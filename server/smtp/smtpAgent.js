/**
 * Copyright (c) 2017-2023 Kode Programming
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
 * Implementation of the logic necessary for sending emails using standard SMTP
 * protocol.  Our design is based on MIT's Nodemail package, which provides a
 * robust set of features.  Conceptually, the nodemailer generates a "real"
 * message ID for the email being sent, which is then used to update the provided
 * email message object.  Note that attempts to send may result in one of three
 * types of results: (1) delivered, (2) temporary failure, or (3) permanent
 * failure.
*****/
if (CLUSTER.isPrimary) {
    register(class SmtpAgent {
        constructor() {
            this.config = Config.email.smtp;
            this.composer = require('nodemailer/lib/mail-composer');
            this.connection = require('nodemailer/lib/smtp-connection');

            return new Promise(async (ok, fail) => {
                ok(this);
            });
        }
        
        deliver(msg) {
            return new Promise((ok, fail) => {
                const mail = new this.composer({
                    sender: msg.getSender().pinned.addr,
                    from: msg.formatSender(),
                    to: msg.formatRecipients('to'),
                    cc: msg.formatRecipients('cc'),
                    bcc: msg.formatRecipients('bcc'),
                    replyTo: msg.getSender().pinned.addr,
                    subject: msg.getSubject(),
                    text: msg.getContent('text'),
                    html: msg.getContent('html'),
                });

                mail.compile().build((error, buffer) => {
                    let rfc2822 = buffer.toString();

                    let connection = new this.connection({
                        host: this.config.host,
                        port: this.config.port,
                        secure: this.config.secure,
                    });

                    connection.connect(() => {
                        connection.login({
                            user: this.config.username,
                            pass: this.config.password,
                        }, (error, info) => {
                            if (info) {
                                connection.send({
                                    from: msg.getSender().pinned.addr,
                                    to: msg.getRecipients().map(recipient => recipient.pinned.addr),
                                },
                                rfc2822,
                                async (error, info) => {
                                    if (error) {
                                        connection.quit();
                                        ok(false);
                                    }
                                    else {
                                        connection.quit();
                                        let updateMethodName = `update${this.config.type}`;
                                        ok(await this.update(msg, rfc2822, info));
                                    }
                                });
                            }
                            else {
                                connection.quit();
                                ok(false);
                            }
                        });
                    });
                });
            });
        }

        async update(msg, rfc2822, info) {
            let match = rfc2822.match(/message-id: *(.*?)$/mi);

            if (match) {
                msg.msgid = match[1];
                let dbc = await dbConnect();
                await msg.save(dbc);
                await dbc.commit();
                await dbc.free();
            }
            else {
                return false;
            }

            setTimeout(() => {
                for (let addr of info.accepted) {
                    for (let endpoint of msg.getRecipients()) {
                        let dboAddr = endpoint.pinned;

                        if (dboAddr.addr == addr) {
                            Ipc.sendPrimary({
                                messageName: '#EmailSpoolerApi',
                                msgid: msg.msgid,
                                recipient: { addr: endpoint.pinned.addr, status: 'Delivered' },
                            });
                            break;
                        }
                    }
                }

                for (let i = 0; i < info.rejected.length; i++) {
                    let addr = info.rejected[i];

                    for (let endpoint of msg.getRecipients()) {
                        let dboAddr = endpoint.pinned;

                        if (dboAddr.addr == addr) {
                            let error = info.rejectedErrors[i];
                            // TODO -- use content of error to select between FailedPerm and FailedTemp.

                            if (true) {
                                Ipc.sendPrimary({
                                    messageName: '#EmailSpoolerApi',
                                    msgid: msg.msgid,
                                    recipient: { addr: endpoint.pinned.addr, status: 'FailedPerm' },
                                });
                            }
                            else {
                                /*
                                Ipc.sendPrimary({
                                    messageName: '#EmailSpoolerApi',
                                    msgid: msg.msgid,
                                    recipient: { addr: endpoint.pinned.addr, status: 'FailedTemp' },
                                });
                                */
                            }

                            break;
                        }
                    }
                }
            }, 2000);

            return msg.msgid;
        }
    });
}
