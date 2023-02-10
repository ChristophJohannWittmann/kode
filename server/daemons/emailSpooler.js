/**
 * Copyright (c) 2017-2022 Kode Programming
 * https://github.com/KodeProgramming/kode/blob/main/LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/*****
 * The email spooler is responsible for accepting and validating requests for
 * sending an email message, creating the DBMS records, and then contacting the
 * SMTP delivery agent to complete the request.  Note that the delivery agent
 * sends the SmtpAgentUpdate message to the daemon to complete the update of
 * the DBMS records and notify online users as necessary.
*****/
singleton(class EmailSpooler extends Daemon {
    constructor() {
        super();
        this.delivering = {};
        this.spooledBulk = [];
        this.spooledFast = [];
        this.filteredBulk = [];
        this.filteredFast = [];
        this.apiQueue = [];
        this.apiRunning = false;
        this.filterRunning = false;
        this.senderRunning = false;
        Ipc.on('#ServerReady', message => this.initialize());
    }

    async apiClicked(dbc, data) {
        data.recipient.status = 'clicked';
        await data.recipient.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Clicked',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiComplained(dbc, data) {
        data.recipient.pinned.complained = true;
        await data.recipient.pinned.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Complained',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiDelivered(dbc, data) {
        data.recipient.status = 'delivered';
        await data.recipient.save(dbc);

        data.recipient.pinned.lastDelivered = mkTime();
        await data.recipient.pinned.save(dbc);

        data.domain.verified = true;
        data.domain.lastVerified = mkTime();
        await data.domain.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Delivered',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiFailedPerm(dbc, data) {
        data.recipient.status = 'failed';
        await data.recipient.save(dbc);

        data.recipient.pinned.failed = true;
        await data.recipient.pinned.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Failed',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiFailedTemp(dbc, data) {
        data.recipient.status = 'failed';
        await data.recipient.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Failed',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiOpened(dbc, data) {
        data.recipient.status = 'opened';
        await data.recipient.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'Opened',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async apiOptedOut(dbc, data) {
        data.recipient.pinned.optedOut = true;
        await data.recipient.pinned.save(dbc);

        Ipc.sendWorkers({
            messageName: '#EmailStatus',
            event: 'OptedOut',
            msgid: data.msg.oid,
            recipient: data.recipient.oid,
        });
    }

    async initialize() {
        this.filters = [
            await mkSmtpStatusFilter(),
            await mkSmtpDomainFilter(),
            await mkSmtpPrivacyDirectFilter(),
            await mkSmtpNeverBounceFilter(),
        ];

        this.agentKey = Config.smtp.agentKey
        this.agentConf = Config.smtp[this.agentKey];
        await eval(`(async () => this.agentObj = await mk${this.agentConf.agent}())()`);

        let dbc = await dbConnect();

        for (let dboMsg of await selectDboMsg(
            dbc,
            `_category='smtpsend' AND _status IN ('spooled', 'filtered')`,
            `_oid ASC`))
        {
            let msg = await mkEmailMessage(dbc, dboMsg);

            if (msg.status == 'spooled') {
                msg.bulk ? this.spooledBulk.push(msg) : this.spooledFast.push(msg);
            }
            else if (msg.status == 'filtered') {
                msg.bulk ? this.filteredBulk.push(msg) : this.filteredFast.push(msg);
            }
        }

        await dbc.rollback();
        await dbc.free();

        this.touchFiltering();
        this.touchDelivery();
    }

    async deliver() {
        this.senderRunning = true;

        while (this.filteredFast.length || this.filteredBulk.length) {
            let msg;

            if (this.filteredFast.length) {
                msg = this.filteredFast.shift();
            }
            else if (this.filteredBulk.length) {
                msg = this.filteredBulk.shift();
            }

            let msgid = await this.agentObj.deliver(msg);
            let dbc = await dbConnect();

            if (msgid) {
                msg.status = 'sending';
                msg.msgid = msgid;
                msg.agent = `SMTP/${this.agentKey}; ${this.agentConf.name}`;
            }
            else {
                msg.status = 'stuck';
            }

            await msg.save(dbc);
            await dbc.commit();
            await dbc.free();

            this.delivering[msg.oid] = msg;
            await pause(20);
        }

        this.senderRunning = false;
    }

    async filter() {
        this.filterRunning = true;

        while (this.spooledFast.length || this.spooledBulk.length) {
            let msg;

            if (this.spooledFast.length) {
                msg = this.spooledFast.shift();
            }
            else if (this.spooledBulk.length) {
                msg = this.spooledBulk.shift();
            }

            for (let filter of this.filters) {
                if (!await filter.filter(msg)) {
                    break;
                }
            }

            if (msg.status == 'spooled') {
                msg.status = 'filtered';

                let dbc = await dbConnect();
                await msg.save(dbc);
                await dbc.commit();
                await dbc.free();

                msg.bulk ? this.filteredBulk.push(msg) : this.filteredFast.push(msg);
                this.touchDelivery();
            }

            await pause(20);
        }

        this.filterRunning = false;
    }

    async onApi(message) {
        this.apiQueue.push(message);

        if (!this.apiRunning) {
            this.runApi();
        }
    }

    async onSpool(message) {
        let dbc = await dbConnect();

        let msg = await mkEmailMessage(dbc, {
            category: 'smtpsend',
            bulk: message.bulk === false ? false : true,
            reason: message.reason,
            reasonType: message.reasonType,
            reasonOid: message.reasonOid,
            from: message.from,
            subject: message.subject,
            to: message.to,
            cc: message.cc,
            bcc: message.bcc,
            html: message.html,
            text: message.text,
            attachments: message.attachments,
        });

        await dbc.commit();
        await dbc.free();

        if (msg.status == 'spooled') {
            msg.bulk ? this.spooledBulk.push(msg) : this.spooledFast.push(msg);
            this.touchFiltering();
        }

        Message.reply(message, {
            oid: msg.oid,
            status: msg.status,
        });
    }

    async onStatus(message) {
        Message.reply(message, {
            bulk: {
                spooled: this.spooledBulk.length,
                filtered: this.filteredBulk.length,
            },
            fast: {
                spooled: this.spooledFast.length,
                filtered: this.filteredFast.length,
            },
            delivering: Object.keys(this.delivering).length,
        });
    }

    async runApi() {
        try {
            this.apiRunning = true;

            while (this.apiQueue.length) {
                let message = this.apiQueue.shift();
                let dbc = await dbConnect();
                let dboMsg = await selectOneDboMsg(dbc, `_msgid='${message.msgid}'`);

                if (dboMsg) {
                    let emailMessage = await mkEmailMessage(dbc, dboMsg);

                    let recipient = Object.values(emailMessage.pinned.recipients)
                    .filter(recipient => recipient.pinned.addr == message.recipient.addr)[0];

                    if (recipient) {
                        let methodName = `api${message.recipient.status}`;

                        if (methodName in this) {
                            let domain = await getDboDomain(dbc, recipient.pinned.domainOid);

                            await this[methodName](dbc, {
                                msg: emailMessage,
                                recipient: recipient,
                                domain: domain,
                                status: message.recipient.status,
                            });

                            const buckets = {
                                creating: 0,
                                rejected: 0,
                                spooled: 0,
                                blocked: 0,
                                optedout: 0,
                                filtered: 0,
                                failed: 0,
                                delivered: 0,
                                opened: 0,
                                clicked: 0,
                            };

                            for (let recipient of Object.values(emailMessage.pinned.recipients)) {
                                buckets[recipient.status]++;
                            }

                            if (buckets.spooled == 0 && buckets.filtered == 0) {
                                emailMessage.status = 'closed';
                            }

                            await emailMessage.save(dbc);
                        }
                    }
                }

                await dbc.commit();
                await dbc.free();
            }
        }
        finally {
            this.apiRunning = false;
        }
    }

    touchDelivery() {
        if (!this.senderRunning) {
            if (this.filteredFast.length + this.filteredBulk.length > 0) {
                this.deliver();
            }
        }
    }

    touchFiltering() {
        if (!this.filterRunning) {
            if (this.spooledFast.length + this.spooledBulk.length > 0) {
                this.filter();
            }
        }
    }
});
