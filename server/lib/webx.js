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
    static dboObjectsUrl = `/DBOOBJECTSTUBS.js`;

    constructor(thunk, reference) {
        super();
        this.thunk = thunk
        this.reference = reference;
        this.tlsMode = 'best';
        this.cssUrls = mkStringSet();
        this.webxCssUrl = `${this.reference.url == '/' ? '' : this.reference.url}/STYLESHEET.css`;
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
        await this.loadWebxCss();
        await this.loadCss();
        await this.loadFavIcons();
        await this.loadText();
    }

    static async initialize() {
        await mkWebBlob(
            Webx.frameworkUrl,
            'text/javascript',
            await buildClientCode([
                'framework/core.js',
                'framework/message.js',
                'framework',
                'gui/lib/entryFilter.js',
                'gui/lib/element.js',
                'gui/lib',
                'gui/widgets/inputBase.js',
                'gui/widgets/input.js',
                'gui/widgets/panel.js',
                'gui/widgets/stack.js',
                'gui/widgets',
            ], Config.debug)
        ).register();

        await Webx.loadDboObjectStubs();
    }

    async loadCss() {
        let count = 0;

        if (Array.isArray(this.reference.cssSheets)) {
            for (let cssPath of this.reference.cssSheets) {
                if (cssPath.endsWith('.css')) {
                    let absPath = this.thunk.mkPath(cssPath);

                    if (await pathExists(absPath)) {
                        let stats = await FILES.stat(absPath);

                        if (stats.isFile()) {
                            let cssText = (await FILES.readFile(absPath)).toString();
                            cssText = Config.debug ? cssText : await minifyCss(cssText);
                            let cssUrl = `${this.reference.url == '/' ? '' : this.reference.url}/STYLESHEET${++count}.css`;
                            this.cssUrls.set(cssUrl);
                            await mkWebBlob(cssUrl, 'text/css', cssText).register();
                        }
                    }
                }
            }
        }
    }

    static async loadDboObjectStubs() {
        let code = [];

        for (let dboThunk of dboThunks) {
            let jsInitializers = {};

            for (let propertyName in dboThunk.properties) {
                let propertyFunc = dboThunk.properties[propertyName].type.init.toString();
                let propertyValue = propertyFunc.match(/\(\) *=> *(.*)/);
                eval(`jsInitializers[propertyName] = ${propertyValue[1]} `)
            }

            code.push(`
            (() => {
                let propertyNames = [${Object.keys(dboThunk.properties).map(name => `'${name}'`)}];
                let initializers = fromJson('${toJson(jsInitializers)}');

                register(class ${dboThunk.className} extends Jsonable {
                    constructor(...args) {
                        super();

                        for (let propertyName of propertyNames) {
                            this[propertyName] = initializers[propertyName];
                        }

                        this.assign(...args);
                    }

                    assign(...args) {
                        for (let arg of args) {
                            if (typeof arg == 'object') {
                                for (let propertyName of propertyNames) {
                                    if (propertyName in arg) {
                                        this[propertyName] = arg[propertyName];
                                    }
                                }
                            }
                        }

                        return this;
                    }
                });
            })();
            `);
        }

        let javascript = Config.debug ? code.join('\n') : await minifyJs(code.join('\n'));
        await mkWebBlob(this.dboObjectsUrl, 'text/javascript', javascript).register();
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
        let cssContent = (await FILES.readFile(PATH.join(env.kodePath, 'gui/lib/widget.css'))).toString();
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
        await mkWebBlob(this.webxCssUrl, 'text/css', cssText).register();

    }

    async upgrade(req, socket, headPacket) {
        if (this.reference.webSocket) {
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
                await this.onUpgrade(req, webSocket);
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
        widget_disabled_border_color: '#ECECEC',

        widget_error_color: '#DC143C',
        widget_error_background_color: '#FFF9F9',
        widget_error_border_color: '#DC143C',

        menu_color: '#2F4F5F',
        menu_background_color: '#F9F9F9',
        menu_hover_color: '#2F4F5F',
        menu_hover_background_color: '#DDDDDD',
        menu_disabled_color: '#BBBBBB',
        menu_disabled_background_color: '#F9F9F9',
        menu_separator: 'solid 1px #244F5F',
        menu_separator_lite: 'solid 1px #DFDFDF',
        menu_font_family: 'Arial',
        menu_font_size: '17px',
        menu_font_weight: 'Thin',
        menu_min_height: '30px',

        main_color: '#2F4F5F',
        main_background_color: '#FFFFFF',
        main_border_color: '#778899',
        main_outline_color: '#FF8C00',
        main_hover_color: '#2F4F4F',
        main_hover_background_color: '#787878',

        alt_color: '#4682B4',
        alt_background_color: '#FDFDFD',
        alt_border_color: '#B0C4DE',
        alt_outline_color: '#FF8C00',
        alt_hover_color: '#2F4F4F',
        alt_hover_background_color: '#FF8C00',

        dialog_color: '#828282',
        dialog_background_color: '#FFFFFF',
        dialog_border: 'solid 2px #B0C4DE',
        dialog_border_radius: '7px',
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
        widget_disabled_border_color: '#454545',

        widget_error_color: '#DC143C',
        widget_error_background_color: '#222222',
        widget_error_border_color: '#DC143C',

        menu_color: '#FFFFFF',
        menu_background_color: '#222222',
        menu_hover_color: '#C0C0C0',
        menu_hover_background_color: '#444444',
        menu_disabled_color: '#777777',
        menu_disabled_background_color: '#222222',
        menu_separator: 'solid 1px #FFFFFF',
        menu_separator_lite: 'solid 1px #373737',
        menu_font_family: 'Arial',
        menu_font_size: '17px',
        menu_font_weight: 'Thin',
        menu_min_height: '30px',

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

        dialog_color: '#B0C4DE',
        dialog_background_color: '#222222',
        dialog_border: 'solid 2px #4682B4',
        dialog_border_radius: '7px',
    }
};
