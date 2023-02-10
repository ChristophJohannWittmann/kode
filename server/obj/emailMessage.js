/*****
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
*****/


/*****
 * An EmailMessage is an extension of the underlying DboMsg and also a helper
 * object for creating, handling, and managing email messages.  For operational
 * reasons, email messages are spread across three general DBMS objects: msg,
 * msgAttr, and msgEndpoint.  These types are somewhat unintuitive for email
 * programming.  Hence, that's the purpose of this object.
*****/
register(class EmailMessage extends DboMsg {
    constructor(dbc, arg) {
        super();

        return new Promise(async (ok, fail) => {
            this.dbc = dbc;

            this.pinned = {
                from: null,
                subject: null,
                recipients: {},
                content: {},
                attachments: {},
            };

            if (typeof arg == 'bigint') {
                await this.load(arg);
            }
            else if (arg instanceof DboMsg) {
                await this.load(arg);
            }
            else if (typeof arg == 'object') {
                if (arg.category in { smtpsend:0, smtprecv:0 }) {
                    await this.buildEnvelope(arg);
                    await this.buildContent(arg);

                    if (arg.category == 'smtprecv') {
                        const agentKey = Config.smtp.agentKey
                        const agentConf = Config.smtp[agentKey];
                        this.status = 'closed';
                        this.msgid = arg.msgId;
                        this.agent = `SMTP/${agentKey}; ${agentConf.agentName}`;
                    }
                }
            }

            await this.save(this.dbc);
            delete this.dbc;
            ok(this);
        });
    }

    announceReceived() {
        Ipc.sendHost({
            messageName: '#ReceivedEmail',
            oid: this.oid,
            reason: this.reason,
            reasonType: this.reasonType,
            reasonOid: this.reasonOid,
            from: this.getSender().pinned,
            recipients: this.getRecipients().map(recipient => recipient.pinned),
        });
    }

    async buildContent(data) {
        if (this.status != 'creating') {
            return;
        }

        const contentMimes = {
            text: 'text/plain',
            html: 'text/html',
        };

        for (let sectionName of Object.keys(contentMimes)) {
            if (sectionName in data) {
                if (typeof data[sectionName] == 'string') {
                    let bodySection = mkDboMsgAttr({
                        msgOid: this.oid,
                        mime: contentMimes[sectionName],
                        name: sectionName,
                        props: {},
                        data: mkBuffer(data[sectionName]).toString('base64'),
                    });

                    await bodySection.save(this.dbc);
                    this.pinned.content[sectionName] = bodySection;
                }
                else if (typeof data[sectionName] == 'object') {
                    let bodySection = mkDboMsgAttr({
                        msgOid: this.oid,
                        mime: contentMimes[sectionName],
                        name: sectionName,
                        props: {},
                        data: '',
                    });

                    Object.assign(bodySection.props, data[sectionName]);
                    await bodySection.save(this.dbc);
                    this.pinned.content[sectionName] = bodySection;
                }
                else {
                    continue;
                }
            }
        }

        if (Array.isArray(data.attachments)) {
            for (let attachment of data.attachments) {
                let msgAttr = mkDboMsgAttr({
                    msgOid: this.oid,
                    mime: attachment.mime ? attachment.mime : 'text/plain',
                    name: attachment.name ? attachment.name : '',
                    props: {},
                    data: mkBuffer(attachment.content).toString('base64'),
                });

                for (let key in data.attachment) {
                    if (!(key in { mime:0, name:0, content: 0 })) {
                        msgAttr.props[key] = attachment[key];
                    }
                }

                await msgAttr.save(this.dbc);
                this.pinned.attachments[attachment.name] = attachment;
            }
        }

        if (Object.keys(this.pinned.recipients).length == 0) {
            let bodySection = mkDboMsgAttr({
                msgOid: this.oid,
                mime: 'text/plain',
                name: `body`,
                data: '',
            });

            await bodySection.save(this.dbc);
            this.pinned.content[sectionName] = bodySection;
        }

        this.status = 'spooled';
    }

    async buildEnvelope(data) {
        this.category = data.category;
        this.bulk = data.bulk === false ? false : true,
        this.type = 'email';
        this.status = 'creating';
        this.reason = data.reason ? data.reason : '';
        this.reasonType = data.reasonType ? data.reasonType : '';
        this.reasonOid = data.reasonOid ? data.reasonOid : 0n;
        await this.save(this.dbc);

        if (data.from) {
            let [ name, addr ] = this.parseRecipient(data.from);
            let emailAddress = await this.resolveEmailAddress(addr);

            this.pinned.from = mkDboMsgEndpoint({
                msgOid: this.oid,
                category: 'from',
                status: 'ok',
                userOid: emailAddress.ownerType == 'DboUser' ? emailAddress.ownerOid : 0n,
                endpointType: 'DboEmailAddress',
                endpointOid: emailAddress.oid,
                name: name,
            });

            this.pinned.from.pinned = emailAddress;
            await this.pinned.from.save(this.dbc);
        }
        else {
            this.status = 'rejected';
            await this.save(this.dbc);
            return;
        }

        if (typeof data.subject == 'string') {
            this.pinned.subject = mkDboMsgAttr({
                msgOid: this.oid,
                mime: 'text/plain',
                name: 'subject',
                data: mkBuffer(data.subject).toString('base64'),
            });

            await this.pinned.subject.save(this.dbc);
        }
        else {
            this.status = 'rejected';
            await this.save(this.dbc);
            return;
        }

        for (let category of ['to', 'cc', 'bcc']) {
            if (data[category] !== undefined) {
                let recipients = data[category];

                for (let recipient of (Array.isArray(recipients) ? recipients : [recipients])) {
                    let [ name, addr ] = this.parseRecipient(recipient);
                    let emailAddress = await this.resolveEmailAddress(addr);

                    if (!(emailAddress in this.pinned.recipients)) {
                        this.pinned.recipients[emailAddress.oid] = mkDboMsgEndpoint({
                            msgOid: this.oid,
                            category: category,
                            status: 'spooled',
                            userOid: emailAddress.ownerType == 'DboUser' ? emailAddress.ownerOid : 0n,
                            endpointType: 'DboEmailAddress',
                            endpointOid: emailAddress.oid,
                            name: name,
                            index: Object.keys(this.pinned.recipients).length,
                        });

                        this.pinned.recipients[emailAddress.oid].pinned = emailAddress;
                        await this.pinned.recipients[emailAddress.oid].save(this.dbc);
                    }
                }
            }
        }

        if (Object.keys(this.pinned.recipients).length == 0) {
            this.status = 'failed';
        }
    }

    formatRecipients(which) {
        const recipients = [];

        for (let endpoint of Object.values(this.pinned.recipients)) {
            if (endpoint.category == which) {
                if (endpoint.name) {
                    recipients.push(`${endpoint.name} <${endpoint.pinned.addr}>`);
                }
                else {
                    recipients.push(endpoint.pinned.addr);
                }
            }
        }

        return recipients;
    }

    formatSender() {
        if (this.pinned.from.name) {
            return `${this.pinned.from.name} <${this.pinned.from.pinned.addr}>`;
        }
        else {
            return this.pinned.from.pinned.addr;
        }
    }

    getAttachments() {
        return Object.values(this.pinned.attachments);
    }

    getContent(section) {
        if (this.pinned.content && section in this.pinned.content) {
            return mkBuffer(this.pinned.content[section].data, 'base64').toString();
        }
        else {
            return '';
        }
    }

    getDeliveredRecipients() {
        return Object.values(this.pinned.recipients)
        .filter(recipient => recipient.status == 'delivered');
    }

    getFailedRecipients() {
        return Object.values(this.pinned.recipients)
        .filter(recipient => recipient.status == 'failed');
    }

    getOtherRecipients() {
        return Object.values(this.pinned.recipients)
        .filter(recipient => !(recipient.status in { failed:0, delivered:0, spooled:0 }));
    }

    getRecipient(oid) {
        return this.pinned.recipients[oid];
    }

    getRecipients() {
        return Object.values(this.pinned.recipients);
    }

    getSender() {
        return this.pinned.from;
    }

    getSpooledRecipients() {
        return Object.values(this.pinned.recipients)
        .filter(recipient => recipient.status == 'spooled');
    }

    getSubject() {
        return mkBuffer(this.pinned.subject.data, 'base64').toString();
    }

    async load(arg, minimize) {
        if (arg instanceof DboMsg) {
            Object.assign(this, arg);
        }
        else {
            Object.assign(this, await getDboMsg(this.dbc, arg));
        }

        for (let messageEndpoint of await selectDboMsgEndpoint(this.dbc, `_msg_oid=${this.oid}`, `_index ASC`)) {
            messageEndpoint.pinned = await getDboEmailAddress(this.dbc, messageEndpoint.endpointOid);

            if (messageEndpoint.category == 'from') {
                this.pinned.from = messageEndpoint;
            }
            else if (messageEndpoint.category in { to:0, cc:0, bcc:0 }) {
                this.pinned.recipients[messageEndpoint.oid] = messageEndpoint;
            }
        }

        for (let messageAttr of await selectDboMsgAttr(this.dbc, `_msg_oid=${this.oid}`)) {
            if (messageAttr.name == 'subject') {
                this.pinned.subject = messageAttr;
            }
            else if (messageAttr.name in { html:0, text:0 }) {
                this.pinned.content[messageAttr.name] = messageAttr;
            }
            else if (minimize !== true) {
                this.pinned.attachments[messageAttr.name] = messageAttr;
            }
        }
    }

    parseRecipient(recipient) {
        let name = '';
        let addr = '';

        if (typeof recipient == 'object') {
            addr = recipient.addr;
            name = recipient.name.trim();
        }
        else if (typeof recipient == 'string') {
            if (recipient.indexOf('<') >= 0) {
                let match = recipient.match(/([a-zA-Z0-9.-_'" ]+?) *< *([a-zA-Z0-9.-_%'"]+@[a-zA-Z0-9.-_%'"]+) *>/);
                name = match[1];
                addr = match[2];
            }
            else {
                addr = recipient.trim();;
            }
        }

        return [ name, addr ];
    }

    async remove() {
        await this.from.erase(this.dbc);
        await this.subject.erase(this.dbc);

        for (let recipient of Object.values(this.recipients)) {
            await recipient.erase(this.dbc);
        }

        for (let content of Object.values(this.content)) {
            await content.erase(this.dbc);
        }

        for (let attachment of Object.values(this.attachments)) {
            await attachment.erase(this.dbc);
        }

        await this.erase(this.dbc);
    }

    async resolveEmailAddress(endpoint) {
        if (endpoint instanceof DboMsgEndpoint) {
            return await EmailAddresses.getFromOid(this.dbc, endpoint.endpointOid);
        }
        else if (endpoint instanceof DboUser) {
            return await EmailAddresses.getFromUser(this.dbc, endpoint);
        }
        else if (typeof endpoint == 'bigint') {
            return await EmailAddresses.getFromOid(this.dbc, endpoint);
        }
        else if (typeof endpoint == 'string') {
            let normalized = endpoint.toLowerCase().trim();
            return await EmailAddresses.ensureFromAddr(this.dbc, normalized);
        }
    }

    [Symbol.iterator]() {
        return Object.values(this.pinned.recipients)[Symbol.iterator]();
    }
});
