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
register(class WSignIn extends WGridLayout {
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
                'Authenticate': new AuthenticateForm(this.data),
                'ForgotPassword': new ForGotPasswordForm(this.data),
            })
        );
    }

    async signInFailed(message) {
        console.log(message);
    }

    async signInSucceded(message) {
        console.log(message);
    }
});


/*****
*****/
class AuthenticateForm extends WGridLayout {
    constructor(data) {
        super('form', {
            rows: ['2fr', 'auto', '3px', 'auto', '8px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.data = data;
        this.setClasses('flex-h-cc colors-2 border-style-solid border-width-1 border-radius-2');

        this.setAt(1, 0, mkWidget('div').set(txt.fwUsername).setClasses('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(3, 0, mkIEmail()
        .bind(this.data, 'username'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.setAt(5, 0, mkWidget('div').set(txt.fwPassword).setClasses('flex-h-sc font-weight-bold font-size-4'));
        this.setAt(7, 0, mkIPassword()
        .bind(this.data, 'password'))
        .setAttribute('autocomplete', 'current-password');

        this.setAt(9, 0,
            mkIButton('button')
            .setAttribute('value', txt.fwSignIn)
            .on('html.click', message => this.onSignIn())
        )

        this.setAt(11, 0,
            mkIButton('button')
            .setAttribute('value', txt.fwForgotPassword)
            .on('html.click', message => this.data.mode = 'ForgotPassword')
        )
    }

    async onSignIn() {
        let rsp = await mkHttp().query({
            messageName: 'SignSelfIn',
            username: this.data.username,
            password: this.data.password,
        });

        if (rsp) {
            this.send({ messageName: 'SignInSucceded' });
            /*
            rsp = await mkHttp().query({
                messageName: 'SignSelfOut',
                context: {
                    org: 12,
                    report: 27,
                }
            });
            */
        }
        else {
            this.send({ messageName: 'SignInFailed' });
        }
    }
}


/*****
*****/
class ForGotPasswordForm extends Widget {
    constructor(data) {
        super('div');
        this.data = data;
        let h1 = mkWidget('h1').set('Hello Forgot Password.');
        h1.enablePropagation('click');
        this.append(h1);
        this.on('html.click', message => this.data.mode = 'Authenticate');
    }
}
/*
class ResetPasswordForm extends WGridLayout {
    constructor(parent) {
        super('form', {
            rows: [],
            cols: [],
        });
    }
}
*/