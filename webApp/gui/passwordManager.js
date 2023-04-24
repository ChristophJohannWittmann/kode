/*****
 * Copyright (c) 2017-2023 Kode Programming
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


(() => {
    /*****
     * The password manager is the panel used for setting a new password!  It's
     * nothing all that different from any standard password manager.  The big
     * difference here is that we use a verification form to send a verification
     * code to the user's contact point, i.e., email or MMS, to verify identity.
     * Once the verification code has been obtained, the user proceeds on to the
     * EntryForm to input and repeat the new password.
    *****/
    register(class PasswordManager extends WPanel {
        constructor() {
            super();
            this.setStyle({
                marginLeft: '8px',
                marginRight: '8px',
            });

            this.controller = mkActiveData({ code: '' });

            this.append(
                this.verifier = mkVerificationForm()
                .on('Widget.Verified', message => {
                    this.controller.verificationCode = message.verificationCode;
                    this.verifier.remove();

                    this.append(this.entryForm = new EntryForm(this))
                    .listen();
                })
            );
        }

        async revert() {
            this.entryForm ? this.entryForm.revert() : false;
        }

        async save() {
            let password = this.entryForm.passwords.getValues().password1;

            let reply = await queryServer({
                messageName: 'SelfSetPassword',
                verificationCode: this.controller.verificationCode,
                password: password,
            });

            if (!reply) {
                await mkWAlertDialog({ text: txx.fwPasswordError });
            }

            home.pop();
        }
    });


    /*****
     * The entry form is implemented as a single WEditable enclosing both the
     * password and confirmation text boxes.  To do this, we created a complete
     * implmentation of WEditable from scratch by extending WEditable and then
     * overriding all of the WEditble methods to accomodate the functionality
     * of the password/confirm editor.  By extending WEditable, the owing WPanel,
     * WEditor, will automatically listen to Change, Modify, Validity messagess
     * being sent by this form.
    *****/
    class EntryForm extends WEditor {
        constructor(passwordManager) {
            super();
            this.passwordManager = passwordManager;
            this.on('Widget.Changed', message => this.validate());

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwPasswordTitle),

                (this.passwords = mkWObjectEditor())
                .add({}, {
                    password1: {
                        label: txx.fwPasswordEnter,
                        type: ScalarPassword,
                        focus: true,
                    },
                    password2: {
                        label: txx.fwPasswordConfirm,
                        type: ScalarPassword,
                    },

                }),

                (this.error = mkWFraming()),
            );

            this.listen();
        }

        clearError() {
            this.error.setInnerHtml('').conceal();
            return this;
        }

        setError(diagnostic) {
            this.error.setInnerHtml(diagnostic).reveal();
            return this;
        }

        validate() {
            let p1 = this.passwords.getValues().password1;
            let p2 = this.passwords.getValues().password2;

            if (p1.length || p2.length) {
                if (p1.length < 8) {
                    this.setError(txx.fwPasswordErrorLength);
                    return false;
                }

                if (!p1.match(/[0-9]/)) {
                    this.setError(txx.fwPasswordErrorNumber);
                    return false;
                }

                if (!p1.match(/[!@#$%^&*()_-]/)) {
                    this.setError(txx.fwPasswordErrorSymbol);
                    return false;
                }

                if (p1 !== p2) {
                    this.setError(txx.fwPasswordErrorMatch);
                    return false;
                }
            }

            this.clearError();
            return true;
        }
    }
})();