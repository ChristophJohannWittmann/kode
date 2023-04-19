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
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR AY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*****/


/*****
 * A webapp is just one specific type of web extension and probably the most
 * frequencly employed.  A webapp is an extension with specific behavior: (1)
 * an undecorated GET results in responding with a dynamically built HTML doc,
 * (2) a GET with query parameters will be sent off to the handleGET() method
 * to handle, and (3) all POST querys will be passed on to the handlePOST()
 * method to be resolved.  To make a functioning webapp, an instance of a sub-
 * class needs to be made.
 * 
 * During server bootstrapping, the module is loaded and a instances of
 * the sub class are created.  Thereafter, that instance is used repeatedly for
 * handling HTTP and web socket requests.
*****/
register(class WebApp extends Webx {
    constructor(thunk, reference) {
        super(thunk, reference);
    }

    async handleGET(req, rsp) {
        let language = MultilingualText.getAcceptableLanguage(req.acceptLanguage());
        let appText = toJson(MultilingualText.getLanguage(language));

        let html = [
            '<!DOCTYPE html>',
            '<html>',
            '  <head>',
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1">',
            '    <meta name="color-scheme" content="dark light">',
            `    <title>${this.reference.title}</title>`,
        ];

        for (let cssUrl of this.getCssUrls()) {
            html.push(`    <link rel="stylesheet" href="${cssUrl}">`);
        }

        for (let favicon of this.favicons) {
            html.push('    ' + favicon);
        }

        html.push('    <script src="/CLIENTFRAMEWORK.js"></script>');
        html.push('    <script src="/DBOOBJECTSTUBS.js"></script>');
        html.push(`    <script src="${this.webAppClientUrl}"></script>`);

        if (this.thunk.getDarkCodeUrl()) {
            html.push(`    <script src="${this.thunk.getDarkCodeUrl()}"></script>`);
        }

        if (this.thunk.getClientCodeUrl()) {
            html.push(`    <script src="${this.thunk.getClientCodeUrl()}"></script>`);
        }

        let script = [
            `        const webAppSettings = {`,
            '            verify: () => false,',
            '            password: () => false,',
            `            container: () => ${this.thunk.opts.container},`,
            `            homeView: () => ${this.thunk.opts.container}.mk${this.reference.home}(),`,
            '            session: () => null,',
            `            url: () => '${this.reference.url}',`,
            '            session: () => null,',
            '            org: () => null,',
            '            user: () => null,',
            `            websocket: () => ${this.reference.webSocket && Config.sockets},`,
            '            grants: () => {},',
            `            lang: () => '${language}',`,
            '        };',
            `        const txx = ${appText};`,
            '        Object.freeze(txx);',
            `        const booted = '${env.booted}';`,
            ].join('\n');

        script = Config.debug ? script : await minifyJs(script);

        [
            '    <script>',
            script,
            '    </script>',
            '  </head>',
            '  <body onload="bootstrap()">',
            '  </body>',
            '</html>',
        ].forEach(line => html.push(line));

        let doc = html.join('\n');
        doc = Config.debug ? doc : await minifyHtml(doc);
        rsp.end(200, 'text/html', doc);
    }

    async handleMessage(message) {
        if (this.handles(message.messageName)) {
            let response;
            let trx = mkWebAppTransaction(message);
            trx['#Reference'] = await this.reference;

            if (await WebAppTransaction.assign(trx, message)) {
                response = await this.query(trx);
                await trx.commit();
            }
            else {
                response = EndpointContainer.internalError;
                await trx.rollback();
            }

            if (response === EndpointContainer.internalError) {
                if ('#Trap' in message) {
                    return {
                        messageName: message.messageName,
                        response: '#InternalServerError',
                        '#Trap': message['#Trap'],
                        '#Pending': [],
                        '#Code': 'ok',
                    };
                }
            }
            else if (response === EndpointContainer.unauthorized) {
                await Ipc.queryPrimary({
                    messageName: '#SessionManagerCloseSession',
                    session: message['#Session'],
                });

                if ('#Trap' in message) {
                    return {
                        messageName: message.messageName,
                        response: '#NoSession',
                        '#Trap': message['#Trap'],
                        '#Pending': [],
                        '#Code': 'ok',
                    };
                }
            }
            else {
                if (trx.endpoint.flags.notify) {
                    Ipc.sendPrimary({
                        messageName: '#SessionManagerNotifyClient',
                        endpoint: trx.endpoint,
                        context: trx.context,
                    });
                }

                if ('#Trap' in message) {
                    return {
                        messageName: message.messageName,
                        response: response,
                        '#Trap': message['#Trap'],
                        '#Pending': await Ipc.queryPrimary({ messageName: '#SessionManagerSweep', session: message['#Session'] }),
                        '#Code': 'ok',
                    };
                }
            }
        }
        else {
            if ('#Trap' in message) {
                return {
                    messageName: '#Ignored',
                    response: '#Ignored',
                    '#Trap': message['#Trap'],
                    '#Pending': await Ipc.queryPrimary({ messageName: '#SessionManagerSweep', session: message['#Session'] }),
                    '#Code': 'ok',
                };
            }
        }

        return false;
    }

    async handlePOST(req, rsp) {
        if (req.isMessage() && 'messageName' in req.message()) {
            let message = req.message();
            let response = await this.handleMessage(message);

            let code = response['#Code'];
            delete response['#Code'];

            if (code == EndpointContainer.internalError) {
                rsp.end(500, 'application/json', toJson(response));
            }
            else if (code == EndpointContainer.unauthorized) {
                rsp.end(401, 'application/json', toJson(response));
            }
            else {
                rsp.end(200, 'application/json', toJson(response));
            }
        }
        else {
            rsp.endStatus(400);
        }
    }

    async handleWebSocket(webSocket, webSocketMessage) {
        if (webSocketMessage.type == 'string') {
            try {
                let message = fromJson(webSocketMessage.payload.toString());

                if (message.messageName == '#SocketSession') {
                    let sessionKey = message['#Session'];

                    Ipc.sendPrimary({
                        messageName: '#SessionManagerSetSocket',
                        session: sessionKey,
                        socketId: webSocket.socketId,
                        workerId: CLUSTER.worker.id,
                    });
                }
                else if (message.messageName == '#Ping') {
                    webSocket.sendMessage({ messageName: '#Pong' });
                }
                else {
                    let response = await this.handleMessage(message);
                    webSocket.sendMessage(response);
                }
            }
            catch (e) {
            }
        }
    }

    async init(cssPath, htmlPath) {
        await super.init();
        this.webAppClientUrl = `/WEBAPPCODE.js`;

        await mkWebBlob(
            this.webAppClientUrl,
            'text/javascript',
            DarkKode.getBlob('webapp') + 
            await buildClientCode([
                PATH.join(env.kodePath, 'webApp/gui'),
            ])
        ).register();

        await mkConfigEndpoints(this);
        await mkDbmsEndpoints(this);
        await mkOrgEndpoints(this);
        await mkPublicEndpoints(this);
        await mkSelfEndpoints(this);
        await mkSmtpEndpoints(this);
        await mkSystemEndpoints(this);
        await mkTemplateEndpoints(this);
        await mkUserEndpoints(this);
    }

    static async initialize() {
        await DarkKode.import('webapp', [PATH.join(env.kodePath, 'webApp/dark')]);
    }

    async onUpgrade(req, webSocket) {
        webSocket.on('#MessageReceived', message => this.handleWebSocket(webSocket, message));
    }
});

