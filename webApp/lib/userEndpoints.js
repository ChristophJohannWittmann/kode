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

    async [ mkEndpoint('UserActivate', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserAddAddress', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserAddUEmail', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserAddPhone', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserDeactivate', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModify', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyAddress', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyEmail', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserModifyPhone', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserRemove', 'user', { notify: true }) ](trx) {
    }

    async [ mkEndpoint('UserRemoveAddress', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserRemoveEmail', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserRemovePhone', 'user', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('UserSelectByEmail', 'user') ](trx) {
        return await Users.selectByEmail(
            await trx.connect(),
            trx.email
        );
    }
    
    async [ mkEndpoint('UserSelectByName', 'user') ](trx) {
        return await Users.selectByName(
            await trx.connect(),
            trx.firstName,
            trx.lastName,
        );
    }
    
    async [ mkEndpoint('UserVerify', 'user') ](trx) {
    }
});
