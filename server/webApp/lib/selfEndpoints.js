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

    async [ mkWebAppEndpoint('AddSelfAddress') ](req) {
    }

    async [ mkWebAppEndpoint('AddSelfEmail') ](req) {
    }

    async [ mkWebAppEndpoint('AddSelfPhone') ](req) {
    }

    async [ mkWebAppEndpoint('ModifySelf') ](req) {
    }

    async [ mkWebAppEndpoint('ModifySelfAddress') ](req) {
    }

    async [ mkWebAppEndpoint('ModifySelfEmail') ](req) {
    }

    async [ mkWebAppEndpoint('ModifySelfPhone') ](req) {
    }

    async [ mkWebAppEndpoint('RemoveSelfAddress') ](req) {
    }

    async [ mkWebAppEndpoint('RemoveSelfEmail') ](req) {
    }

    async [ mkWebAppEndpoint('RemoveSelfPhone') ](req) {
    }

    async [ mkWebAppEndpoint('ResetSelfPassword') ](req) {
    }

    async [ mkWebAppEndpoint('SetSelfPassword') ](req) {
    }

    async [ mkWebAppEndpoint('SignSelfIn') ](req) {
        let dbc = await req.connect();
        let user = await UserObj.authenticate(dbc, req.username, req.password);

        if (user) {
            let sessionKey = await Ipc.queryPrimary({
                messageName: '#SessionManagerCreateSession',
                user: user,
            });

            req.reply({ newlyEstablishedSessionKey: sessionKey });
        }
        else if (await UserObj.empty(dbc)) {
            let sessionKey = await Ipc.queryPrimary({
                messageName: '#SessionManagerCreateBootstrapSession',
            });

            req.reply({ newlyEstablishedSessionKey: sessionKey });
        }
        else {
            req.reply(false);
        }

        await dbc.rollback();
        await dbc.free();
    }

    async [ mkWebAppEndpoint('SignSelfOut') ](req) {
    }
});
