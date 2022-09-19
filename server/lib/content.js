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

    constructor(module, path) {
        this.exists = false;
        this.absPath = path;
        this.dirPath = PATH.join(module.path, 'content', PATH.sep);
        this.relPath = this.absPath.substr(this.dirPath.length);
        this.baseName = PATH.basename(this.absPath);
        this.extName = PATH.extname(this.absPath);
        this.mime = Mime.fromExtension(this.extName);
        this.url = PATH.join(module.config.namespace, this.relPath);
        this.content = '';
    }

    async analyze() {
        if (this.mime) {
            if (FS.existsSync(this.absPath)) {
                let stats = await FILES.stat(this.absPath);

                if (stats.isFile()) {
                    this.exists = true;
                }
            }
        }
    }

    async get() {
        if (this.content) {
            return {
                mime: this.mime,
                content: this.content,
            };
        }
        else {
            let content;

            try {
                let raw = await FILES.readFile(this.absPath);
                content = Content.formatters[this.mime.type](raw);

                if (Config.cache) {
                    this.content = content;
                }
            } 
            catch (e) {
                this.content = `ERROR: ${this.absPath}`;
                this.mime = Mime.fromMimeCode('text/plain');
                log(`Error occured while reading conent file: ${this.absPath}`, e);
            }

            return {
                mime: this.mime,
                content: content,
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
singleton(class ContentManager {
    constructor() {
        this.urls = {};
        this.cache = Config.cache;
    }

    deregister(url) {
        if (url in this.urls) {
            delete this.urls[url];
        }
    }
    
    async get(url) {
        if (url in this.urls) {
            return this.urls[url].get();
        }
    }
    
    async registerModule(module) {
        for (let path of await recurseFiles(module.contentPath)) {
            let content = new Content(module, path);
            await content.analyze();
            this.urls[content.url] = content;
        }
    }
});
