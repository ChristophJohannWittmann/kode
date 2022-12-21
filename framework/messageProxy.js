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
 * Theere are cases where we want a single object, such as a synthetic widget,
 * with several sub-widgets to handle and redirect and even rename messages
 * from it's components into a single unified messageing from the container or
 * parent object.  The purpose of the MessageProxy is to provide this feature
 * in a manner that's relatively easy to implement on constructed objects.
*****/
register(class MessageProxy extends Emitter {
    constructor(emitter) {
        super();
        this.emitter = emitter;
        this.sources = new WeakMap();

        this.emitter.off = (messageName, handler) => {
            Reflect.apply(this.off, this, [messageName, handler])
            return this.emitter;
        };

        this.emitter.on = (messageName, handler, filter) => {
            Reflect.apply(this.on, this, [messageName, handler, filter])
            return this.emitter;
        };

        this.emitter.once = (messageName, handler, filter) => {
            Reflect.apply(this.once, this, [messageName, handler, filter])
            return this.emitter;
        };
    }

    handle(message, emitter) {
        let source = this.sources.get(emitter);

        if (source) {
            if (message.messageName in source.messages) {
                let msg = copy(message);
                msg.EMITTER = this.emitter;
                msg.messageName = source.messages[message.messageName].messageOut;
                this.send(msg);
            }
        }
    }

    route(emitter, messageIn, messageOut) {
        let source = this.sources.get(emitter);

        if (!source) {
            source = new Object({
                emitter: emitter,
                messages: {},
                handler: message => this.handle(message, emitter),
                off: emitter.off,
                on: emitter.on,
                once: emitter.once,
            });

            emitter.off = this.off;
            emitter.on = this.on;
            emitter.once = this.once;

            this.sources.set(emitter, source);
        }

        if (!(messageIn in source.messages)) {
            source.messages[messageIn] = {
                messageIn: messageIn,
                messageOut: messageOut ? messageOut : messageIn,
            };

            Reflect.apply(source.on, source.emitter, [messageIn, source.handler]);
        }

        return this;
    }

    unroute(emitter, messageName) {
        let source = this.sources.get(emitter);

        if (source) {
            delete source.messages[messageName];
        }

        return this;
    }
});
