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
*****/
if (!CLUSTER.isPrimary) {
    singleton(class Worker {
        constructor() {
            this.running = false;

            for (let messageName of [
                '#Pause',
                '#Start',
            ]) {
                Ipc.on(messageName, async message => {
                    await this[`on${messageName.substr(1)}`]();
                    Message.reply(message, true);
                });
            }
        }

        async onPause(message) {
            if (this.running) {
                this.running = false;
            }
        }

        async onStart(message) {
            if (!this.running) {
                this.running = true;
            }
        }
    });
}


/*****
*****/
if (CLUSTER.isPrimary) {
    singleton(class Workers {
        constructor() {
            this.workers = {};
            this.daemons = {};
            CLUSTER.on('disconnect', worker => this.onDisconnect(worker));
            CLUSTER.on('exit', (worker, code, signal) => this.onDisconnect(worker, code, signal));
            CLUSTER.on('listening', (worker, address) => this.onDisconnect(worker, address));
        }

        count() {
            return Object.keys(this.workers).length;
        }

        async onDisconnect(worker) {
        }

        async onExit(worker, code, signal) {
        }

        async pause(worker) {
        }

        async run(worker) {
        }

        start(count) {
            let done;
            let workers = mkSet();

            let promise = new Promise(async (ok, fail) => {
                done = () => {
                    ok();
                };
            });

            CLUSTER.on('online', worker => {
                if (workers.has(worker.id)) {
                    workers.clear(worker.id);

                    if (workers.empty()) {
                        done();
                    }
                }
            });

            for (let i = 0; i < count; i++) {
                let worker = CLUSTER.fork();
                workers.set(worker.id);
            }

            return promise;
        }

        async stop(worker) {
        }

        worker(id) {
            return CLUSTER.workers[id];
        }
    });
}
