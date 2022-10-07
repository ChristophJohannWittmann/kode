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
class Session {
    constructor(id) {
        this.id = id;
        this.state = 'unauth';
    }

    async upgrade(user) {
        this.state = 'anon'
        this.org = null;
        this.user = null;
        this.grants = {};
    }
}


/*****
*****/
singleton(class Sentinel extends Daemon {
    constructor() {
        super();
        this.sessions = {};
        this.expiring = [];
        
        this.permissions = mkSet(
            'sys',
            'user',
        );
    }
    /*
    async onAddPermissions(message) {
        for (let permission of message.permissions.array()) {
            this.permissions.set(permission);
        }

        Message.reply(message, 'ok');
    }
    */

    async onAuthenticate(message) {
    }

    async onAuthorize(message) {
    }

    async onCloseSession(message) {
    }

    async onCreateSession(message) {
        let id = await Crypto.digestUnsalted('sha256', (new Date()).toString());

        while (id in this.sessions) {
            id = await Crypto.digestUnsalted('sha256', (new Date()).toString());
        }

        let session = new Session(id);
        Message.reply(message, session.id);
    }

    async onListPermissions(message) {
        Message.reply(message, this.permissions);
    }

    async onTouchSession(message) {
    }
});
