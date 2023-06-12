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
 * A module is an encapsulation of the data and functions that are required for
 * loading and executing the module content and programming code.  A module is
 * NOT coded as a nodeJS module.  The module is a directory with one config.js
 * file and zero or more additional files containing content, applications, and
 * javascript code.
*****/
register(class Thunk {
    static thunkMap = {};
    static thunkArray = [];

    constructor(path, opts) {
        this.path = path == '' ? env.kodePath : path;
        this.opts = opts ? opts : {};
        this.darkCodeUrl = '';
        this.clientCodeUrl = '';

        if (opts.container) {
            Thunk.thunkArray.push(this);
            Thunk.thunkMap[this.opts.container] = this;
        }
    }

    static get(container) {
        return Thunk.thunkMap[container];
    }

    getClientCodeUrl() {
        return this.clientCodeUrl;
    }

    getDarkCodeUrl() {
        return this.darkCodeUrl;
    }

    async loadClient() {
        if (this.opts.container) {
            let paths = this.opts.client.map(path => this.mkPath(path));
            let clientCode = await buildClientCode(paths);
            clientCode = `setContainer('${this.opts.container}');\n` + clientCode;
            clientCode = Config.debug ? clientCode : await minifyJs(script);

            if (clientCode) {
                this.clientCodeUrl = `/${this.opts.container}/CLIENTCODE.js`;

                await mkWebBlob(
                    this.clientCodeUrl,
                    'text/javascript',
                    clientCode,
                ).register();
            }
        }

        return this;
    }

    async loadDark() {
        if (Array.isArray(this.opts.dark)) {
            await DarkKode.import(
                this.opts.container,
                this.opts.dark.map(path => this.mkPath(path)),
            );
        }

        if (!this.darkCodeUrl && !DarkKode.isEmpty(this.opts.container)) {
            this.darkCodeUrl = `/${this.opts.container}/DARKCODE.js`;

            await mkWebBlob(
                this.darkCodeUrl,
                'text/javascript',
                `setContainer('${this.opts.container}');\n` + DarkKode.getBlob(this.opts.container),
            ).register();
        }

        return this;
    }

    async loadPermissions() {
        if (CLUSTER.isPrimary) {
            if (Array.isArray(this.opts.permissions)) {
                for (let permission of Object.values(this.opts.permissions)) {
                    permission.container = this.opts.container;
                    
                    await Ipc.sendPrimary({
                        messageName: '#PermissionsManagerSetPermission',
                        permission: permission,
                    });
                }
            }
        }
    }

    async loadServer() {
        for (let path of this.opts.server) {
            let absPath = this.mkPath(path);

            for (let filePath of await recurseFiles(absPath)) {
                require(filePath);
            }
        }

        return this;
    }

    async loadWebExtensions() {
        for (let reference of this.opts.references) {
            if ('webx' in reference) {
                let makerName;
                let lastDot = reference.webx.lastIndexOf('.');

                if (lastDot > 0) {
                    let container = reference.webx.substring(0, lastDot+1);
                    makerName = `${container}mk${reference.webx.substr(lastDot+1)}`;
                }
                else {
                    makerName = `mk${reference.webx}`;
                }

                let webx;
                eval(`webx = ${makerName}(this, reference);`);
                await webx.init();

                if (!webx.selfRegister) {
                    if (typeof webx.reference.url == 'string') {
                        WebLibrary.register(webx.reference.url, webx);
                    }
                    else if (Array.isArray(webx.reference.url)) {
                        for (let url of webx.reference.url) {
                            WebLibrary.register(url.path, webx);
                        }
                    }
                }
            }
        }

        return this;
    }

    async loadWebResources() {
        for (let reference of this.opts.references) {
            if ('path' in reference) {
                let path = this.mkPath(reference.path);

                for (let filePath of await recurseFiles(path)) {
                    let subPath = filePath.substr(path.length);
                    let subUrl = PATH.join(reference.url, subPath);
                    await mkWebResource(subUrl, filePath).register();

                    if (subUrl.endsWith('/index.html')) {
                        let indexUrl = subUrl.substr(0, subUrl.length - '/index.html'.length);
                        indexUrl = indexUrl ? indexUrl : '/';
                        await mkWebResource(indexUrl, filePath).register();
                    }
                }
            }
        }

        return this;
    }

    mkPath(subpath) {
        if (PATH.isAbsolute(subpath)) {
            return subpath;
        }
        else {
            return PATH.join(this.path, subpath);
        }
    }

    setContainer() {
        setContainer(this.opts.container);
        getContainer().thunk = this;
    }

    static [Symbol.iterator]() {
        return Thunk.thunkArray[Symbol.iterator]();
    }
});


/*****
 * This is a thunk that's created for automatically opening Webx object that are
 * part of the framework and are controlled by kode.json rather than by a module's
 * thunk.js program file.  After the thunk is created, we assign this thunk to
 * the global object, which means that 
*****/
global.thunk = mkThunk('', {
    container: 'fw',
    server: [],
    client: [],
    dark: [],
    permissions: [],
    references: [],
});
