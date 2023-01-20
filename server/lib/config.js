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
 * The configuration or Config is a frozen, sealed, global configuration object
 * that provides configuration data to the application and its other components.
 * As a singleton, the Config constructor must return a promise, which resolves
 * when the singleton object has been initialized and is ready for use. The
 * Config singleton instance is whatever value is returned back by the singleton
 * constructor's promise resolution.
*****/
singleton(class Config {
    async loadSystem() {
        if (!env.configPath || !await pathExists(env.configPath)) {
            return `Configuration directory not found: "${env.configPath}"`;
        }
        
        let stats = await FILES.stat(env.configPath);

        if (!stats.isDirectory()) {
            return `Configuration directory is not a standard directory" "${env.configPath}"`;
        }

        await FILES.chmod(env.configPath, 0o700);

        for (let path of await recurseFiles(env.configPath)) {
            await FILES.chmod(path, 0o600);
        }

        let serverConfigPath = PATH.join(env.configPath, 'kode.json');

        if (!await pathExists(serverConfigPath)) {
            return `Server configuration path not found: "${serverConfigPath}"`;
        }

        stats = await FILES.stat(serverConfigPath);

        if (!stats.isFile()) {
            return `Server configuration path is not a regular file: "${serverConfigPath}"`;
        }

        
        let buffer = await FILES.readFile(serverConfigPath);
        let systemConfig = fromJson(buffer.toString());
        
        for (let key in systemConfig) {
            this[key] = systemConfig[key];
        }

        return true;
    }
    
    sealOff() {
        let stack = [Config];
        
        while (stack.length) {
            let obj = stack.pop();
            Object.seal(obj);
            Object.freeze(obj);
           
            if (Array.isArray(obj)) {
                for (let element of obj) {
                    if (typeof element == 'object') {
                        stack.push(element);
                    }
                }
            }
            else if (typeof item == 'object') {
                for (let value of Object.values(item)) {
                    if (typeof element == 'object') {
                        stack.push(element);
                    }
                }
            }
        }
    }
});
