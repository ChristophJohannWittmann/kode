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
register(class SignIn extends Widget {
    constructor() {
        super();

        this.layout = mkGridLayout(this, {
            rows: ['auto', '350px', 'auto'],
            rowGap: '0px',
            cols: ['auto', '400px', 'auto'],
            colGap: '0px',
        });

        this.credentials = mkActiveData({
            forgotPassword: false,
            username: 'chris.wittmann@infosearch.online',
            password: '',
        });

        this.createAuthenticationForm();
        this.createForgotPasswordForm();

        this.layout.setAt(1, 1, this.challengeForm);
    }

    createAuthenticationForm() {
        this.challengeForm = mkWidget('form')
        .setClasses('flex-h-cc colors-2 border-style-solid border-width-1 border-radius-2');

        const challengeLayout = mkGridLayout(this.challengeForm, {
            rows: ['2fr', 'auto', '3px', 'auto', '8px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        challengeLayout.setAt(1, 0, mkWidget('div').set('Username').setClasses('flex-h-sc font-weight-bold font-size-4'));
        challengeLayout.setAt(3, 0, mkIEmail()
        .bind(this.credentials, 'username'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        challengeLayout.setAt(5, 0, mkWidget('div').set('Password').setClasses('flex-h-sc font-weight-bold font-size-4'));
        challengeLayout.setAt(7, 0, mkIPassword()
        .bind(this.credentials, 'password'))
        .setAttribute('autocomplete', 'current-password');

        challengeLayout.setAt(9, 0,
            mkIButton('button')
            .setAttribute('value', 'Sign In')
            .on('html.click', message => this.onSignIn())
        )

        challengeLayout.setAt(11, 0,
            mkIButton('button')
            .setAttribute('value', 'Forgot Password')
            .on('html.click', message => this.onForgotPassword())
        )
    }

    createForgotPasswordForm() {
    }

    onAuthenticate() {
        console.log('onAuthenticate()');
    }

    onForgotPassword() {
        console.log('onForgotPassword()');
    }

    async onResetPassword() {
        console.log('onResetPassword()');
    }

    async onSignIn() {
        let rsp = await mkHttp().query({
            messageName: 'SignSelfIn',
            username: this.credentials.username,
            password: this.credentials.password,
        });

        console.log(rsp);
    }
});
