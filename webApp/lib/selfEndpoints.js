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
 * These are the endpoints that provide the user features that are available to
 * all users regardless of permissions granted.  In other words, these are base-
 * line features needed to be a user with a session.  Note that this container
 * also includes the "SelfSignIn" endpoiont, which is marked as "nosession",
 * which means there is no authorization trxuired to use that endpoint.  All of
 * the other endpoints trxuire no specific granted features.
*****/
register(class SelfEndpoints extends EndpointContainer {
    constructor(webApp) {
        super(webApp);
    }
    
    async [ mkEndpoint('SelfAddAddress', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfAddEmail', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfAddPhone', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfGetDarkWidget', 'self') ](trx) {
        return DarkKode.getClass(trx.libName, trx.className);
    }
    
    async [ mkEndpoint('SelfGetOrgsPreference', 'self') ](trx) {
        return (await selectOneDboPreference(await trx.connect(), `_name='Orgs'`)).value.on;
    }
    
    async [ mkEndpoint('SelfListGrants', 'self') ](trx) {
        return await Ipc.queryPrimary({
            messageName: '#SessionManagerGetGrants',
            session: trx['#Session'],
        });
    }
    
    async [ mkEndpoint('SelfModify', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfModifyAddress', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfModifyEmail', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfModifyPhone', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfSetOrg', 'self') ](trx) {
        if (typeof trx.orgOid == 'bigint' && trx.orgOid >= 0) {
            let org;
            let dbc = await trx.connect();

            if (trx.session.user.orgOid == 0) {
                org = await getDboOrg(dbc, trx.orgOid);
            }
            else {
                org = await getDboOrg(dbc, trx.session.user.orgOid);
            }

            if (typeof org == 'object') {
                return org;
            }
        }

        return false;
    }
    
    async [ mkEndpoint('SelfRemoveAddress', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfRemoveEmail', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfRemovePhone', 'self') ](trx) {
    }
    
    async [ mkEndpoint('SelfResetPassword', 'self', { password: true }) ](trx) {
    }
    
    async [ mkEndpoint('SelfSetPassword', 'self', { password: true }) ](trx) {
        let dbc = await trx.connect();
        let user = await Users.getUser(dbc, trx.session.user.oid);

        if (await Ipc.queryPrimary({
            messageName: '#SessionManagerValidateVerificationCode',
            session: trx['#Session'],
            code: trx.verificationCode,
        })) {
            await mkDboUserLog({
                userOid: trx.session.user.oid,
                activity: 'password-set',
                info: 'ok',
            }).save(await trx.connect());

            await user.setPassword(dbc, trx.password);
            return true;
        }

        await mkDboUserLog({
            userOid: trx.session.user.oid,
            activity: 'password-set',
            info: 'failed.potential-hack',
        }).save(await trx.connect());

        return false;
    }
    
    async [ mkEndpoint('SelfSignOut', 'self', { password: true, verify: true }) ](trx) {
        await Ipc.queryPrimary({
            messageName: '#SessionManagerCloseSession',
            session: trx['#Session'],
        });

        await mkDboUserLog({
            userOid: trx.session.user.oid,
            activity: 'signout',
            info: 'ok',
        }).save(await trx.connect());

        return true;
    }
    
    async [ mkEndpoint('SelfSendVerificationRequest', 'self', { unprotected: true }) ](trx) {
        let code = await Ipc.queryPrimary({
            messageName: '#SessionManagerCreateVerificationCode',
            session: trx['#Session'],
            length: 7,
            milliseconds: 5*60*1000,
        });

        // TODO -- actually send code via message.
        console.log(`Created code ${code}`);

        await mkDboUserLog({
            userOid: trx.session.user.oid,
            activity: 'verify-start',
            info: 'ok',
        }).save(await trx.connect());

        return true;
    }
    
    async [ mkEndpoint('SelfValidateVerificationDigits', 'self', { unprotected: true }) ](trx) {
        let verification = await Ipc.queryPrimary({
            messageName: '#SessionManagerValidateVerificationDigits',
            session: trx['#Session'],
            digits: trx.digits,
        });

        if (verification === false) {
            await mkDboUserLog({
                userOid: trx.session.user.oid,
                activity: 'verify-entry',
                info: 'failed.incorrect-verification-code',
            }).save(await trx.connect());

            await pauseFor(700);
            return false;
        }
        else {
            await mkDboUserLog({
                userOid: trx.session.user.oid,
                activity: 'verify-entry',
                info: 'ok',
            }).save(await trx.connect());

            return verification;
        }
    }
    
    async [ mkEndpoint('SelfVerifyEmail', 'self', { verify: true }) ](trx) {
    }
});
