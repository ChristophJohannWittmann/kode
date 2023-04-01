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
 * A session is used for associated a single user endpoint with a server user
 * context.  The server context is always a webx or an extension of a webx.  The
 * first reason for developing the session was to support web applcations, which
 * are web extensions.  A session can also be associated with another endpoint
 * that's a host that's not on a client application.
*****/
register(class Session {
    constructor(user, idleMinutes) {
        return new Promise(async (ok, fail) => {
            this.timeout = null;
            this.workerId = 0;
            this.socketId = false;
            this.user = mkUser(user);
            this.idleMinutes = idleMinutes;
            this.pendingMessages = [];
            this.dbc = await dbConnect();

            this.verificationCode = '';
            this.verificationTime = null;
            this.verificationTimeout = null;

            let seed = `${(new Date()).toString()}${this.user.userName}`;
            this.key = await Crypto.digestUnsalted('sha512', `${seed}${Math.random()}`);

            while (this.key in SessionManager.byKey) {
                this.key = await Crypto.digestUnsalted('sha512', `${seed}${Math.random()}`);
            }

            this.orgOid = this.user.orgOid;
            this.grants = await this.user.getGrants(this.dbc);
            this.grants.setPermission('self');

            await this.dbc.rollback();
            await this.dbc.free();
            delete this.dbc;

            ok(this);
        });
    }

    async authorize(permission) {
        return { granted: this.grants.hasPermission(permission), user: this.user };
    }

    clearVerificationCode() {
        this.verificationCode = '';
        return this;
    }

    clearSocket() {
        this.socketId = false;
        return this;
    }

    async close() {
        if (this.timeout) {
            clearInterval(this.timeout);
        }

        SessionManager.removeSession(this);
    }

    async createVerificationCode(length, milliseconds) {
        let digits = [];
        this.verificationCode = '';

        if (this.verificationTimeout) {
            clearTimeout(this.verificationTimeout);
            this.verificationTimeout = null;
        }

        for (let i = 0; i < length; i++) {
            digits.push(Crypto.random(0, 9));
        }

        digits = digits.join('');
        this.verificationTime = mkTime().toISOString();
        this.verificationCode = await Crypto.digestUnsalted('sha512', `${digits}${this.key}${this.verificationTime}`);

        this.verificationTimeout = setTimeout(() => {
            this.verificationCode = '';
            this.verificationTime = null;
            this.verificationTimeout = null;
        }, milliseconds);

        return digits;
    }

    getGrants() {
        let scrubbed = clone(this.grants.getPermissions());
        delete scrubbed.self;
        return scrubbed;
    }

    hasSocket() {
        return this.socketId !== false;
    }

    queue(message) {
        this.pendingMessages.push(message);
    }

    setOrgOid(orgOid) {
        if (this.user.orgOid == 0n) {
            if (typeof message.orgOid == 'bigint' && this.orgOid != message.orgOid) {
                this.orgOid = message.orgOid;
                return true;
            }
        }

        return false;
    }

    setSocket(webSocketId, workerId) {
        this.socketId = webSocketId;
        this.workerId = workerId;
        return this;
    }

    sweep() {
        if (this.pendingMessages.length) {
            let pendingMessages = this.pendingMessages;
            this.pendingMessages = [];
            return pendingMessages;
        }

        return this.pendingMessages;
    }

    touch() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => this.close(), this.idleMinutes*60*1000);
    }

    async validateVerificationCode(code) {
        let validated = code == this.verificationCode;

        if (this.verificationTimeout) {
            clearTimeout(this.verificationTimeout);
            this.verificationTimeout = null;
        }

        this.verificationCode = '';
        this.verificationTime = null;

        return validated;
    }

    async validateVerificationDigits(digits) {
        if (typeof digits == 'string' && this.verificationCode) {
            let hash = await Crypto.digestUnsalted('sha512', `${digits}${this.key}${this.verificationTime}`);

            if (hash === this.verificationCode) {
                return this.verificationCode;
            }
        }

        return false;
    }

    webSocketId() {
        return this.webSocketId;
    }
});