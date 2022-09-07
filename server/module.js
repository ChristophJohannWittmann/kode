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
*****/
register(class Module {
    constructor(path) {
        return new Promise(async (ok, fail) => {
            this.status = 'new';
            this.path = path;
            
            if (FS.existsSync(this.path)) {
                let stats = await FILES.stat(this.path);
     
                if (stats.isDirectory()) {
                    this.config = await Config.loadModule(`${this.path}/config.json`);
                    
                    if (!this.config.active) {
                        this.status = 'module-set-inactive';
                    }
                    else {
                        this.status = 'ok';
                    }
                }
                else {
                    this.status = 'path-is-not-directory';
                }
            }
            else {
                this.status = 'directory-not-found';
            }
            
            ok(this);
        });
    }
    
    async load() {
        namespace(this.config.name);
        
        for (let directoryEntry of await FILES.readdir(this.path)) {
            console.log('\nModule.load()');
            console.log(directoryEntry);
            console.log('');
        }
        
        namespace();
    }
    
    async upgradeSchema() {
    }
});
