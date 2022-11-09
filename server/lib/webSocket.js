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
register(class WSocket {
    static _socketId = 1;

    constructor(socket, extensions, headData) {
        this._socketId = $WebSocket._socketId++;
        this._socket = socket;
        this._socket.setTimeout(0);
        this._socket.setNoDelay();
        this._sessionId = '';
        this._frameParser = $FrameParser(this, headData);
        this._frameBuilder = $FrameBuilder();
        this._buildExtensionMap(extensions);
  
        this.type = '';
        this.payload = [];
        this.state = 'Ready';

        this._interval = setInterval(() => {
            this.send({messageName: '$Ping'});
        }, 15000);
    }
  
    buildExtensionMap(extensions) {
        let extensionMap = {};
  
        extensions.split(';').forEach(extension => {
            let [ left, right ] = extension.trim().split('=');
            extensionMap[left] = right;
        });
  
        this._extensions = $WebSocketExtensions(extensionMap);
    }

    close() {
        this.state = 'Closing';

        if (this._socket) {
            let frames = this._frameBuilder.build('', 0x8);
            frames.forEach(frame => this._socket.write(frame));
        }
    }

    destroy() {
        this.state = 'Closed';
        clearInterval(this._interval);
        this._socket.destroy();
    }

    onError(error) {
        this._socket.destroy(error);
        this._socket = null;
    }

    onFrame(frame) {
        if (this.state == 'Ready') {
            if (frame.opcode == 0x1) {
                this.type = 'string';
            }
            else if (frame.opcode == 0x2) {
                this.type = 'binary';
            }
            else if (frame.opcode == 0x8) {
                if (this.state == 'Ready') {
                    this.close();
                }

                this.destroy();
                return;
            }
            else if (frame.opcode == 0x9) {
                return;
            }
            else if (frame.opcode == 0xa) {
                return;
            }
            else {
                this.close();
                return;
            }

            if (frame.fin) {
                this.onMessage(frame.payload());
                this.reset();
            }
            else {
                this.state = 'Fragmented';
                this.payload.push(frame.payload());
            }
        }
        else if (this.state == 'Fragmented') {
            if (frame.opcode == 0x0) {
                this.payload.push(frame.payload());
            }
            else {
                this.close();
            }

            if (frame.fin) {
                this.onMessage(Buffer.concat(this.payload));
                this.reset();
            }
        }
    }
  
    async onMessage(payload) {
        let message;
  
        if (this.type == 'string') {
            message = $Message($fromJson(payload.toString()));
        }

        if (message.messageName == '$Ping') {
            this.send({messageName: '$Pong'});
        }
        else if (message.messageName == '$SocketSession') {
            this._sessionId = message.sessionId;
        }
        else if (message.messageName != '$Pong') {
            try {
                if (message.$wsQuery) {
                    let reply = await Cls$MessageHandler.query(message, message.sessionId);
                    this.send(reply);
                }
                else {
                    Cls$MessageHandler.send(message, message.sessionId);
                }
            }
            catch (e) {
                $log(e);
                await rsp.respond500();
                return;
            }
        }
    }

    query(message) {
        if (!(message instanceof Cls$Message)) {
            message = $Message(message);
        }

        let trap = $ReturnTrap();
        message.$wsQuery = true;
        message.$returnTrapId = trap.id();
        Cls$ReturnTrap.setExpected(trap.id(), 1);
        this.send(message);
        return trap.promise();
    }

    reset() {
        this.type = '';
        this.payload = [];
        this.state = 'Ready';
    }
  
    secWebSocketExtensions() {
        return this._extensions.secWebSocketExtensions();
    }

    send(message) {
        if (this._socket) {
            if (!(message instanceof Cls$Message)) {
                message = $Message(message);
            }

            let frames = this._frameBuilder.build($toJson(message), 0x1);
            frames.forEach(frame => this._socket.write(frame));
        }
    }
});


/*****
*****/
class FrameBuilder {
    static _maxPayloadLength = 50000;

    build(payload, opcode) {
        let frames = [];
        this._payload = payload;
        this._messageOpcode = opcode;
        this._frameOpcode = this._messageOpcode;

        while (this._payload.length) {
            if (this._payload.length <= $FrameBuilder._maxPayloadLength) {
                frames.push(this.buildFrame(this._payload.length, 0x80));
                this._payload = '';
            }
            else {
                let slice = payload.slice(0, $FrameBuilder._maxPayloadLength);
                frames.push(this.buildFrame(slice.length, 0x00));
                this._payload = this._payload.slice($FrameBuilder._maxPayloadLength)
            }

            this._frameOpcode = 0;
        }

        return frames;
    }

    buildFrame(payloadLength, ctl) {
        let headerLength = 2;

        if (payloadLength > 65536) {
            headerLength += 4;
            var frame = Buffer.alloc(headerLength + payloadLength);
            frame[0] = ctl | this._frameOpcode;
            frame[1] = 127;
            frame.writeUInt32BE((payloadLength & 0xffff0000) >> 32, 2);
            frame.writeUInt32BE(payloadLength & 0x0000ffff, 6);
        }
        else if (payloadLength > 125) {
            headerLength += 2;
            var frame = Buffer.alloc(headerLength + payloadLength);
            frame[0] = ctl | this._frameOpcode;
            frame[1] = 126;
            frame.writeUInt16BE(payloadLength, 2);
        }
        else {
            var frame = Buffer.alloc(headerLength + payloadLength);
            frame[0] = ctl | this._frameOpcode;
            frame[1] = payloadLength;
        }

        for (let i = 0; i < payloadLength; i++) {
            frame[i + headerLength] = this._payload.charCodeAt(i);
        }

        return frame;
    }
}


/*****
*****/
class FrameParser {
    constructor(webSocket, headData) {
        this._webSocket = webSocket;
        this._socket = webSocket._socket;
        this._socket.on('data', data => this.onData(data));
        this._socket.on('error', error => this.onError(error));
        this._state = 'GetInfo';
        this._rawFrame = Buffer.from(headData);

        this.analyzers = {
            GetInfo: this.getInfo,
            GetExtended: this.getExtended,
            GetMask: this.getMask,
            GetPayload: this.getPayload,
            HaveFrame: this.onFrame,
        }
    }

    getExtended() {
        if (this.payloadExtention == 'large') {
            if (this._rawFrame.length >= this.maskOffset) {
                this.payloadLength = this._rawFrame.readUInt32BE(2) << 32 | this._rawFrame.readUInt32BE(6);
                this._state = 'GetMask';
            }
        }
        else if (this.payloadExtention == 'medium') {
            if (this._rawFrame.length >= this.maskOffset) {
                this.payloadLength = this._rawFrame.readUInt16BE(2);
                this._state = 'GetMask';
            }
        }
        else {
            this._state = 'GetMask';
        }
    }

    getInfo() {
        if (this._rawFrame.length >= 4) {
            this.fin =  (this._rawFrame[0] & 0x80) === 0x80;
            this.rsv1 = (this._rawFrame[0] & 0x40) === 0x40;
            this.rsv2 = (this._rawFrame[0] & 0x20) === 0x20;
            this.rsv3 = (this._rawFrame[0] & 0x10) === 0x10;
            this.opcode = this._rawFrame[0] & 0x0f;

            this.masking = (this._rawFrame[1] & 0x08);
            this.payloadLength = this._rawFrame[1] & 0x7f;
            this.payloadExtention = 'none';

            if (this.payloadLength == 126) {
                this.maskOffset = 4;
                this.headerLength = 8;
                this.payloadExtention = 'medium';
            }
            else if (this.payloadLength == 127) {
                this.maskOffset = 10;
                this.headerLength = 14;
                this.payloadExtention = 'large';
            }
            else {
                this.maskOffset = 2;
                this.headerLength = 6;
            }

            this._state = 'GetExtended';
        }
    }

    getMask() {
        if (this._rawFrame.length >= this.maskOffset + 4) {
            this.mask = [];

            for (let i = 0; i < 4; i++) {
                this.mask.push(this._rawFrame[i + this.maskOffset]);
            }

            this._state = 'GetPayload';
        }
    }

    getPayload() {
        if (this._rawFrame.length >= this.headerLength + this.payloadLength) {
            this._state = 'HaveFrame';
        }
    }

    onData(buffer) {
        this._rawFrame = Buffer.concat([this._rawFrame, buffer]);

        while(this._state in this.analyzers) {
            let state = this._state;
            Reflect.apply(this.analyzers[this._state], this, []);

            if (this._state == state) {
                break;
            }
        }
    }

    onError(error) {
        this._webSocket.onError(error);
    }

    onFrame() {
        let frameLength = this.headerLength + this.payloadLength;
        let nextFrame = Buffer.from(this._rawFrame.slice(frameLength));
        this._rawFrame = this._rawFrame.slice(0, frameLength);
        this._webSocket.onFrame(this);

        this._state = 'GetInfo';
        this._rawFrame = nextFrame;
        delete this.fin;
        delete this.rsv1;
        delete this.rsv2;
        delete this.rsv3;
        delete this.masking;
        delete this.payloadLength;
        delete this.payloadExtention;
        delete this.maskOffset;
        delete this.headerLength;
        delete this.payloadExtention;
        delete this.mask;
    }

    payload() {
        let slice = this._rawFrame.slice(this.headerLength);
        let decoded = Buffer.alloc(slice.length);

        for (let i = 0; i < slice.length; i++) {
            decoded[i] = slice[i] ^ this.mask[i % 4];
        }

        return decoded;
    }
}
