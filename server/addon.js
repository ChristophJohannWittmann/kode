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
 * This is a functional wrapper for a binary (C++) addon project.  Each addon
 * project uses on of the provided C++ wrapper API provided by kode, the first
 * of which resides in modules/apiV1.  Updated APIs will increment the number
 * such as modules/apiV2, modules/apiV3 and so on.  If the module is already
 * built, just load it.  If the module isn't built, go ahead on build it first.
 * Please note that all of the overhead associated with the system reflection
 * of the current build status only happens in the primary proceess.
*****/
register(class Addon {
    constructor(path) {
        this.path = path;
        this.status = 'ok';
        this.prefix = '(loaded  )';
        this.error = '';
        this.module = null;
    }

    async build() {
        try {
            if (FS.existsSync(this.builtPath)) {
                await FILES.rm(this.builtPath);
            }

            await execShell(`cd ${this.path}; node-gyp configure`);
            await execShell(`cd ${this.path}; node-gyp build`);
            await FILES.writeFile(this.builtPath, '');
        }
        catch (e) {
            this.error = e;
            this.prefix = '(failed  )';
        }
    }

    async built() {
        this.buildPath = PATH.join(this.path, 'build');
        this.builtPath = PATH.join(this.path, '.built');

        if (!FS.existsSync(this.buildPath)) {
            return false;
        }

        if (!FS.existsSync(this.builtPath)) {
            return false;
        }

        const builtStats = await FILES.stat(this.builtPath);
        const builtMs = builtStats.ctime.valueOf();

        for (let path of await recurseFiles(this.path)) {
            if (!path.startsWith(this.buildPath)) {
                let stats = await FILES.stat(path);

                if (stats.ctime.valueOf() > builtMs) {
                    return false;
                }
            }
        }

        return true;
    }

    info() {
        return `${this.prefix} Addon ${this.path}`;
    }
    
    async load() {
        if (CLUSTER.isPrimary && !await this.built()) {
            await this.build();
        }

        try {
            let addon = require(PATH.join(this.path, 'build/Release/addon.node'));
            Config.addonArray.push(addon);
            Config.addonMap[addon.name] = addon;
        }
        catch (e) {
            this.error = e;
            this.prefix = '(unloaded)';
        }
    }
});
