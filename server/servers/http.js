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
register(class HttpServer extends Server {
    constructor(config) {
        super(config);
    }

    async start() {
        if (CLUSTER.isPrimary) {
        }
        else {
            console.log('** START SERVER **');
            console.log(this.config);
            /*
            let crypto = this.crypto();
      
            if (crypto) {
                this._nodeHttpServer = Https.createServer({
                    key: crypto.pemPrivate,
                    cert: crypto.pemCert,
                    ca: crypto.pemCA,
                }, (req, rsp) => this.handleRequest(req, rsp));
            }
            else {
                this._nodeHttpServer = Http.createServer((req, rsp) => this.handleRequest(req, rsp));
            }
      
            this._nodeHttpServer.listen(this.port(), this.addr());
      
            this._nodeHttpServer.on('upgrade', async (req, socket, headPacket) => {
                let secureKey = req.headers['sec-websocket-key'];
                let hash = await Cls$Crypto.digest('sha1', `${secureKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
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
            });
            */
        }
    }

    async stop() {
        if (CLUSTER.isPrimary) {
        }
        else {
        }
    }
});
