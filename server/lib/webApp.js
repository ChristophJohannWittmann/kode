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
 * class needs to be made.  To make this happend, the subclass js module needs
 * to have a single export, and must look something like this:
 * 
 * exports = module.exports = new (class SubClass extends WebApp { ... } )();
 * 
 * During server bootstrapping, the module is loaded and a single instance of
 * the sub class is created.  Thereafter, that instance is used repeatedly for
 * handling HTTP and web socket requests.
*****/
register(class WebApp extends WebExtension {
    static clientFramework = null;

    constructor() {
        super();
        this.webSockets = {};
    }

    async buildCSS(path) {
        path = path ? path : PATH.join(env.kodePath, 'server/lib/webApp.css');
        this.visualCss = (await FILES.readFile(path)).toString();
        let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
        this.compactCss = (await execShell(`node ${minifyPath} ${path}`)).stdout.trim();
    }

    async buildHTML(path) {
        path = path ? path : PATH.join(env.kodePath, 'server/lib/webApp.html');
        this.visualHtml = (await FILES.readFile(path)).toString();
        let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
        this.compactHtml = (await execShell(`node ${minifyPath} ${path}`)).stdout.trim();
    }

    description() {
        return 'Web application description.';
    }

    async handleGET(req) {
        let session = await Ipc.queryPrimary({ messageName: '#SentinelCreateSession' });

        let doc = mkTextTemplate(Config.html == 'visual' ? this.visualHtml : this.compactHtml).set({
            css: this.compactCss,
            title: this.title(),
            description: this.description(),
            session: session,
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
        await this.buildCSS(cssPath);
        await this.buildHTML(htmlPath);
        await WebApp.loadClientFramework();
    }

    async loadClientApp(...args) {
    }

    static async loadClientFramework() {
    }

    async loadServerApp(...args) {
    }

    async onWebSocket(webSocket) {
        //this.webSockets[webSocket.id] = webSocket;
    }

    title() {
        return 'Web Application';
    }
});
