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
        this.widgetStyleSettings = clone(widgetStyleSettings);
    }

    async buildWidgetCss() {
        const widgetStyleSettings = {};

        for (let section in this.widgetStyleSettings) {
            widgetStyleSettings[section] = [];

            for (let settingName in this.widgetStyleSettings[section]) {
                widgetStyleSettings[section].push(`        --${settingName.replaceAll('_', '-')}: ${this.widgetStyleSettings[section][settingName]};`);
            }

            widgetStyleSettings[section] = widgetStyleSettings[section].join('\n');
        }

        let cssContent = (await FILES.readFile(PATH.join(env.kodePath, 'gui/lib/widget.css'))).toString();
        let cssTemplate = mkTextTemplate(cssContent);

        for (let symbol in cssTemplate.symbols) {
            if (symbol in widgetStyleSettings) {
                cssTemplate.set(symbol, widgetStyleSettings[symbol]);
            }
            else {
                cssTemplate.set(symbol, '');
            }
        }

        let cssText = Config.debug ? cssTemplate.toString() : await minifyCss(cssTemplate.toString());
        await mkWebBlob(this.webxCssUrl, 'text/css', cssText).register();
        return this;
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
        await this.buildWidgetCss();
        await this.loadCss();
        await this.loadFavIcons();
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
                'gui/widgets/editable.js',
                'gui/widgets/editor.js',
                'gui/widgets/grid.js',
                'gui/widgets/input.js',
                'gui/widgets/select.js',
                'gui/widgets/textArea.js',
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

    async setWidgetStyleSettings(arg) {
        if (typeof arg == 'string') {
            try {
                let path = this.thunk.mkPath(arg);
                let module = require(path);

                if (typeof module == 'object') {
                    var settings = module;
                }
                else {
                    return this;
                }
            }
            catch(e) {
                return this;
            }
        }
        else if (typeof arg == 'object') {
            var settings = arg;
        }
        else {
            return this;
        }

        for (let section in settings) {
            if (section in this.widgetStyleSettings) {
                for (let settingName in settings[section]) {
                    if (settingName in this.widgetStyleSettings[section]) {
                        this.widgetStyleSettings[section][settingName] = settings[section][settingName];
                    }
                }
            }
        }

        return this;
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
