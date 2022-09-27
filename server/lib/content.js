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
class Content {
    static formatters = {
        binary: buffer => buffer,
        string: buffer => buffer.toString(),
    };

    constructor(url, path) {
        return new Promise(async (ok, fail) => {
            this.url = url;
            this.path = path;
            this.mime = Mime.fromExtension(PATH.extname(this.path));
            this.isApp = false;
            this.found = false;
            this.blob = null;

            if (this.mime) {
                if (FS.existsSync(this.path)) {
                    let stats = await FILES.stat(this.path);

                    if (stats.isFile()) {
                        this.found = true;

                        if (this.mime.code == 'text/javascript') {
                            let buffer = await FILES.readFile(this.path);
                            this.blob = buffer.toString();

                            if (this.blob.match(/'KODE#MODULE';/m)) {
                                this.isApp = true;
                            }
                        }
                    }
                }
            }

            ok(this);
        });
    }

    async get() {
        if (this.blob) {
            return {
                mime: this.mime,
                blob: this.blob,
            };
        }
        else {
            let blob;

            try {
                let buffer = await FILES.readFile(this.path);
                blob = Content.formatters[this.mime.type](buffer);

                if (Config.cache) {
                    this.blob = blob;
                }
            } 
            catch (e) {
                this.blob = `ERROR: ${this.absPath}`;
                this.mime = Mime.fromMimeCode('text/plain');
                log(`Error occured while reading content file: ${this.path}`, e);
            }

            return {
                mime: this.mime,
                blob: blob,
            };
        }
    }
}


/*****
 * Each process gets it's own singleton content object, which may be used by the
 * HTTP or any other server that needs to refer to content.  Each content item
 * has a unique URL.  On the aggregate level, the content from each module is
 * segregated to ensure unique URLs for each register content file.
*****/
singleton(class ContentLibrary {
    constructor() {
        this.urls = {};
    }

    deregister(url) {
        if (url in this.urls) {
            delete this.urls[url];
        }
    }
    
    async get(url) {
        if (url in this.urls) {
            return await this.urls[url].get();
        }
    }
    
    async register(url, path) {
        if (url in this.urls) {
            logPrimary(`    ERROR: "Duplicate URL ignored"  URL: "${url}"`);            
        }
        else {
            let content = await new Content(url, path);
            this.urls[content.url] = content;
            return content;
        }
    }
});
