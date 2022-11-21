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
 * These are the endpoints that provide the user features that are available to
 * all users regardless of permissions granted.  In other words, these are base-
 * line features needed to be a user with a session.  Note that this container
 * also includes the "SelfSignIn" endpoiont, which is marked as "nosession",
 * which means there is no authorization required to use that endpoint.  All of
 * the other endpoints require no specific granted features.
*****/
register(class SelfEndpoints extends EndpointContainer {
    constructor(webApp) {
        super(webApp);
    }

    async [ mkEndpoint('AddSelfAddress') ](req) {
    }

    async [ mkEndpoint('AddSelfEmail') ](req) {
    }

    async [ mkEndpoint('AddSelfPhone') ](req) {
    }

    async [ mkEndpoint('ModifySelf') ](req) {
    }

    async [ mkEndpoint('ModifySelfAddress') ](req) {
    }

    async [ mkEndpoint('ModifySelfEmail') ](req) {
    }

    async [ mkEndpoint('ModifySelfPhone') ](req) {
    }

    async [ mkEndpoint('RemoveSelfAddress') ](req) {
    }

    async [ mkEndpoint('RemoveSelfEmail') ](req) {
    }

    async [ mkEndpoint('RemoveSelfPhone') ](req) {
    }

    async [ mkEndpoint('ResetSelfPassword') ](req) {
    }

    async [ mkEndpoint('SetSelfPassword') ](req) {
    }

    async [ mkEndpoint('SignSelfIn', 'nosession' ) ](req) {
        let dbc = await req.connect();
        let user = await Users.authenticate(dbc, req.username, req.password);

        if (user) {
            let sessionKey = await Ipc.queryPrimary({
                messageName: '#SessionManagerCreateSession',
                user: user,
            });

            req.reply({ '#NewlyEstablishedSessionKey': sessionKey });
        }
        else {
            req.reply(false);
        }

        await dbc.rollback();
        await dbc.free();
    }

    async [ mkEndpoint('SignSelfOut') ](req) {
        let response = await Ipc.queryPrimary({
            messageName: '#SessionManagerCloseSession',
            session: req['#Session'],
        });

        req.reply({ '#CloseSession': true });
    }
});
