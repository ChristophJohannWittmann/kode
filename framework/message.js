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
register(class Emitter {
    constructor() {
        this.handlers = {};
    }
  
    length(messageName) {
        if (messageName in this.handlers) {
            return Object.keys(this.handlers[messageName]).length;
        }
  
        return 0;
    }

    off(messageName, func) {
        (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
            let handler = this.handlers[messageName];
            
            if (handler && handler.map.has(func)) {
                for (let i = 0; i < handler.thunks.length; i++) {
                    let thunk = handler.thunks[i];
                    
                    if (Object.is(func, thunk.func)) {
                        handler.thunks.splice(i, 1);
                        break;
                    }
                }
                
                handler.map.delete(func);
            }
        });
    }

    on(messageName, func, filter) {
        (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
            if (messageName in this.handlers) {
                var handler = this.handlers[messageName];
            }
            else {
                var handler = { map: new WeakMap(), thunks: [] };
                this.handlers[messageName] = handler;
            }
            
            if (!handler.map.has(func)) {
                let thunk = {func: func, once: false, filter: filter ? filter : false };
                handler.thunks.push(thunk);
                handler.map.set(func, thunk);
            }
        });
    }

    once(messageName, func, filter) {
        (Array.isArray(messageName) ? messageName : [messageName]).forEach(messageName => {
            if (messageName in this.handlers) {
                var handler = this.handlers[messageName];
            }
            else {
                var handler = { map: new WeakMap(), thunks: [] };
                this.handlers[messageName] = handler;
            }
            
            if (!handler.map.has(func)) {
                let thunk = {func: func, once: true, filter: filter ? filter : false };
                handler.thunks.push(thunk);
                handler.map.set(func, thunk);
            }
        });
    }

    query(message) {
        if (!(message instanceof Message)) {
            message = mkMessage(message);
        }

        let trap = mkTrap();
        message['#Trap'] = trap.id;
        this.send(message);
        return trap.promise;
    }

    send(message) {
        if (!(message instanceof Message)) {
            message = mkMessage(message);
        }

        if (message.messageName in this.handlers) {
            let handler = this.handlers[message.messageName];
            let thunks = handler.thunks;
            handler.thunks = [];
  
            if ('#Trap' in message) {
                Trap.setExpected(message['#Trap'], thunks.length);
            }

            thunks.forEach(thunk => {
                if (typeof thunk.filter != 'function' || thunk.filter(message)) {
                    thunk.func(message);
                }
                
                if (!thunk.once) {
                    handler.thunks.push(thunk);
                }
            });
        }
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
  
    static pushReply(trapId, reply) {
        if (trapId && trapId in Trap.traps) {
            let trap = Trap.traps[trapId];
            trap.replies.push(reply);
  
            if (trap.replies.length == trap.expected) {
                trap.done();
            }
        }
    }
  
    static setExpected(id, expected) {
        let trap = Trap.traps[id];
  
        if (trap) {
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
