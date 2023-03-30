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
 * For security and architectural purposes, session objects exist only in the
 * primary server process.  This daemon provides theh linkage between the
 * web extension endpoints and the overall security architecture.  This daemon
 * is responsible interfacing with other server components for all aspects of
 * session management.
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

    async onAuthorize(message) {
        if (message.session && message.session in this.byKey) {
            let authorization = await this.byKey[message.session].authorize(message.permission);
            return Message.reply(message, authorization);
        }

        Message.reply(message, { granted: false, user: { oid: 0n } });
    }

    async onClearVerificationCode(message) {
        let session = this.byKey[message.session];

        if (session) {
            session.clearVerificationCode();
        }
    }

    async onClearSocket(message) {
        let session = this.byKey[message.session];

        if (session) {
            session.clearSocket();
        }
    }

    async onCloseAllSession(message) {
        // ********************************************************
        // -- TODO --
        // ********************************************************
    }

    async onCloseUserSessions(message) {
        // ********************************************************
        // -- TODO --
        // ********************************************************
    }

    async onCloseSession(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];
                await session.close();
                this.removeSession(session);
            }
        }

        Message.reply(message, true);
    }

    async onCreateSession(message) {
        let session = await mkSession(message.user, message.idleMinutes);
        this.byKey[session.key] = session;

        if (session.user.oid in this.byUser) {
            this.byUser[session.user.oid].push(session);
        }
        else {
            this.byUser[session.user.oid] = [session];
        }

        session.touch();
        Message.reply(message, session.key);
    }

    async onCreateVerificationCode(message) {
        let session = this.byKey[message.session];

        if (session) {
            Message.reply(
                message,
                await session.createVerificationCode(message.length, message.milliseconds)
            );
        }
    }

    async onGetUserSessions(message) {
        if (message.userOid in this.byUser) {
        }

        Message.reply(message, []);
    }

    async onGetSession(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];

                return Message.reply(message, {
                    user: session.user,
                    orgOid: session.orgOid,
                });
            }
        }

        Message.reply(message, false);
    }

    async onListGrants(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];
                return Message.reply(message, session.listGrants());
            }
        }

        Message.reply(message, {});
    }

    async onNotifyClient(message) {
        const notification = {
            messageName: '#NotifyClient',
            endpoint: message.endpoint.name,
            flags: message.endpoint.flags,
            permission: message.endpoint.permission ? message.endpoint.permission : '',
        };

        for (let session of Object.values(this.byKey)) {
            let authorization = await session.authorize(message.endpoint.permission);

            if (authorization.granted) {
                notification.socketId = session.socketId;

                if (session.hasSocket()) {
                    Ipc.sendWorker(session.workerId, notification);
                }
                else {
                    session.queue(notification);
                }
            }
        }
    }

    async onSetOrg(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                if (typeof message.oigOid == 'bigint') {
                    return Message.reply(message, this.byKey[message.session].setOrgOid());
                }
            }
        }

        Message.reply(message, false);
    }

    async onSetSocket(message) {
        let session = this.byKey[message.session];

        if (session) {
            session.setSocket(message.socketId, message.workerId);
        }
    }

    async onSweep(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];
                return Message.reply(message, session.sweep());
            }
        }

        Message.reply(message, []);
    }

    async onTouchSession(message) {
        if ('session' in message) {
            if (message.session in this.byKey) {
                let session = this.byKey[message.session];
                session.touch();
            }
        }

        Message.reply(message, true);
    }

    async onValidateVerificationCode(message) {
        let session = this.byKey[message.session];

        if (session) {
            Message.reply(message, await session.validateVerificationCode(message.code));
        }
    }

    async onValidateVerificationDigits(message) {
        let session = this.byKey[message.session];

        if (session) {
            Message.reply(message, await session.validateVerificationDigits(message.digits));
        }
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
