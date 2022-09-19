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
 * The configuration or Config is a frozen, sealed, global configuration object
 * that provides configuration data to the application and its other components.
 * As a singleton, the Config constructor must return a promise, which resolves
 * when the singleton object has been initialized and is ready for use. The
 * Config singleton instance is whatever value is returned back by the singleton
 * constructor's promise resolution.
*****/
singleton(class Config {
    async loadModule(path) {
        if (FS.existsSync(path)) {
            try {
                let stats = await FILES.stat(path);

                if (stats.isFile()) {
                    let buffer = await FILES.readFile(path);
                    let config = fromJson(buffer.toString());
          
                    if (config.active) {
                        global.Config.moduleArray.push(config);
                        global.Config.moduleMap[config.name] = config;
                    }
          
                    return config;
                }
                else {
                    return 'config.json-not-a-file';
                }
            }
            catch(e) {
                console.log(e);
                return 'config.json-failed';
            }
        }
        else {
            return 'config.json-not-found';
        }
        
        return 'ok';
    }
    
    async loadSystem(path) {
        if (!path || !FS.existsSync(path)) {
            return false;
        }
        
        let stats = await FILES.stat(path);

        if (!stats.isDirectory()) {
            return false;
        }
        
        let configurationFilePath = PATH.join(path, 'config.json');
     
        if (!FS.existsSync(configurationFilePath)) {
            return false;
        }
     
        stats = await FILES.stat(configurationFilePath);

        if (!stats.isFile()) {
            return false;
        }
        
        let buffer = await FILES.readFile(configurationFilePath);
        let systemConfig = fromJson(buffer.toString());
        
        for (let key in systemConfig) {
            this[key] = systemConfig[key];
        }
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
