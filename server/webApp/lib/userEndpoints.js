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
register(class UserEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkEndpoint('ActivateUser', 'user') ](req) {
    }

    async [ mkEndpoint('AddUserAddress', 'user') ](req) {
    }

    async [ mkEndpoint('AddUserEmail', 'user') ](req) {
    }

    async [ mkEndpoint('AddUserPhone', 'user') ](req) {
    }

    async [ mkEndpoint('DeactivateUser', 'user') ](req) {
    }

    async [ mkEndpoint('GetUsers', 'user') ](req) {
    }

    async [ mkEndpoint('ModifyUser', 'user') ](req) {
    }

    async [ mkEndpoint('ModifyUserAddress', 'user') ](req) {
    }

    async [ mkEndpoint('ModifyUserEmail', 'user') ](req) {
    }

    async [ mkEndpoint('ModifyUserPhone', 'user') ](req) {
    }

    async [ mkEndpoint('RemoveUser', 'user') ](req) {
    }

    async [ mkEndpoint('RemoveUserAddress', 'user') ](req) {
    }

    async [ mkEndpoint('RemoveUserEmail', 'user') ](req) {
    }

    async [ mkEndpoint('RemoveUserPhone', 'user') ](req) {
    }

    async [ mkEndpoint('ResetUserPassword', 'user') ](req) {
    }

    async [ mkEndpoint('SignUserOut', 'user') ](req) {
    }

    async [ mkEndpoint('VerifyUser', 'user') ](req) {
    }
});
