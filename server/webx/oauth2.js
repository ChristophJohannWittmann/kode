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
// http://localhost/oauth2/authorize?scope=scope&response_type=code&redirect_uri=http://localhost/reflect&state=123&nonce=123&client_id=abc


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
            let params = req.getVariables();

            if ('oauth2server' in Config) {
                if (params.client_id in Config.oauth2server) {
                    let settings = Config.oauth2server[params.client_id];

                    if (params.response_type == 'code' && typeof params.redirect_uri == 'string') {
                        if (!params.scope || params.scope == settings.scope) {
                            let url = `${env.scheme}://${params.redirect_uri}?`;
                            url = params.state ? `${url}&state=${params.state}`: url;

                            let oauth2RequestCode = await Ipc.queryPrimary({
                                messageName: '#OAuth2DaemonRequestAuthorization',
                                request: params,
                                settings: settings,
                            });

                            let action = `action=${env.scheme}://${req.header('host')}${this.authenticatedUrl}&code=${percentEncode(oauth2RequestCode)}`;
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
            let params = req.getVariables();

            if ('code' in params) {
                let authorization = await Ipc.queryPrimary({
                    messageName: '#OAuth2DaemonConfirmAuthorization',
                    session: params.session,
                    requestCode: params.code,
                });

                if (authorization) {
                    let request = authorization.request;

                    if (authorization.request.state) {
                        rsp.setHeader('Location', `${request.redirect_uri}?code=${authorization.authCode}&state=${request.state}`);
                        rsp.endStatus(302);
                        return;
                    }
                    else {
                        rsp.setHeader('Location', `${request.redirect_uri}?code=${authorization.authCode}`);
                        rsp.endStatus(302);
                        return;
                    }
                }
            }

            rsp.endStatus(404);
        }

        async handleGET(req, rsp) {
            if ('oauth2server' in Config) {
                if (req.pathname() == this.authorizeUrl) {
                    await this.handleAuthorize(req, rsp);
                }
                else if (req.pathname() == this.authenticatedUrl) {
                    await this.handleAuthenticated(req, rsp);
                }
                else if (req.pathname() == this.tokenUrl) {
                    await this.handleToken(req, rsp);
                }
                else if (req.pathname() == this.userUrl) {
                    await this.handleUser(req, rsp);
                }
                else {
                    rsp.endStatus(404);
                }
            }
        }

        async handlePOST(req, rsp) {
            if ('oauth2server' in Config) {
                if (req.pathname() == this.authorizeUrl) {
                    await this.handleAuthorize(req, rsp);
                }
                else if (req.pathname() == this.authenticatedUrl) {
                    await this.handleAuthenticated(req, rsp);
                }
                else if (req.pathname() == this.tokenUrl) {
                    await this.handleToken(req, rsp);
                }
                else if (req.pathname() == this.userUrl) {
                    await this.handleUser(req, rsp);
                }
                else {
                    rsp.endStatus(404);
                }
            }
        }

        async handleToken(req, rsp) {
            console.log(`\n******* handleToken()`);
            let params = req.getVariables();

            /*
            if ('oauth2server' in Config) {
                if (params.client_id in Config.oauth2server) {
                    let settings = Config.oauth2server[params.client_id];

                    if ('client_secret' in params && params.client_secret == settings.clientSecret) {
                        let token = await Ipc.queryPrimary({
                            messageName: '#OAuth2DaemonGetToken',
                            authorizationCode: params.code,
                        });

                        //console.log(token);

                        if (token) {
                            rsp.end(200, 'application/json', toJson(token));
                            return;
                        }
                    }
                }
            }
            */

            rsp.end(200, 'application/json', '{"error":"invalid_request"}');
        }

        async handleUser(req, rsp) {
            console.log(`\n******* handleUser()`);
            let params = req.getVariables();
            console.log(params);
        }

        async init() {
            await super.init();
            this.authorizeUrl = `${this.reference.url}/authorize`;
            this.authenticatedUrl = `${this.reference.url}/authenticated`;
            this.tokenUrl = `${this.reference.url}/token`;
            this.userUrl = `${this.reference.url}/user`;
            WebLibrary.register(this.authorizeUrl, this);
            WebLibrary.register(this.authenticatedUrl, this);
            WebLibrary.register(this.tokenUrl, this);
            WebLibrary.register(this.userUrl, this);
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

        async onConfirmAuthorization(message) {
            if (message.requestCode in this.requests) {
                let request = this.requests[message.requestCode];
                delete this.requests[message.requestCode];
                let authCode = mkBuffer(await Crypto.digestUnsalted('sha256', `${message.session}${mkTime().toISOString()}`)).toString('hex');

                while (authCode in this.authsByKey) {
                    authCode = mkBuffer(await Crypto.digestUnsalted('sha256', `${message.session}${mkTime().toISOString()}`)).toString('hex');
                }

                let session = await Ipc.queryPrimary({
                    messageName: '#SessionManagerGetSession',
                    session: message.session,
                });

                let dbc = await dbConnect();
                let email = await Users.getEmail(dbc, session.user.oid);
                await dbc.rollback();
                await dbc.free();

                let authorization = {
                    authCode: authCode,
                    request: request.request,
                    settings: request.settings,
                    session: message.session,
                    userOid: session.user.oid,
                    userFirstName: session.user.firstName,
                    userLastName: session.user.lastName,
                    userEmailOid: email.oid,
                    userEmail: email.addr,
                    tokens: {},
                };

                Message.reply(message, authorization);
            }

            Message.reply(message, false);
        }

        async onGetToken(message) {
            if ('authorizationCode' in message) {
                if (message.authorizationCode in this.authsByKey) {
                    let authorization = this.authsByKey[message.authorizationCode];
                    let seed = `${authorization.authCode}:${mkTime().toISOString()}`;

                    let token = {
                        access_token: `${Crypto.encodeBase64Url(await Crypto.digestUnsalted(seed))}`,
                        expires_in: authorization.settings.exipiresIn * 1000,
                    };

                    Message.reply(message, token);
                }
            }
            else {
            }

            Message.reply(message, false);
        }

        async onGetUser(message) {
            console.log('OAuth2Daemon.onGetUser()');
            Message.reply(message, 'chris.wittmann@infosearch.online');
        }

        async onRequestAuthorization(message) {
            let requestCode = await Crypto.digestUnsalted('sha256', mkTime().toISOString());

            while (requestCode in this.requests) {
                await pause(479);
                requestCode = await Crypto.digestUnsalted('sha256', mkTime().toISOString());
            }

            this.requests[requestCode] = {
                requestCode: requestCode,
                request: clone(message.request),
                settings: clone(message.settings),
            };

            Message.reply(message, requestCode);
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
