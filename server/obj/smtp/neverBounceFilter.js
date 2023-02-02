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
 * The never bounce filter uses an external provide to validate and/or reject
 * the addresses of email recipients.  Nerver Bounce is accessable via HTTPS
 * rquests, which requies and account and a paid balance.  All authentication
 * data contained within the request search stirng, meaning it's a GET.  The
 * response handling is a little complicated because of multiple potential
 * failure points along the way.
*****/
register(class SmtpNeverBounceFilter {
    constructor() {
        return new Promise(async (ok, fail) => {
            ok(this);
        });
    }
    
    async filter(outbound) {
        /*
        if (!this.settings) {
            await this.init();
        }
        
        if (!this.settings.value.enabled) {
            return;
        }
        else if (this.settings.value.paid == 0) {
            notify(`Never Bounce credits are 0 (zero).  Outbound SMTP stopped!`);
            sendPrimary({ category: 'SmtpFilterOff' });
            return;
        }
        else if (this.settings.value.paid <= 30001) {
            if (this.settings.value.paid % 2000 == 0) {
                notify(`Never Bounce credits running low: ${this.settings.value.paid}`);
            }
        }

        for (let recipient of outbound.recipients) {
            let addr = outbound.addrMap[recipient.addr];
            let domain = outbound.domainMap[recipient.domain];
            
            if (await this.qualifies(addr, domain)) {
                if (await this.qualifies(domain, addr)) {
                    await this.performCheck(addr, recipient);
                }
            }
        }
        */
        return true;
    }
    
    async init() {
        /*
        let pg = await pgConnect();
        let settings = await selectPgoParameter(pg, `_name='smtp-nbfilter'`);
    
        if (settings.length) {
            settings = settings[0];
        }
        else {
            settings = PgoParameter({
                name: 'smtp-nbfilter',
                value: {
                    enabled: true,
                    host: config.neverBounce.host,
                    path: config.neverBounce.path,
                    key: config.neverBounce.key,
                    timeout: 15,
                    free: 0,
                    paid: 1,
                }
            });
            
            await settings.save(pg);
        }
        
        await pg.commit();
        await pg.free();
        this.settings = settings;
        */
        return this;
    }
    
    async pollNeverBounce(addr, recipient) {
        const v = this.settings.value;
        let rsp = await HTTPCLIENT.get(
            true,
            v.host,
            `${v.path}?key=${v.key}&email=${addr.addr}&credits_info=1&timeout=${v.timeout}&address_info=1`
        );
        
        if (rsp.status == 999) {
            return false
        }
        else {
            let nb = rsp.content;
            
            if (nb.status == 'success') {
                switch (nb.result) {
                    case 'valid':
                        break;
                        
                    case 'invalid':
                    case 'disposable':
                        addr.verified = true;
                        addr.sendable = false;
                        addr.issue = 'neverbounce';
                        recipient.status = 'failed';
                        break;
                }
            }
            
            this.settings.value.free = nb.credits_info.free_credits_remaining;
            this.settings.value.paid = nb.credits_info.paid_credits_remaining;
            
            let pg = await pgConnect();
            await this.settings.save(pg);
            await pg.commit();
            await pg.free();
            
            return true;
        }
    }
    
    performCheck(addr, recipient) {
        return new Promise(async (ok, fail) => {
            let attempts = 0;
            
            if (attempts > 5) {
                notify(`Could not successfully poll Never Bounce.`);
                sendPrimary({ category: 'SmtpFilterOff' });
                ok();
            }
            else {
                attempts++;
                
                if (await this.pollNeverBounce(addr, recipient)) {
                    ok();
                }
                else {
                    await UTIL.wait(20000);
                }
            }
        });
    }
    
    async qualifies(addr, domain) {
        if (!addr.locked && !domain.locked) {
            if (!addr.verified || !domain.verified) {
                return true;
            }
            
            if (Date.now() > addr.verifiedDate.valueOf() + domain.decayDays*24*60*60*1000) {
                return true;
            }
            
            if (Date.now() > domain.verifiedDate.valueOf() + domain.decayDays*24*60*60*1000) {
                return true;
            }
        }
        
        return false;
    }
});
