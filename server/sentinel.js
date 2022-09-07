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
if (CLUSTER.isPrimary)  {
    /*
    class Authenticator {
        static authenticateConfig() {
        }
        
        static authenticateDBMS() {
        }
    }
    
    register(class Session {
        static _sessionsById = {};
        static _sessionsByUser = {};
        static _nextSessionNumber = 1;
        static _setable = ['orgId', 'language'];
        static _getable = ['orgId', 'user', 'language'];
    
        constructor() {
            return new Promise(async (ok, fail) => {
                if (Config.debug) {
                    this._id = 'debug-mode';
                }
                else {
                    let seed = toJson({
                        now: Date(),
                        sessionNumber: $Session._nextSessionNumber++,
                        random: Cls$Crypto.random(-1000000000, 1000000000)
                    });
                    
                    this._id = (await Cls$Crypto.digest('sha512', seed, true)).hash;
                }
            
                this._user = null;
                this._language = $Config.language;
                this._pendingMessages = [];
                this._signInTimeout = null;
                this._signInInactive = $Config.application.session.signInMinutes * 60 * 1000;
                $Session._sessionsById[this._id] = this;
                ok(this);
            });
        }
      
        authorize(authorizations) {
            return 'success';
        }
      
        _computeAuthorizations() {
        }
        
        id() {
            return this._id;
        }
      
        language(language) {
            if (language) {
                this._language = language;
                return this;
            }
            else {
                return this._language;
            }
        }
        
        orgId(orgId) {
            if (typeof orgId == 'number') {
                if (this._user) {
                    if (orgId in this._user.orgIds) {
                        this._orgId = orgId;
                        return this;
                    }
                }
            }
            else {
                return this._orgId;
            }
        }
      
        queue(message) {
        }
        
        static retrieve(sessionId) {
            if (sessionId in $Session._sessionsById) {
                return $Session._sessionsById[sessionId];
            }
        }
        
        signInInactive() {
            return this._signInInactive;
        }
        
        async signInKey(username, key) {
        }
        
        async signInPassword(username, password) {
        }
        
        async signOut() {
        }
        
        user() {
            return this._user;
        }
    });
    
    Cls$Ipc.on('$Authorize', async message => {
        if (message.sessionId) {
            let session = Cls$Session.retrieve(message.sessionId);

            if (session) {
                message.$reply(session.authorize(message.authorizations));
            }
            else {
                message.$reply(false);
            }
        }
        else {
            message.$reply(message.authorizations.length() == 0);
        }
    });
    
    Cls$Ipc.on('$CloseSession', async message => {
    });
    
    Cls$Ipc.on('$CreateSession', async message => {
        message.$reply((await $Session()).id());
    });
    
    Cls$Ipc.on('$GetSession', async message => {
        if (message.sessionId) {
            let session = Cls$Session.retrieve(message.sessionId);
            
            if (session) {
                let shared = {};
               
                Cls$Session._getable.forEach(propertyName => {
                    shared[propertyName] = session[`_$propertyName`];
                });
          
                message.$reply(shared);
            }
            else {
                message.$reply(null);
            }
        }
    });
    
    Cls$Ipc.on('$SetSession', async message => {
        if (message.sessionId) {
            let session = Cls$Session.retrieve(message.sessionId);
            
            if (session) {
                $Session._setable.forEach(propertyName => {
                    if (propertyName in message) {
                        session[propertyName](messsage[property]);
                    }
                });
            }
        }
    });
    
    Cls$Ipc.on('$SignInWithKey', async message => {
    });
    
    Cls$Ipc.on('$SignInWithPassword', async message => {
    });
    
    Cls$Ipc.on('$SignOut', async message => {
    });
    
    Cls$Ipc.on('$TouchSession', async message => {
    });
    */
}
