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
 * The status filter is a preliminary filter that inspects the status of the
 * address and domain of each recipient.  If a recipient's domain is not sendable,
 * the recipient is rejected.  If the recipient's address is not sendable or the
 * recipient has opted out, the recipient is rejected.  If no recipients have been
 * accepted, the smptSend or record is marked as failed as well.
*****/
if (CLUSTER.isPrimary) {
    register(class SmtpStatusFilter {
        constructor() {
            return new Promise(async (ok, fail) => {
                ok(this);
            });
        }
        
        async filter(msg) {
            for (let recipient of Object.values(msg.pinned.recipients)) {
            }
            return true;
            /*
            for (let recipient of outbound.recipients) {
                let addr = outbound.addrMap[recipient.addr];
                let domain = outbound.domainMap[recipient.domain];
                
                if (domain.verified && !domain.sendable) {
                    if (domain.issue == 'spamtrap') {
                        recipient.status = 'spamtrap';
                        outbound.record.status = 'failed';
                        outbound.record.issue = 'spamtrap';
                        continue;
                    }
                    else {
                        recipient.status = 'failed';
                        continue;
                    }
                }
                
                if (addr.verified && !addr.sendable) {
                    if (addr.issue == 'spamtrap') {
                        recipient.status = 'spamtrap';
                        outbound.record.status = 'failed';
                        outbound.record.issue = 'spamtrap';
                        continue;
                    }
                    else {
                        recipient.status = 'failed';
                        continue;
                    }
                }
                else if (addr.optout) {
                    recipient.status = 'optout';
                    continue;
                }
                
                recipient.verified = addr.verified;
            }
            */
        }
    });
}
