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
*****/
register(class Module {
    constructor(path, builtin) {
        this.path = path;
        this.status = 'ok';
        this.error = '';
        this.schemas = {};
        this.prefix = '(ok      )';
        this.configPath = PATH.join(this.path, 'config.json');
    }

    info() {
        return `${this.prefix} Module ${this.path}`;
    }
    
    async load() {
        if (FS.existsSync(this.path)) {
            let stats = await FILES.stat(this.path);

            if (stats.isDirectory()) {
                if (FS.existsSync(this.configPath)) {
                    stats = await FILES.stat(this.configPath);

                    if (stats.isFile()) {
                        try {                    
                            this.config = fromJson((await FILES.readFile(this.configPath)).toString());

                            for (let methodName of [
                                'validate',
                                'loadServer',
                                'loadClient',
                                'loadContent',
                                'loadSchemas',
                            ]) {
                                await this[methodName]();

                                if (this.status != 'ok') {
                                    break;
                                }
                            }

                            if (this.status == 'ok') {
                                Config.moduleMap[this.namespace] = this;
                                Config.moduleArray.push(this);
                            }
                        }
                        catch (e) {
                            this.error = e;
                            this.status = 'error';
                            this.prefix = '(error   )';
                            log(`\n${this.error.stack.toString()}`);
                        }
                    }
                    else {
                        this.status = 'fail';
                        this.prefix = '(config  )';
                    }
                }
                else {
                    this.status = 'fail';
                    this.prefix = '(path    )';
                }
            }
            else {
                this.status = 'fail';
                this.prefix = '(dir     )';
            }
        }
        else {
            this.status = 'fail';
            this.prefix = '(notfound)';
        }
    }

    async loadClient() {
        if (FS.existsSync(PATH.join(this.path, 'client'))) {
            // *** TBD ***
        }
    }

    async loadContent() {
        if (FS.existsSync(PATH.join(this.path, 'content'))) {
            await ContentManager.registerModule(this);
        }
    }

    async loadSchemas() {
        let dbSchemasPath = PATH.join(this.path, 'dbmsSchemas.js');

        if (FS.existsSync(dbSchemasPath)) {
            let dbSchemas;
            let buffer = await FILES.readFile(dbSchemasPath);
            eval(`dbSchemas = ${buffer.toString()};`);

            for (let schemaName in dbSchemas) {
                let schema = mkDbSchema(schemaName, true, ...dbSchemas[schemaName]);
                DbSchemaContainer.setSchema(schema);
            }
        }
    }

    async loadServer() {
        if (FS.existsSync(PATH.join(this.path, 'server'))) {
            // *** TBD ***
        }
    }

    async upgradeSchemas() {
        let prefix = '(ok.     )';

        for (let schemaName in this.config.schemas) {
            let config = this.config.schemas[schemaName];
            DbSchemaContainer.setInstance(schemaName, config.database, config.prefix);
        }

        for (let configName in DbSchemaContainer.instancesByConfig) {
            let instance = DbSchemaContainer.instancesByConfig[configName];

            let schemas = Object.entries(instance.schemas).map(entry => {
                let [ schemaName, prefixes ] = entry;
                return { schemaName: schemaName, prefixes: prefixes.array() };
            });

            let analysis = await mkDbSchemaAnalyzer(configName, schemas);

            for (let diff of analysis.diffs) {
                if (diff.isUpgrade) {
                    logPrimary(`    ${diff.toString()}`);
                    await diff.upgrade();
                }
            }
        }
    }

    async validate() {
        if (this.status == 'ok' && 'namespace' in this.config) {
            if (this.config.namespace in Config.moduleMap) {
                this.status = 'dupname';
                this.prefix = '(dupname )';
            }
            else {
                this.namespace = this.config.namespace;
            }
        }
        else {
            this.status = 'noname';
            this.prefix = '(noname  )';
        }

        if (this.status == 'ok' && 'active' in this.config && typeof this.config.active == 'boolean') {
            if (!this.config.active) {
                this.status = 'inactive';
                this.prefix = '(inactive)';
            }
        }
    }
});
