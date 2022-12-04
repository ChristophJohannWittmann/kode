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


(() => {
    /*****
    *****/
    let webSocket = null;


    /*****
     * This is the startup or bootstrap function for the client framework code.
     * This is called when the body has been loaded with the onload="bootstrop()"
     * HTML attribute.  This ensures a standard environment initialization accross
     * web applications and a standard initiialization sequence.
    *****/
    register(async function bootstrap() {
        window.win = mkWin(window);
        window.doc = win.doc();
        window.styleSheet = doc.getStyleSheet('WebApp');
        await onSingletons();

        window.views = mkWStack();
        doc.body().append(views);

        if (webAppSettings.authenticate()) {
            views.push(mkFWSignInView());
        }
        else {
            views.push(webAppSettings.homeView());

            if (webAppSettings.websocket()) {
                webSocket = mkWebsocket(webAppSettings.url());
            }
        }
    });


    /*****
    *****/
    on('#CloseApp', message => {
        signOut();
    });


    /*****
    *****/
    register(async function queryServer(message) {
        if (webSocket) {
            return await webSocket.queryServer(message);
        }
        else {
            return await mkHttp().queryServer(message);
        }
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
    *****/
    register(function signIn(userSettings) {
        views.pop();
        views.push(webAppSettings.homeView());
        webAppSettings.session = () => userSettings.sessionKey;
        webAppSettings.password = () => userSettings.setPassword;
        webAppSettings.verify = () => userSettings.verifyEmail;

        if (webAppSettings.password()) {
            views.push(mkFWPasswordView());
        }

        if (webAppSettings.verify()) {
            views.push(mkFWVerifyEmailView());
        }

        if (webAppSettings.websocket()) {
            webSocket = mkWebsocket(doc.location().href);
            webSocket.sendServer({ messageName: '#SocketSession' })
        }
    });


    /*****
    *****/
    register(function signOut() {
        if (webAppSettings.authenticate()) {
            if (webSocket) {
                webSocket.close();
                webSocket = null;
            }

            views.clear();
            views.push(mkFWSignInView());
            webAppSettings.veryify = () => false;
            webAppSettings.password = () => false;
            webAppSettings.session = () => null;
        }
    });
})();
