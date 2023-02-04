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
 * This is an SMTP delivery agent, which is useful for development and testing
 * purposes only.  It's here to ensure we don't crash a development system while
 * writing and testing code.  It does nothing except to return a response saying
 * that the message was undeliverable with a useless marker for the msgid.  The
 * response will always be "blocked".  Blocked is normally reserved for messages
 * that are blocked internally.  By responding as blocked, none of the email
 * addres nor domain records are modified.
*****/
if (CLUSTER.isPrimary) {
    register(class SmtpAgentNull {
        constructor(config) {
            this.config = config;

            return new Promise(async (ok, fail) => {
                ok(this);
            });
        }
        
        async deliver(msg) {
            let message = {
                messageName: '#EmailSpoolerApi',
                action: 'MsgUpdate',
                msg: {
                    oid: msg.oid,
                    msgid: `<msgid-${mkTime().toISOString()}-${msg.oid}>`,
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

            Ipc.sendPrimary(message);
        }
    });
}
