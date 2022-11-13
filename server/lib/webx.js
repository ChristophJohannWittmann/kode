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
 * A web extension is a programming unit or module that provides a dynamic way
 * to handle HTTP requests.  As the framework loads and module references are
 * analyzed, if the analyzed reference is a javascript file and has this text
 * embedded as a line of code, 'javascript-web-extension';, it'll be treated as
 * a web extension, which means it's compiled and added as a web-extension
 * resource.  This base class provides both the overall web-extension framwork
 * and some basic common features that are required for all web extensions.
*****/
register(class Webx extends Emitter {
    constructor() {
        super();
        this.valid = true;
        this.options = {};
    }

    async getModuleSetting(name, required, type) {
        if (name in this.module.settings) {
            let ok = true;
            let value = this.module.settings[name];

            if (type == 'array') {
                ok = Array.isArray(value);
            }
            else {
                ok = typeof value == type;
            }

            if (ok) {
                this.options[name] = value;
            }
            else {
                this.valid = false;
                logPrimary(`    (ERROR) Webex Invalid Module Setting.  Module "${this.module.path}", Setting "${name}"`);
            }
        }
        else if (required) {
            this.valid = false;
            logPrimary(`    (ERROR) Webex Module Setting Not Found.  Module "${this.module.path}", Setting "${name}" `);
        }
        else {
            this.options[name] = null;
        }
    }

    async handleRequest(req, rsp) {
        if (this.valid) {
            try {
                let handlerName = `handle${req.method()}`;

                if (handlerName in this && typeof this[handlerName] == 'function') {
                    await this[handlerName](req, rsp);
                }
                else {
                    rsp.endStatus(405);
                }
            }
            catch (e) {
                let diagnostic = `Web Extension HTTP Error: Extension "${this.module.config.title}".`;
                log(diagnostic, e);
                rsp.end(500, 'text/plain', diagnostic);
            }
        }
        else {
            rsp.endStatus(501);
        }
    }

    async init() {
        this.getModuleSetting('title', true, 'string');
        this.getModuleSetting('description', true, 'string');
        this.getModuleSetting('container', true, 'string');
        Object.assign(this.options, this.config);
    }

    off(messageName) {
        super.off(messageName);
        return this;
    }

    on(messageName, handler) {
        super.off(messageName);
        super.on(messageName, handler);
        return this;
    }

    once(messageName, handler, filter) {
        super.off(messageName);
        super.once(messageName, handler);
        return this;
    }

    async upgrade(httpReq, socket, headPacket) {
        if (this.options.websocket) {
            if (Reflect.has(this, 'onWebSocket')) {
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
    }
});
