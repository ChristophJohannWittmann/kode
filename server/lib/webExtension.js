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
'javascript-web-extension';


/*****
 * A web extension is a programming unit or module that provides a dynamic way
 * to handle HTTP requests.  As the framework loads and module references are
 * analyzed, if the analyzed reference is a javascript file and has this text
 * embedded as a line of code, 'javascript-web-extension';, it'll be treated as
 * a web extension, which means it's compiled and added as a web-extension
 * resource.  This base class provides both the overall web-extension framwork
 * and some basic common features that are required for all web extensions.
*****/
exports = module.exports = register(class WebExtension extends Emitter {
    constructor() {
        super();
    }

    async handleGET(req) {
        return {
            mime: mkMime('text/plain'),
            data: '',
        };
    }

    async handlePOST(req) {
        return {
            mime: mkMime('text/plain'),
            data: '',
        };
    }

    async handleRequest(req, rsp) {
        try {
            if (req.method() == 'GET') {
                let result = await this.handleGET(req, rsp);
                rsp.mime = result.mime;
                rsp.end(await compress(rsp.encoding, result.data));
            }
            else if (req.method() == 'POST') {
                let result = await this.handlePOST(req, rsp);
                rsp.mime = result.mime;
                rsp.end(await compress(rsp.encoding, result.data));
            }
            else {
                rsp.endError(405);
            }
        }
        catch (e) {
            let text = `Web Extension HTTP Error: Extension "${this.module.config.title}".`;
            log(text, e);
            rsp.end(await compress(rsp.encoding, text));
        }
    }

    async init() {
    }

    async onWebSocket(req, webSocket) {
    }

    async upgrade(httpReq, socket, headPacket) {
        if (this.module.config.websocket) {
            let secureKey = httpReq.headers['sec-websocket-key'];
            let hash = await Crypto.digestUnsalted('sha1', `${secureKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
            let webSocket = mkWebSocket(socket, req.headers['sec-websocket-extensions'], headPacket);
            
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
            await this.onWebSocket(mkHttpReq(httpReq), webSocket);
        }
    }
});
