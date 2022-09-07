/**
 */


/**
 */
$(class $Http {
    static _converters = {
        'application/json': rsp=>$fromJson(rsp),
    };

    constructor() {
        this._session = `${SESSION}`;
    }
  
    async get(path) {
        let url = `${path}?SESSION=${this._session}`;
        return await this.request('GET', url, undefined, 'application/json');
    }
  
    async post(message) {
        if (!(message instanceof Cls$Message)) {
            message = $Message(message);
        }

        let url = $Window().location().href;
        message.$sessionId = this._session;
        let json = $toJson(message);
        return $Message((await this.request('POST', url, json, 'application/json')).data.reply);
    }
  
    request(method, url, body, mime) {
        return new Promise((ok, fail) => {
            let req = new XMLHttpRequest();
      
            req.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (req.status >= 200 && req.status < 300) {
                        let contentType = req.getResponseHeader('content-type');
                        
                        if (contentType in $Http._converters) {
                            ok({mime: contentType, data: $Http._converters[contentType](req.response)});
                        }
                        else {
                            ok({mime: contentType, data: req.response});
                        }
                    }
                    else {
                        ok(this);
                    }
                }
            };
      
            req.open(method, url, true);
            req.setRequestHeader('content-type', mime);
            req.send(body);
        });
    }
});


/**
 */
$(class $WebSocket {
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
});
