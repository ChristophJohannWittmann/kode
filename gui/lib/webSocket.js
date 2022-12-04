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
register(class Websocket extends Emitter {
    constructor(url) {
        super();
        this.ws = null;
        this.pending = [];
        this.awaiting = {};

        if (url.indexOf('https:') == 0) {
            this.url = url.replace('https', 'wss');
        }
        else if (url.indexOf('http:') == 0) {
            this.url = url.replace('http', 'ws');
        }
        else {
            this.url = url;
        }

        setInterval(() => {
            if (this.ws) {
                this.sendServer({ messageName: '#Ping' });
            }
        }, 20000);
    }

    close() {
        if (this.ws && this.ws.readystate == 1) {
            this.ws.close();
        }
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = event => this.sendPending();
        this.ws.onerror = error => this.ws = null;
        this.ws.onclose = () => this.ws = null;
        this.ws.onmessage = event => this.onMessage(fromJson(event.data));
    }

    onMessage(message) {
        if (message.messageName == '#Ping') {
            this.sendMessage({ messageName: '#Pong' });
        }
        else if ('#Trap' in message) {
            let trapId = message['#Trap'];
            delete this.awaiting[trapId];
            Trap.pushReply(trapId, message);
        }
        else {
            this.send(message);
        }
    }

    queryServer(message) {
        let trap = mkTrap();
        Trap.setExpected(trap, 1);
        message['#Trap'] = trap.id;
        message['#Session'] = webAppSettings.session();

        if (message instanceof Message) {
            this.pending.push(message);
        }
        else {
            this.pending.push(mkMessage(message));
        }

        this.awaiting[trap.id] = trap;
        this.sendPending();
        return trap.promise;
    }

    sendServer(message) {
        message['#Session'] = webAppSettings.session();

        if (message instanceof Message) {
            this.pending.push(message);
        }
        else {
            this.pending.push(mkMessage(message));
        }

        this.sendPending();
    }

    sendPending() {
        if (!this.ws) {
            this.connect();
        }
        else {
            while (this.pending.length) {
                this.ws.send(toJson(this.pending.shift()));
            }
        }
    }
});
