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
singleton(class SessionManager extends Daemon {
    constructor() {
        return new Promise(async (ok, fail) => {
            super();
            this.byKey = {};
            this.byUser = {};
            ok(this);
        });
    }

    addSession(session) {
        if (!(session.key in this.byKey)) {
            this.byKey[session.key] = session;
        }

        if (session.org.oid in this.byOrg) {
            this.byOrg[session.org.oid].push(session);
        }
        else {
            this.byOrg[session.org.oid] = [session];
        }

        if (session.user.oid in this.byUser) {
            this.byUser[session.user.oid].push(session);
        }
        else {
            this.byUser[session.user.oid] = [session];
        }
    }

    async onAuthorize(message) {
        if (message.session && message.session in this.byKey) {
            let authorized = await this.byKey[message.session].authorize(message.permission, message.context);
            Message.reply(message, authorized);
        }

        Message.reply(message, false);
    }

    async onCloseAllSession(message) {
    }

    async onCloseOrgSessions(message) {
    }

    async onCloseUserSessions(message) {
    }

    async onCloseSession(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];
                await session.close();
                this.removeSession(session);
                return Message.reply(message, true);
            }
        }

        Message.reply(message, false);        
    }

    async onCreateSession(message) {
        let session = await mkSession(message.user);
        this.byKey[session.key] = session;

        if (!(session.user.oid in this.byUser)) {
            this.byUser[session.user.oid] = {};
        }

        this.byUser[session.user.oid][session.key] = session;
        Message.reply(message, session.key);
    }

    async onGetOrgSessions(message) {
    }

    async onGetUserSessions(message) {
    }

    async onGetSession(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                return Message.reply(message, this.byKey[message['session']]);
            }
        }

        Message.reply(message, false);
    }

    async onNotifySessions(message) {
    }

    async onTouchSession(message) {
    }

    removeSession(session) {
        delete this.byKey[session.key];

        if (session.user.oid in this.byUser) {
            let sessions = this.byUser[session.user.oid];

            if (session.key in sessions) {
                delete sessions[session.user.oid];
            }

            if (Object.keys(sessions).length == 0) {
                delete this.byUser[session.user.oid];
            }
        }
    }
});
