/*****
 * Copyright (c) 2017-2023 Kode Programming
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
 * This is a version of the WebLibrary that's implemented as a server Daemon.
 * Its purpose is NOT for general-purpose content.  It's for dynamic content
 * that is temporarily made available and is easily monitored to see when that
 * content has been requested.  It was originally needed for the ACME protocol.
 * It was then expanded into a general-purpose feature of the server.
*****/
singleton(class WebLibrary extends Daemon {
    constructor() {
        super();
        this.urls = {};
        this.wait = {};
    }

    async onDeregister(message) {
        if (message.url in this.urls) {
            delete this.urls[message.url];
        }

        Message.reply(message, true);
    }
    
    async onGet(message) {
        if (message.url in this.urls) {
            let item = this.urls[message.url];
            Message.reply(message, item);

            if (item.url in this.wait) {
                for (let trigger of this.wait[item.url]) {
                    trigger();
                }

                delete this.wait[item.url];
            }
        }
        else {
            Message.reply(message, null);
        }
    }
    
    async onRegister(message) {
        if (!(message.url in this.urls)) {
            this.urls[message.url] = {
                url: message.url,
                mime: message.mime,
                blob: message.blob,
                tlsMode: message.tlsMode,
            };

            Message.reply(message, message.url);
        }
        else {
            Message.reply(message, false);
        }
    }

    onWait(message) {
        if (message.url in this.urls) {
            if (message.url in this.wait) {
                this.wait[message.url].push(() => Message.reply(message, true));
            }
            else {
                this.wait[message.url] = [() => Message.reply(message, true)];
            }
        }
        else {
            Message.reply(message, true);
        }
    }
});
