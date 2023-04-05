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
 * Provides back-end management of user-table objects, which are involved with
 * a number of complex administrative and security procedures.  This singleton
 * class provides services to create, modify, view, and analyze users.  Like
 * the org object, once a user has been added to the DBMS, the record will not
 * ever be deleted.  Users are modified and set to inactive rather than
 * deleting them.  Most of the user management processes are security intensive
 * and are thus best implemented in this back-end server object.
*****/
singleton(class Users {
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

                                    return mkUser(user);
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

        let user = mkUser(userData);
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
            await mkGrants(user).save(dbc);

            await mkDboUserLog({
                userOid: user.oid,
                activity: 'user-create',
                info: 'ok',
            }).save(dbc);
        }

        return { ok: true, userOid: user.oid };
    }

    async getEmail(dbc, oid) {
        return await selectOneDboEmailAddress(dbc, `_owner_type='DboUser' AND _owner_oid=${oid}`);
    }

    async getUser(dbc, oid) {
        return mkUser(await getDboUser(dbc, oid));
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

    async search(dbc, pattern, orgOid) {
        pattern = pattern.indexOf('*') >= 0 ? '' : pattern.trim();

        try {
            let found = (await dbc.query(`
                SELECT u._oid AS "oid", u._first_name AS "firstName", u._last_name AS "lastName", e._addr as "email"
                FROM _user u
                JOIN _email_address e
                ON u._email_oid = e._oid
                WHERE u._org_oid = ${orgOid}
                AND (u._first_name ~* '${pattern}'
                OR u._last_name ~* '${pattern}'
                OR e._addr ~* '${pattern}')
            `)).data;

            found.forEach(found => found.oid = BigInt(found.oid));
            return found;
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
                return mkUser(user);
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

        return selected.map(user => mkUser(user));
    }
});


/*****
 * An extension of the DbuUser, this class is a shadow object for managing and
 * editing a user object.  The only constructor paramter is the DboUser object
 * that's being shadowed.  This class provides for getting additional user data
 * from the DBMS and taking care of complex assignment such as setting the
 * password.
*****/
register(class User extends DboUser {
    constructor(properties) {
        super(properties);
    }

    async credentials(dbc) {
        return await selectOneDboCredentials(dbc, `_user_oid=${this.oid} AND _status='current'`);
    }

    async getEmails(dbc) {
        return await selectDboEmail(dbc, `_owner_type='DboUser' AND _owner_oid=${this.oid}`);
    }

    async getGrants(dbc) {
        return mkGrants(await selectOneDboGrants(dbc, `_user_oid=${this.oid}`));
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

    async modify(dbc, userData) {
        console.log('Users.modifyUser():  modify basis user record.')
    }

    async setGrants(dbc, modifiedGrants) {
        let grants = mkGrants(await selectOneDboGrants(dbc, `_user_oid=${this.oid}`));

        for (let modifiedGrant of Object.values(modifiedGrants)) {
            if (modifiedGrant.granted) {
                if (grants.hasPermission(modifiedGrant.permission)) {
                    grants.setContext(modifiedGrant.permission, modifiedGrant.context);
                }
                else {
                    grants.setPermission(modifiedGrant.permission, modifiedGrant.context);
                }
            }
            else {
                if (grants.hasPermission(modifiedGrant.permission)) {
                    grants.clearPermission(modifiedGrant.permission);
                }
            }
        }

        await grants.save(dbc);
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
});


/*****
 * A permission is simple a unique string indentifier.  A grant is where that
 * permission is granted to an application user.  Logically, a grant is an object
 * that specifies the grant, as shown below.  In practise, the permission must
 * also be converted to a base64 representation for internal use.
 * 
 *          { permission:"org" }
 * 
 * Additionally, a grant may contain an additional object called, the context
 * object.  The overall application frameworks handles the basic permission,
 * but if there is additional context data, that must be provides to the endpoiont
 * that will handle the request to further restrict or limit the data provided
 * by that endpooint.
*****/
register(class Grants extends DboGrants {
    constructor(arg) {
        if (arg instanceof DboGrants) {
            super(arg);
        }
        else if (arg instanceof User) {
            super({ 
                userOid: arg.oid,
                permissions: mkBuffer('{}').toString('base64'),
                context: mkBuffer('{}').toString('base64'),
            });
        }
    }

    clearContext(permission, arg) {
        if (this.hasPermission(permission)) {
            let context = fromJson(mkBuffer(this.context, 'base64').toString());
            typeof arg == 'string' ? delete context[permission][arg] : context[permission] = {};
            this.context = mkBuffer(toJson(context)).toString('base64');
        }

        return this;
    }

    clearPermission(permission) {
        let permissions = fromJson(mkBuffer(this.permissions, 'base64').toString());
        let context = fromJson(mkBuffer(this.context, 'base64').toString());
        delete permissions[permission];
        delete context[permission];
        this.permissions = mkBuffer(toJson(permissions)).toString('base64');
        this.context = mkBuffer(toJson(context)).toString('base64');
        return this;
    }

    getContext(permission) {
        if (permission) {
            if (this.hasPermission(permission)) {
                return fromJson(mkBuffer(this.context, 'base64').toString())[permission];
            }
        }
        else {
            return fromJson(mkBuffer(this.context, 'base64').toString());
        }
    }

    getPermissions() {
        return fromJson(mkBuffer(this.permissions, 'base64').toString());
    }

    hasPermission(permission) {
        return permission in this.getPermissions();
    }

    setContext(permission, ...args) {
        if (this.hasPermission(permission)) {
            if (typeof args[0] == 'object') {
                let context = fromJson(mkBuffer(this.context, 'base64').toString());
                context[permission] = args[0];
                this.context = mkBuffer(toJson(context)).toString('base64');
            }
            else if (typeof args[0] == 'string' && typeof args[1] != 'undefined') {
                let context = fromJson(mkBuffer(this.context, 'base64').toString());
                context[permission][args[0]] = args[1];
                this.context = mkBuffer(toJson(context)).toString('base64');
            }
        }

        return this;
    }

    setPermission(permission, context) {
        let permissions = fromJson(mkBuffer(this.permissions, 'base64').toString());
        permissions[permission] = true;
        this.permissions = mkBuffer(toJson(permissions)).toString('base64');
        this.setContext(permission, context ? context : new Object());
        return this;
    }

    [Symbol.iterator]() {
        return Object.keys(this.getPermissions())[Symbol.iterator]();
    }
});
