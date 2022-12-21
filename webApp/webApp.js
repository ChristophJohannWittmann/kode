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
    constructor(module, reference) {
        super(module, reference);
        this.webSockets = {};
    }

    async buildCSS(path) {
        this.visualCss = (await FILES.readFile(path)).toString();
        this.compactCss = await minify(path);
    }

    async buildHTML(path) {
        this.visualHtml = (await FILES.readFile(path)).toString();
        this.compactHtml = await minify(path);
    }

    async buildLinks() {
        let links = [];
        this.links = '';

        if (Array.isArray(this.reference.favicons)) {
            for (let favicon of this.reference.favicons) {
                switch (favicon.type) {
                    case 'icon':
                        let parsed = PATH.parse(favicon.href);
                        let mime = mkMime(parsed.ext);

                        links.push(
                            await htmlElement('link',
                                htmlAttribute('rel', favicon.type),
                                htmlAttribute('type', mime.code),
                                htmlAttribute('href', favicon.href)
                            ).toCompact()
                        );
                        break;

                    case 'shortcut icon':
                        links.push(
                            await htmlElement('link',
                                htmlAttribute('rel', favicon.type),
                                htmlAttribute('href', favicon.href)
                            ).toCompact()
                        );
                        break;
                }
            }
        }

        if (links.length) {
            this.links = `\n        ${links.join('\n        ')}`;
        }
    }

    calcApplicationLanguage(req) {
        let acceptLanguage = req.acceptLanguage();

        if (Object.keys(acceptLanguage).length) {
            for (let lang in acceptLanguage) {
                let language = this.multilingualText.hasLanguage(lang);

                if (language) {
                    return language;
                }
            }
        }

        return this.multilingualText.getLanguage();
    }

    async handleGET(req, rsp) {
        let handlerName = `handleGet${req.query()}`;

        if (handlerName in this) {
            await this[handlerName](req, rsp);
        }
        else {
            let language = this.calcApplicationLanguage(req);
            let apptext = toJson(this.multilingualText.getLanguage(language));

            let doc = mkTextTemplate(this.reference.minify ? this.compactHtml : this.visualHtml).set({
                css: this.compactCss,
                title: this.module.settings.title,
                description: this.module.settings.description,
                links: this.links,
                url: this.reference.url,
                websocket: this.settings.websocket,
                apptext: apptext,
                homeView: this.settings.homeView,
                container: this.module.settings.container,
            });

            rsp.end(200, 'text/html', await doc.toString());
        }
    }

    async handleGetCLIENTAPPLICATION(req, rsp) {
        if (!(rsp.encoding in this.framework)) {
            this.clientApplication[rsp.encoding] = await compress(rsp.encoding, this.clientApplication['']);
        }

        rsp.preEncoded = true;
        rsp.end(this.clientApplication[rsp.encoding]);
    }

    async handleGetCLIENTFRAMEWORK(req, rsp) {
        if (!(rsp.encoding in this.framework)) {
            this.framework[rsp.encoding] = await compress(rsp.encoding, this.framework['']);
        }

        rsp.preEncoded = true;
        rsp.end(this.framework[rsp.encoding]);
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
                        messageName: '#InternalServerError',
                        '#Trap': message['#Trap'],
                        '#Code': EndpointContainer.internalError,
                    };
                }
                else {
                    return false;
                }
            }
            else if (response === EndpointContainer.unauthorized) {
                await Ipc.queryPrimary({
                    messageName: '#SessionManagerCloseSession',
                    session: message['#Session'],
                });

                if ('#Trap' in message) {
                    return {
                        messageName: '#CloseApp',
                        '#Code': EndpointContainer.unauthorized
                    };
                }
                else {
                    return false;
                }
            }
            else {
                if ('#Trap' in message) {
                    return {
                        messageName: message.messageName,
                        response: response,
                        '#Trap': message['#Trap'],
                        '#Pending': await Ipc.queryPrimary({ messageName: '#SessionManagerSweep', session: message['#Session'] }),
                        '#Code': 'ok',
                    };
                }
                else {
                    return false;
                }
            }
        }
        else {
            if ('#Trap' in message) {
                return {
                    messageName: '#Ignored',
                    response: '',
                    '#Trap': message['#Trap'],
                    '#Pending': await Ipc.queryPrimary({ messageName: '#SessionManagerSweep', session: message['#Session'] }),
                    '#Code': EndpointContainer.ignored,
                };
            }
            else {
                return false;
            }
        }
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
                    this.webSockets['#Session'] = webSocket;
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
        await this.loadApplicationText();

        this.framework = { '': await buildClientCode([
                'framework/core.js',
                'framework/message.js',
                'framework',
                'gui/lib/entryFilter.js',
                'gui/lib',
                'gui/widgets/inputBase.js',
                'gui/widgets/input.js',
                'gui/widgets/stack.js',
                'gui/widgets',
                'gui/views/container.js',
                'gui/views/panel.js',
                'gui/views',
                'webApp/gui',
            ])
        };

        if (this.settings.server) {
            for (let path of this.settings.server.map(path => absolutePath(this.module.path, path))) {
                for (let codePath of await recurseFiles(path)) {
                    if (codePath.endsWith('.js')) {
                        require(codePath);
                    }
                }
            }
        }

        if (this.settings.client) {
            this.clientApplication = {
                '': await buildClientCode(this.settings.client.map(path => absolutePath(this.module.path, path)))
            };
        }

        await this.buildLinks();
        await this.buildHTML(PATH.join(env.kodePath, 'webApp/webApp.html'));

        if (this.settings.colorsCss) {
            await this.buildCSS(this.reference.css);
        }
        else {
            await this.buildCSS(PATH.join(env.kodePath, 'webApp/webApp.css'));
        }

        await mkConfigEndpoints(this);
        await mkDbmsEndpoints(this);
        await mkOrgEndpoints(this);
        await mkPublicEndpoints(this);
        await mkSelfEndpoints(this);
        await mkSmtpEndpoints(this);
        await mkSystemEndpoints(this);
        await mkTemplateEndpoints(this);
        await mkTicketEndpoints(this);
        await mkUserEndpoints(this);
    }

    async loadApplicationText() {
        this.multilingualText = mkWebAppText();

        if ('text' in this.settings) {
            for (let definedPath of await this.settings.text) {
                let path = absolutePath(this.module.path, definedPath);

                if (path.endsWith('.js') && await pathExists(path)) {
                    let stats = await FILES.stat(path);

                    if (stats.isFile()) {
                        let module = require(path);

                        if (module instanceof Object) {
                            this.multilingualText.setText(module);
                        }
                    }
                }
            }
        }

        this.multilingualText.finalize();
    }

    async onWebSocket(req, webSocket) {
        webSocket.on('#MessageReceived', message => this.handleWebSocket(webSocket, message));
    }
});
