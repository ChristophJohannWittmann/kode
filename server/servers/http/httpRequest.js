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
*****/
register(class HttpRequest {
    constructor(httpServer, httpReq) {
        return new Promise(async (ok, fail) => {
            this.httpServer = httpServer;
            this.httpReq = httpReq;
            await this.loadBody();

            this.params = {};
            this.parsedUrl = URL.parse(this.httpReq.url);
            let iterator = new URL.URLSearchParams(this.query()).entries();

            for (let param = iterator.next(); !param.done; param = iterator.next()) {
                this.params[param.value[0]] = param.value[1];
            }

            Object.seal(this.params);
            Object.freeze(this.params);
            ok(this);
        });
    }

    accept() {
        return this.acceptor('accept');
    }

    acceptEncoding() {
        return this.acceptor('accept-encoding');
    }
  
    acceptLanguage() {
        return this.acceptor('accept-language');
    }

    acceptor(headerName) {
        let items = {};
        let value = this.header(headerName);

        if (value) {
            value.split(',').forEach(item => {
                let [ value, quality ] = item.split(';');
                
                items[value] = {
                    value: value,
                    quality: quality ? parseFloat(quality.substr(2)) : 0
                };
            });
        }

        return items;
    }

    auth() {
        return this.parsedUrl.auth;
    }

    body() {
        return this.requestBody.data;
    }

    encoding() {
        if ('content-encoding' in this.headers()) {
            return mkEncoding(this.header('content-encoding'));
        }
        else {
            return mkEncoding();
        }
    }

    hash() {
        return this.parsedUrl.hash;
    }

    hasHeader(headerName) {
        return headerName.toLowerCase() in this.httpReq.headers;
    }

    header(headerName) {
        return this.httpReq.headers[headerName.toLowerCase()];
    }

    headers() {
        return this.httpReq.headers;
    }

    host() {
        return this.parsedUrl.host;
    }

    hostname() {
        return this.parsedUrl.hostname;
    }

    href() {
        return this.parsedUrl.href;
    }

    isMessage() {
        if (this.requestBody.mime.code === 'application/json') {
            return true;
        }
        else {
            return false;
        }
    }
    
    async loadBody() {
        this.requestTooLarge = false;

        return new Promise((ok, fail) => {
            let size = 0;
            let chunks = [];
            
            this.httpReq.on('data', data => {
                size += data.length;
                
                if (size > 100000000) {
                    this.requestBody = {
                        mime: Mime.fromMimeCode('text/plain'),
                        value: 'Payload Too Large'
                    };
                    
                    this.requestTooLarge = true;
                    ok();
                }
                else {
                    chunks.push(data);
                }
            });
            
            this.httpReq.on('end', () => {
                if (chunks.length) {
                    let mimeCode = this.header('content-type');
                    let mime = Mime.fromMimeCode(mimeCode);
                    
                    if (mime.type == 'binary') {
                        this.requestBody = {
                            mime: mime,
                            value: mkBinary(Buffer.concat(chunks))
                        };
                    }
                    else {
                        this.requestBody = {
                            mime: mime,
                            value: chunks.map(chunk => chunk.toString()).join('')
                        };
                    }
                    
                    if (mimeCode == 'application/json') {
                        this.requestMessage = fromJson(this.requestBody.value);
                    }
                }
                else {
                    this.requestBody = {
                        mime: Mime.fromMimeCode('text/plain'),
                        data: ''
                    };
                }
                
                ok();
            });
        });
    }

    message() {
        if (this.requestBody.mime.code === 'application/json') {
            try {
                return fromJson(this.requestBody);
            }
            catch (e) {
                return new Object();
            }
        }
    }

    method() {
        return this.httpReq.method;
    }

    mime() {
        return this.requestBody.mime;
    }

    parameters() {
        return this.params;
    }

    path() {
        return this.parsedUrl.path;
    }

    pathname() {
        return this.parsedUrl.pathname;
    }

    protocol() {
        return this.parsedUrl.protocol;
    }

    query() {
        return this.parsedUrl.query;
    }

    search() {
        return this.parsedUrl.search;
    }

    url() {
        return this.httpReq.url;
    }

    userAgent() {
        return this.header('user-agent');
    }
});
