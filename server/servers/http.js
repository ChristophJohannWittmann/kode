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
 * The HTTP server wraps the node JS builtin HTTP server in the framework API
 * to make controlling the HTTP server that same API as servers written entirely
 * using the framework API.  The primary process was written as stub that does
 * essentially nothing!  Note that the listen() method was overridden to ensure
 * our code doesn't attempt to open the HTTP ports.
*****/
if (CLUSTER.isPrimary) {
    register(class HttpServer extends Server {
        constructor(config, serverName) {
            super(config, serverName);
        }

        listen() {
        }
    });
}


/*****
 * The HTTP server wraps the node JS builtin HTTP server in the framework API
 * to make controlling the HTTP server that same API as servers entirely written
 * using the framework API.  The worker code using the builtin class to start
 * the listener (somehow in the buildtin code) and to start the HTTP handler.
 * The HTTP worker essentially does nothing with regards to a websocket upgrade.
 * If the requested URL refers to a web extension module, that module is called
 * handle or ignore the upgrade request.
*****/
if (CLUSTER.isWorker) {
    require('./http/httpRequest.js');
    require('./http/httpResponse.js');

    register(class HttpServer extends Server {
        constructor(config, serverName) {
            super(config, serverName);
            this.http = null;
            this.https = null;

            if (this.config.http) {
                this.http = HTTP.createServer((httpReq, httpRsp) => this.handle(httpReq, httpRsp, false));
                this.http.listen(this.config.http, this.addr());
                this.http.on('upgrade', (...args) => this.upgrade(...args));
            }

            const crypto = this.crypto();

            if (this.config.https && crypto) {
                this.https = HTTPS.createServer({
                    key: crypto.privateKey.pem,
                    cert: crypto.cert.certificate[0],
                    ca: crypto.cert.certificate[1],
                }, (httpReq, httpRsp) => this.handle(httpReq, httpRsp, true));
                this.https.listen(this.config.https, this.addr());
                this.https.on('upgrade', (...args) => this.upgrade(...args));
            }
        }

        async handle(httpReq, httpRsp, tls) {
            let req = await mkHttpRequest(this, httpReq, tls);
            let rsp = await mkHttpResponse(this, httpRsp, req);

            try {
                if (req.method() in { GET:0, POST:0 }) {
                    let resource = await ResourceLibrary.get(req.pathname());

                    if (resource) {
                        await this.handleResource(req, rsp, tls, resource);
                    }
                    else {
                        rsp.endStatus(404);
                    }
                }
                else {
                    rsp.endStatus(405);
                }
            }
            catch (e) {
                log(e);
                rsp.endStatus(500);
            }

            let dbc = await dbConnect();

            await mkDboHttpLog({
                ipAddr: req.host(),
                cipher: req.cipher(),
                method: req.method(),
                url: req.url(),
                headers: req.headers(),
                status: rsp.status,
            }).save(dbc);

            await dbc.commit();
            await dbc.free();
        }

        async handleResource(req, rsp, tls, resource) {
            if (!(resource.tlsMode in { best:0, must:0, none:0 })) {
                rsp.endStatus(404);
                return;                
            }

            if (tls) {
                if (resource.tlsMode == 'none') {
                    if (this.http) {
                        rsp.setHeader('Location', `${req.fullRequest().replace('https', 'http')}`);
                        rsp.endStatus(301);
                        return;
                    }
                    else {
                        rsp.endStatus(404);
                        return;
                    }
                }
            }
            else {
                if (resource.tlsMode == 'must') {
                    if (this.https) {
                        rsp.setHeader('Location', `${req.fullRequest().replace('http', 'https')}`);
                        rsp.endStatus(301);
                        return;
                    }
                    else {
                        rsp.endStatus(404);
                        return;
                    }
                }
                else if (resource.tlsMode == 'best') {
                    if (this.https) {
                        rsp.setHeader('Location', `${req.fullRequest().replace('http', 'https')}`);
                        rsp.endStatus(301);
                        return;
                    }
                }
            }

            if (resource.category == 'webx') {
                await resource.value.handleRequest(req, rsp);
            }
            else if (resource.category == 'hook') {
                let response = await resource.reference.hook.accept({
                    method: req.method(),
                    url: req.url(),
                    headers: req.headers(),
                    content: req.body(),
                });

                rsp.end(response.mime, response.content);
            }
            else if (req.method() == 'GET') {
                let content = await resource.get(rsp.encoding);

                if (content.error) {
                    rsp.mime = mkMime('text/plain');
                    rsp.end(`Error while fetching ${req.url()}`);
                }
                else {
                    rsp.preEncoded = true;
                    rsp.mime = content.mime;
                    rsp.end(content.value);
                }
            }
            else {
                rsp.endStatus(405);
            }
        }

        isHttp() {
            return this.http != null;
        }

        isHttps() {
            return this.https != null;
        }

        isIntegrative() {
            return this.http != null && this.https != null;
        }

        async upgrade(httpReq, socket, headPacket) {
            let req = await mkHttpRequest(this, httpReq);
            let resource = await ResourceLibrary.get(req.pathname());

            if (resource && resource.category == 'webx') {
                try {
                    await resource.value.upgrade(req, socket, headPacket);
                }
                catch (e) {
                    log(`Web Socket Upgrade Request Error: ${req.url()}`, e);
                }
            }
        }
    });
}
