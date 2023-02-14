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
 * Each process gets it's own singleton content object, which may be used by the
 * HTTP or any other server that needs to refer to content.  Each content item
 * has a unique URL.  On the aggregate level, the content from each module is
 * segregated to ensure unique URLs for each register content file.
*****/
singleton(class WebLibrary {
    constructor() {
        this.urls = {};
    }

    deregister(url) {
        for (let filtered of Object.keys(this.urls).filter(key => key.startsWith(url))) {
            delete this.urls[filtered];
        }
    }
    
    async get(url) {
        if (url in this.urls) {
            return await this.urls[url];
        }
    }
    
    async register(url, webItem) {
        if (url in this.urls) {
            logPrimary(`    WARNING: "Duplicate URL ignored"  URL: "${url}"`);
        }
        else {
            this.urls[url] = webItem;
        }
    }
});


/*****
 * A class that encapsulates a single content object, which must be located at
 * a unique URL.  It's primary purpose is to support the HTTP server by serving
 * as an instance of data that can be fed via the HTTP server.  Each content
 * object contains additional meta data to facilitate content management.
*****/
register(class WebResource {
    static formatters = {
        binary: buffer => buffer,
        string: buffer => buffer.toString(),
    };

    constructor(url, path, tlsMode) {
        return new Promise(async (ok, fail) => {
            this.url = url;
            this.path = path;
            this.tlsMode = tlsMode ? tlsMode : 'best';
            this.category = 'content';
            this.mime = mkMime(PATH.extname(this.path));
            this.value = null;
            WebLibrary.register(this.url, this);

            if (this.url.endsWith('/index.html')) {
                let url = this.url.substr(0, this.url.length - '/index.html'.length);
                url = url ? url : '/';
                WebLibrary.register(url, this);
            }

            ok(this);
        });
    }

    async get(alg) {
        let value = this.value;

        if (value === null) {
            try {
                let buffer = await FILES.readFile(this.path);
                value = { '': WebResource.formatters[this.mime.type](buffer) };

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
});


/*****
 * The WebBlob class is a type of web item that's precomputed by the system and
 * then stored in WebLibrary.  Originally, these were created to provide blobs
 * of jovascript representing entire minified frameworks.  It seems clear that
 * either binary or text data can be provided as a resource using this approach.
*****/
register(class WebBlob {
    constructor(url, mime, blob, tlsMode) {
        return new Promise(async (ok, fail) => {
            this.url = url;
            this.mime = mime;
            this.blob = blob;
            this.tlsMode = tlsMode ? tlsMode : 'best';
            this.category = 'content';
            this.mime = mkMime(mime);
            this.value = null;
            WebLibrary.register(this.url, this);
            ok(this);
        });
    }

    async get(alg) {
        let value = this.value;

        if (value === null) {
            try {
                value = { '': WebResource.formatters[this.mime.type](this.blob) };
                this.value = value;
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
});
