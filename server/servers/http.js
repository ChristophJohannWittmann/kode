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
    register(class HttpServer extends Server {
        constructor(config, serverName) {
            super(config, serverName);
            this.handlers = {};

            if (this.tls()) {
                this.nodeHttpServer = HTTPS.createServer({
                    key: crypto.pemPrivate,
                    cert: crypto.pemCert,
                    ca: crypto.pemCA,
                }, (httpReq, httpRsp) => this.handle(httpReq, httpRsp));
            }
            else {
                this.nodeHttpServer = HTTP.createServer((httpReq, httpRsp) => this.handleRequest(httpReq, httpRsp));
            }
      
            this.nodeHttpServer.listen(this.port(), this.addr());
            
            /*
            this.nodeHttpServer.on('upgrade', async (req, socket, headPacket) => {
                if (this.config.websocket) {
                    let secureKey = req.headers['sec-websocket-key'];
                    let hash = await Crypto.digestUnsalted('sha1', `${secureKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
                    let webSocket = $WebSocket(socket, req.headers['sec-websocket-extensions'], headPacket);
                    
                    let headers = [
                        'HTTP/1.1 101 Switching Protocols',
                        'Upgrade: websocket',
                        'Connection: upgrade',
                        `Sec-WebSocket-Accept: ${hash}`,
                        '\r\n'
                    ];
          
                    if (webSocket.secWebSocketExtensions()) {
                        headers.append(`Sec-WebSocket-Extensions: ${webSocket.secWebSocketExtensions()}`);
                    }
                
                    socket.write(headers.join('\r\n'));
                }
            });
            */
        }

        clearHandler(handler, criteria) {
        }

        async handleRequest(httpReq, httpRsp) {
            console.log(httpReq.headers.host);

            httpRsp.end('Hello Plain Text', 'utf-8');
        }

        port() {
            return this.tls() ? 443 : 80;
        }

        setHandler(handler, criteria) {
        }
    });
}
