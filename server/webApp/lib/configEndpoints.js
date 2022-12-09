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
*****/
register(class ConfigEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkEndpoint('ConfigCreateAcmeProvider', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigCreateCertificate', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigCreateKeyPair', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigCreateNetIface', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigDeleteAcmeProvider', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigDeleteCertificate', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigDeleteKeyPair', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigDeleteNetIface', 'system') ](trx) {
    }

    async [ mkEndpoint('ConfigGetNetIface', 'system') ](trx) {
        let config = await loadConfigFile('builtin');
        let iface = config.network[trx.ifaceName];


        if (iface.tls) {
            if (!iface.tls.privateKey) {
                iface.tls.privateKey = '...';
            }
            else {
                iface.tls.privateKey = '[Private Key]';
            }

            if (!iface.tls.publicKey) {
                iface.tls.publicKey = '...';
            }

            if (!iface.tls.cert) {
                iface.tls.cert = '...';
            }

            if (!iface.tls.caCert) {
                iface.tls.caCert = '...';
            }
        }

        return iface;
    }

    async [ mkEndpoint('ConfigListAcmeProviders', 'system') ](trx) {
        let config = await loadConfigFile('builtin');
        
        return Object.entries(config.acme).map(entry => ({
            provider: entry[0],
            name: entry[1].name,
            url: entry[1].url,
            account: entry[1].account,
        }));
    }

    async [ mkEndpoint('ConfigListNetIfaces', 'system') ](trx) {
    }
});
