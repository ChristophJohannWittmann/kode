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
$(class $HttpRequest {
    constructor(httpReq, httpServer) {
        return new Promise(async (ok, fail) => {
            this._httpReq = httpReq;
            this._httpServer = httpServer;
            this._httpMethod = httpReq.method;
            this._httpHeaders = httpReq.headers;
            this._body = {mime: 'text/plain', type: 'error', value: 'GET request has no body.'};
            this._params = {};
            this._message = {};
            this._sessionId = '';

            if (this._httpMethod == 'GET') {
                let iterator = this.url().searchParams.entries();

                for (let param = iterator.next(); !param.done; param = iterator.next()) {
                    this._params[param.value[0]] = param.value[1];

                    if (param.value[0] == 'SESSION') {
                        this._sessionId = param.value[1].toString().replace(/ /g, '+');
                    }
                }
            }
            
            ok(this);
        });
    }
  
    _accept(headerName) {
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

    accept() {
        return this._accept('accept');
    }

    acceptEncoding() {
        return this._accept('accept-encoding');
    }
  
    acceptLanguage() {
        return this._accept('accept-language');
    }

    body() {
        return this._body.value;
    }

    contentFormat() {
        return this._body.type;
    }

    contentType() {
        return this._body.mime;
    }

    header(name) {
        let headerName = name.toLowerCase();

        if (headerName in this._httpHeaders) {
            return this._httpHeaders[name.toLowerCase()];
        }

        return '';
    }

    headers() {
        return this._httpHeaders;
    }

    host() {
        return this.header('host');
    }
  
    language() {
        return this._language;
    }
  
    locale() {
        return this._locale;
    }

    async loadMessageBody() {
        return new Promise((ok, fail) => {
            let size = 0;
            let chunks = [];
            
            this._httpReq.on('data', data => {
                size += data.length;
                
                if (size > 100000000) {
                    this._body = {
                        mime: 'text/plain',
                        type: 'error',
                        value: 'Incoming reqest body exceeds allowable length.'
                    };
                    
                    ok();
                }
                else {
                    chunks.push(data);
                }
            });
            
            this._httpReq.on('end', () => {
                let mimeCode = this.header('content-type');
                let mime = Cls$Mime.fromMimeCode(mimeCode);
                
                if (mime.type == 'binary') {
                    this._body = {
                        mime: mime.code,
                        type: 'binary',
                        value: Buffer.concat(chunks)
                    };
                }
                else {
                    this._body = {
                        mime: mime.code,
                        type: 'text',
                        value: chunks.map(chunk => chunk.toString()).join('')
                    };
                }
                
                if (mimeCode == 'application/json') {
                    this._message = $fromJson(this._body.value);
                    this._sessionId = this._message.$sessionId;
                    delete this._message.$session;
                }
                
                ok();
            });
        });
    }

    message() {
        return this._message;
    }

    method() {
        return this._httpMethod;
    }

    param(name) {
        if (name in this._params) {
            return this._params[name];
        }
    }

    path() {
        return this.url().pathname;
    }

    protocol() {
        return this._httpServer.tls() ? 'https' : 'http';
    }

    sessionId() {
        return this._sessionId;
    }

    tls() {
        return this._httpServer.tls();
    }

    url() {
        if (this.header('host')) {
            return new URL.URL(`${this.protocol()}://${this.header('host')}${this._httpReq.url}`);
        }
        else {
            return new URL.URL(`${this.protocol()}://NOHOST${this._httpReq.url}`);
        }
    }

    userAgent() {
        return this.header('user-agent');
    }
});
