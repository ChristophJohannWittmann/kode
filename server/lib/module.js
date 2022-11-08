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
        this.status = 'ok';
        this.prefix = '(ok      )';
        this.failure = false;
        this.databases = {};
        this.config = {};
    }

    erase() {
        global[this.settings.container];


        if (this.settings.databases) {
            for (let dbName in this.settings.databases) {
                delete DbDatabase.databases[dbName];
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
        await this.execute('validatePath');
        await this.execute('loadModule');
        setContainer(this.settings.container);
        await this.execute('loadDatabases');
    }

    async loadConfig() {
        let dbc = await dbConnect();
        let config = await selectOneDboSetting(dbc, `_name='${this.settings.container}-module'`);
        await dbc.rollback();
        await dbc.free();

        if (config) {
            this.config = new ModuleConfig(this, config.value);

            if (await !this.config.validate()) {
                this.status = 'fail';
                this.prefix = '(validate )';
                this.failure = `Module configuration validation: "${validation.failure}"`;
            }
        }
        else {
            this.config = new ModuleConfig(this);
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

    async loadReferences() {
        if (this.status == 'ok') {
            if (Array.isArray(this.settings.references)) {
                for (let reference of this.settings.references) {
                    ResourceLibrary.register(reference, this);
                }
            }

            if (Array.isArray(this.config.references)) {
                for (let reference of this.config.references) {
                    ResourceLibrary.register(reference, this);
                }
            }
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


/*****
*****/
class ModuleConfig {
    constructor(module, config) {
        this['#VALID'] = true;

        if (config) {
            Object.assign(this, config);
        }
        else {
            this.createDefaults(module.settings);
        }
    }

    async createDefaults(settings) {
        console.log('TODO -- ModuleConfig.createDefaults()');

        for (let setting in Object.values(settings)) {
            let [ key, value ] = setting;

            switch (typeof value) {
                case 'string':
                    break;
            }
        }
    }

    isValid() {
        return this['#VALID'];
    }

    async validate() {
        console.log('TODO -- ModuleConfig.validate()');
        if (this['#VALID']) {
        }

        return this['#VALID'];
    }
}
