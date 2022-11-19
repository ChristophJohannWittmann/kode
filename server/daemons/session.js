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
            this.byOrg = {};
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

    async onCloseAllSession(message) {
    }

    async onCloseOrgSessions(message) {
    }

    async onCloseUserSessions(message) {
    }

    async onCloseSession(message) {
    }

    async onCreateBootstrapSession(message) {

        let session = await mkSession(false);
        /*
        let dbc = await dbConnect();

        if (UserObj.empty(dbc)) {
            let session = mkSession();
            await session.initBootstrap();
            this.addSession(session);
            Message.reply(message, session.key);
        }
        else {
            Message.reply(message, false);
        }

        await dbc.rollback();
        await dbc.free();
        */
    }

    async onCreateSession(message) {
        /*
        let session = mkSession();
        await session.init(message.user);
        this.addSession(session);
        Message.reply(message, session.key);
        */
    }

    async onGetOrgSessions(message) {
    }

    async onGetUserSessions(message) {
    }

    async onGetSession(message) {
        if ('session' in message) {
            if (message['session'] in this.byKey) {
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
        delete this.byKey(session.key);
        let group = this.byOrg[session.org.oid];

        if (group.length > 1) {
            for (let i = 0; i < group.length; i++) {
                if (group[i].key == session.key) {
                    group.splice(i, 1);
                    break;
                }
            }
        }
        else {
            delete byOrg[session.org.oid];
        }

        group = this.byUser[session.user.oid];

        if (group.length > 1) {
            for (let i = 0; i < group.length; i++) {
                if (group[i].key == session.key) {
                    group.splice(i, 1);
                    break;
                }
            }
        }
        else {
            delete byUser[session.user.oid];
        }
    }
});
