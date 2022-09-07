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
 * There are two variants of Buffer.  In the server, Buffer wraps the builtin
 * Buffer class by providing some additional features.  On the browser, it's
 * a class the implements the same features based on a uint8 array.  This makes
 * coding buffers the same on both the client and server.  Additionally, the
 * framework buffer is JSON transferable so that buffers can be easily sent
 * between processes, cluster hosts, and the application clients.
*****/
register(class Buffer {
    constructor(value, encoding) {
        if (value instanceof builtIn.buffer) {
            this.jsBuffer = value;
        }
        else {
            this.set(value, encoding);
        }
    }
  
    float32Be(index, value) {
        if (value) {
            this.jsBuffer.writeFloatBE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readFloatBE(index);
        }
    }
  
    float32Le(index, value) {
        if (value) {
            this.jsBuffer.writeFloatLE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readFloatLE(index);
        }
    }
  
    float64Be(index, value) {
        if (value) {
            this.jsBuffer.writeDoubleBE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigDoubleBE(index);
        }
    }
  
    float64Le(index, value) {
        if (value) {
            this.jsBuffer.writeDoubleLE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigDoubleLE(index);
        }
    }
  
    int8(index, value) {
        if (value) {
            this.jsBuffer.writeInt8(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readInt8(index);
        }
    }
  
    int16Be(index, value) {
        if (value) {
            this.jsBuffer.writeInt6BE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readInt16BE(index);
        }
    }
  
    int16Le(index, value) {
        if (value) {
            this.jsBuffer.writeInt16LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readInt16LE(index);
        }
    }
  
    int32Be(index, value) {
        if (value) {
            this.jsBuffer.writeInt32BE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readInt32BE(index);
        }
    }
  
    int32Le(index, value) {
        if (value) {
            this.jsBuffer.writeInt32LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readInt32LE(index);
        }
    }
  
    int64Be(index, value) {
        if (value) {
            this.jsBuffer.writeBigInt64BE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigInt64BE(index);
        }
    }
  
    int64Le(index, value) {
        if (value) {
            this.jsBuffer.writeBigIn664LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigInt64LE(index);
        }
    }
  
    find(startIndex, byteArray) {
        for (let i = startIndex; i < this.jsBuffer.length - bytes.length; i++) {
            let j;
  
            for (j = i; j < bytes.length; j++) {
                if (this.jsBuffer[startIndex + j] != bytes[j]) {
                    break;
                }
            }
  
            if (j == bytes.length) {
                return i;
            }
        }
  
        return -1;
    }
  
    length() {
        return this.jsBuffer.length;
    }

    set(value, encoding) {
        if (typeof value == 'string') {
            switch (encoding) {
                case 'hex':
                case 'base64':
                    this.jsBuffer = builtIn.buffer.from(value, encoding);
                    break;
    
                case 'b64':
                    this.jsBuffer = builtIn.buffer.from(value, 'base64');
                    break;

                default:
                    this.jsBuffer = builtIn.buffer.from(value);
            }
        }
        else {
            this.jsBuffer = builtIn.buffer.alloc(value);
        }
    }
  
    subBuffer(startIndex, endIndex) {
        return mkBuffer(this.jsBuffer.subarray(startIndex, endIndex));
    }
  
    uint8(index, value) {
        if (value) {
            this.jsBuffer[index] = value;
        }
        else {
            return this.jsBuffer[index];
        }
    }
  
    uint16Be(index, value) {
        if (value) {
            this.jsBuffer.writeUInt16BE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readUInt16BE(index);
        }
    }
  
    uint16Le(index, value) {
        if (value) {
            this.jsBuffer.writeUInt16LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readUInt16LE(index);
        }
    }
  
    uint32Be(index, value) {
        if (value) {
            this.jsBuffer.writeUInt32Be(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readUInt32BE(index);
        }
    }
  
    uint32Le(index, value) {
        if (value) {
            this.jsBuffer.writeUInt32LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readUInt32LE(index);
        }
    }
  
    uint64Be(index, value) {
        if (value) {
            this.jsBuffer.writeBigUInt64BE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigUInt64BE(index);
        }
    }
  
    uint64Le(index, value) {
        if (value) {
            this.jsBuffer.writeBigUInt64LE(value, index);
            return this;
        }
        else {
            return this.jsBuffer.readBigUInt64LE(index);
        }
    }

    str(encoding) {
        switch (encoding) {
            case 'hex':
            case 'base64':
                return this.jsBuffer.toString(encoding);
    
            case 'b64':
                return this.jsBuffer.toString('base64');

            default:
                return this.jsBuffer.toString();
        }
    }
});
