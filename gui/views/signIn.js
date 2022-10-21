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

        this.credentials = mkActiveData({
            username: '',
            password: '',
        });

        this.panel = mkGridLayoutWidget({
            rows: ['auto', '20px', '15px', '20px', 'auto'],
            rowGap: '4px',
            cols: ['80px', '250px'],
            colGap: '0px',
        });

        this.panel.setClassNames('flex-h-cc border-1 border-radius-2 colors-2');

        let usernameInput = mkTextInput().bindingStart(this.credentials, 'username');
        let passwordInput = mkPasswordInput().bindingStart(this.credentials, 'password');

        this.panel.setAt(1, 0, mkWidget('div').set('Username').setClassName('flex-h-sc'));
        this.panel.setAt(1, 1, usernameInput);

        this.panel.setAt(3, 0, mkWidget('div').set('Password').setClassName('flex-h-sc'));
        this.panel.setAt(3, 1, passwordInput);

        this.setAt(1, 1, this.panel);
    }
});