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
 
 
 (() => {
    /*****
     * A framework wrapper class for simplifying the implementation of an HTTP
     * or HTTPS client request.  Note that the request is configured/formatted
     * to enable single-line get() and post() and other REST options to the
     * remote server.
    *****/
    register(class HttpClient {
        constructor() {
        }

        buildOpts(arg) {
            if (typeof arg == 'string') {
                let url = URL.parse(arg);

                var opts = {
                    protocol: url.protocol == 'http:' ? url.protocol : 'https:',
                    port: url.port ? url.port : (url.protocol == 'http:' ? 80 : 443),
                    client: url.protocol == 'http:' ? HTTP : HTTPS,
                    host: url.host,
                    path: url.path,
                    headers: {},
                };
            }
            else {
                var opts = {
                    protocol: arg.protocol ? arg.protocol : 'https:',
                    port: arg.port ? arg.port : (arg.protocol == 'http:' ? 80 : 443),
                    client: arg.protocol == 'http:' ? HTTP : HTTPS,
                    host: arg.host ? arg.host : '',
                    path: arg.path ? arg.path : '',
                    headers: arg.headers ? arg.headers : {},
                };
            }

            return opts;
        }

        async get(arg, headers) {
            let opts = this.buildOpts(arg);
            opts.method = 'GET';
            return await this.request(opts, headers);
        }

        async head(arg, headers) {
            let opts = this.buildOpts(arg);
            opts.method = 'HEAD';
            return await this.request(opts, headers);
        }

        async post(arg, mime, content, headers) {
            let opts = this.buildOpts(arg);
            opts.method = 'POST';
            opts.content = content;
            opts.headers['Content-Type'] = mime;
            return await this.request(opts, headers);
        }

        request(opts, headers) {
            if (headers) {
                for (let headerName in headers) {
                    opts.headers[headerName] = headers[headerName];
                }
            }

            if ('content' in opts) {
                opts.headers['Content-Length'] = opts.content.length;
            }

            return new Promise((ok, fail) => {
                let req = opts.client.request(opts, rsp => {
                    let body = [];
                    
                    rsp.on('data', buffer => {
                        body.push(buffer)
                    });
                    
                    rsp.on('end', () => {
                        let content = '';
                        let mime = rsp.headers['content-type'];

                        if (mime) {
                            let semi = mime.indexOf(';');

                            if (semi > 0) {
                                mime = mime.substring(0, semi - 1);
                            }
                        }
                        else {
                            mime = 'text/plain';
                        }

                        if (body.length) {
                            if (mime in converters) {
                                content = converters[mime](body);
                            }
                            else {
                                content = converters['text/plain'](body);
                            }
                        }

                        ok({
                            status: rsp.statusCode,
                            mime: mime,
                            message: rsp.statusMessage,
                            headers: rsp.headers,
                            content: content,
                        });
                    });
                    
                    rsp.on('error', error => {
                        ok({
                            status: 999,
                            mime: 'text/plain',
                            message: '',
                            headers: {},
                            content: error.toString(),
                        });
                    });
                });

                'content' in opts ? req.write(opts.content) : false;
                req.end();
            });
        }
    });


    /**
     * This is the exhaustive list of converters that are supported within the
     * http request module.  You need to add more if you're expecting other types
     * of response content.  Note that if a content type is NOT supported, the HTTP
     * client return the response as an application/octet-stream type.
     */
    const converters = {
        'application/json': array => {
            return fromJson(array.map(el => el.toString()).join(''));
        },
        
        'application/octet-stream': array => {
            let length = array.reduce((prev, curr) => prev + curr.length, 0);
            return Buffer.concat(array, length);
        },
        
        'application/xml': array => {
            return array.map(el => el.toString()).join('');
        },
        
        'text/htm': array => {
            return array.map(el => el.toString()).join('');
        },
        
        'text/html': array => {
            return array.map(el => el.toString()).join('');
        },
        
        'text/plain': array => {
            return array.map(el => el.toString()).join('');
        },
    };
})();
