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
 * These are the web application endpoints that require no session in order to
 * be called.  The first and most useful features provided by these endpoints
 * is to enable user sign-in and to enable the anonymous password reset feature.
 * Just remember that we've collected all of the unsecured endpoints in this
 * module in order to make the developer aware that these must be programmed
 * and used accordingly.
*****/
register(class PublicEndpoints extends EndpointContainer {
    constructor(webApp) {
        super(webApp);
    }
    
    async [ mkEndpoint('PublicResetPassword', undefined, { unprotected: true }) ](trx) {
    }
    
    async [ mkEndpoint('PublicSignIn', undefined, { unprotected: true }) ](trx) {
        let dbc = await trx.connect();
        let user = await Users.authenticate(dbc, trx.username, trx.password);

        if (user instanceof DboUser) {
            let sessionKey = await Ipc.queryPrimary({
                messageName: '#SessionManagerCreateSession',
                user: user,
                idleMinutes: trx['#Reference'].sessionIdle,
            });

            return {
                sessionKey: sessionKey,
                verifyEmail: !user.verified,
                setPassword: !user.password,
            };
        }
        else {
            return false;
        }
    }
});
