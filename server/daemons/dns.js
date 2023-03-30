/**
 * Copyright (c) 2023 Infosearch International, Reno NV
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
 * The reason is a group of error codes that we bundle together into something
 * that's meaningful to the program flow.  The reason is what we use to decide
 * how to respond to a DNS error within the application server.
*****/
const appCodes = {};
appCodes[DNS.NODATA]                = 'dns-none';
appCodes[DNS.NOTFOUND]              = 'dns-none';
appCodes[DNS.NOTIMP]                = 'dns-none';
appCodes[DNS.NONAME]                = 'dns-none';
appCodes[DNS.SERVERFAIL]            = 'dns-none';
appCodes[DNS.REFUSED]               = 'dns-blocked';
appCodes[DNS.CONNREFUSED]           = 'dns-blocked';
appCodes[DNS.CANCELLED]             = 'dns-blocked';
appCodes[DNS.FORMERR]               = 'dns-technical';
appCodes[DNS.BADQUERY]              = 'dns-technical';
appCodes[DNS.BADFAMILY]             = 'dns-technical';
appCodes[DNS.BADRESP]               = 'dns-technical';
appCodes[DNS.TIMEOUT]               = 'dns-technical';
appCodes[DNS.EOF]                   = 'dns-technical';
appCodes[DNS.FILE]                  = 'dns-technical';
appCodes[DNS.NOMEM]                 = 'dns-technical';
appCodes[DNS.DESTRUCTION]           = 'dns-technical';
appCodes[DNS.BADSTR]                = 'dns-technical';
appCodes[DNS.BADFLAGS]              = 'dns-technical';
appCodes[DNS.BADHINTS]              = 'dns-technical';
appCodes[DNS.NOTINITIALIZED]        = 'dns-technical';
appCodes[DNS.LOADIPHLPAPI]          = 'dns-technical';
appCodes[DNS.ADDRGETNETWORKPARAMS]  = 'dns-technical';


/*****
 * A single server instance used for fetching DNS information.  This central
 * module plus its caching help to alleviate too much network traffic to get
 * DNS information on a requent basis.
*****/
singleton(class Dns extends Daemon {
    static millis = 4 * 60 * 60 * 1000;

    constructor() {
        super();
        this.data = {};
    }

    async onResolveCname(message) {
        let hostinfo = this.data[message.hostname];

        if (!hostinfo) {
            hostinfo = new Object({ hostname: message.hostname });
            this.data[hostinfo.hostname] = hostinfo;
        }

        if (!hostinfo.cname) {
            hostinfo.cname = await this.resolveCname(message.hostname);
            setTimeout(() => delete hostinfo.cname, Dns.millis);
        }

        Message.reply(message, hostinfo.cname);
    }

    async onResolveIp4(message) {
        let hostinfo = this.data[message.hostname];

        if (!hostinfo) {
            hostinfo = new Object({ hostname: message.hostname });
            this.data[hostinfo.hostname] = hostinfo;
        }

        if (!hostinfo.ip4) {
            hostinfo.ip4 = await this.resolveIp4(message.hostname);
            setTimeout(() => delete hostinfo.ip4, Dns.millis);
        }

        Message.reply(message, hostinfo.ip4);
    }

    async onResolveIp6(message) {
        let hostinfo = this.data[message.hostname];

        if (!hostinfo) {
            hostinfo = new Object({ hostname: message.hostname });
            this.data[hostinfo.hostname] = hostinfo;
        }

        if (!hostinfo.ip6) {
            hostinfo.ip6 = await this.resolveIp6(message.hostname);
            setTimeout(() => delete hostinfo.ip6, Dns.millis);
        }

        Message.reply(message, hostinfo.ip6);
    }

    async onResolveMx(message) {
        let domaininfo = this.data[message.domain];

        if (!domaininfo) {
            domaininfo = new Object({ domain: message.domain });
            this.data[domaininfo.hostname] = domaininfo;
        }

        if (!domaininfo.mx) {
            domaininfo.mx = await this.resolveMx(message.domain);
            setTimeout(() => delete domaininfo.mx, Dns.millis);
        }

        Message.reply(message, domaininfo.mx);
    }
    
    resolveCname(hostname) {
        return new Promise((ok, fail) => {
            DNS.resolveCname(hostname, (error, records) => {
                if (error) {
                    let errorCode = error in appCodes ? appCodes[error] : 'other';
                    ok({ cnames: [], error: errorCode });
                }
                else {
                    ok({ cnames: records, error: '' });
                }
            });
        });
    }

    resolveIp4(hostname) {
        return new Promise((ok, fail) => {
            DNS.resolve4(hostname, (error, ipaddrs) => {
                if (error) {
                    let errorCode = error in appCodes ? appCodes[error] : 'other';
                    ok({ ipaddrs: [], error: errorCode });
                }
                else {
                    ok({ ipaddrs: ipaddrs, error: '' });
                }
            });
        });
    }
    
    resolveIp6(hostname) {
        return new Promise((ok, fail) => {
            DNS.resolve6(hostname, (error, ipaddrs) => {
                if (error) {
                    let errorCode = error in appCodes ? appCodes[error] : 'other';
                    ok({ ipaddrs: [], error: errorCode });
                }
                else {
                    ok({ ipaddrs: ipaddrs, error: '' });
                }
            });
        });
    }
    
    resolveMx(domain) {
        return new Promise(async (ok, fail) => {
            DNS.resolveMx(domain, (error, addrs) => {
                if (error) {
                    let errorCode = error in appCodes ? appCodes[error] : 'other';
                    ok({ ipaddrs: [], error: errorCode });
                }
                else {
                    ok({ ipaddrs: addrs, error: '' });
                }
            })
        });
    }
});
