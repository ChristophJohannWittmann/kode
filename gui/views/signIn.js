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
register(class SignInView extends WGridLayout {
    constructor() {
        super({
            rows: ['auto', '350px', 'auto'],
            rowGap: '0px',
            cols: ['auto', '400px', 'auto'],
            colGap: '0px',
        });

        const credentials = mkActiveData({
            forgotPassword: false,
            username: 'chris.wittmann@infosearch.online',
            password: 'a very unbreakable password',
        });

        const panel = this.setAt(1, 1,
            mkWGridLayout({
                rows: ['5fr', 'auto', '8px', 'auto', '25px', 'auto', '8px', 'auto', '3fr'],
                cols: ['80px', '250px'],
            })
            .setClassName('flex-h-cc')
            .setClassName('border-1')
            .setClassName('border-radius-2')
        );

        panel.setAt(1, 0, mkWidget('div').set('Username').setClassName('flex-h-sc'));
        panel.setAt(1, 1, mkTextInput()
            .bindValue(credentials, 'username'))
            .setAutoFocus(this)
            .setAutoComplete('email');

        panel.setAt(3, 0, mkWidget('div').set('Password').setClassName('flex-h-sc'));
        panel.setAt(3, 1, mkPasswordInput()
            .bindValue(credentials, 'password'))
            .setAutoComplete('current-password');

        const signIn = panel.setAt(5, 1, mkWLink()
            .setHref('https://google.com')
            .set('Sign In')
            .setTarget('_blank')
            .setClassName('flex-h-sc',)
        );

        const forgotPassword = panel.setAt(7, 1, mkWLink()
            .setHref('https://google.com')
            .set('Forgot Password')
            .setTarget('_blank')
            .setClassName('flex-h-sc',)
        );
    }
});
