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
register(class ServerBase extends Emitter {
    constructor(config, serverName) {
        super();
        this.config = config;
        this.serverName = serverName;
        this.network = Config.network[this.config.network];
    }

    active() {
        return this.config.active && this.network.active ? true : false;
    }

    addr() {
        return this.network.address ? this.network.address : '0.0.0.0';
    }

    caAccount() {
        return this.network.caAccount ? this.network.caAccount : '';
    }

    caName() {
        return this.network.caName ? this.network.caName : '';
    }

    caUrl() {
        return this.network.caUrl ? this.network.caUrl : '';
    }

    domain() {
        return this.network.domain ? this.network.domain : '';
    }

    host() {
        return this.network.host ? this.network.host : '';
    }

    name() {
        return this.config.name ? this.config.name : '';
    }

    networkName() {
        return this.config.network ? this.config.network : '';
    }

    port() {
        return 0;
    }
  
    tls() {
        const tls = this.config.network.tls;

        if (tls) {
            if (tls.publicKey) {
                if (tls.privateKey) {
                    if (tls.cert) {
                        if (tls.ca) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    type() {
        return this.config.type ? this.config.type : '';
    }
});


/*****
*****/
if (CLUSTER.isPrimary) {
    register(class Server extends ServerBase {
        constructor(config, serverName) {
            super(config, serverName);
            this.free = [];
            this.used = {};
            this.network = Config.network[this.config.network];
            this.keepAlive = true;

            const filter = message => message.serverName == this.config.name;

            const handle = async (method, message) => {
                await this[method]();
                Message.reply(message, true);
            };

            Ipc.on('#ServerKill', message => handle(this.kill, message), filter);
            Ipc.on('#ServerStart', message => handle(this.start, message), filter);
            Ipc.on('#ServerStop', message => handle(this.stop, message), filter);
            Ipc.on('#ServerWorkerFree', (worker, message) => this.onWorkerFree(worker));
        }

        async kill() {
            for (let worker of this.free) {
                worker.send({ messageName: '#ServerKill' });
            }

            for (let worker of this.used) {
                worker.send({ messageName: '#ServerKill' });
            }
        }

        listen() {
            this.server = undefined;
            let options = config.options ? config.options : new Object();

            this.server = new NET.Server(options, socket => {
                socket.pause();
                let worker = this.free.shift();
                this.used.push(worker);
                Ipc.sendWorker(worker, { messageName: '#ServerRequest', '#Socket': socket });
            });

            options = new Object({
                port: this.network.port,
                host: this.network.address,
                backlog: 10,
            });

            this.server.listen(options);
        }

        async onWorkerFree(worker) {
            console.log('worker Free');
        }

        async onWorkerGone(worker) {
            console.log('worker Gone');
        }

        async start() {
            return new Promise(async (ok, fail) => {
                if (!this.server || this.server.listening()) {
                    this.listen();
                }

                let i;
                let count = this.config.workers - this.free.length - Object.keys(this.used).length;
                let env = { KODE_SERVER_NAME: this.serverName };

                const workerOnline = worker => {
                    this.free.push(worker);

                    if (i >= count) {
                        ok();
                    }
                };

                for (i = 0; i < count; i++) {
                    let worker = CLUSTER.fork(env);
                    worker.on('online', () => workerOnline(worker));
                    worker.on('disconnect', () => this.onWorkerGone(worker));
                    worker.on('exit', () => this.onWorkerGone(worker));
                }
            });
        }

        async stop() {
        }
    });
}


/*****
*****/
if (CLUSTER.isWorker) {
    register(class Server extends ServerBase {
        constructor(config, serverName) {
            super(config, serverName);
            this.socket = null;
            Ipc.on('#ServerRequest', message => this.accept(message['#Socket']));
            Ipc.on('#ServerKill', message => this.kill());
        }

        accept(socket) {
            this.socket = socket;
            this.socket.on('close', () => this.onSocketClose());
            this.socket.on('data', data => this.onSocketData(data));
            this.socket.on('error', error => this.onSocketError(error));
            this.socket.on('timeout', () => this.onSocketTimeout());
            this.socket.resume();
        }

        async kill() {
            PROC.exit(0);
        }

        async onSocketClose() {
            console.log('socket close');
            if (!this.socket.destroyed) {
                this.socket.destroy();
            }

            this.socket = null;
            Ipc.sendPrimary({ messgeName: '#ServerWorkerFree' });
        }

        async onSocketData(data) {
        }

        async onSocketError(error) {
            this.socket.destroy();
        }

        async onSocketTimeout() {
            this.socket.destroy();
        }
    });
}
