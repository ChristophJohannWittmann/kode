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
*****/
register(class UserEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkEndpoint('UserActivate', 'user') ](trx) {
    }

    async [ mkEndpoint('UserAddAddress', 'user') ](trx) {
    }

    async [ mkEndpoint('UserAddUEmail', 'user') ](trx) {
    }

    async [ mkEndpoint('UserAddPhone', 'user') ](trx) {
    }

    async [ mkEndpoint('UserDeactivate', 'user') ](trx) {
    }

    async [ mkEndpoint('UserModify', 'user') ](trx) {
    }

    async [ mkEndpoint('UserModifyAddress', 'user') ](trx) {
    }

    async [ mkEndpoint('UserModifyEmail', 'user') ](trx) {
    }

    async [ mkEndpoint('UserModifyPhone', 'user') ](trx) {
    }

    async [ mkEndpoint('UserRemove', 'user') ](trx) {
    }

    async [ mkEndpoint('UserRemoveAddress', 'user') ](trx) {
    }

    async [ mkEndpoint('UserRemoveEmail', 'user') ](trx) {
    }

    async [ mkEndpoint('UserRemovePhone', 'user') ](trx) {
    }

    async [ mkEndpoint('UserResetPassword', 'user') ](trx) {
    }

    async [ mkEndpoint('UserSelectByEmail', 'user') ](trx) {
        return await Users.selectByEmail(
            await trx.connect(),
            trx.data.email
        );
    }

    async [ mkEndpoint('UserSelectByName', 'user') ](trx) {
        return await Users.selectByName(
            await trx.connect(),
            trx.data.firstName,
            trx.data.lastName,
        );
    }

    async [ mkEndpoint('UserSignOut', 'user') ](trx) {
    }

    async [ mkEndpoint('UserVerify', 'user') ](trx) {
    }
});
