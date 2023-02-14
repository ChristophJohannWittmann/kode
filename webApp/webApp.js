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
    constructor(thunk, reference) {
        super(thunk, reference);
        this.webSockets = {};
        this.tlsMode = 'best';

        if (Array.isArray(this.reference.text)) {
            this.reference.text.unshift(PATH.join(env.kodePath, 'webApp/webAppText.js'));
        }
        else {
            this.reference.text = [ PATH.join(env.kodePath, 'webApp/webAppText.js') ];
        }
    }

    async handleGET(req, rsp) {
        let language = this.calcLanguage(req);
        let appText = toJson(this.text.getLanguage(language));

        let html = [
            '<!DOCTYPE html>',
            '<html class="fill margin-none padding-none">',
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

        if (this.getClientCodeUrl()) {
            html.push(`    <script src="${this.getClientCodeUrl()}"></script>`);
        }

        html.push(`    <script src="${this.webAppClientUrl}"></script>`);

        let script = [
            `        const webAppSettings = {`,
            '            verify: () => false,',
            '            password: () => false,',
            `            container: () => ${this.thunk.opts.container},`,
            `            homeView: () => ${this.thunk.opts.container}.mk${this.reference.home}(),`,
            '            session: () => null,',
            `            url: () => '${this.reference.url}',`,
            '            session: () => null,',
            `            websocket: () => ${this.reference.webSocket},`,
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
        rsp.end(200, 'text/html', html.join('\n'));
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
        await super.init();
        this.webAppClientUrl = `/WEBAPPCODE.js`;

        mkWebBlob(
            this.webAppClientUrl,
            'text/javascript',
            await buildClientCode([
                PATH.join(env.kodePath, 'webapp/gui'),
            ])
        );
    }

    async onUpgrade(req, webSocket) {
        webSocket.on('#MessageReceived', message => this.handleWebSocket(webSocket, message));
    }
});
// *********************************************************************************************
// *********************************************************************************************
// *********************************************************************************************
// *********************************************************************************************
// *********************************************************************************************
    /*
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
    */

    /*
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
    */

    /*
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
    */

    /*
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
    */

    /*
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
    */

    /*
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
    */


    /*
    async init(cssPath, htmlPath) {
        await super.init();

        await this.loadApplicationText();

        async loadClient() {
            let paths = this.opts.client.map(path => this.mkPath(path));
            this.clientCode = await buildClientCode(paths);
            return this;
        }

        async loadServer() {
            setContainer(this.opts.container);

            for (let path of this.opts.server) {
                let absPath = this.mkPath(path);

                for (let filePath of await recurseFiles(absPath)) {
                    require(filePath);
                }
            }

            return this;
        }

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
    */

    /*
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
    */

    /*
    async loadHtmlTemplate() {
        let html = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html'))).toString();

        if (this.reference.debug) {
            var htmlJs = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html.js'))).toString();
        }
        else {
            html = await minifyHtml(html);
            var htmlJs = (await FILES.readFile(PATH.join(env.kodePath, 'webApp/webApp.html.js.min'))).toString();
        }
    }
    */

