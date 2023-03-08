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
 * The sign-in view is used for signing into the web app.  Basic authentication
 * employs the user of a username (email address) and a password.  We use emails
 * exclusively because they should be unique to each individual.  It supports
 * the expected standard features such as forgot-password-help requests.  This
 * view has a single form centered in its middle, which is either the auth form
 * or the reset-password form.
*****/
register(class FWSignInView extends WGrid {
    constructor() {
        super({
            rows: ['auto', '350px', 'auto'],
            cols: ['auto', '400px', 'auto'],
        });

        this.data = mkActiveData({
            mode: 'Authenticate',
            username: '',
            password: '',
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
            await mkWAlertDialog({
                text: txx.fwSignInFailed,
            });
        }
    }
});


/*****
 * This form provides the core features for signing in.  It's where you enter
 * your username and password, which if successful, open the application home
 * page.  This form calls the view's signIn() method to handle authentication
 * with the server endpoints, and if successful, will continue to the next step
 * of multi-factor authentication or on to the application home page in case of
 * single-factor authentication.
*****/
class AuthenticateForm extends WGrid {
    constructor(data) {
        super({
            tagName: 'form',
            rows: ['2fr', 'auto', '3px', 'auto', '8px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.data = data;
        this.setClassNames('flex-h-cc alt-colors border-style-solid border-width-2 border-radius-2');

        this.setAt(1, 0, mkWidget('div').setInnerHtml(txx.fwSignInUsername).setClassNames('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(3, 0, mkIEmail()
        .bind(this.data, 'username', 'value'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.setAt(5, 0, mkWidget('div').setInnerHtml(txx.fwSignInPassword).setClassNames('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(7, 0, mkIPassword()
        .bind(this.data, 'password', 'value'))
        .setAttribute('autocomplete', 'current-password');

        this.setAt(9, 0,
            mkIButton()
            .setAttribute('value', txx.fwSignInSignIn)
            .on('dom.click', message => this.send({ messageName: 'SignIn' }))
        )

        this.setAt(11, 0,
            mkIButton()
            .setAttribute('value', txx.fwSignInForgotPassword)
            .on('dom.click', message => this.data.mode = 'ForgotPassword')
        )
    }
}


/*****
 * As expected, users can submit a request to reset their password.  That's done
 * by submitting this form along with a populated email address.  Note that the
 * password reset will geneate a link that's email to the user.  Upon clicking
 * that link, multi-factor authentication will be enforced before continuing to
 * the password page.
*****/
class ForgotCredentialsForm extends WGrid {
    constructor(data) {
        super({
            tagName: 'form',
            rows: ['2fr', 'auto', '20px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.data = data;
        this.setClassNames('flex-h-cc alt-colors border-style-solid border-width-1 border-radius-2');

        this.setAt(1, 0, mkWidget('div').setInnerHtml(txx.fwForgotInstructions));

        this.setAt(3, 0, mkWidget('div').setInnerHtml(txx.fwForgotEmail).setClassNames('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(5, 0, mkIEmail()
        .bind(this.data, 'username', 'value'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.setAt(7, 0,
            mkIButton()
            .setAttribute('value', txx.fwForgotReset)
            .on('dom.click', message => this.send({ messageName: 'ResetPassword' }))
        )

        this.setAt(9, 0,
            mkIButton()
            .setAttribute('value', txx.fwForgotSignIn)
            .on('dom.click', message => this.data.mode = 'Authenticate')
        )
    }
}