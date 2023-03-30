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
 * The domain filter is used for performing DNS checks and other future potential
 * network-based checks to filter-out domains that look unavailable or possibly
 * suspicous in nature.  Again, this filter on screens out suspicious domaons
 * that are NOT verified.
*****/
if (CLUSTER.isPrimary) {
    register(class SmtpDomainFilter {
        constructor() {
            return new Promise(async (ok, fail) => {
                ok(this);
            });
        }
        
        async filter(msg) {
            /*
            const domains = {};
        
            for (let recipient of outbound.recipients) {
                let addr = outbound.addrMap[recipient.addr];
                let domain = outbound.domainMap[recipient.domain];
                
                if (!domain.verified && domain.sendable) {
                    if (domain.id in domains) {
                        if (!domains[domain.id].sendable) {
                            recipient.status = 'failed'
                        }
                    }
                    else {
                        domains[domain.id] = domain;
                        
                        if (!await this.checkMX(domain)) {
                            domain.sendable = false;
                            domain.verified = true;
                            domain.issue = 'mxcheck';
                            addr.sendable = false;
                            addr.verified = true;
                            addr.issue = 'mxcheck';
                            recipient.status = 'failed';
                        }
                        else if (!await this.checkNextThing(domain)) {
                            domain.sendable = false;
                            domain.verified = true;
                            domain.issue = '**REPLACE**';
                            addr.sendable = false;
                            addr.verified = true;
                            addr.issue = '**REPLACE**';
                            recipient.status = 'failed';
                        }
                    }
                }
            }
            */
            return true;
        }
        
        async checkMX(domain) {
            let exchanges = await requestPrimary({ category: 'DnsMX', domain: domain.domain });
            return exchanges.mx.length  > 0;
        }
        
        async checkNextThing(domain) {
            return true;
        }
    });
}
