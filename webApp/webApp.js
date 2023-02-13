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
 * Default CSS colors for the built in style sheet.  If the developer does not
 * provide alternate colors in the module.json file, use these colors here for
 * the GUI.
*****/
const builtinCssVariables = {
    light: {
        widget_border_width: '1px',
        widget_border_radius: '5px',
        widget_outline_width: '2px',
        widget_outline_radius: '5px',

        widget_color: '#2F4F5F',
        widget_background_color: '#FFFFFF',
        widget_border_color: '#C0C0C0',

        widget_hover_color: '#2F4F5F',
        widget_hover_background_color: '#F9F9F9',
        widget_hover_border_color: '#C0C0C0',

        widget_focus_color: '#646464',
        widget_focus_background_color: '#FFFFFF',
        widget_focus_border_color: '#C0C0C0',
        widget_focus_outline_color: '#FF8C00',

        widget_disabled_color: '#BBBBBB',
        widget_disabled_background_color: '#FFFFFF',
        widget_disabled_border_color: '#C0C0C0',

        widget_error_color: '#DC143C',
        widget_error_background_color: '#FFF9F9',
        widget_error_border_color: '#DC143C',

        menu_color: '#2F4F5F',
        menu_background_color: '#F9F9F9',
        menu_hover_color: '#2F4F5F',
        menu_hover_background_color: '#DDDDDD',
        menu_disabled_color: '#BBBBBB',
        menu_disabled_background_color: '#F9F9F9',

        main_color: '#2F4F5F',
        main_background_color: '#FFFFFF',
        main_border_color: '#778899',
        main_outline_color: '#FF8C00',
        main_hover_color: '#2F4F4F',
        main_hover_background_color: '#787878',

        alt_color: '#4682B4',
        alt_background_color: '#FDFDFD',
        alt_border_color: '#4682B4',
        alt_outline_color: '#FF8C00',
        alt_hover_color: '#2F4F4F',
        alt_hover_background_color: '#FF8C00',
    },
    dark: {
        widget_border_width: '1px',
        widget_border_radius: '5px',
        widget_outline_width: '2px',
        widget_outline_radius: '5px',

        widget_color: '#FFFFFF',
        widget_background_color: '#000000',
        widget_border_color: '#565656',

        widget_hover_color: '#FFFFFF',
        widget_hover_background_color: '#222222',
        widget_hover_border_color: '#565656',

        widget_focus_color: '#FFFFFF',
        widget_focus_background_color: '#000000',
        widget_focus_border_color: '#565656',
        widget_focus_outline_color: '#FF8C00',

        widget_disabled_color: '#A9A9A9',
        widget_disabled_background_color: '#000000',
        widget_disabled_border_color: '#C0C0C0',

        widget_error_color: '#DC143C',
        widget_error_background_color: '#222222',
        widget_error_border_color: '#DC143C',

        menu_color: '#FFFFFF',
        menu_background_color: '#222222',
        menu_hover_color: '#C0C0C0',
        menu_hover_background_color: '#444444',
        menu_disabled_color: '#BBBBBB',
        menu_disabled_background_color: '#222222',

        main_color: '#FFFFFF',
        main_background_color: '#000000',
        main_border_color: '#F0F8FF',
        main_outline_color: '#FF8C00',
        main_hover_color: '#2F4F4F',
        main_hover_background_color: '#787878',

        alt_color: '#B0C4DE',
        alt_background_color: '#222222',
        alt_border_color: '#4682B4',
        alt_outline_color: '#FF8C00',
        alt_hover_color: '#2F4F4F',
        alt_hover_background_color: '#FF8C00',
    }
};


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
    constructor(reference) {
        super(reference);
        console.log(reference);
        this.webSockets = {};
    }

    async buildCSS(path, variables) {
        if (variables) {
            let template = mkTextTemplate((await FILES.readFile(path)).toString());

            for (let symbol in template.symbols) {
                if (symbol in variables) {
                    template.set(symbol, variables[symbol]);
                }
                else {
                    template.set(symbol, '');
                }
            }

            var verboseCss = template.toString();
        }
        else {
            var verboseCss = (await FILES.readFile(path)).toString();
        }

        if (this.reference.debug) {
            return verboseCss;
        }
        else {
            return await minifyCss(verboseCss);
        }
    }

    buildCssVariables(cssVariables) {
        const schemeSettings = {};

        for (let section in cssVariables) {
            schemeSettings[section] = [];

            for (let settingName in cssVariables[section]) {
                schemeSettings[section].push(`        --${settingName.replaceAll('_', '-')}: ${cssVariables[section][settingName]};`);
            }

            schemeSettings[section] = schemeSettings[section].join('\n');
        }

        return schemeSettings;
    }

    async buildHTML() {
        let html = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html'))).toString();

        if (this.reference.debug) {
            var htmlJs = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html.js'))).toString();
        }
        else {
            html = await minifyHtml(html);
            var htmlJs = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html.js.min'))).toString();
        }

        return html.replace('${webAppJs}', htmlJs);
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
        else if (req.query().startsWith('STYLESHEET')) {
            await this.handleGetSTYLESHEET(req, rsp);
        }
        else {
            let language = this.calcApplicationLanguage(req);
            let apptext = toJson(this.multilingualText.getLanguage(language));

            let doc = mkTextTemplate(this.html).set({
                styleSheets: this.styleSheetLinks,
                title: this.module.settings.title,
                description: this.module.settings.description,
                links: this.links,
                url: this.reference.url,
                websocket: this.settings.websocket,
                apptext: apptext,
                homeView: this.settings.homeView,
                container: this.module.settings.container,
                bootedAt: env.booted.toString(),
            });

            rsp.end(200, 'text/html', await doc.toString());
        }
    }

    async handleGetCLIENTAPPLICATION(req, rsp) {
        if (!(rsp.encoding in this.clientApplication)) {
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

    async handleGetSTYLESHEET(req, rsp) {
        if (req.query().indexOf('/') > 0) {
            let [ path, number ] = req.query().trim().split('/');
            let index = parseInt(number);

            if (index >= 0 && index < this.styleSheets.length) {
                if (!(rsp.encoding in this.styleSheets[index])) {
                    this.styleSheets[index][rsp.encoding] = await compress(rsp.encoding, this.styleSheets[index]['']);
                }

                rsp.preEncoded = true;
                rsp.end(200, 'text/css', this.styleSheets[index][rsp.encoding]);
                return;
            }
        }

        rsp.endStatus(404);
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
                    this.webSockets[sessionKey] = webSocket;

                    Ipc.sendPrimary({
                        messageName: '#SessionManagerSetSocket',
                        session: sessionKey,
                        socketId: webSocket.socketId,
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
        return;
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
                'gui/widgets/panel.js',
                'gui/widgets',
                'webApp/gui',
            ], this.reference.debug)
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
                '': await buildClientCode(
                        this.settings.client.map(path => absolutePath(this.module.path, path)),
                        this.reference.debug
                    )
            };
        }

        await this.buildLinks();
        this.html = await this.buildHTML();
        this.styleSheets = [];

        if (this.settings.cssVariables) {
            let variables = this.buildCssVariables(this.settings.cssVariables);
            this.styleSheets.push({ '': await this.buildCSS(PATH.join(env.kodePath, 'webApp/webApp.css'), variables) });
        }
        else {
            let variables = this.buildCssVariables(builtinCssVariables);
            this.styleSheets.push({ '': await this.buildCSS(PATH.join(env.kodePath, 'webApp/webApp.css'), variables) });
        }

        if (this.settings.cssSheets) {
            for (let cssSheetPath of this.settings.cssSheets) {
                let absPath = absolutePath(this.module.path, cssSheetPath);
                this.styleSheets.push({ '': await this.buildCSS(absPath) });
            }
        }

        let links = [];

        for (let i = 0; i < this.styleSheets.length; i++) {
            links.push(`<link rel="stylesheet" href="?STYLESHEET/${i}">`);
        }

        this.styleSheetLinks = `\n        ${links.join('\n        ')}`;

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
