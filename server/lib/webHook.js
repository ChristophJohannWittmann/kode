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
 * A hook is a one-use pseudo resource generally used for special purposes. For
 * instance, we need a HookResource when performing ACME certification.  It can
 * also be used with designated single purpose dynamic links.  For instance, if
 * a user is provided an application URL, that URL can be a hook with a special
 * one-time purpose.  Keep in mind that hooks disappear after their one-time use
 * or after they expire.
*****/
register(class HookResource {
    static nextHookId = 1;

    static init = (() => {
        Ipc.on('#HookResource.Accept', async message => {
            if (message.hookId && message.url in ResourceLibrary.urls) {
                let hook = ResourceLibrary.urls[message.url].reference.hook;

                if (!hook.isStub) {
                    let response = await hook.accept(message.requestInfo);
                    Message.reply(message, response);
                }
            }
        });

        Ipc.on('#HookResource.Clear', async message => {
            if (message.hookId && message.url in ResourceLibrary.urls) {
                let hook = ResourceLibrary.urls[message.url].reference.hook;

                if (hook.stub) {
                    ResourceLibrary.deregister(message.url);
                }
            }
        });

        Ipc.on('#HookResource.Set', async message => {
            if (message.hook.hookId && !(message.url in ResourceLibrary.urls)) {
                if (message.hook.procId != PROC.pid) {
                    mkHookResource(message.hook.url, message.hook);
                }
            }
        });
    })();

    constructor(url, hook) {
        this.url = url;
        this.timeout = null;
        this.tlsMode = 'best';
        this.milliseconds = 0;
        this.category = 'hook';
        this.makePromise();

        if (typeof hook == 'object') {
            this.stub = true;
            this.procId = hook.procId;
            this.hookId = hook.hookId;
            this.workerId = hook.workerId;
            this.responder = async () => ({ status: 200, mime: 'text/plain', headers: {}, content: '' });
        }
        else {
            this.stub = false;
            this.procId = PROC.pid;
            this.hookId = `${PROC.pid}.${HookResource.nextHookId++}`;
            this.workerId = CLUSTER.worker.id;

            if (typeof hook == 'function') {
                var responder = hook;
            }
            else {
                var responder = async () => ({ status: 200, mime: 'text/plain', headers: {}, content: '' });
            }

            Ipc.sendWorkers({
                messageName: '#HookResource.Set',
                hook: this,
            });

            this.responder = responder;
        }

        if (!(this.url in ResourceLibrary.urls)) {
            ResourceLibrary.register(kodeModule, {
                url: url,
                hook: this,
            });
        }
    }

    async accept(requestInfo) {
        if (this.stub) {
            let response = await Ipc.queryWorker(this.workerId, {
                messageName: '#HookResource.Accept',
                url: this.url,
                procId: this.procId,
                hookId: this.hookId,
                requestInfo: requestInfo,
            });

            return response;
        }
        else {
            this.clearTimeout();
            let response = await this.responder(requestInfo);
            this.trigger(response);            
            return response;
        }
    }

    clear() {
        if (!this.stub) {
            this.clearTimeout();

            Ipc.sendWorkers({
                messageName: '#HookResource.Clear',
                url: this.url,
                procId: this.procId,
                hookId: this.hookId,
            });

            ResourceLibrary.deregister(this.url);
            this.trigger();
        }
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        return this;
    }

    keepPromise() {
        return this.promise;
    }

    makePromise() {
        this.promise = new Promise((ok, fail) => {
            this.trigger = value => {
                ok(value);
                this.makePromise();
            }
        });
    }

    setTlsMode(mode) {
        switch (mode) {
            case 'best':
            case 'none':
            case 'must':
                this.tlsMode = mode;
                break;
        }

        return this;
    }

    setTimeout(milliseconds) {
        if (this.timeout) {
            this.clearTimeout();
        }

        this.timeout = setTimeout(() => {
            this.clear();
        }, milliseconds);

        return this;
    }
});
