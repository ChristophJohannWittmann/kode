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
 * Require all of the SMTP filters that are built into the framework for outgoing
 * SMTP messages.  Filters vary in a lot of aspects.  The main conformity with
 * regards to them is that they have an async maker and an async method called
 * filter().  Filter returns true if the message successfully passed filtering.
 * If it hasn't passed filtering, the filter is also responsible for updating
 * the status of the msg and msgEndpoint objects.
*****/
require('../obj/smtp/domainFilter.js');
require('../obj/smtp/neverBounceFilter.js');
require('../obj/smtp/privacyDirectFilter.js');
require('../obj/smtp/statusFilter.js');


/*****
 * These are the mail sending agents supported by the framework.  A mail sending
 * agent is responsible for delivering and receiving emails via the internet.
 * Only a single agent may be active at a time, whose value generally does NOT
 * change once a server has been started.
*****/
require('../obj/smtp/mailgunAgent.js');
require('../obj/smtp/nullAgent.js');


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

    async initialize() {
        this.filters = [
            await mkSmtpStatusFilter(),
            await mkSmtpDomainFilter(),
            await mkSmtpPrivacyDirectFilter(),
            await mkSmtpNeverBounceFilter(),
        ];

        let agentConfig = Config.communications.smtp.agents[Config.communications.smtp.agent];
        await eval(`(async () => this.deliveryAgent = await mk${agentConfig.className}(agentConfig))()`);
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
            msg.agent = `SMTP/${this.deliveryAgent.config.code}; ${this.deliveryAgent.config.name}`;

            let dbc = await dbConnect();
            await msg.save(dbc);
            await dbc.commit();
            await dbc.free();

            this.deliveryAgent.deliver(msg);
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

    async onAgentUpdate(message) {
        let dbc = await dbConnect();
        let emailMessage = await mkEmailMessage(dbc, message.msgOid);

        if (emailMessage) {
            emailMessage.msgid = message.msgid;
            await emailMessage.save(dbc);

            for (let recipientStatus of message.recipients) {
                let emailRecipient = emailMessage.getRecipient(recipientStatus.oid);

                if (emailRecipient) {
                    emailRecipient.status = recipientStatus.status;
                    let domain = await getDboDomain(dbc, emailRecipient.endpointOid);

                    if (recipientStatus.status == 'delivered') {
                        domain.verified = true;
                        domain.lastVerified = mkTime();
                    }
                    else if (recipientStatus.status == 'failed') {
                        if (recipientStatus.domainStatus != 'ok') {
                            domain.error = `${recipientStatus.domainStatus}; ${recipientStatus.domainError}`;
                        }

                        domain.verified = false;
                        domain.lastVerified = mkTime();
                    }

                    await domain.save(dbc);
                    await emailRecipient.save(dbc);
                }
            }
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
