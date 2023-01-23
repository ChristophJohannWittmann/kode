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


    /*****
    *****/
    async [ mkEndpoint('ConfigCertifyIface', 'system') ](trx) {
        let acme = await mkAcmeProvider(trx.ifaceName);
        await acme.establishSession();
        await acme.checkAccount();
        let certificate = await acme.certify(90);

        console.log(certificate);
        return true;
    }


    /*****
     * Clear the current TLS/Crypto Data from the configuration.
    *****/
    async [ mkEndpoint('ConfigClearCrypto', 'system') ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];

        iface.tls.publicKey = null;
        iface.tls.privateKey = null;
        iface.tls.cert = null;
        iface.tls.caCert = null;

        await config.save();
        return true;
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigCopyPublicKey', 'system') ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];
        return iface.tls.publicKey;        
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigCreateAcmeProvider', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigCreateCertificate', 'system') ](trx) {
    }


    /*****
     * Create a new TLS/Crypto key pair.
    *****/
    async [ mkEndpoint('ConfigCreateKeyPair', 'system') ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];
        let keyPair = await Crypto.generateKeyPair();

        iface.tls.publicKey = keyPair.publicKey;
        iface.tls.privateKey = keyPair.privateKey;
        iface.tls.cert = null;
        iface.tls.caCert = null;

        await config.save();
        return true;
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigCreateNetIface', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigDeleteAcmeProvider', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigDeleteCertificate', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigDeleteKeyPair', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigDeleteNetIface', 'system') ](trx) {
    }


    /*****
    *****/
    async [ mkEndpoint('ConfigGetNetIface', 'system') ](trx) {
        let config = await loadConfigFile();
        let iface = config.network[trx.ifaceName];

        if ('tls' in iface) {
            if (!iface.tls.privateKey) {
                iface.tls.privateKey = '[NONE]';
            }
            else {
                iface.tls.privateKey = '[Private Key]';
            }

            if (!iface.tls.publicKey) {
                iface.tls.publicKey = '[NONE]';
            }
            else {
                iface.tls.publicKey = '[Public Key]';
            }

            if (!iface.tls.cert) {
                iface.tls.cert = '[NONE]';
            }
            else {
                iface.tls.cert = 'expires on';
            }

            if (!iface.tls.caCert) {
                iface.tls.caCert = '[NONE]';
            }
            else {
                iface.tls.caCert = 'expires on';
            }
        }
        else {
            iface.tls = {
                privateKey: '[NONE]',
                publicKey: '[NONE]',
                cert: '[NONE]',
                caCert: '[NONE]',
            };
        }

        return iface;
    }


    /*****
     * List configured ACME providers.
    *****/
    async [ mkEndpoint('ConfigListAcmeProviders', 'system') ](trx) {
        let config = await loadConfigFile();
        
        return Object.entries(config.acme).map(entry => ({
            provider: entry[0],
            name: entry[1].name,
            url: entry[1].url,
            account: entry[1].account,
        }));
    }


    /*****
     * List Network Interfaces.
    *****/
    async [ mkEndpoint('ConfigListNetIfaces', 'system') ](trx) {
        let config = await loadConfigFile();
        return Object.keys(config.network);
    }


    /*****
     * Update non-crypto network information.
    *****/
    async [ mkEndpoint('UpdateNetIface', 'system') ](trx) {
        let config = await loadConfigFile();

        if (trx.ifaceName in config.network) {
            for (let property in config.network[trx.ifaceName]) {
                if (property in trx) {
                    config.network[trx.ifaceName][property] = trx[property];
                }
            }

            if (trx.acme != config.network[trx.ifaceName].acme) {
                config.network[trx.ifaceName].tls.acme = trx.acme;
            }
        }

        await config.save();
        return true;
    }
});
