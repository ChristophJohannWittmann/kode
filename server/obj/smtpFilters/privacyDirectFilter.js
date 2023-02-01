/**
 * Copyright (c) 2022 Infosearch International, Reno NV
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


/**
 * The privacy direct filter is very important and prescreens against a single
 * known spam trap approach.  privachdirect.net "catches" senders and puts them
 * on SORBS by placing receiving spam-trap domains all over the place.  They are
 * also typos such as progidy.net adn telus.net.  One typo and you're on SORBS.
 * What we noticed is that the A records for those spam-trap domains seem to
 * point privacydirect.net.  Hence, we check the A/AAAA records for all recipient
 * domains against the IPs of both www.privacydirect.net and privacydirect.net.
 * If there's any overlap, the address and domain are snagged permanently
 * shut down.
 *
new (class PrivacyDirectFilter extends SmtpFilter {
    static addrs = null;
    static cache = null;
    
    constructor() {
        super();
        this.name = 'Privacy Direct Filter';
    }
    
    async exec(outbound) {
        await this.init();
    
        for (let recipient of outbound.recipients) {
            let smtpAddr = outbound.addrMap[recipient.addr];
            let smtpDomain = outbound.domainMap[recipient.domain];
            
            if (!smtpDomain.verified && smtpDomain.sendable) {
                for (let addr of await this.resolve(smtpDomain.domain, `www.${smtpDomain.domain}`)) {
                    if (addr in PrivacyDirectFilter.ipAddrs) {                        
                        outbound.record.status = 'failed';
                        outbound.record.issue = 'spamtrap';
                        
                        recipient.status = 'spamtrap';
                        
                        smtpDomain.locked = true;
                        smtpDomain.verified = true;
                        smtpDomain.sendable = false;
                        smtpDomain.issue = 'spamtrap';
                        
                        let history = outbound.createDomainHistory(smtpDomain);
                        history.action = 'blacklisted'
                        history.issue = 'spamtrap (privacydirect.net)';
                        
                        smtpAddr.locked = true;
                        smtpAddr.verified = true;
                        smtpAddr.sendable = false;
                        smtpAddr.issue = 'spamtrap';
                        
                        history = outbound.createAddrHistory(smtpAddr);
                        history.action = 'blacklisted'
                        history.issue = 'spamtrap (privacydirect.net)';
                        
                        break;
                    }
                }
            }
        }
    }
    
    async init() {
        if (!PrivacyDirectFilter.ipAddrs) {
            let pg = await pgConnect();
            let params = await selectPgoParameter(pg, `_name='smtp-pdfilter'`);
            
            if (!params.length) {
                let param = PgoParameter({
                    name: 'smtp-pdfilter',
                    value: [
                        'privacydirect.net',
                        'www.privacydirect.net'
                    ]
                });
                
                await param.save(pg);
                var hosts = param.value;
            }
            else {
                var hosts = params[0].value;
            }
            
            await pg.commit();
            await pg.free();
            
            PrivacyDirectFilter.cache = {};
            PrivacyDirectFilter.ipAddrs = {};

            for (let host of hosts) {
                let response = await requestPrimary({ category: 'DnsResolve', hostname: host });
                let allAddrs = response.host.ipv4.ipaddrs.concat(response.host.ipv6.ipaddrs);
                
                allAddrs.forEach(addr => {
                    if (addr in PrivacyDirectFilter.ipAddrs) {
                        PrivacyDirectFilter.ipAddrs[addr].push(host);
                    }
                    else {
                        PrivacyDirectFilter.ipAddrs[addr] = [host];
                    }
                });
            }
            
            setTimeout(() => PrivacyDirectFilter.ipAddrs = null, 24*60*60*1000);
        }
    }
    
    async resolve(...hostnames) {
        let addrs = [];
        
        for (let hostname of hostnames) {
            if (hostname in PrivacyDirectFilter.cache) {
                var hostInfo = PrivacyDirectFilter.cache[hostname];
            }
            else {
                var hostInfo = await requestPrimary({ category: 'DnsResolve', hostname: hostname });
                PrivacyDirectFilter.cache[hostname] = hostInfo;
            }
            
            if (hostInfo) {
                addrs = addrs.concat(hostInfo.host.ipv4.ipaddrs);
                addrs = addrs.concat(hostInfo.host.ipv6.ipaddrs);
            }
        }
        
        return addrs;
    }
})();
*/
