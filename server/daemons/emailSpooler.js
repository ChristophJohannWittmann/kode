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
        this.filterRunning = false;
        this.senderRunning = false;
        Ipc.on('#ServerReady', message => this.initialize());
    }

    async apiUpdateMsg(dbc, message) {
        let emailMessage = await mkEmailMessage(dbc, message.msg.oid);

        if (emailMessage) {
            emailMessage.msgid = message.msg.msgid;
            emailMessage.status = message.msg.status;
            await emailMessage.save(dbc);

            if (Array.isArray(message.recipients)) {
                for (let recipient of message.recipients) {
                    let endpoint = await getDboMsgEndpoint(dbc, recipient.oid);
                    let emailAddress = await getDboEmailAddress(dbc, endpoint.endpointOid);

                    switch (recipient.status) {
                        case 'delivered':
                            emailAddress.lastDelivered = mkTime();
                            emailAddress.error = '';
                            break;

                        case 'failed':
                            emailAddress.verified = false;
                            emailAddress.lastVerified = mkTime();
                            recipient.error ? emailAddress.error = recipient.error : false;
                            break;
                    }

                    endpoint.status = recipient.status;
                    await endpoint.save(dbc);
                    await emailAddress.save(dbc);
                }
            }

            if (Array.isArray(message.domains)) {
                for (let domain of message.domains) {
                    let dboDomain = await getDboDomain(dbc, domain.oid)

                    switch (domain.status) {
                        case 'ok':
                            dboDomain.verified = true;
                            dboDomain.lastVerified = mkTime();
                            dboDomain.error = '';
                            await dboDomain.save(dbc);
                            break;

                        case 'refused':
                        case 'unsendable':
                            dboDomain.verified = false;
                            dboDomain.lastVerified = mkTime();
                            dboDomain.error = domain.error;
                            await dboDomain.save(dbc);
                            break;
                    }
                }
            }
        }
    }

    async initialize() {
        this.filters = [
            await mkSmtpStatusFilter(),
            await mkSmtpDomainFilter(),
            await mkSmtpPrivacyDirectFilter(),
            await mkSmtpNeverBounceFilter(),
        ];

        this.smtpCode = Config.smtp.selected;
        this.config = Config.smtp[this.smtpCode];
        await eval(`(async () => this.agent = await mk${this.config.agent}(this.config))()`);
        let dbc = await dbConnect();

        for (let dboMsg of await selectDboMsg(
            dbc,
            `_type='email' AND _status NOT IN ('failed', 'delivered', 'optout')`,
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

            msg.status = 'sending';
            msg.agent = `SMTP/${this.smtpCode}; ${this.agent.config.name}`;

            let dbc = await dbConnect();
            await msg.save(dbc);
            await dbc.commit();
            await dbc.free();

            this.agent.deliver(msg);
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
        let dbc = await dbConnect();

        switch (message.action) {
            case 'MsgUpdate':
                await this.apiUpdateMsg(dbc, message);
                break;
        }

        await dbc.commit();
        await dbc.free();
    }

    async onSpool(message) {
        let dbc = await dbConnect();

        let msg = await mkEmailMessage(dbc, {
            category: 'smtpsend',
            bulk: message.bulk === false ? false : true,
            reason: message.reason ? message.reason : '',
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
