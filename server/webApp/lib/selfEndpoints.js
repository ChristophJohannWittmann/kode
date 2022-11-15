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
register(class SelfEndpoints extends WebAppEndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkWebAppEndpoint('ModifySelf') ](req) {
    }

    async [ mkWebAppEndpoint('ResetSelfPassword', 'nosession') ](req) {
    }

    async [ mkWebAppEndpoint('SetSelfPassword') ](req) {
    }

    async [ mkWebAppEndpoint('SignSelfIn', 'nosession') ](req) {
        let org;
        let dbc = await req.connect();
        let user = await UserObj.authenticate(await req.connect(), req.username, req.password);

        if (user) {
            org = await OrgObj.get(dbc, user.orgOid);
        }
        else if (await UserObj.empty(dbc)) {
            user = mkDboUser({
                email: 'noemail@nodomain',
                firstName: 'User',
                lastName: 'Person',
                status: 'active',
                authType: 'simple',
                verified: false,
                password: false,
            });

            org = mkDboOrg({
                name: 'No Org',
                authType: 'simple',
            });

            let sessionKey = await Ipc.queryPrimary({
                messageName: '#SessionsCreateSession',
                org: org,
                user: user,
            });

            req.reply({ sessionKey: sessionKey });
        }
        else {
            req.reply({
                greeting: 'hello signin please',
                status: 'successful',
            });
        }
    }

    async [ mkWebAppEndpoint('SignSelfOut') ](req) {
    }
});
