/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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

            if (this.tls()) {
                const crypto = this.crypto();

                this.nodeHttpServer = HTTPS.createServer({
                    key: crypto.key,
                    cert: crypto.cert,
                    ca: crypto.CA,
                }, (...args) => this.handle(...args));
            }
            else {
                this.nodeHttpServer = HTTP.createServer((...args) => this.handle(...args));
            }

            this.nodeHttpServer.on('upgrade', async (httpReq, socket, headPacket) => {
                let resource = ResourceLibrary.get(httpReq.pathname());

                if (resource && resource.webExtension) {
                    try {
                        await resource.value.upgrade(httpReq, socket, headPacket);
                    }
                    catch (e) {
                        log(`Web Socket Upgrade Request Error: ${httpReq.url}`, e);
                    }
                }
            });
      
            this.nodeHttpServer.listen(this.port(), this.addr());
        }

        async handle(httpReq, httpRsp) {
            let req = await mkHttpRequest(this, httpReq);
            let rsp = await mkHttpResponse(this, httpRsp, req);
            let resource = await ResourceLibrary.get(req.pathname());

            if (resource) {
                if (resource.webExtension) {
                    await resource.value.handle(req, rsp);
                }
                else {
                    let content = await resource.get(rsp.encoding);

                    if (content.error) {
                        rsp.mime = mkMime('text/plain');
                        rsp.end(`Error while fetching ${req.url()}`);
                    }
                    else {
                        rsp.mime = content.mime;
                        rsp.end(content.value);
                    }
                }
            }
            else {
                rsp.endError(404);
            }

            await mkDboHttpLog({
                ipAddr: req.host(),
                cipher: req.cipher(),
                method: req.method(),
                url: req.url(),
                headers: req.headers(),
                status: rsp.status,
            }).save();
        }

        port() {
            return this.tls() ? 443 : 80;
        }
    });
}
