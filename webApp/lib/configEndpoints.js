/*****
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
*****/


/*****
*****/
register(class ConfigEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }
    
    async [ mkEndpoint('ConfigCertifyIface', 'system', { notify: true }) ](trx) {
        let acme = await mkAcmeProvider(trx.ifaceName);
        await acme.establishSession();
        await acme.checkAccount();
        let certificate = await acme.certify(90);
        let config = await loadConfigFile();
        config.network[trx.ifaceName].tls.cert = certificate;
        await config.save();
        return true;
    }
    
    async [ mkEndpoint('ConfigClearCrypto', 'system', { notify: true }) ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];
        iface.tls.publicKey = null;
        iface.tls.privateKey = null;
        iface.tls.cert = null;
        await config.save();
        return true;
    }
    
    async [ mkEndpoint('ConfigCopyPublicKey', 'system') ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];
        return iface.tls.publicKey.pem;
    }
    
    async [ mkEndpoint('ConfigCreateAcmeProvider', 'system') ](trx) {
    }
    
    async [ mkEndpoint('ConfigCreateKeyPair', 'system', { notify: true }) ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];
        let keyPair = await Crypto.generateKeyPair();

        iface.tls = iface.tls ? iface.tls : new Object();
        iface.tls.publicKey = keyPair.publicKey;
        iface.tls.privateKey = keyPair.privateKey;
        iface.tls.cert = null;
        iface.tls.caCert = null;

        await config.save();
        return true;
    }
    
    async [ mkEndpoint('ConfigCreateNetIface', 'system', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ConfigDeleteAcmeProvider', 'system', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ConfigDeleteCertificate', 'system', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ConfigDeleteKeyPair', 'system', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ConfigDeleteNetIface', 'system', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ConfigGetNetIface', 'system') ](trx) {
        let config = await loadConfigFile();        
        let iface = config.network[trx.ifaceName];

        let data = {
            address: iface.address,
            domain: iface.domain,
            host: iface.host,
            acme: iface.tls ? iface.tls.acme : '',
        };

        if ('tls' in iface) {
            data.privateKey = iface.tls.privateKey ? '[Private Key]' : '[NONE]';
            data.publicKey = iface.tls.publicKey ? '[Public Key]' : '[NONE]';
            data.cert = iface.tls.cert ? '[Certificate]' : '[NONE]';
        }
        else {
            data.privateKey = '[NONE]';
            data.publicKey = '[NONE]';
            data.cert = '[NONE]';
        }

        return data;
    }
    
    async [ mkEndpoint('ConfigListAcmeProviders', 'system') ](trx) {
        let config = await loadConfigFile();
        
        return Object.entries(config.acme).map(entry => ({
            provider: entry[0],
            name: entry[1].name,
            url: entry[1].url,
            account: entry[1].account,
        }));
    }
    
    async [ mkEndpoint('ConfigListNetIfaces', 'system') ](trx) {
        let config = await loadConfigFile();
        return Object.keys(config.network);
    }
    
    async [ mkEndpoint('ConfigUpdateNetIface', 'system', { notify: true }) ](trx) {
        let config = await loadConfigFile();

        if (trx.ifaceName in config.network) {
            config.network[trx.ifaceName].address = trx.address;
            config.network[trx.ifaceName].domain = trx.domain;
            config.network[trx.ifaceName].host = trx.host;
            config.network[trx.ifaceName].tls.acme = trx.acme;
        }

        await config.save();
    }
});
