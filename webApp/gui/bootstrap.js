/*****
 * Copyright (c) 2017-2022 Kode Programming
 * https://github.com/KodeProgramming/kode/blob/main/LICENSEm
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


(() => {
    /*****
     * If a webapp utilizes a websocket, this is it.  This value is also used
     * for controlling logic, which depends on whether an application websocket
     * enabled.  Please note that the webSocket object doesn't go away if the
     * socket is disconneted.  Hence,  application code can just call webSocket
     * functions without caring if it's connected.  It will automatically
     * reconnect if necessary.
    *****/
    let webSocket = null;


    /*****
     * This is the startup or bootstrap function for the client framework code.
     * This is called when the body has been loaded with the onload="bootstrop()"
     * HTML attribute.  This ensures a standard environment initialization accross
     * web applications and a standard initiialization sequence.
    *****/
    register(async function bootstrap() {
        await onSingletons();
        window.win = mkWin(window);
        window.doc = win.doc();
        window.styleSheet = doc.getStyleSheet('WebApp');
        window.html = mkWHtml(doc);
        window.head = mkWHead(doc);
        window.body = mkWBody(doc);
        window.home = null;
        body.push(mkFWSignInView());

        /*
        win.on('focus', async message => {
            if (booted != await queryServer({ messageName: 'PublicGetBootHash' })) {
                doc.location().reload();
            }
        });
        */
    });


    /*****
     * The #CloseApp message is sent from the server to the client when user
     * signs out or is automatically signed out.  Application closing needs to
     * close outthe websocket and null it out before clearing the application
     * view stack and replacing that entire stack with the sign-in view.
    *****/
    on('#CloseApp', message => {
        if (message.notify) {
            doKludgeAlert(message.notify);
        }

        signOut();
    });


    /*****
     * Communication with the server should be performed vis-a-vis these two
     * communication functions because the source code needs to be written to
     * work with either an HTTP-request only mode or with a websocket.
    *****/
    register(function queryServer(message) {
        return new Promise(async (ok, fail) => {
            if (webSocket) {
                var response = await webSocket.queryServer(message);
            }
            else {
                var response = await mkHttp().queryServer(message);
            }

            if (response === '#CloseApp') {
                send({ messageName: '#CloseApp', notify: false });
            }
            else if (response === '#NoSession') {
                send({ messageName: '#CloseApp', notify: txx.fwMiscSessionClosed });
            }
            else if (response === '#InternalServerError') {
            }
            else {
                ok(response);
            }
        });
    });

    register(async function sendServer(message) {
        if (webSocket) {
            return await webSocket.sendServer(message);
        }
        else {
            mkHttp().queryServer(message);
        }
    });


    /*****
     * The signin function is called by the sign-in view after the user has been
     * authenticated by the server.  Firstly, the server should have passed the
     * session-state variables as part of server response, which specifies whether
     * the user requires additional verification.  If additional user input is
     * required, those views are stacked up appropriately.  If the application has
     * been enabled for websocket use, the websocket is also created and connected
     * to the server.
    *****/
    register(async function signIn(sessionState) {
        /*
        if (booted != await queryServer({ messageName: 'PublicGetBootHash' })) {
            doc.location().reload();
            return;
        }
        */

        body.pop();
        window.home = webAppSettings.homeView()
        body.push(window.home);

        webAppSettings.session = () => sessionState.sessionKey;
        webAppSettings.password = () => sessionState.setPassword;
        webAppSettings.verify = () => sessionState.verifyEmail;

        if (webAppSettings.password()) {
            body.push(mkFWPasswordView());
        }

        if (webAppSettings.verify()) {
            body.push(mkFWVerifyEmailView());
        }

        if (webAppSettings.websocket()) {
            webSocket = mkWebsocket(doc.location().href);
            webSocket.sendServer({ messageName: '#SocketSession' })
        }
    });


    /*****
     * This function performs the front-end work of signing out.  It DOES NOT
     * tell server to close the session.  Closing out the server-side is done
     * be sending a SelfSignOut message.  This simply closes the GUI out and
     * reverts to the sign in view.
    *****/
    register(function signOut() {
        if (webSocket) {
            webSocket.close();
            webSocket = null;
        }

        body.clear();
        body.push(mkFWSignInView());
        window.home = null;
        webAppSettings.veryify = () => false;
        webAppSettings.password = () => false;
        webAppSettings.session = () => null;
    });
})();
