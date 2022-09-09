/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
 * Need to comment this function.
*****/
register(class Module {
    constructor(path) {
        this.path = path;
        this.status = 'ok';
        this.prefix = '(loaded  )';
        this.error = '';
    }

    info() {
        return `${this.prefix} Module ${this.path}`;
    }
    
    async load() {
        if (FS.existsSync(this.path)) {
            let stats = await FILES.stat(this.path);

            if (stats.isDirectory()) {
                let configPath = `${this.path}/config.json`;

                if (FS.existsSync(configPath)) {
                    stats = await FILES.stat(configPath);

                    if (stats.isFile()) {
                        try {                    
                            this.config = fromJson((await FILES.readFile(configPath)).toString());

                            for (let methodName of ['validate', 'scanContent', 'scanDirectory', 'upgradeSchema']) {
                                await this[methodName]();

                                if (this.status != 'ok') {
                                    break;
                                }
                            }

                            if (this.status == 'ok') {
                                Config.moduleMap[this.config.name] = this;
                                Config.moduleArray.push(this);
                                Config.moduleUrlMap[this.config.url] = this;
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
    }

    async scanContent() {
    }

    async scanDirectory() {
        namespace(this.config.name);
        namespace();
    }

    async upgradeSchema() {
        if (CLUSTER.isPrimary) {
        }
    }

    async validate() {
        if (this.status == 'ok' && 'name' in this.config) {
            if (this.config.name in Config.moduleMap) {
                this.status = 'dupname';
                this.prefix = '(dupname )';
            }
        }
        else {
            this.status = 'noname';
            this.prefix = '(noname  )';
        }

        if (this.status == 'ok' && 'url' in this.config) {
            if (this.config.url in Config.moduleUrlMap) {
                this.status = 'dupurl';
                this.prefix = '(dupurl  )';
            }
        }
        else {
            this.status = 'nourl';
            this.prefix = '(nourl   )';
        }

        if (this.status == 'ok' && 'active' in this.config && typeof this.config.active == 'boolean') {
            if (!this.config.active) {
                this.status = 'inactive';
                this.prefix = '(inactive)';
            }
        }
    }
});
