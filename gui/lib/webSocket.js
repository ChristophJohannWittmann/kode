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
register(class WSocket extends Emitter {
    constructor() {
        super();
    }
    /*
    static _socket = null;
    static _socketServerName = '';
    static _emitter = $Emitter();
    static _pendingMessages = [];

    static _auto = (() => {
        Cls$Message.on('$CloseApp', message => {
            $WebSocket.close();
        });
    })();
  
    constructor(socketServerName) {
        $WebSocket._socketServerName = socketServerName;
        return $WebSocket;
    }
  
    static close() {
        if ($WebSocket._socket && $WebSocket._socket.readyState == 1) {
            $WebSocket._socket.close();
        }
  
        return $WebSocket;
    }
  
    static connect() {
        return new Promise((ok, fail) => {
            if ($WebSocket._socketServerName in SOCKETS) {
                $WebSocket._pendingMessages.unshift({
                    messageName: '$SocketSession',
                    sessionId: SESSION
                });
                
                let socketInfo = SOCKETS[$WebSocket._socketServerName];
                let location = $Window().location();
                let url = `${location.protocol.replace('http', 'ws')}//${location.hostname}:${location.port}${location.pathname}`;
                $WebSocket._socket = new WebSocket(url);
                
                $WebSocket._socket.onopen = event => {
                    while ($WebSocket._pendingMessages.length) {
                        $WebSocket.send($WebSocket._pendingMessages.shift());
                    }
                    
                    ok($WebSocket);
                };
                
                $WebSocket._socket.onerror = error => {
                    console.log(error);
                    $WebSocket.close();
                    fail();
                };
                
                $WebSocket._socket.onclose = () => {
                    $WebSocket._socket.close();
                    $WebSocket._socket = null;
                };
                
                $WebSocket._socket.onmessage = event => $WebSocket.onMessage(event);
            }
            else {
                ok(`$WebSocket, cannot connection to unknown server: ${$WebSocket._socketServerName}`);
            }
        });
    }
  
    static off(messageName, handler, filter) {
        $WebSocket._emitter.off(messageName, handler, filter);
        return $WebSocket;
    }
  
    static on(messageName, handler, filter) {
        $WebSocket._emitter.on(messageName, handler, filter);
        return $WebSocket;
    }
  
    static once(messageName, handler, filter) {
        $WebSocket._emitter.once(messageName, handler, filter);
        return $WebSocket;
    }
  
    static async onMessage(event) {
        let message = $fromJson(event.data);
  
        if (message.messageName == '$Ping') {
            $WebSocket.send({messageName: '$Pong'});
        }
        else if (message.messageName != '$Pong') {
            if (message.messageName == '$wsReply') {
                Cls$ReturnTrap.pushReply(message.$returnTrapId, message.reply);
            }
            else if (message.$wsQuery) {
                let handlerCount = $WebSocket._emitter.lengthOf(message.messageName);

                let trap = $ReturnTrap();
                Cls$ReturnTrap.setExpected(trap.id(), handlerCount);
                let originalReturnTrapId = message.$returnTrapId;
                message.$returnTrapId = trap.id();

                $WebSocket._emitter.send(message);
                let reply = await trap.promise();

                let replyMessage = $Message({
                    messageName: '$wsReply',
                    query: message,
                    reply: reply
                });

                delete message.$webSocket;
                replyMessage.$returnTrapId = originalReturnTrapId;
                $WebSocket.send(replyMessage);
            }
            else {
                $WebSocket._emitter.send(message);
            }
        }
    }
  
    static async query(message) {
        let trap = $ReturnTrap();
        Cls$ReturnTrap.setExpected(trap.id(), 1);
        message.$returnTrapId = trap.id();
        message.$wsQuery = true;
        $WebSocket.send(message);
        return trap.promise();
    }
  
    static send(message) {
        if (!(message instanceof Cls$Message)) {
            message = $Message(message);
        }
  
        message.sessionId = SESSION;
  
        if (!('$wsQuery' in message)) {
            message.$wsQuery = false;
        }
  
        if ($WebSocket._socket && $WebSocket._socket.readyState == 1) {
            $WebSocket._socket.send($toJson(message));
        }
        else {
            $WebSocket._pendingMessages.push(message);
            $WebSocket.connect();
        }
  
        return $WebSocket;
    }
    */
});
