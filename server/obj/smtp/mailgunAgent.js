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
    Ipc.on('#ServerReady:http', async message => {
        if ('mailgun' in Config.smtp && Config.smtp.agentKey == 'mailgun') {
            ResourceLibrary.register(builtinModule, {
                url: '/api/mg',
                webx: 'MailGun',
            });
        }
    });

    register(class SmtpApiMailGun extends Webx {
        constructor(module, reference) {
            super(module, reference);
            this.config = Config.smtp.mailgun;
        }

        buildRecvMessage(formData) {
        }

        async handlePOST(req, rsp) {
            try {
                if (req.mime().code == 'multipart/form-data' && req.mime().props.boundary) {
                    let formData = parseMultipartFormData(req.body(), req.mime().props.boundary);
                    let msg = this.buildRecvMessage(formData);
                    await this.processRecvMessage(msg);
                    rsp.endStatus(200);
                }
                else if (req.isMessage()) {
                    let event = req.message();

                    if (await this.verifyEvent(event)) {
                        await this.processEvent(event);
                        rsp.endStatus(200);
                    }
                    else {
                        rsp.endStatus(406);
                    }
                }
            }
            catch (e) {
                rsp.endStatus(500);
            }
        }

        async processEvent(evnet) {
            /*
            //await mkHttpClient().post('http://localhost/api/mg', 'text/plain', msg.oid.toString());
            let dbc = await dbConnect();
            let msg = await await mkEmailMessage(dbc, BigInt(req.body()));

            let message = {
                messageName: '#EmailSpoolerApi',
                action: 'MsgUpdate',
                msg: {
                    oid: msg.oid,
                    msgid: `<msgid-${mkTime().toISOString()}-${msg.oid}>`,
                    status: 'closed',
                },
                domains: [],
                recipients: [],
            };

            recipients: Object.values(msg.pinned.recipients).forEach(async recipient => {
                message.domains.push({
                    oid: recipient.pinned.domainOid,
                    status: 'ok',
                });

                message.recipients.push({
                    oid: recipient.oid,
                    status: 'delivered',
                    error: '',
                });
            });

            await dbc.commit();
            await dbc.free();

            Ipc.sendPrimary(message);
            */
        }

        async processRecvMessage(msg) {
        }

        async verifyEvent(evnet) {
            console.log(event);
            return true;
        }
    });
}
