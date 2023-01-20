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
register(class AcmeProvider {
    constructor(ifaceName) {
        return new Promise(async (ok, fail) => {
            this.config = await loadConfigFile();
            this.iface = this.config.network[ifaceName];
            this.acme = this.config.acme[this.iface.tls.acme];
            this.alg = 'RS256';
            ok(this);
        });
    }

    async certify() {
        this.challengeType = 'http-01';

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
            this.challenge = null;
            this.finalizeUrl = reply.content.finalizeUrl;
            this.authorizationUrl = reply.content.authorizations[0];
            reply = await this.post(this.authorizationUrl, 'PostAsGet');

            if (reply.status == 200) {
                this.challenge = reply.content.challenges.filter(challenge => {
                    return challenge.type == this.challengeType;
                })[0];

                let hash = await Crypto.hash('sha256', `{"e":"${this.jwk.e}","kty":"${this.jwk.kty}","n":"${this.jwk.n}"}`);
                let keyChallenge = `/.well-known/acme-challenge/${this.challenge.token}`;
                let keyAuthorization = `${this.challenge.token}.${thumbprint}`;

                let hook = mkHookResource(keyChallenge, async (...args) => {
                    return {
                        status: 200,
                        mime: 'text/plain',
                        headers: {},
                        content: keyAuthorization,
                    };
                })
                .setTlsMode('none')
                .setTimeout(60000);

                reply = await this.post(this.challenge.url, {});

                if (reply.status == 200) {
                    reply = await hook.keepPromise();
                    console.log(reply);

                    if (reply) {
                        if (await this.confirmChallenge(2)) {
                            console.log('time to create the CSR');
                        }
                    }
                }
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
        
            let interval = setInterval(async () => {
                attempts++;
                let response = await this.post(this.authorizationUrl, 'PostAsGet');

                let challenge = response.content.challenges.filter(challenge => {
                    return challenge.type == this.challenge.type
                })[0];

                console.log(challenge);
                if (challenge.status == 'valid') {
                    clearInterval(interval);
                    ok(true);
                }
                else if (attempts > maxAttempts) {
                    clearInterval(interval);
                    ok(false);
                }
            }, 1000);
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

    async pollOrder() {
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