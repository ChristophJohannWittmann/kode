/*****
 * Copyright (c) 2017-2023 Kode Programming
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
 * A singleton class used for selecting and manipulating UserObjects, which
 * are extensions of the DboUser wrapper class.  The select functions simplify
 * DBMS operations since searching and selecting may be complex and required
 * in multiple back-end coponents of the server framework.
*****/
singleton(class Users {
    constructor() {
    }

    async authenticate(dbc, userName, password) {
        let email = await selectOneDboEmailAddress(dbc, `_addr=${dbc.str(dbText, userName)}`);

        if (email && email.ownerType == 'DboUser') {
            let user = await getDboUser(dbc, email.ownerOid);

            if (user) {
                if (user.status == 'active') {
                    let orgOk = user.orgOid == 0n;

                    if (!orgOk) {
                        let org = await getDboOrg(dbc, user.orgOid);

                        if (org instanceof DboOrg) {
                            if (org.status == 'active') {
                                orgOk = true;
                            }
                        }
                    }

                    if (orgOk) {
                        if (user.failures < 5) {
                            let credentials = await selectOneDboCredentials(dbc, `_user_oid=${user.oid} AND _type='password' AND _status='current'`)

                            if (credentials) {
                                let crypto = await Crypto.digestUnsalted('sha512', `${user.oid}${password}${user.oid}`);

                                if (crypto == credentials.crypto) {
                                    user.failures = 0;
                                    await user.save(dbc);

                                    await mkDboUserLog({
                                        userOid: user.oid,
                                        activity: 'signin',
                                        info: 'ok',
                                    }).save(dbc);

                                    return user;
                                }
                            }

                            await mkDboUserLog({
                                userOid: user.oid,
                                activity: 'signin',
                                info: 'failed.password',
                            }).save(dbc);
                        }
                        else {
                            await mkDboUserLog({
                                userOid: user.oid,
                                activity: 'signin',
                                info: 'failed.too-many-attempts',
                            }).save(dbc);
                        }

                        user.failures++;
                        await user.save(dbc);
                    }
                    else {
                        await mkDboUserLog({
                            userOid: user.oid,
                            activity: 'signin',
                            info: 'failed.org-inactive',
                        }).save(dbc);
                    }
                }
                else {
                    await mkDboUserLog({
                        userOid: user.oid,
                        activity: 'signin',
                        info: 'failed.user-inactive',
                    }).save(dbc);
                }
            }
        }

        return false;
    }

    async createUser(dbc, userData) {
        if (!userData.email.trim()) {
            return { ok: false, feedback: 'fwUserEditorNoEmail' };
        }

        if (!userData.firstName.trim() || !userData.lastName.trim()) {
            return { ok: false, feedback: 'fwUserEditorNoName' };
        }

        let user = mkDboUser(userData);
        let email = await EmailAddresses.ensureFromAddr(dbc, userData.email);

        if (email.ownerOid > 0n) {
            return { ok: false, feedback: 'fwUserEditorEmailInUse' };
        }

        user.emailOid = email.oid;
        await user.save(dbc);

        if (user.oid > 0n) {
            email.ownerType = 'DboUser';
            email.ownerOid = user.oid;
            await email.save(dbc);

            await mkDboUserLog({
                userOid: user.oid,
                activity: 'user-create',
                info: 'ok',
            }).save(dbc);
        }

        return { ok: true, userOid: user.oid };
    }

    async get(dbc, oid) {
        return mkUserObject(await getDboUser(dbc, oid));
    }

    async getEmail(dbc, oid) {
        return await selectOneDboEmailAddress(dbc, `_owner_type='DboUser' AND _owner_oid=${oid}`);
    }

    async getUserData(dbc, oid) {
        let dboUser = await getDboUser(dbc, oid);

        if (dboUser) {
            let userData = Object.assign(new Object(), dboUser);
            let emailAddr = await getDboEmailAddress(dbc, userData.emailOid);
            userData.email = emailAddr.addr;
            userData.emailOid = emailAddr.oid;
            userData.phones = await selectDboPhone(dbc, `_owner_type='DboUser' AND _owner_oid=${userData.oid}`);
            userData.addresses = await selectDboAddress(dbc, `_owner_type='DboUser' AND _owner_oid=${userData.oid}`);
            userData.altEmails = await selectDboEmailAddress(dbc, `_owner_type='DboUser' AND _owner_oid=${userData.oid} AND _oid <> ${userData.emailOid}`);
            return userData;
        }

        return null;
    }

    async modifyUser(dbc, userData) {
    }

    async search(dbc, pattern, orgOid) {
        pattern = pattern.indexOf('*') >= 0 ? '' : pattern.trim();

        try {
            return (await dbc.query(`
                SELECT u._oid AS "oid", u._first_name AS "firstName", u._last_name AS "lastName", e._addr as "email"
                FROM _user u
                JOIN _email_address e
                ON u._email_oid = e._oid
                WHERE u._org_oid = ${orgOid}
                AND (u._first_name ~* '${pattern}'
                OR u._last_name ~* '${pattern}'
                OR e._addr ~* '${pattern}')
            `)).data;
        }
        catch (e) {
            return [];
        }
    }

    async selectByEmail(dbc, email, orgOid) {
        let dboEmailAddress = await selectOneDboEmailAddress(dbc, `_addr ~* ${dbc.str(dbText, email)} AND _org_oid = ${orgOid}`);

        if (dboEmailAddress && dboEmailAddress.ownerType == 'DboUser') {
            let user = await getDboUser(dbc, dboEmailAddress.ownerOid);

            if (user && user.status == 'active') {
                return mkUserObject(user);
            }
        }

        return null;
    }

    async selectByName(dbc, firstName, lastName, orgOid) {
        let selected = [];

        if (firstName) {
            if (lastName) {
                return await selectDboUser(dbc, `_first_name ~* ${dbc.str(dbText, firstName)} AND _last_name ~* ${dbc.str(dbText, lastName)}} AND _org_oid = ${orgOid}`);
            }
            else {
                return await selectDboUser(dbc, `_first_name ~* ${dbc.str(dbText, firstName)} AND _org_oid = ${orgOid}`);
            }
        }
        else if (lastName) {
            return await selectDboUser(dbc, `_last_name ~* ${dbc.str(dbText, lastName)} AND _org_oid = ${orgOid}`);
        }

        return selected.map(user => mkUserObject(user));
    }
});


/*****
 * The UserObject is an extension of the DboUser class, which is a wrapper for
 * DBMS user records.  These functions encapsulate the manipulation of user data
 * in a single class.  User objects extend their features to include supporting
 * DBMS objects: credentials, grants, addresses, emails, and phone numbers.
*****/
register(class UserObject extends DboUser {
    constructor(properties) {
        super(properties);
    }

    async activate() {
        this.status = 'active';
        return this;
    }

    async checkPasswordHistory() {
        // ********************************************************
        // -- TODO --
        // ********************************************************
        return true;
    }

    async clearGrant(dbc, grant) {
        // ********************************************************
        // -- TODO --
        // ********************************************************
        return true;
    }

    async credentials(dbc) {
        return await selectOneDboCredentials(dbc, `_user_oid=${this.oid} AND _status='current'`);
    }

    async deactivate() {
        this.status = 'inactive';
        return this;
    }

    async getEmails(dbc) {
        return await selectDboEmail(dbc, `_owner_type='DboUser' AND _owner_oid=${this.oid}`);
    }

    async getGrants(dbc) {
        return await selectDboGrant(dbc, `_user_oid=${this.oid}`);
    }

    async getHistory(dbc, data0, date1) {
        if (date0) {
            return (await selectDboUserLog(dbc, `_user_oid=${this.oid} AND _created BETWEEN '${date0.isoStr()}' AND '${date1.isoStr()}'`), `_created DESC`);
        }
        else {
            return (await selectDboUserLog(dbc, `_user_oid=${this.oid}`), `_created DESC`);
        }
    }

    async getPhones(dbc) {
        return await selectDboPhone(dbc, `_owner_type='DboUser' AND _owner_oid=${this.oid}`);
    }

    async getPrimaryEmail(dbc) {
        return await selectOneDboUser(dbc, `_owner_type='DboUser' AND _owner_oid=${this.oid}`);
    }

    async sendEmail(dbc, email) {
        // ********************************************************
        // -- TODO --
        // ********************************************************
        return this;
    }

    async sendMMS(dbc, mms) {
        // ********************************************************
        // -- TODO --
        // ********************************************************
        return this;
    }

    async setGrant(dbc, grant) {
        let context = mkContext(grant);

        if (!(await selectOneDboGrant(dbc, `_context='${context.toBase64()}'`))) {
            await mkDboGrant({
                userOid: this.oid,
                context: context.toBase64(),
            }).save(dbc);
        }
    }

    async setPassword(dbc, password) {
        let current = await selectOneDboCredentials(
            dbc,
            `_user_oid=${this.oid} AND _type='password' AND _status='current'`
        );

        if (current) {
            current.status = 'halted';
            await current.save(dbc);
        }

        let creds = await mkDboCredentials({
            userOid: this.oid,
            type: 'password',
            status: 'current',
            crypto: await Crypto.digestUnsalted('sha512', `${this.oid}${password}${this.oid}`),
            expires: mkTime(),
        }).save(dbc);

        return this;
    }

    async zombify() {
        this.status = 'zombie';
        return this;
    }
});