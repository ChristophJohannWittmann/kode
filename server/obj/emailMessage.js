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
            else if (typeof arg == 'object') {
                await this.buildEnvelope(arg);
                await this.buildContent(arg);
            }
            else if (typeof arg == 'string') {
                console.log('importing raw incoming email...');
            }

            await this.save(this.dbc);
            delete this.dbc;
            ok(this);
        });
    }

    async buildContent(data) {
        if (this.status != 'envelopeok') {
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
                        data: mkBuffer(data[sectionName]).toString('base64'),
                    });

                    await bodySection.save(this.dbc);
                    this.pinned.content[sectionName] = bodySection;
                }
                else if (typeof data[sectionName] == 'object') {
                    let personalizationData = data[sectionName];

                    if (typeof personalizationData.templateOid == 'bigint') {                        
                        let bodySection = mkDboMsgAttr({
                            msgOid: this.oid,
                            mime: 'application/kode.template',
                            name: sectonName,
                            data: mkBuffer(toJson(personalizationData)).toString('base64'),
                        });

                        await bodySection.save(this.dbc);
                        this.pinned.content[sectionName] = bodySection;
                    }
                    else {
                        continue;
                    }
                }
                else {
                    continue;
                }
            }
        }

        if (Array.isArray(data.attachments)) {
            let count = 0;

            for (let attachment of data.attachments) {
                count++;
                let attachmentName = attachment.name;

                if (attachment.name in this.pinned.attachments) {
                    attachmentName = `${attachment.name}_${count}`;
                }

                let msgAttr = mkDboMsgAttr({
                    msgOid: this.oid,
                    mime: attachment.mime,
                    name: attachmentName,
                    data: mkBuffer(attachment).toString('base64'),
                });

                await msgAttr.save(this.dbc);
                this.pinned.attachments[attachment.name] = attachment;
            }
        }

        if (Object.keys(this.pinned.recipients).length == 0) {
            let bodySection = mkDboMsgAttr({
                msgOid: this.oid,
                mime: 'text.plain',
                name: `body`,
                data: '',
            });

            await bodySection.save(this.dbc);
            this.pinned.content[sectionName] = bodySection;
        }

        this.status = 'pending';
    }

    async buildEnvelope(data) {
        this.category = data.category ? data.category : 'none',
        this.bulk = data.bulk === false ? false : true,
        this.type = 'email';
        this.status = 'creating';
        this.reason = data.reason ? data.reason : '';
        await this.save(this.dbc);

        if (data.from) {
            let emailAddress = await this.resolveEmailAddress(data.from);

            this.pinned.from = mkDboMsgEndpoint({
                msgOid: this.oid,
                category: 'from',
                status: 'added',
                userOid: emailAddress.ownerType == 'DboUser' ? emailAddress.ownerOid : 0n,
                endpointType: 'DboEmailAddress',
                endpointOid: emailAddress.oid,
            });

            this.pinned.from.pinned = emailAddress;
            await this.pinned.from.save(this.dbc);
        }
        else {
            this.status = 'nosender';
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
            this.status = 'nosubject';
            await this.save(this.dbc);
            return;
        }

        for (let category of ['to', 'cc', 'bcc']) {
            if (data[category]) {
                let recipients = data[category];

                for (let recipient of (Array.isArray(recipients) ? recipients : [recipients])) {
                    let emailAddress = await this.resolveEmailAddress(recipient);

                    if (!(emailAddress in this.pinned.recipients)) {
                        this.pinned.recipients[emailAddress.oid] = mkDboMsgEndpoint({
                            msgOid: this.oid,
                            category: category,
                            status: 'added',
                            userOid: emailAddress.ownerType == 'DboUser' ? emailAddress.ownerOid : 0n,
                            endpointType: 'DboEmailAddress',
                            endpointOid: emailAddress.oid,
                            index: Object.keys(this.pinned.recipients).length,
                        });

                        this.pinned.recipients[emailAddress.oid].pinned = emailAddress;
                        await this.pinned.recipients[emailAddress.oid].save(this.dbc);
                    }
                }
            }
        }

        if (Object.keys(this.pinned.recipients).length == 0) {
            this.status = 'envelopebad';
        }
        else {
            this.status = 'envelopeok';
        }
    }

    getAttachments() {
        return Object.values(this.pinned.attachments);
    }

    getContent() {
        return Object.values(this.pinned.content);
    }

    getRecipientCount() {
        return Object.entries(this.pinned.recipients).length;
    }

    getRecipients() {
        return Object.values(this.pinned.recipients);
    }

    getSender() {
        return mkBuffer(this.pinned.from.data, 'base64').toString();
    }

    getSubject() {
        return mkBuffer(this.pinned.subject.data, 'base64').toString();
    }

    async load(oid, minimize) {
        Object.assign(this, await getDboMsg(this.dbc, oid));

        for (let messageEndpoint of await selectDboMsgEndpoint(this.dbc, `_msg_oid=${oid}`, `_index ASC`)) {
            messageEndpoint.pinned = await getDboEmailAddress(this.dbc, messageEndpoint.endpointOid);

            if (messageEndpoint.category == 'from') {
                this.pinned.from = messageEndpoint;
            }
            else if (messageEndpoint.category in { to:0, cc:0, bcc:0 }) {
                this.pinned.recipients[messageEndpoint.oid] = messageEndpoint;
            }
        }

        for (let messageAttr of await selectDboMsgAttr(this.dbc, `_msg_oid=${oid}`)) {
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
            return endpoint;
        }
        else if (endpoint instanceof DboUser) {
            return mkDboMsgEndpoint({
                msgOid: this.oid,
                status: 'pending',
                userOid: endpoint.oid,
                endpointType: 'DboEmailAddress',
                endpointOid: await Users.getEmail(this.dbc, endpoint.oid)
            });
        }
        else if (typeof endpoint == 'bigint') {
            return await getDboEmailAddress(this.dbc, endpoint);
        }
        else if (typeof endpoint == 'string') {
            let normalized = endpoint.toLowerCase().trim();
            let emailAddress = await selectOneDboEmailAddress(this.dbc, `_addr='${normalized}'`);

            if (!emailAddress) {
                let [ userName, domainName ] = normalized.spllit('@');
                let domain = await Domains.ensureFromName(this.dbc, domainName);

                emailAddress = mkEmailAddress({
                    domainOid: domain.oid,
                    user: userName,
                    addr: normalized,
                });

                await emailAddress.save(this.dbc);
            }

            return emailAddress;
        }
    }

    [Symbol.iterator]() {
        return Object.values(this.pinned.recipients)[Symbol.iterator]();
    }
});
