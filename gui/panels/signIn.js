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
register(class SignIn extends PanelWidget {
    constructor() {
        super('div');

        this.layout = mkGridLayout(this, {
            rows: ['auto', '350px', 'auto'],
            rowGap: '0px',
            cols: ['auto', '400px', 'auto'],
            colGap: '0px',
        });

        this.credentials = mkActiveData({
            forgotPassword: false,
            username: 'chris.wittmann@infosearch.online',
            password: 'a very unbreakable password',
            dropdown: 'no',
            essay: 'hello essay.  tab here\nbefore this stuff here.',
            buttonText: 'Hello Button',
        });

        /*
        ActiveData.on(this.credentials, message => {
            if (message.action == 'change') {
                console.log(message.newValue);
            }
        });
        */

        this.createChallengeForm();
        this.createForgotEmailForm();
        this.createForgotPasswordForm();

        this.layout.setAt(1, 1, this.challengeForm);
        /*
        this.layout.setAt(1, 1,
            mkWText(EssayEntryFilter)
            .set('hello text area')
            .setClassName('fill')
            .setAttribute('autofocus')
            .bind(this.credentials, 'essay')
        );
        */
    }

    createChallengeForm() {
        this.challengeForm = mkWForm()
        .setClasses('flex-h-cc colors-2 border-style-solid border-width-1 border-radius-2');

        this.challengeLayout = mkGridLayout(this.challengeForm, {
            rows: ['6fr', 'auto', '3px', 'auto', '8px', 'auto', '3px', 'auto', '25px', 'auto', '8px', 'auto', '2fr'],
            cols: ['350px'],
        });

        this.challengeLayout.setAt(1, 0, mkWidget('div').set('Username').setClassName('flex-h-sc'));
        this.challengeLayout.setAt(3, 0, mkEmailInput()
        .bind(this.credentials, 'username'))
        .setAttribute('autofocus')
        .setAttribute('autocomplete', 'email');

        this.challengeLayout.setAt(5, 0, mkWidget('div').set('Password').setClassName('flex-h-sc'));
        this.challengeLayout.setAt(7, 0, mkPasswordInput()
        .bind(this.credentials, 'password'))
        .setAttribute('autocomplete', 'current-password');

        this.challengeLayout.setAt(9, 0, mkWLink()
            .setHref('https://google.com')
            .set('Sign In')
            .setTarget('_blank')
            .setClassName('flex-h-sc')
        );

        /*
        this.challengeLayout.setAt(11, 0, mkWLink()
            .setHref('https://google.com')
            .set('Forgot Password')
            .setTarget('_blank')
            .setClassName('flex-h-sc',)
        );
        this.challengeLayout.setAt(11, 0, mkWPlaceholder(this.credentials, 'username'));
        */

        /*
        this.challengeLayout.setAt(11, 0,
            mkWSelect()
            .setOptions([
                { value: 'yes',    text: 'Yes',   disabled: false },
                { value: 'no',     text: 'No',    disabled: false },
                { value: 'maybe',  text: 'Maybe', disabled: false },
                { label: 'Alternative', options: [
                    { value: 'ja',       text: 'Ja',       disabled: false },
                    { value: 'nein',     text: 'Nein',     disabled: false },
                    { value: 'veleicht', text: 'Veleicht', disabled: false },
                ]}
            ])
            .setAttribute('multiple')
            .setAttribute('required')
            .bind(this.credentials, 'dropdown')
        );
        */

        this.challengeLayout.setAt(11, 0,
            mkWTextButton('Some Odd Button')
            //.on('html.click', message => console.log(message))
            //.bind(this.credentials, 'buttonText')
        );
    }

    createForgotEmailForm() {
    }

    createForgotPasswordForm() {
    }
});
