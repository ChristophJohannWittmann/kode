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
register(class Server extends Emitter {
    static makers = {};
    static servers = [];
    static isServer = true;

    constructor(config) {
        super();
        this.config = config;
        this.network = Config.network[this.config.network];
        Server.servers.push(this);
    }

    addr() {
        return this.network.address ? this.network.address : '0.0.0.0';
    }

    port() {
        return this.network.port ? this.network.port : 0;
    }

    async shutdown() {
    }

    async start() {
        if (CLUSTER.isPrimary) {
        }
        else {
        }
    }

    async stop() {
        if (CLUSTER.isPrimary) {
        }
        else {
        }
    }
  
    tls() {
        const tls = this.config.network.tls;

        if (tls) {
            if (tls.publicKey) {
                if (tls.privateKey) {
                    if (tls.cert) {
                        if (tls.ca) {
                            return {
                                pemPublic: iface.pemPublic,
                                pemPrivate: iface.pemPrivate,
                                pemCert: iface.pemCert,
                                pemCA: iface.pemCA,
                                expires: iface.expires
                            };
                        }
                    }
                }
            }
        }
    }
}); 
