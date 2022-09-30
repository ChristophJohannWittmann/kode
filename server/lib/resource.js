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

    constructor(reference) {
        return new Promise(async (ok, fail) => {
            this.expires = null;
            this.oneTime = false;
            this.url = reference.expandedUrl;
            this.path = reference.expandedPath;

            if (reference.type == 'content') {
                this.mime = Mime.fromExtension(PATH.extname(this.path));
                this.value = null;
            }
            else if (reference.type == 'app') {
                this.mime = null;
                this.value = require(reference.expandedPath);
            }

            ok(this);
        });
    }

    async get() {
        let value = this.value;

        if (value === null) {
            value = await this.load();
        }

        return {
            url: this.url,
            mime: this.mime,
            value: value,
        };
    }

    async load() {
        try {
            let buffer = await FILES.readFile(this.path);
            let value = Resource.formatters[this.mime.type](buffer);

            if (Config.cache) {
                this.value = value;
            }

            return value;
        } 
        catch (e) {
            this.value = `ERROR: ${this.path}`;
            this.mime = Mime.fromMimeCode('text/plain');
            log(`Error occured while reading content file: ${this.path}`, e);
        }
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
        /*
        if (CLUSTER.isPrimary) {
            Ipc.on('#Resource', async message => await this.onPrimary(message));
        }
        else {
            Ipc.on('#Resource', async message => await this.onWorker(message));
        }
        */
    }

    deregister(url) {
        for (let filtered of Object.keys(this.urls).filter(key => key.startsWith(url))) {
            delete this.urls[filtered];
        }
    }

    async expandReference(reference) {
        if ('path' in reference) {
            let absPath = PATH.isAbsolute(reference.path) ? reference.path : PATH.join(reference.modulePath, reference.path);

            if (FS.existsSync(absPath)) {
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

                        if (!baseName.startsWith('.')) {
                            let relative = filePath.substr(reference.path.length);
                            let expandedReference = clone(reference);
                            expandedReference.expandedUrl = PATH.join(reference.url, relative);
                            expandedReference.expandedPath = filePath;
                            expanded.push(expandedReference);
                        }
                    }

                    return expanded;
                }
            }
            else {
                logPrimary(`    ERROR: "File Not Found"  PATH: "${path}"`);
            }
        }

        return [];
    }
    
    async get(url) {
        if (url in this.urls) {
            return await this.urls[url].get();
        }
    }

    /*
    async onPrimary(message) {
        console.log(message);
    }

    async onWorker(message) {
        //console.log(message);
    }
    */
    
    async register(reference) {
        for (let ref of await this.expandReference(reference)) {
            if (ref.expandedUrl in this.urls) {
                logPrimary(`    ERROR: "Duplicate URL ignored"  URL: "${ref.expandedUrl}"`);
            }
            else {
                let resource = await new Resource(ref);
                this.urls[resource.url] = resource;
            }
        }
    }
});
