/*****
 * Copyright (c) 2017-2022 Christoph Wittmann, chris.wittmann@icloud.com
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

    async handleGET(req, rsp) {
        let handlerName = `handleGet${req.query()}`;

        if (handlerName in this) {
            await this[handlerName](req, rsp);
        }
        else {
            let doc = mkTextTemplate(Config.minify ? this.compactHtml : this.visualHtml).set({
                css: this.compactCss,
                title: this.module.settings.title,
                description: this.module.settings.description,
                links: this.links,
                bodyClasses: this.settings.bodyClasses,
                url: this.reference.url,
                authenticate: this.settings.authenticate,
                websocket: this.settings.websocket,
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

    async handlePOST(req, rsp) {
        if (req.isMessage() && 'messageName' in req.message()) {
            let response;
            let message = req.message();

            if (message.messageName in this.handlers) {
                let req = mkWebAppTransaction(message);
                response = await this.query(req);
                await req.commit();
            }
            else {
                response = WebAppEndpointContainer.ignored;
            }

            if (response === WebAppEndpointContainer.internalError) {
                rsp.endStatus(500);
            }
            else if (response === WebAppEndpointContainer.unauthorized) {
                rsp.endStatus(401);
            }
            else if (response === WebAppEndpointContainer.ignored) {
                rsp.end(200, 'application/json', toJson({
                    messageName: 'Ignored',
                    '#Trap': message['#Trap'],
                }));
            }
            else {
                rsp.end(200, 'application/json', toJson({
                    messageName: 'PostResponse',
                    response: response,
                    '#Trap': message['#Trap'],
                }));
            }
        }
        else {
            rsp.endStatus(400);
        }
    }

    async init(cssPath, htmlPath) {
        await super.init();

        this.framework = { '': await buildClientCode([
                'framework/core.js',
                'framework',
                'gui/lib',
                'gui/widgets/inputBase.js',
                'gui/widgets/textArea/entryFilter.js',
                'gui/widgets',
                'gui/editors',
                'gui/panels',
                'server/webApp/gui',
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
        await this.buildHTML(PATH.join(env.kodePath, 'server/webApp/webApp.html'));

        if (this.settings.colorsCss) {
            await this.buildCSS(this.reference.css);
        }
        else {
            await this.buildCSS(PATH.join(env.kodePath, 'server/webApp/webApp.css'));
        }

        //await mkDbmsEndpoints(this);
        //await mkOrgEndpoints(this);
        await mkSelfEndpoints(this);
        //await mkSmtpEndpoints(this);
        //await mkSystemEndpoints(this);
        //await mkTemplateEndpoints(this);
        //await mkUserEndpoints(this);
    }

    async onWebSocket(req, webSocket) {
        console.log(websocket);
        //this.webSockets[webSocket.id] = webSocket;
    }
});
