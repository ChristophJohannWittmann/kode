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
 * Integrated implementation of the ACME protocol!  The network interface is from
 * the primary kode.json configuration file.  Here's a description of the primary
 * methods in this class.  Please keep in min that the AcmeProvider can only be
 * used for a single requested opertion at a time.  Once that request/order has
 * been completed or rejected, the AcmeProvider object can no longer be used.
 * 
 * authorize()
 * After a session has been established, with establishSession(), before much can
 * happen, we need to get authorization from the ACME provider that we have the
 * authorization to control the specified DNS host.
 * 
 * certify()
 * Certifiy the specified network interface and get a certificate chain to be
 * installed into the kode.json configuration file.  Before certify() is called,
 * establishSession() and checkAccount() must be called to ensure we proper
 * preparation to certify: (a) submit a new order, (b) obtain authorization for
 * the certificate, (c) create and submit the CSR, (d) finialize and return the
 * certificate chain.
 * 
 * checkAccount()
 * Ensures that we have a configured Acme provider account.  If there are no
 * account settings in the configuration, we'll create a new account.  If there
 * is an existing acccount, just load it.
 * 
 * confirmChallenge()
 * When obtaining authorization for a new serive order, we need to perform an
 * asynchrnous step, which is used to provide that we have control of the host
 * specified in the service order.  Confirming the authorization challenge posed
 * by the remote ACME server is the final step in obtaining authorization/.
 * 
 * confirmOrder()
 * When a servie order for a certificate has been accepted, it may be either
 * immediately processed or it may return with a status of "processing".  If
 * the latter, we need to poll the ACME server until the status has changed
 * from "processing" to "valid".
 * 
 * establishSession()
 * The first step performing any actions using ACME is to establish a session
 * with the remote server.  We'll initialize our session with a set or returned
 * links and we'll receive our first nonce string, which is required for our
 * first post.
 * 
 * post()
 * The post method provides the engine for dynamically building JWS HTTP POST
 * requests for the ACME server.  Each JWS post requires a protected header,
 * request content, and a crypto signature.  Note that the "protected" and
 * "payload" properties of the POST's JSON object are encoded using Base 64
 * URL encoding.
 * 
 * revoke()
 * Provides the ability to revoke a TLS certificate.  Due to data management
 * archtiecture, revoke() must be called for the current interface.  It's best
 * if the calling code makes a duplicate of the interface code before revoke()
 * is called.
*****/
register(class AcmeProvider {
    constructor(ifaceName) {
        return new Promise(async (ok, fail) => {
            this.config = await loadConfigFile();
            this.iface = this.config.network[ifaceName];
            this.acme = this.config.acme[this.iface.tls.acme];
            this.alg = 'RS256';
            this.failure = {};
            ok(this);
        });
    }

    async authorize() {
        this.challenge = null;
        this.challengeType = 'http-01';
        let reply = await this.post(this.authorizationUrl, 'PostAsGet');

        if (reply.status == 200) {
            this.challenge = reply.content.challenges.filter(challenge => {
                return challenge.type == this.challengeType;
            })[0];

            if (this.challenge.status == 'pending') {
                let hash = await Crypto.hash('sha256', `{"e":"${this.jwk.e}","kty":"${this.jwk.kty}","n":"${this.jwk.n}"}`);
                let thumbprint = Crypto.encodeBase64Url(hash);
                let keyChallenge = `/.well-known/acme-challenge/${this.challenge.token}`;
                let keyAuthorization = `${this.challenge.token}.${thumbprint}`;

                let hook = mkHookResource(keyChallenge, async (...args) => {
                    return {
                        status: 200,
                        mime: 'text/plain',
                        headers: {},
                        content: keyAuthorization,
                    };
                }).setTlsMode('none').setTimeout(30000);
                reply = await this.post(this.challenge.url, {});

                if (reply.status == 200) {
                    reply = await hook.keepPromise();

                    if (reply) {
                        if (await this.confirmChallenge(10)) {
                            hook.clear();
                            return true;
                        }
                        else {
                            this.failure = reply;
                        }
                    }
                }
                else {
                    this.failure = reply;
                }
            }
            else if (this.challenge.status == 'valid') {
                return true;
            }
        }

        return false;
    }

    async certify(days) {
        let reply = await this.post(
            this.newOrder,
            {
                identifiers: [{
                    type: 'dns',
                    value: this.iface.host,
                }]
            }
        );

        if (reply.status == 201) {
            this.finalizeUrl = reply.content.finalize;
            this.authorizationUrl = reply.content.authorizations[0];

            if (await this.authorize()) {
                let csr = await Crypto.createCsr({
                    der: true,
                    privateKey: this.iface.tls.privateKey.pem,
                    country: Config.operator.country,
                    state: Config.operator.state,
                    locale: Config.operator.locale,
                    org: Config.operator.org,
                    hostname: this.iface.host,
                    days: days,
                });

                reply = await this.post(this.finalizeUrl, {
                    csr: Crypto.encodeBase64Url(csr),
                });

                if (reply.content.status == 'valid') {
                    this.certificateUrl = reply.content.certificate;
                }
                else if (!this.confirmOrder(10)) {
                    return false;
                }

                reply = await this.post(this.certificateUrl, 'PostAsGet', {
                    Accept: 'application/pem-certificate-chain',
                });

                return await Crypto.analyzeCertificateChain(reply.content);
            }
        }

        return false;
    }

    async checkAccount() {
        if (!this.acme.account) {
            let keyPair = await Crypto.generateKeyPair();

            this.config.acme[this.iface.tls.acme].publicKey = keyPair.publicKey;
            this.config.acme[this.iface.tls.acme].privateKey = keyPair.privateKey;
            this.jwk = npmPemJwk.pem2jwk(keyPair.publicKey.pem);

            let reply = await this.post(
                this.newAccount,
                {
                    termsOfServiceAgreed: true,
                    contact: this.config.administrators.map(admin => `mailto:${admin.email}`),
                });

            this.config.acme[this.iface.tls.acme].account = reply.content;
            this.config.acme[this.iface.tls.acme].account.kid = reply.headers.location;

            await this.config.save();
            this.acme = this.config.acme[this.iface.tls.acme];
        }
        else {
            this.jwk = npmPemJwk.pem2jwk(this.acme.publicKey.pem);
        }

        return this.acme.account;
    }

    async confirmChallenge(maxAttempts) {
        return new Promise((ok, fail) => {
            let attempts = 0;
        
            const poll = async () => {
                attempts++;
                let response = await this.post(this.authorizationUrl, 'PostAsGet');

                let challenge = response.content.challenges.filter(challenge => {
                    return challenge.type == this.challenge.type
                })[0];

                if (challenge.status == 'valid') {
                    ok(true);
                }
                else if (challenge.status == 'invalid') {
                    ok(false);                    
                }
                else if (attempts >= maxAttempts) {
                    ok(false);
                }
                else {
                    setTimeout(poll, 2000);
                }
            };

            poll();
        });
    }

    async confirmOrder(maxAttempts) {
        return new Promise((ok, fail) => {
            let attempts = 0;

            const poll = async () => {
                attempts++;
                let response = await this.post(this.finalizeUrl, 'PostAsGet');

                if (response.content.status == 'valid') {
                    this.certificateUrl = response.content.certificate;
                    ok(true);
                }
                else if (response.content.status in { pending:0, invalid:0 }) {
                    ok(false);                    
                }
                else if (response.content.status == 'processing') {
                    if ('retry-after' in response.headers) {
                        var millis = parseInt(response.headers['retry-after']) * 1000;
                        setTimeout(poll, millis);
                    }
                    else {
                        setTimeout(poll, 5000);
                    }                    
                }
                else if (attempts >= maxAttempts) {
                    ok(false);
                }
            };

            poll();
        });
    }

    async establishSession() {
        let reply = await mkHttpClient().get(this.acme.url);

        if (reply.status == 200 && reply.mime == 'application/json') {
            for (let property in reply.content) {
                this[property] = reply.content[property];
            }

            reply = await mkHttpClient().head(this.newNonce);
            this.nonce = reply.headers['replay-nonce'];
            return true;
        }

        return false;
    }

    getAccount() {
        return this.acme.account;
    }

    async post(url, payload, headers) {
        headers = headers ? headers : {};
        headers['Connection'] = 'keep-alive';
        headers['User-Agent'] = 'Kode_ACME_User_Agent_v001';
        headers['Accept-Language'] = 'en-US';

        let jwsHeader = {
            alg: this.alg,
            nonce: this.nonce,
            url: url,
        };

        url == this.newAccount ? jwsHeader.jwk = this.jwk : jwsHeader.kid = this.acme.account.kid;
        let jwsHeaderB64 = Crypto.encodeBase64Url(toStdJson(jwsHeader));
        let jwsPayloadB64 = payload == 'PostAsGet' ? '' : Crypto.encodeBase64Url(toStdJson(payload));

        let jwsSignature = Crypto.sign(
            'sha256',
            this.acme.privateKey.pem,
            `${jwsHeaderB64}.${jwsPayloadB64}`,
            'base64url'
        );

        let body = toStdJson({
            protected: jwsHeaderB64,
            payload: jwsPayloadB64,
            signature: jwsSignature,
        });

        let reply = await mkHttpClient().post(url, 'application/jose+json', body, headers);
        this.nonce = reply.headers['replay-nonce'];
        return reply;
    }

    async revoke() {
    }
});