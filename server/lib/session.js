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
register(class Session {
    constructor(userObj) {
        return new Promise(async (ok, fail) => {
            /*
            this.contexts = {};
            this.webSocket = null;

            for (let context of await Ipc.queryPrimary({ 'messageName': '#SecurityManagerListContexts' })) {
                this.contexts[context.contextName] = unset();
            }

            user === false ? await this.loadBootstrapUser() : await this.loadUser(user);
            let seed = `${(new Date()).toString()}${this.user.userName}`;
            this.key = await Crypto.digestUnsalted('sha512', `${seed}${Math.random()}`);

            while (this.key in SessionManager.byKey) {
                this.key = await Crypto.digestUnsalted('sha512', `${seed}${Math.random()}`);
            }
            */

            ok(this);
        });
    }

    async close() {
        /*
        if (this.webSocket) {
            this.webSocket.sendClient({
                messageName: '#CloseSession'
            });

            await this.webSocket.close();
            Sessions.removeSession(this);
        }
        */
    }

    setSecurityContext(contextName, value) {
        this.contexts[contextName] = value;
        return this;
    }

    touch() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => this.close(), Config.sessionIdle*60*1000);
    }
});