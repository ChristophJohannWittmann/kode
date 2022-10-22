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
register(class SignInView extends GridLayoutWidget {
    constructor() {
        super({
            rows: ['auto', '350px', 'auto'],
            rowGap: '0px',
            cols: ['auto', '400px', 'auto'],
            colGap: '0px',
        });

        const credentials = mkActiveData({
            username: 'chris.wittmann@infosearch.online',
            password: 'a very unbreakable password',
        });

        const panel = this.setAt(1, 1,
            mkGridLayoutWidget({
                rows: ['5fr', 'auto', '8px', 'auto', '25px', 'auto', '4fr'],
                cols: ['80px', '250px'],
            })
            .setClassNames('flex-h-cc border-1 border-radius-2 colors-2')
        );

        let usernameInput = mkTextInput().bindInput(credentials, 'username');
        let passwordInput = mkPasswordInput().bindInput(credentials, 'password');

        panel.setAt(1, 0, mkWidget('div').set('Username').setClassName('flex-h-sc'));
        panel.setAt(1, 1, usernameInput);

        panel.setAt(3, 0, mkWidget('div').set('Password').setClassName('flex-h-sc'));
        panel.setAt(3, 1, passwordInput);

        const forgotPassword = panel.setAt(5, 1, mkLink()
            .setHref('https://google.com')
            .set('Click to open Google')
            .setClassName('font-size-3')
            .setTarget('_blank')
        );

        forgotPassword.on('html.click', message => console.log(credentials));
    }
});
