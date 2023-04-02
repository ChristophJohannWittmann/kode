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
 * This is the endpoint container for managing users if one has the "user"
 * permission set.  For the currently opened organization, or none, these
 * endpoints are used for managing users within that entity.  If the session
 * currently has no org, then these endpoints will pertain to all users
 * with NO associated org.
*****/
register(class UserEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkEndpoint('UserAddAddress', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserAddUEmail', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserAddPhone', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserCreateUser', 'user', { notify: true }) ](trx) {
        trx.userData.orgOid = trx.session.orgOid;
        return await Users.createUser(await trx.connect(), trx.userData);
    }

    async [ mkEndpoint('UserGetEmail', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserGetGrants', 'user', { notify: true }) ](trx) {
        let user = await Users.getUser(await trx.connect(), trx.userOid);
        let grants = await user.getGrants(await trx.connect());

        return {
            permissions: grants.getPermissions(),
            context: grants.getContext(),
        };
    }

    async [ mkEndpoint('UserGetPermissions', 'user', { notify: true }) ](trx) {
        return await Ipc.queryPrimary({
            messageName: '#PermissionsManagerGetPermissions'
        });
    }

    async [ mkEndpoint('UserGetUser', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserGetUserData', 'user', { notify: true }) ](trx) {
        return Users.getUserData(await trx.connect(), trx.oid);
    }

    async [ mkEndpoint('UserModifyAddress', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyEmail', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyPhone', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyUser', 'user', { notify: true }) ](trx) {
        console.log('UserModifyUser');
        return false;
        return await Users.modifyUser(await trx.connect(), trx.userData);
    }

    async [ mkEndpoint('UserRemoveAddress', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserRemoveEmail', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserRemovePhone', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserSearch', 'user') ](trx) {
        if (trx.criterion == 'email') {
            return await Users.selectByEmail(
                await trx.connect(),
                trx.email,
                trx.session.user.orgOid,
            );
        }
        else if (trx.criterion == 'name') {
            return await Users.selectByName(
                await trx.connect(),
                trx.firstName,
                trx.lastName,
                trx.session.user.orgOid,
            );
        }
        else if (trx.criterion == 'search') {
            return await Users.search(
                await trx.connect(),
                trx.pattern,
                trx.session.user.orgOid,
            );
        }
        else {
            return [];
        }
    }
    
    async [ mkEndpoint('UserVerify', 'user') ](trx) {
    }
});
