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
 * The SmtpAgentMailGun class is an Smtp sending agent that's constructed during
 * system initialization if Mail Gun is the selected SMTP sender in settings.
 * The deliver function accepts an internal message and uses the Mail Gun API
 * to deliver messages to recipients.  Note that we don't perform updates to
 * any of the msg objects, we leave that to the webhook webx to receive and
 * process updates and feedback from Mail Gun.
*****/
if (CLUSTER.isPrimary) {
    register(class SmtpAgentMailGun {
        constructor() {
            this.config = Config.smtp.mailgun;
            
            return new Promise(async (ok, fail) => {
                ok(this);
            });
        }
        
        async deliver(msg) {
            return new Promise(async (ok, fail) => {
                let dbc = await dbConnect();
                const sender = msg.getSender();
                const senderDomain = await getDboDomain(dbc, sender.pinned.domainOid);
                const mg = npmMailGun({ apiKey: this.config.apiKey, domain: senderDomain.name });

                const data = {
                    from: msg.formatSender(),
                    subject: msg.getSubject(),
                };

                for (let cat of ['to', 'cc', 'bcc']) {
                    let array = msg.formatRecipients(cat);
                    array.length ? data[cat] = array : false;
                }

                for (let section of ['text', 'html']) {
                    let content = msg.getContent(section);
                    content ? data[section] = content : false;
                }

                if (!('html' in data) && !('text' in data)) {
                    data.text = '';
                }

                mg.messages().send(data, async (error, response) => {
                    if (typeof response == 'object' && 'id' in response) {
                        ok(response.id);
                    }
                    else {
                        return ok(null);
                    }

                    await dbc.rollback();
                    await dbc.free();
                    ok();
                });
            });
        }
    });
}


/*****
*****/
if (CLUSTER.isWorker) {
    if ('mailgun' in Config.smtp && Config.smtp.agentKey == 'mailgun') {
        Ipc.on('#ServerReady:http', async message => {
            ResourceLibrary.register(builtinModule, {
                url: '/api/mg',
                webx: 'MailGun',
            });
        });

        register(class SmtpApiMailGun extends Webx {
            constructor(module, reference) {
                super(module, reference);
                this.config = Config.smtp.mailgun;
            }

            async checkEventSignature(event) {
                if (typeof event.signature == 'object') {
                    if (typeof event.signature.token == 'string' && typeof event.signature.timestamp == 'string') {
                        if (typeof event.signature.signature == 'string') {
                            let content = `${event.signature.timestamp}${event.signature.token}`;
                            let verificationSignature = Crypto.signHmac('sha256', this.config.apiKey, content, 'hex');
                            return verificationSignature == event.signature.signature;
                        }
                    }
                }

                return false;
            }

            async checkMessageSignature(formData) {
                if (typeof formData.token == 'object' && typeof formData.token.content == 'string') {
                    if (typeof formData.timestamp == 'object' && typeof formData.timestamp.content == 'string') {
                        if (typeof formData.signature == 'object' && typeof formData.signature.content == 'string') {
                            let content = `${formData.timestamp.content}${formData.token.content}`;
                            let verificationSignature = Crypto.signHmac('sha256', this.config.apiKey, content, 'hex');
                            return verificationSignature == formData.signature.content;
                        }
                    }
                }

                return false
            }

            async handlePOST(req, rsp) {
                try {
                    if (req.mime().code == 'multipart/form-data' && req.mime().props.boundary) {
                        let formData = parseMultipartFormData(req.body(), req.mime().props.boundary);

                        if (this.checkMessageSignature(formData)) {
                            await this.OnReceived(formData);
                            rsp.endStatus(200);
                        }
                        else {
                            rsp.endStatus(401);
                        }
                    }
                    else if (req.isMessage()) {
                        let event = req.message();

                        if (await this.checkEventSignature(event)) {
                            await this.onEvent(event['event-data']);
                            rsp.endStatus(200);
                        }
                        else {
                            rsp.endStatus(401);
                        }
                    }
                    else {
                        rsp.endStatus(404);
                    }
                }
                catch (e) {
                    rsp.endStatus(500);
                }
            }

            async onEvent(event) {
                const eventMap = {
                    'clicked': 'Clicked',
                    'complained': 'Complained',
                    'delivered': 'Delivered',
                    'failed-permanent': 'FailedPerm',
                    'failed-temporary': 'FailedTemp',
                    'opened': 'Opened',
                    'unsubscribed': 'OptedOut',
                };

                if (event.event == 'failed') {
                    var status = eventMap[`failed-${event.severity}`];
                }
                else {
                    var status = eventMap[event.event]; 
                }

                let message = {
                    messageName: '#EmailSpoolerApi',
                    msgid: `${event.message.headers['message-id']}>`,
                    recipient: { addr: event.recipient, status: status },
                };

                Ipc.sendPrimary(message);
            }

            async OnReceived(formData) {
                let data = {
                    category: 'smtprecv',
                    bulk: false,
                    msgId: formData['Message-Id'].content,
                    from: formData.Sender.content,
                    subject: formData.Subject.content,
                };

                for (let section of ['To', 'Cc', 'Bcc']) {
                    if (section in formData) {
                        data[section.toLowerCase()] = formData[section].content;
                    }
                    else if (section.toLowerCase() in formData) {
                        data[section] = formData[section.toLowerCase()].content;
                    }
                }

                for (let section of [{ src: 'body-html', dst: 'html' }, { src: 'body-plain', dst: 'text' }]) {
                    if (section.src in formData) {
                        data[section.dst] = formData[section.src].content;
                    }
                }

                if (typeof formData['attachment-count'] == 'object') {
                    data.attachments = [];

                    for (let i = 1; i <= parseInt(formData['attachment-count'].content); i++) {
                        data.attachments.push(formData[`attachment-${i}`]);
                    }
                }

                let dbc = await dbConnect();

                try {
                    let emailMessage = await mkEmailMessage(dbc, data);
                    await dbc.commit();
                    emailMessage.announceReceived();
                }
                catch (e) {
                    await dbc.rollback();
                }
                finally {
                    await dbc.free();
                }
            }
        });
    }
}
