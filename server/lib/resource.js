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
 * A class that encapsulates a single content object, which must be located at
 * a unique URL.  It's primary purpose is to support the HTTP server by serving
 * as an instance of data that can be fed via the HTTP server.  Each content
 * object contains additional meta data to facilitate content management.
*****/
class Resource {
    static formatters = {
        binary: buffer => buffer,
        string: buffer => buffer.toString(),
    };

    constructor(reference, module) {
        return new Promise(async (ok, fail) => {
            this.module = module;
            this.expires = null;
            this.oneTime = false;
            this.url = reference.expandedUrl;
            this.path = reference.expandedPath;
            this.mime = mkMime(PATH.extname(this.path));
            this.value = null;

            if (this.mime.code == 'text/javascript') {
                const code = (await FILES.readFile(this.path)).toString();

                if (code.match(/'javascript-web-extension';/m)) {
                    this.webExtension = true;
                    this.value = new require(this.path)();
                    this.value.module = module;
                    this.value.config = reference;
                }
            }

            ok(this);
        });
    }

    async get(alg) {
        let value = this.value;

        if (value === null) {
            try {
                let buffer = await FILES.readFile(this.path);
                value = { '': Resource.formatters[this.mime.type](buffer) };

                if (Config.cache && buffer.length <= 1024*1024*Config.cacheMB) {
                    this.value = value;
                }
            } 
            catch (e) {
                return {
                    url: this.url,
                    mime: mkMime('text/plain'),
                    value: `ERROR: ${this.path}`,
                    error: true,
                };
            }
        }

        if (!(alg in value)) {
            value[alg] = await compress(alg, value['']);
        }

        return {
            url: this.url,
            mime: this.mime,
            value: value[alg],
            error: false,
        };
    }
}


/*****
 * Each process gets it's own singleton content object, which may be used by the
 * HTTP or any other server that needs to refer to content.  Each content item
 * has a unique URL.  On the aggregate level, the content from each module is
 * segregated to ensure unique URLs for each register content file.
*****/
singleton(class ResourceLibrary {
    constructor() {
        this.urls = {};
        this.webExtensionMap = {};
        this.webExtensionArray = [];
    }

    deregister(url) {
        for (let filtered of Object.keys(this.urls).filter(key => key.startsWith(url))) {
            delete this.urls[filtered];
        }
    }

    async expandReference(reference) {
        if ('path' in reference) {
            let absPath = PATH.isAbsolute(reference.path) ? reference.path : PATH.join(env.kodePath, 'server', reference.path);

            if (await pathExists(absPath)) {
                let stats = await FILES.stat(absPath);

                if (stats.isFile()) {
                    reference.expandedUrl = reference.url;
                    reference.expandedPath = absPath;
                    return [reference];
                }
                else if (stats.isDirectory()) {
                    let expanded = [];

                    for (let filePath of await recurseFiles(absPath)) {
                        let baseName = PATH.basename(filePath);
                        let relative = filePath.substr(reference.path.length);

                        if (!baseName.startsWith('.')) {
                            let expandedReference = clone(reference);
                            expandedReference.expandedUrl = PATH.join(reference.url, relative);
                            expandedReference.expandedPath = filePath;
                            expanded.push(expandedReference);
                        }
                    }

                    for (let dirPath of await recurseDirectories(absPath)) {
                        let indexPath = PATH.join(dirPath, 'index.html');

                        if (await pathExists(indexPath)) {
                            let stats = await FILES.stat(indexPath);

                            if (stats.isFile()) {
                                let expandedReference = clone(reference);
                                let relative = dirPath.substr(reference.path.length);
                                expandedReference.expandedUrl = PATH.join(reference.url, relative);
                                expandedReference.expandedPath = indexPath;
                                expanded.push(expandedReference);
                            }
                        }
                    }

                    return expanded;
                }
            }
            else {
                logPrimary(`    ERROR: "File Not Found"  PATH: "${reference.path}"`);
            }
        }

        return [];
    }
    
    async get(url) {
        if (url in this.urls) {
            return await this.urls[url];;
        }
    }
    
    async register(reference, module) {
        for (let ref of await this.expandReference(reference)) {
            if (ref.expandedUrl in this.urls) {
                logPrimary(`    ERROR: "Duplicate URL ignored"  URL: "${ref.expandedUrl}"`);
            }
            else {
                let resource = await (new Resource(ref, module));
                this.urls[resource.url] = resource;

                if (resource.webExtension) {
                    this.webExtensionArray.push(resource);
                    this.webExtensionMap[resource.url] = resource;
                    await resource.value.init();
                }
            }
        }
    }
});
