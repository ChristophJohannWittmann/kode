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
 * The base class for all of the servers that are implemented with the framework.
 * In essence, the ServerBase class provides features that are common to both
 * the priminary process server and the worker process server.  The basic set
 * of features related to (1) providing configuration and network data, (2) 
 * performing basic crypto functions, and (3) ensuring that all primary and
 * worker server objects are emitters.
*****/
register(class ServerBase extends Emitter {
    constructor(config, serverName) {
        super();
        this.config = config;
        this.serverName = serverName;
        this.network = Config.network[this.config.network];
    }
  
    crypto() {
        const tls = this.network.tls;

        if (tls) {
            if (tls.publicKey) {
                if (tls.privateKey) {
                    if (tls.cert) {
                        return tls;
                    }
                }
            }
        }

        return false;
    }

    getAddress() {
        return this.network.address ? this.network.address : '0.0.0.0';
    }

    getDomain() {
        return this.network.domain ? this.network.domain : '';
    }

    getHost() {
        return this.network.host ? this.network.host : '';
    }

    getName() {
        return this.config.name ? this.config.name : '';
    }

    getNetworkName() {
        return this.config.network ? this.config.network : '';
    }

    getPort() {
        return this.config.port ? this.config.port : 0;
    }

    getType() {
        return this.config.type ? this.config.type : '';
    }
});


/*****
 * The standard server model is employed.  There's a listener on the specified
 * port awaiting an incoming connection.  The incoming socket is then passed
 * off to a free worker.  That worker performs its task and then notifies the
 * server that it's ready to start working on another incoming connection.  Note
 * that the HTTP server doesn't really use any of this code.  It uses the builtin
 * HTTP module, to implement the server in a different way.
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
            delete this.used[worker.id];
            this.free.push(worker);
        }

        async onWorkerGone(worker) {
            if (CLUSTER.workers[worker.id]) {
                if (worker.id in this.used) {
                    delete this.used[worker.id];
                }
                else {
                    for (let i = 0; i < this.free.length; i++) {
                        if (this.free[i].id == worker.id) {
                            this.free.splice(i, 0);
                            break;
                        }
                    }
                }
            }
            else {
                let platformEnv = { KODE_SERVER_NAME: this.serverName };
                let replacementWorker = CLUSTER.fork(platformEnv);
                replacementWorker.on('online', worker => this.onWorkerOnline(worker));
                replacementWorker.on('disconnect', () => this.onWorkerGone(replacementWorker));
                replacementWorker.on('exit', () => this.onWorkerGone(replacementWorker));
            }
        }

        async onWorkerOnline(worker) {
            this.free.push(worker);
        }

        async start() {
            return new Promise(async (ok, fail) => {
                if (!this.server || this.server.listening()) {
                    this.listen();
                }

                let i;
                let started = 0;
                let count = this.config.workers - this.free.length - Object.keys(this.used).length;
                let platformEnv = { KODE_SERVER_NAME: this.serverName };

                Ipc.on(`#ServerWorkerStarted:${this.serverName}`, message => {
                    if (++started >= count) {
                        ok();
                    }
                });

                for (i = 0; i < count; i++) {
                    let worker = CLUSTER.fork(platformEnv);
                    worker.on('online', worker => this.onWorkerOnline(worker));
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
 * The standard worker algorthm is to accept a socket from the primary process
 * and take over from there.  The work is responsible for managing all of the
 * server-side protocol, interpretation of incoming requests, and for repsond to
 * those requests according to the specified protocol.  Most servers will be
 * implemented using a protocol class, whose purpose is to interpret and manage
 * incoming data.
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
