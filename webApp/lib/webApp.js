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
    constructor() {
        super();
        this.webSockets = {};
        this.permissions = [];
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

        if ('favicons' in this.config) {
            for (let favicon of this.options.favicons) {
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
                title: this.options.title,
                description: this.options.description,
                links: this.links,
                bodyClasses: this.options.bodyClasses,
                url: this.options.url,
                authenticate: this.options.authenticate,
                websocket: this.options.websocket,
            });

            rsp.end(200, 'text/html', await doc.toString());
        }
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
            let requestMessage = req.message();
            let transaction = mkWebAppTransaction(requestMessage);

            try {
                let responseMessage;
                let response = await this.query(transaction);
                transaction.commit();

                if (response) {
                    responseMessage = {
                        messageName: 'PostResponse',
                        '#Trap': requestMessage['#Trap'],
                        response: response
                    };
                }
                else {
                    responseMessage = {
                        messageName: 'Ignored',
                        '#Trap': requestMessage['#Trap'],                    
                    };
                }

                rsp.end(200, 'application/json', toJson(responseMessage));
            }
            catch (e) {
                transaction.rollback();
                rsp.endStatus(500);
            }
        }
        else {
            rsp.endStatus(401);
        }
    }

    async init(cssPath, htmlPath) {
        await super.init();

        this.getModuleSetting('panel', true, 'string');
        this.getModuleSetting('bodyClasses', true, 'string');
        this.getModuleSetting('websocket', true, 'boolean');
        this.getModuleSetting('authenticate', true, 'boolean');
        this.getModuleSetting('server', false, 'array');
        this.getModuleSetting('client', false, 'array');

        this.framework = { '': await buildClientCode([
                'framework/core.js',
                'framework',
                'gui/lib',
                'gui/widgets/inputBase.js',
                'gui/widgets/textArea/entryFilter.js',
                'gui/widgets',
                'gui/editors',
                'gui/panels',
                'webApp/gui/panels',
            ])
        };

        await this.buildLinks();
        await this.buildHTML(PATH.join(env.kodePath, 'webApp/lib/webApp.html'));

        if (this.options.colorsCss) {
            await this.buildCSS(this.config.css);
        }
        else {
            await this.buildCSS(PATH.join(env.kodePath, 'webApp/lib/webApp.css'));
        }

        await mkOrgEndpoints(this);
        await mkSelfEndpoints(this);
        await mkUserEndpoints(this);
    }

    async onWebSocket(req, webSocket) {
        console.log(websocket);
        //this.webSockets[webSocket.id] = webSocket;
    }
});
