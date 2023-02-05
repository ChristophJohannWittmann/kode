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
register(class Module {
    constructor(path) {
        this.path = path;
        this.status = 'ok';
        this.prefix = '(ok      )';
        this.failure = false;
        this.databases = {};
        this.config = {};
    }

    erase() {
        if (this.settings) {
            if (this.settings.container in global) {
                delete global[this.settings.container];
            }

            if (this.settings.databases) {
                for (let dbName in this.settings.databases) {
                    delete DbDatabase.databases[dbName];
                }
            }
        }

        return this;
    }

    async execute(methodName) {
        if (this.status == 'ok') {
            await this[methodName]();
        }
    }

    getContainer() {
        return this.settings.container;
    }

    getDiagnostic() {
        return `    [${this.failure}]`;
    }

    getFailure() {
        return this.failure;
    }

    getInfo() {
        return `${this.prefix} Module ${this.path}`;
    }

    getStatus() {
        return this.status;
    }
    
    async load() {
        if (this.path == '#BUILTIN') {
            global.builtinModule = this;
            this.container = global;

            this.settings = {
                title: 'Builtin',
                description: 'Buildin Framework Module.',
                container: 'builtin',
                features: [],
                databases: {},
                webx : {
                    MailGun: {
                        'className': 'SmtpApiMailGun'
                    }
                }                
            }
        }
        else {
            await this.execute('validatePath');
            await this.execute('loadModule');
            await this.execute('loadFeatures');
            await this.execute('loadDatabases');
        }
    }

    async loadConfig() {
        this.configPath = PATH.join(env.configPath, `${this.settings.container}.json`);

        if (await pathExists(this.configPath)) {
            let stats = await FILES.stat(this.configPath);

            if (stats.isFile()) {
                try {
                    let buffer = await FILES.readFile(this.configPath);
                    this.config = fromJson(buffer.toString());
                }
                catch (e) {
                    return `${e.stack}`;
                }
            }
            else {
                return `Unable to open file.`;
            }
        }
        else {
            return `Path does not exist.`;
        }
    }

    async loadDatabases() {
        if (this.settings.schemas) {
            for (let schemaPath of this.settings.schemas) {
                let absPath = absolutePath(this.path, schemaPath);

                if (await pathExists(absPath)) {
                    let stats = await FILES.stat(absPath);

                    if (stats.isFile()) {
                        try {
                            require(absPath);
                        }
                        catch (e) {
                            throw new Error(`Error occured while loading schema file ${absPath} in module ${this.path}\n${e.stack}`);
                        }
                    }
                    else {
                        throw new Error(`Could not open schema file ${absPath} in module ${this.path}`);
                    }
                }
                else {
                    throw new Error(`Schema file not found ${schemaPath} in module ${this.path}`);
                }
            }
        }

        if (this.settings.databases) {
            for (let dbName in this.settings.databases) {
                let db = mkDbDatabase(dbName);

                for (let schemaName of this.settings.databases[dbName]) {
                    db.setSchema(schemaName);
                }
            }
        }
    }

    async loadModule() {
        this.modulePath = PATH.join(this.path, 'module.json');

        if (await pathExists(this.modulePath)) {
            let stats = await FILES.stat(this.modulePath);

            if (stats.isFile()) {
                try {
                    this.settings = fromJson((await FILES.readFile(this.modulePath)).toString());
                    this.container = setContainer(this.settings.container);
                }
                catch (e) {
                    this.status = 'fail';
                    this.prefix = '(json    )';
                    this.failure = `Module file syntax failure: "${this.modulePath}"`;
                }
            }
            else {
                this.status = 'fail';
                this.prefix = '(file    )';
                this.failure = `Module path is not a regular file: "${this.modulePath}"`;
            }
        }
        else {
            this.status = 'fail';
            this.prefix = '(config  )';
            this.failure = `Module file not found: "${this.modulePath}"`;
        }
    }

    async loadFeatures() {
        if (Array.isArray(this.settings.features)) {
            for (let path of this.settings.features.map(path => absolutePath(this.path, path))) {
                for (let codePath of await recurseFiles(path)) {
                    if (codePath.endsWith('.js')) {
                        console.log(codePath);
                        require(codePath);
                    }
                }
            }
        }
    }

    async loadReferences() {
        if(CLUSTER.isWorker) {
            if (this.status == 'ok') {
                if (Array.isArray(this.settings.references)) {
                    for (let reference of this.settings.references) {
                        ResourceLibrary.register(this, reference);
                    }
                }

                if (Array.isArray(this.config.references)) {
                    for (let reference of this.config.references) {
                        ResourceLibrary.register(this, reference);
                    }
                }
            }
        }
    }

    async mkWebx(reference) {
        try {
            let webx;
            let webxSettings = this.settings.webx[reference.webx];
            eval(`webx = mk${webxSettings.className}(this, reference);`);
            await webx.init();
            return webx;
        }
        catch (e) {
            console.log(`Unable to build Web Extension "${reference.webx}" in module at "${this.path}"`);
            console.log(e);
            PROC.exit(-1);
        }
    }

    async validatePath() {
        if (await pathExists(this.path)) {
            let stats = await FILES.stat(this.path);

            if (!stats.isDirectory()) {
                this.status = 'fail';
                this.prefix = '(dir     )';
                this.failure = `Module path is not a directory: "${this.path}"`;
            }
        }
        else {
            this.status = 'fail';
            this.prefix = '(notfound)';
            this.failure = `Invalid module path: "${this.path}"`;
        }
    }
});
