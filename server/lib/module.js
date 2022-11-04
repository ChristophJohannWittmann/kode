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
 * A module is an encapsulation of the data and functions that are required for
 * loading and executing the module content and programming code.  A module is
 * NOT coded as a nodeJS module.  The module is a directory with one config.js
 * file and zero or more additional files containing content, applications, and
 * javascript code.
*****/
register(class Module {
    constructor(path) {
        this.path = path;
        this.configPath = PATH.join(this.path, 'config.json');
        this.modulePath = PATH.join(this.path, 'module.json');
        this.status = 'ok';
        this.prefix = '(ok      )';
        this.failure = false;
        this.databases = {};
    }

    async execute(methodName) {
        if (this.status == 'ok') {
            await this[methodName]();
        }
    }

    getActive() {
        return this.config.active;
    }

    getContainer() {
        return this.module.container;
    }

    getDiagnostic() {
        return `                [${this.failure}]`;
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
        await this.execute('validatePath');
        await this.execute('loadModule');
        await this.execute('validateModule');
        await this.execute('loadConfig');
        await this.execute('validateConfig');
        await this.execute('loadDatabases');
    }

    async loadConfig() {
        if (this.settings.configuration) {
            if (await pathExists(this.configPath)) {
                let stats = await FILES.stat(this.configPath);

                if (stats.isFile()) {
                    try {
                        this.config = fromJson((await FILES.readFile(this.configPath)).toString());
                    }
                    catch (e) {
                        this.status = 'fail';
                        this.prefix = '(json     )';
                        this.failure = `Config file syntax failure: "${this.configPath}"`;
                    }
                }
                else {
                    this.status = 'fail';
                    this.prefix = '(file     )';
                    this.failure = `Config path is not a regular file: "${this.configPath}"`;
                }
            }
            else {
                this.status = 'fail';
                this.prefix = '(config   )';
                this.failure = `Config file not found: "${this.configPath}"`;
            }
        }
        else {
            this.config = null;
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
                            throw new Error(`Error occured while loading schema file ${abspath} in module ${this.path}\n${e.stack}`);
                        }
                    }
                    else {
                        throw new Error(`Could not open schema file ${abspath} in module ${this.path}`);
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
        if (await pathExists(this.modulePath)) {
            let stats = await FILES.stat(this.modulePath);

            if (stats.isFile()) {
                try {
                    this.settings = fromJson((await FILES.readFile(this.modulePath)).toString());
                }
                catch (e) {
                    this.status = 'fail';
                    this.prefix = '(json     )';
                    this.failure = `Module file syntax failure: "${this.modulePath}"`;
                }
            }
            else {
                this.status = 'fail';
                this.prefix = '(file     )';
                this.failure = `Module path is not a regular file: "${this.modulePath}"`;
            }
        }
        else {
            this.status = 'fail';
            this.prefix = '(config   )';
            this.failure = `Module file not found: "${this.modulePath}"`;
        }
    }

    async validateConfig() {
        if (this.config) {
            let validation = Layout.validateObject(this.settings.layout, this.config);

            if (!validation.valid) {
                this.status = 'fail';
                this.prefix = '(validate )';
                this.failure = `Module configuration validation: "${validation.failure}"`;
            }
        }
    }

    async validateModule() {
        for (let entry of Object.entries({
            title: prop => typeof prop == 'string',
            description: prop => typeof prop == 'string',
            container: prop => typeof prop == 'string',
            client: prop => Array.isArray(prop) || prop === undefined,
            server: prop => Array.isArray(prop) || prop === undefined,
            schemas: prop => Array.isArray(prop) || prop === undefined,
            databases: prop => typeof prop == 'object' || prop === undefined,
            references: prop => Array.isArray(prop) || prop === undefined,
            configuration: prop => typeof prop == 'object' || prop === undefined,
        })) {
            let [ key, validator ] = entry;

            if (key in this.settings) {
                if (!validator(this.settings[key])) {
                    this.status = 'fail';
                    this.prefix = '(type     )';
                    this.failure = `Module setting doesn't match the expected value type: "${key}"`;
                    return;                    
                }
            }
            else {
                this.status = 'fail';
                this.prefix = '(required )';
                this.failure = `Required module setting not found: "${key}"`;
                return;
            }
        }

        let validation = Layout.validate(this.settings.layout);

        if (!validation.valid) {
            this.status = 'fail';
            this.prefix = '(validate )';
            this.failure = `Module layout failed validation: "${validation.failure}"`;
        }
    }

    async validatePath() {
        if (await pathExists(this.path)) {
            let stats = await FILES.stat(this.path);

            if (!stats.isDirectory()) {
                this.status = 'fail';
                this.prefix = '(dir      )';
                this.failure = `Module path is not a directory: "${this.path}"`;
            }
        }
        else {
            this.status = 'fail';
            this.prefix = '(notfound )';
            this.failure = `Invalid module path: "${this.path}"`;
        }
    }
});
