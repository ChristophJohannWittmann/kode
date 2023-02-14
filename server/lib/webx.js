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
 * A web extension is a programming unit or module that provides a dynamic way
 * to handle HTTP requests.  As the framework loads and module references are
 * analyzed, if the analyzed reference is a javascript file and has this text
 * embedded as a line of code, 'javascript-web-extension';, it'll be treated as
 * a web extension, which means it's compiled and added as a web-extension
 * resource.  This base class provides both the overall web-extension framwork
 * and some basic common features that are required for all web extensions.
*****/
register(class Webx extends Emitter {
    static frameworkUrl = `/CLIENTFRAMEWORK.js`;

    constructor(thunk, reference) {
        super();
        this.thunk = thunk
        this.reference = reference;
        this.cssUrls = mkStringSet();
        this.webxCssUrl = `${this.reference.url}/STYLESHEET.css`;
        this.cssUrls.set(this.webxCssUrl);
    }

    buildCssVars(cssVariables) {
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

    calcLanguage(req) {
        let acceptLanguage = req.acceptLanguage();

        if (Object.keys(acceptLanguage).length) {
            for (let lang in acceptLanguage) {
                let language = this.text.hasLanguage(lang);

                if (language) {
                    return language;
                }
            }
        }

        return this.text.getLanguage();
    }

    getCssUrls() {
        return this.cssUrls.list();
    }

    getClientCodeUrl() {
        return this.clientCodeUrl;
    }

    async handleRequest(req, rsp) {
        try {
            let handlerName = `handle${req.method()}`;

            if (handlerName in this && typeof this[handlerName] == 'function') {
                await this[handlerName](req, rsp);
            }
            else {
                rsp.endStatus(405);
            }
        }
        catch (e) {
            let diagnostic = `Web Extension HTTP Error: URL="${this.reference.url}".`;
            log(diagnostic, e);
            rsp.end(500, 'text/plain', diagnostic);
        }
    }

    async init() {
        await this.loadServer();
        await this.loadClient();
        await this.loadWebxCss();
        await this.loadCss();
        await this.loadFavIcons();
        await this.loadText();
    }

    static async load() {
        mkWebBlob(
            Webx.frameworkUrl,
            'text/javascript',
            await buildClientCode([
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
            ], Config.debug)
        );
    }

    async loadClient() {
        let paths = this.reference.client.map(path => this.thunk.mkPath(path));
        let clientCode = await buildClientCode(paths);

        if (clientCode) {
            this.clientCodeUrl = `${this.reference.url}/CLIENTCODE.js`;

            mkWebBlob(
                this.clientCodeUrl,
                'text/javascript',
                clientCode,
            );
        }
        else {
            this.clientCodeUrl = '';
        }

        return this;
    }

    async loadCss() {
        let count = 0;

        if (Array.isArray(this.reference.css)) {
            for (let cssPath of this.reference.css) {
                if (cssPath.endsWith('.css')) {
                    let absPath = this.mkPath(cssPath);

                    if (await pathExists(absPath)) {
                        let stats = await FILES.stat(absPath);

                        if (stats.isFile()) {
                            let cssText = (await FILES.readFile(absPath)).toString();
                            cssText = Config.debug ? cssText : await minifyCss(cssText);
                            let cssUrl = `/${this.opts.container}/STYLESHEET${++count}`;
                            this.cssUrls.set(cssUrl);
                            mkWebBlob(cssUrl, 'text/css', cssText);
                        }
                    }
                }
            }
        }
    }

    async loadFavIcons() {
        this.favicons = [];

        if (Array.isArray(this.reference.favicons)) {
            for (let favicon of this.reference.favicons) {
                switch (favicon.type) {
                    case 'icon':
                        let parsed = PATH.parse(favicon.href);
                        let mime = mkMime(parsed.ext);

                        this.favicons.push(
                            await htmlElement('link',
                                htmlAttribute('rel', favicon.type),
                                htmlAttribute('type', mime.code),
                                htmlAttribute('href', favicon.href)
                            ).toCompact()
                        );
                        break;

                    case 'shortcut icon':
                        this.favicons.push(
                            await htmlElement('link',
                                htmlAttribute('rel', favicon.type),
                                htmlAttribute('href', favicon.href)
                            ).toCompact()
                        );
                        break;
                }
            }
        }
    }

    async loadServer() {
        setContainer(this.thunk.opts.container);

        for (let path of this.reference.server) {
            let absPath = this.mkPath(path);

            for (let filePath of await recurseFiles(absPath)) {
                require(filePath);
            }
        }

        return this;
    }

    async loadText() {
        this.text = mkMultilingualText();

        if (Array.isArray(this.reference.text)) {
            for (let path of this.reference.text) {
                if (path.endsWith('.js')) {
                    let absPath = this.thunk.mkPath(path);

                    if (await isFile(absPath)) {
                        let mod = require(absPath);

                        try {
                            this.text.setText(mod);
                        }
                        catch (e) {}
                    }
                }
            }
        }
    }

    async loadWebxCss() {
        let vars;
        let varsPath = '';
        let cssContent = (await FILES.readFile(PATH.join(env.kodePath, 'server/lib/webx.css'))).toString();
        let cssTemplate = mkTextTemplate(cssContent);

        if (this.reference.vars) {
            varsPath = this.thunk.mkPath(this.reference.vars);
        }
        else if (this.thunk.opts.vars) {
            varsPath = this.thunk.mkPath(this.thunk.opts.vars);
        }

        if (varsPath) {
            if (varsPath.endsWith('.js')) {
                if (await pathExists(varsPath)) {
                    let stats = await FILES.stat(varsPath);

                    if (stats.isFile()) {
                        vars = require(varsPath);
                    }
                }
            }

            varsPath = '';
        }

        if (!vars) {
            vars = webxCssVars;
        }

        let cssVars = this.buildCssVars(vars);

        for (let symbol in cssTemplate.symbols) {
            if (symbol in cssVars) {
                cssTemplate.set(symbol, cssVars[symbol]);
            }
            else {
                cssTemplate.set(symbol, '');
            }
        }

        let cssText = Config.debug ? cssTemplate.toString() : await minifyCss(cssTemplate.toString());
        mkWebBlob(this.webxCssUrl, 'text/css', cssText);

    }

    async upgrade(req, socket, headPacket) {
        if (this.reference.websocket) {
            if (Reflect.has(this, 'onUpgrade')) {
                let secureKey = req.header('sec-websocket-key');
                let hash = await Crypto.digestUnsalted('sha1', `${secureKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
                let webSocket = mkWebSocket(socket, req.header('sec-websocket-extensions'), headPacket);
                
                let headers = [
                    'HTTP/1.1 101 Switching Protocols',
                    'Upgrade: websocket',
                    'Connection: upgrade',
                    `Sec-WebSocket-Accept: ${hash}`,
                ];

                if (webSocket.extensions.length) {
                    headers.push(`Sec-WebSocket-Extensions: ${webSocket.secWebSocketExtensions()}`);
                }
            
                headers.push('\r\n');
                socket.write(headers.join('\r\n'));
                await this.onWebSocket(req, webSocket);
            }
        }
    }
});


/*****
 * Default CSS colors for the built in style sheet.  If the developer does not
 * provide alternate colors in the thunk file, either for the module in general,
 * or for the Webx specifically, use these standard organization colors for the
 * dark and light color schemes of various HTML widgets.
*****/
global.webxCssVars = {
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
