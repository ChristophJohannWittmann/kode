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
// http://localhost/oauth2/authorize?scope=scope&response_type=code&redirect_uri=localhost/reflect&state=123&nonce=123&client_id=abc


/*****
 * This extension webx is responsible implementing the outward part of the OAuth2
 * protocol from an authorization server or identity provider perspective.  For
 * this to work an entry in the configuration file must provide an entry with
 * the client_id being the key for looking up the oauth2 client's configuration
 * data.  As a webx, this only runs in a worker process and is instantiated, like
 * all webx, by its configuration data in the application thunk file.  Remember
 * that the thunk.js file is the application or module configuration while the
 * kode.json file is the server-wide configuration file.  During initialization,
 * the OAuth2Server automatically registers its own paths.  If the thunk shows
 * the oauth server at /oauth, what's registered is /oauth/authorized,
 * /oauth/authenticated, and /oauth/token.  /oauth/authorized is used internally
 * after the user has been authenticated.
 * 
 * An authorization request is started with a GET or POST to /oauth/authorize.
 * Data is stored in a OAuth2Dasemon, whose task to store server-wide OAuth2
 * data for all clients.
*****/
if (CLUSTER.isWorker) {
    register(class OAuth2Server extends Webx {
        constructor(thunk, reference) {
            super(thunk, reference);
            this.selfRegister = true;
        }

        async handleAuthorize(req, rsp) {
            let params = req.parameters();

            if ('oauth2' in Config) {
                if (params.client_id in Config.oauth2) {
                    let settings = Config.oauth2[params.client_id];

                    if (params.response_type == 'code' && typeof params.redirect_uri == 'string') {
                        if (!params.scope || params.scope == settings.scope) {
                            let url = `${env.scheme}://${params.redirect_uri}?`;
                            url = params.state ? `${url}&state=${params.state}`: url;

                            let oauth2RequestCode = await Ipc.queryPrimary({
                                messageName: '#OAuth2DaemonRequestAuthorization',
                                request: params,
                            });

                            let action = `action=${this.authenticatedUrl}` +
                                         `&code=${Crypto.encodeBase64Url(mkBuffer(oauth2RequestCode).toString('base64'))}`;

                            rsp.setHeader('Location', `${this.reference.signin}?${action}`);
                            rsp.endStatus(302);
                            return;
                        }
                    }
                }
            }

            rsp.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            rsp.end(200, 'text/plain', `error=access_denied&state=${params.state}`);
        }

        async handleAuthenticated(req, rsp) {
            let params = req.parameters();

            if ('code' in params) {
                let request = await Ipc.queryPrimary({
                    messageName: '#OAuth2DaemonGetRequest',
                    requestCode: mkBuffer(Crypto.decodeBase64Url(params.code), 'base64').toString(),
                });

                if (request) {
                    let authCode = await Ipc.queryPrimary({
                        messageName: '#OAuth2DaemonSetAuthorizationCode',
                        session: request.session,
                        data: request,
                    });

                    if (authCode) {
                        if (request.state) {
                            rsp.setHeader('Location', `${env.scheme}://${request.redirect_uri}?code=${authCode}&state=${request.state}`);
                            rsp.endStatus(302);
                            return;
                        }
                        else {
                            rsp.setHeader('Location', `${env.scheme}://${request.redirect_uri}?code=${authCode}`);
                            rsp.endStatus(302);
                            return;
                        }
                    }
                }
            }

            rsp.endStatus(404);
        }

        async handleGET(req, rsp) {
            if ('oauth2' in Config) {
                if (req.pathname() == this.authorizeUrl) {
                    await this.handleAuthorize(req, rsp);
                }
                else if (req.pathname() == this.authenticatedUrl) {
                    await this.handleAuthenticated(req, rsp);
                }
                else if (req.pathname() == this.tokenUrl) {
                    await this.handleToken(req, rsp);
                }
                else {
                    rsp.endStatus(404);
                }
            }
        }

        async handleToken(req, rsp) {
            console.log(`\n******* handleToken()`);
            console.log(req.parameters());
            console.log(req.headers());
        }

        async init() {
            await super.init();
            this.authorizeUrl = `${this.reference.url}/authorize`;
            this.authenticatedUrl = `${this.reference.url}/authenticated`;
            this.tokenUrl = `${this.reference.url}/token`;
            WebLibrary.register(this.authorizeUrl, this);
            WebLibrary.register(this.authenticatedUrl, this);
            WebLibrary.register(this.tokenUrl, this);
        }
    });
}


/*****
 * The OAuth2Daemon is responsible for handling server-wide requests for storing
 * and retrieving data associated with the OAuth server feature set.  The reason
 * for this is that multiple associated OAuth HTTP requests will come in over
 * more than one worker process.
*****/
if (CLUSTER.isPrimary) {
    singleton(class OAuth2Daemon extends Daemon {
        constructor() {
            super();
            this.requests = {};
            this.authsByKey = {};
            this.authsByTok = {};
        }

        async onGetRequest(message) {
            if (message.requestCode in this.requests) {
                let request = this.requests[message.requestCode];
                delete this.requests[message.requestCode];
                Message.reply(message, request);
            }

            Message.reply(message);
        }

        async onRequestAuthorization(message) {
            let requestCode = await Crypto.digestUnsalted('sha256', mkTime().toISOString());

            while (requestCode in this.requests) {
                await pause(479);
                requestCode = await Crypto.digestUnsalted('sha256', mkTime().toISOString());
            }

            this.requests[requestCode] = Object.assign(new Object(), message.request);
            Message.reply(message, requestCode);
        }

        async onSetAuthorizationCode(message) {
            let authCode = mkBuffer(await Crypto.digestUnsalted('sha256', `${message.session}${mkTime().toISOString()}`)).toString('hex');

            while (authCode in this.authsByKey) {
                authCode = mkBuffer(await Crypto.digestUnsalted('sha256', `${message.session}${mkTime().toISOString()}`)).toString('hex');
            }

            this.authsByKey[authCode] = {
                authCode: authCode,
                session: message.session,
                data: message.data,
            };

            Message.reply(message, authCode);
        }
    });
}


/*****
 * This extension webx is responsible implementing the a Client on OAuth2
 * protocol.
*****/
if (CLUSTER.isWorker) {
    register(class OAuth2Client extends Webx {
        constructor(thunk, reference) {
            super(thunk, reference);
        }
    });
}
