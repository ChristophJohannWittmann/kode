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
'javascript-web-extension';


/*****
*****/
let clientFramework;

async function loadClientFramework() {
    if (!clientFramework) {
    }
}


/*****
 * A webapp is just one specific type of web extension and probably the most
 * frequencly employed.  A webapp is an extension with specific behavior: (1)
 * an undecorated GET results in responding with a dynamically built HTML doc,
 * (2) a GET with query parameters will be sent off to the handleGET() method
 * to handle, and (3) all POST querys will be passed on to the handlePOST()
 * method to be resolved.  To make a functioning webapp, an instance of a sub-
 * class needs to be made.  To make this happend, the subclass js module needs
 * to have a single export, and must look something like this:
 * 
 * exports = module.exports = new (class SubClass extends WebApp { ... } )();
 * 
 * During server bootstrapping, the module is loaded and a single instance of
 * the sub class is created.  Thereafter, that instance is used repeatedly for
 * handling HTTP and web socket requests.
*****/
exports = module.exports = register(class WebApp extends WebExtension {
    constructor() {
        super();
        this.webSockets = {};
        this.permissions = [];
    }

    async buildCSS(path) {
        this.visualCss = (await FILES.readFile(path)).toString();
        let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
        this.compactCss = (await execShell(`node ${minifyPath} ${path}`)).stdout.trim();
    }

    async buildHTML(path) {
        this.visualHtml = (await FILES.readFile(path)).toString();
        let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
        this.compactHtml = (await execShell(`node ${minifyPath} ${path}`)).stdout.trim();
    }

    async buildLinks() {
        let links = [];
        this.links = '';

        if ('favicons' in this.module.config) {
            for (let favicon of this.module.config.favicons) {
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

    async handleGET(req) {
        let doc = mkTextTemplate(Config.html == 'visual' ? this.visualHtml : this.compactHtml).set({
            css: this.compactCss,
            title: this.module.config.title,
            description: this.module.config.description,
            session: '',
            links: this.links,
        });

        return {
            mime: mkMime('text/html'),
            data: doc.toString(),
        };
    }

    async handlePOST(req) {
        return {
            mime: mkMime('text/plain'),
            data: ''
        };
    }

    async init(cssPath, htmlPath) {
        await super.init();
        await loadClientFramework();
        await this.buildLinks();

        if (this.module.config.css) {
            await this.buildCSS(this.module.config.css);
        }
        else {
            await this.buildCSS(PATH.join(env.kodePath, 'server/lib/webApp.css'));
        }

        if (this.module.config.html) {
            await this.buildHTML(this.module.config.html);
        }
        else {
            await this.buildHTML(PATH.join(env.kodePath, 'server/lib/webApp.html'));
        }
    }

    async onWebSocket(req, webSocket) {
        //this.webSockets[webSocket.id] = webSocket;
    }
});
