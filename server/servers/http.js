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
                let resource = ResourceLibrary.get(httpReq.url);

                if (resource && resource.webExtension) {
                    await value.upgrade(httpReq, socket, headPacket);
                }
            });
      
            this.nodeHttpServer.listen(this.port(), this.addr());
        }

        async handle(httpReq, httpRsp) {
            let req = await mkHttpRequest(this, httpReq);
            let rsp = await mkHttpResponse(this, httpRsp);
            let resource = await ResourceLibrary.get(req.url());

            if (resource) {
                if (resource.webExtension) {
                    await this.handleExtension(req, rsp, resource);
                }
                else {
                    await this.handleResource(req, rsp, resource);
                }
            }
            else {
                console.log(`HTTP Server, responsd with 404, not found: ${req.url()}`);
                rsp.setContent('Very nice web server.  ', 'Nothing');
                await rsp.respond();
            }
        }

        async handleExtension(req, rsp, ext) {
            console.log(ext)
            rsp.setContent('Very nice web server.  ', 'Extension');
            await rsp.end();
        }

        async handleFavicon(req, rsp) {
        }

        async handleResource(req, rsp, resource) {
            let content = await resource.get();
            rsp.mime(content.mime);
            rsp.setContent(content.value);
            await rsp.end();
        }

        port() {
            return this.tls() ? 443 : 80;
        }
    });
}
