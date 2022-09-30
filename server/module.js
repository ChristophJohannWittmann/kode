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
    constructor(path, builtin) {
        this.path = path;
        this.configPath = PATH.join(this.path, 'config.json');
        this.status = 'ok';
        this.prefix = '(ok      )';
        this.error = '';
        this.apps = {};
        this.urls = {};
        this.schemas = {};
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
                            await this.validate();

                            if (this.status == 'ok') {
                                for (let reference of this.config.references) {
                                    reference.modulePath = this.path;
                                    await ResourceLibrary.register(reference);
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

    async validate() {
        if (this.status == 'ok' && 'ns' in this.config) {
            if (this.config.ns in Config.moduleMap) {
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
