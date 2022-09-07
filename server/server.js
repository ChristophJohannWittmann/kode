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
register(class Server {
    static servers = {};

    constructor(config) {
        this.config = config;
        this.addr = Config.interfaces[this.config.interface].address;
        Server.servers[this.config.name] = this;
    }
  
    handleRequest(socket) {
        console.log('$handleRequest(socket) -- implement!')
    }
  
    crypto() {
        let iface = $Config.interfaces[this.config.interface];
  
        if (iface.pemPublic) {
            if (iface.pemPrivate) {
                if (iface.pemCert) {
                    if (iface.pemCA) {
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
  
    static getServer(serverName) {
        return $Server.servers[serverName];
    }
  
    static getServers(type) {
        if (type) {
            return Object.values($Server.servers).filter(server => server.config.type == type);
        }
        else {
            return Object.values($Server.servers);
        }
    }
  
    interface() {
        return $Config.interfaces[this.config.interface];
    }
  
    name() {
        return this.config.name;
    }
  
    port() {
        return this.config.port;
    }
  
    property(name) {
        return this.config[name];
    }
  
    async startPrimary() {
        console.log('$Server.startPrimary() -- implement!');
    }
  
    async startWorker() {
        console.log('$Server.startWorker() -- $on() to listen for work to do!');
    }
  
    async stop() {
    }
  
    tls() {
        let iface = $Config.interfaces[this.config.interface];
  
        if (iface.pemPublic) {
            if (iface.pemPrivate) {
                if (iface.pemCert) {
                    if (iface.pemCA) {
                        return true;
                    }
                }
            }
        }
  
        return false;
    }
  
    type() {
        return this.config.type;
    }
});
