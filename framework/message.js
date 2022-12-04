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
 * The Emitter exists on both the client and server platforms. The Emitter sends
 * messages to registered handlers within the local processing environment.  The
 * local processing environment means the for the current process on the current
 * server; other classes implement this feature beyond the current processes:
 * IpcEmitter, ClusterEmitter, and WebSocketEmitter.  On the client, the only
 * additional emitter class is the WebSocketEmitter.
*****/
register(class Emitter extends NonJsonable {
    constructor() {
        super();
        this.handlers = {};
        this.silent = false;
    }

    handles(messageName) {
        return messageName in this.handlers;
    }
  
    length(messageName) {
        if (messageName in this.handlers) {
            return Object.keys(this.handlers[messageName]).length;
        }
  
        return 0;
    }

    off(messageName, func) {
        if (func === undefined) {
            delete this.handlers[messageName];
        }
        else {
            if ('#HANDLER' in func) {
                (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
                    let handler = this.handlers[messageName];

                    if (handler && (func['#HANDLER'] in handler.map)) {
                        for (let i = 0; i < handler.thunks.length; i++) {
                            let thunk = handler.thunks[i];
                            
                            if (func['#HANDLER'] === thunk.func['#HANDLER']) {
                                handler.thunks.splice(i, 1);
                                break;
                            }
                        }
                        
                        delete handler.map[func['#HANDLER']];
                    }
                });
            }
        }

        return this;
    }

    on(messageName, func, filter) {
        if (!('#HANDLER' in func)) {
            func['#HANDLER'] = Symbol('handler');
        }

        (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
            if (messageName in this.handlers) {
                var handler = this.handlers[messageName];
            }
            else {
                var handler = { map: {}, thunks: [] };
                this.handlers[messageName] = handler;
            }
            
            if (!(func['#HANDLER'] in handler.map)) {
                let thunk = { func: func, once: false, filter: filter ? filter : false };
                handler.thunks.push(thunk);
                handler.map[func['#HANDLER']] = thunk;
            }
        });

        return this;
    }

    once(messageName, func, filter) {
        if (!('#HANDLER' in func)) {
            func['#HANDLER'] = Symbol('handler');
        }

        (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
            if (messageName in this.handlers) {
                var handler = this.handlers[messageName];
            }
            else {
                var handler = { map: {}, thunks: [] };
                this.handlers[messageName] = handler;
            }
            
            if (!(func['#HANDLER'] in handler.map)) {
                let thunk = { func: func, once: true, filter: filter ? filter : false };
                handler.thunks.push(thunk);
                handler.map[func['#HANDLER']] = thunk;
            }
        });

        return this;
    }

    query(message) {
        if (!(message instanceof Message)) {
            message = mkMessage(message);
        }

        let trap = mkTrap();
        message['#Trap'] = trap.id;

        if (message.messageName in this.handlers) {
            let handler = this.handlers[message.messageName];

            if (handler.thunks.length) {
                let thunks = handler.thunks;
                handler.thunks = [];
                Trap.setExpected(message['#Trap'], thunks.length);

                thunks.forEach(thunk => {
                    if (!thunk.once) {
                        handler.thunks.push(thunk);
                    }

                    if (typeof thunk.filter != 'function' || thunk.filter(message)) {
                        thunk.func(message);
                    }
                });
            }
            else {
                Trap.done(trap);
            }
        }
        else {
            Trap.done(trap);
        }

        return trap.promise;
    }

    resume() {
        this.silent = false;
        return this;
    }

    send(message) {
        if (!this.silent) {
            if (!(message instanceof Message)) {
                message = mkMessage(message);
            }

            if (message.messageName in this.handlers) {
                let handler = this.handlers[message.messageName];
                let thunks = handler.thunks;
                handler.thunks = [];

                thunks.forEach(thunk => {
                    if (!thunk.once) {
                        handler.thunks.push(thunk);
                    }

                    if (typeof thunk.filter != 'function' || thunk.filter(message)) {
                        thunk.func(message);
                    }
                });
            }
        }
    }

    silence() {
        this.silent = true;
        return this;
    }
});


/*****
 * A trap is shared across platforms and has the same functionality in all uses.
 * On all emitters, there is a send() and a query() methiod.  The query method
 * provides an async service and returns when the remote endpoint has responded
 * to the query.  The Trap class provides the features required to send the
 * message and asynchronously return a response to the caller when the reply has
 * been recieved from the remote endpoint.
*****/
register(class Trap {
    static nextId = 1;
    static traps = {};
  
    constructor() {
        this.id = Trap.nextId++;
        this.replies = [];
        this.expected = 0;
        this.pending = true;
        Trap.traps[this.id] = this;
        let self = this;
  
        this.promise = new Promise((ok, fail) => {
            const done = () => {
                delete Trap.traps[self.id];
            
                switch (self.replies.length) {
                    case 0:
                        ok(null);
                    case 1:
                        ok(self.replies[0]);
                    default:
                        ok(self.replies);
                }
            };
            
            self.done = () => done();
        });
    }

    static cancel(arg) {
        let trap;

        if (typeof arg == 'number') {
            trap = Trap.traps[arg];
        }
        else if (arg instanceof Trap && arg.id in Trap.traps) {
            trap = arg;
        }

        if (trap) {
            trap.pending = false;
            delete Trap.traps[trap.id];
        }
    }

    static done(arg) {
        let trap;

        if (typeof arg == 'number') {
            trap = Trap.traps[arg];
        }
        else if (arg instanceof Trap && arg.id in Trap.traps) {
            trap = arg;
        }

        if (trap) {
            trap.done();
            trap.pending = false;
            delete Trap.traps[trap.id];
        }
    }
  
    static pushReply(arg, reply) {
        let trap;

        if (typeof arg == 'number') {
            trap = Trap.traps[arg];
        }
        else if (arg instanceof Trap && arg.id in Trap.traps) {
            trap = arg;
        }

        if (trap && trap.pending) {
            trap.replies.push(reply);
  
            if (trap.replies.length == trap.expected) {
                trap.pending = false;
                trap.done();
            }
        }
    }
  
    static setExpected(arg, expected) {
        let trap;

        if (typeof arg == 'number') {
            trap = Trap.traps[arg];
        }
        else if (arg instanceof Trap && arg.id in Trap.traps) {
            trap = arg;
        }

        if (trap && trap.pending) {
            trap.expected = expected;
        }
    }
});


/*****
 * There's not a lot to a message.  It's an object whose properties are sent
 * from endpoint to endpoint.  Each message is individual and has a different
 * set or properties or property keys with one exception.  All messages MUST
 * have a messsageName property, which is used finding the appropriate message
 * handler.  The static reply() function is used by the remote handler to
 * reply to the sending endpoint.
*****/
register(class Message extends Jsonable {
    constructor(properties) {
        super();
        
        if (properties) {
            Object.assign(this, properties);
        }
    }
  
    static reply(message, reply) {
        if ('#Trap' in message) {
            Trap.pushReply(message['#Trap'], reply);
        }
    }
});


/*****
 * This is in effect the "global" emitter.  Each process, which is either the
 * client environment or a process on the server, has a single global emitter
 * to facility general-scoped communications within the process.
*****/
{
    const e = mkEmitter();

    global.Ignored = Symbol('#IGNORED');
    
    global.off = (messageName, handler) => {
        return e.off(messageName, handler);
    };
    
    global.on = (messageName, handler, filter) => {
        return e.on(messageName, handler, filter);
    };
    
    global.once = (messageName, handler, filter) => {
        return e.once(messageName, handler, filter);
    };
    
    global.query = message => {
        return e.query(message);
    };
    
    global.send = message => {
        return e.send(message);
    };
}
