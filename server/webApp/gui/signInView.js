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
*****/
register(class FWSignInView extends WGridLayout {
    constructor() {
        super({
            rows: ['auto', '350px', 'auto'],
            rowGap: '0px',
            cols: ['auto', '400px', 'auto'],
            colGap: '0px',
        });

        this.data = mkActiveData({
            mode: 'Authenticate',
            username: 'charlie@kodeprogramming.org',
            password: 'password',
        });

        this.setAt(1, 1, mkWidget('div')
            .bind(this.data, 'mode', {
                'Authenticate': new AuthenticateForm(this.data).on('SignIn', message => this.signIn(message)),
                'ForgotPassword': new ForgotCredentialsForm(this.data).on('ResetPassword', message => this.resetPassword(message)),
            })
        );
    }

    async resetPassword(message) {
        await mkHttp().query({
            messageName: 'PublicResetPassword',
            username: this.data.username,
        });

        setTimeout(() => this.data.mode = 'Authenticate', 2000);
    }

    async signIn(message) {
        let rsp = await queryServer({
            messageName: 'PublicSignIn',
            username: this.data.username,
            password: this.data.password,
        });

        if (rsp) {
            signIn(rsp);
        }
        else {
            console.log('What a bummer.  Could not sign in.')
        }
    }
});


/*****
*****/
class AuthenticateForm extends WGridLayout {
    constructor(data) {
        super({
            tagName: 'form',
            rows: ['2fr', 'auto', '3px', 'auto', '8px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.data = data;
        this.setClasses('flex-h-cc colors-2 border-style-solid border-width-1 border-radius-2');

        this.setAt(1, 0, mkWidget('div').set(txx.fwSignInUsername).setClasses('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(3, 0, mkIEmail()
        .bind(this.data, 'username'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.setAt(5, 0, mkWidget('div').set(txx.fwSignInPassword).setClasses('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(7, 0, mkIPassword()
        .bind(this.data, 'password'))
        .setAttribute('autocomplete', 'current-password');

        this.setAt(9, 0,
            mkIButton('button')
            .setAttribute('value', txx.fwSignInSignIn)
            .on('html.click', message => this.send({ messageName: 'SignIn' }))
        )

        this.setAt(11, 0,
            mkIButton('button')
            .setAttribute('value', txx.fwSignInForgotPassword)
            .on('html.click', message => this.data.mode = 'ForgotPassword')
        )
    }
}


/*****
*****/
class ForgotCredentialsForm extends WGridLayout {
    constructor(data) {
        super({
            tagName: 'form',
            rows: ['2fr', 'auto', '20px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.data = data;
        this.setClasses('flex-h-cc colors-2 border-style-solid border-width-1 border-radius-2');

        this.setAt(1, 0, mkWidget('div').set(txx.fwForgotInstructions));

        this.setAt(3, 0, mkWidget('div').set(txx.fwForgotEmail).setClasses('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(5, 0, mkIEmail()
        .bind(this.data, 'username'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.setAt(7, 0,
            mkIButton('button')
            .setAttribute('value', txx.fwForgotReset)
            .on('html.click', message => this.send({ messageName: 'ResetPassword' }))
        )

        this.setAt(9, 0,
            mkIButton('button')
            .setAttribute('value', txx.fwForgotSignIn)
            .on('html.click', message => this.data.mode = 'Authenticate')
        )
    }
}