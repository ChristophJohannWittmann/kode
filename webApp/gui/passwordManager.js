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


(() => {
    /*****
    *****/
    register(class PasswordManager extends WPanel {
        constructor(authorized, email) {
            super();
            this.setStyle({
                marginLeft: '8px',
                marginRight: '8px',
            })

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwPasswordTitle)
            );

            this.controller = mkActiveData({
                email: email,
                authorization: '',
                password1: '',
                password2: '',
            });

            this.stm = mkWStateMachine(this, ['authorizing', 'entry']);
            this.stm.disableUpdates();
            this.stm.appendChild(new AuthForm(), 'Authorization', ['authorizing']);
            this.stm.appendChild(new EntryForm(), 'Entry', ['entry']);
            this.stm.setMode(authorized === true ? 'entry' : 'authorizing');
            this.stm.enableUpdates();
        }

        async revert() {
        }

        async save() {
        }
    });


    /*****
    *****/
    class AuthForm extends Widget {
        constructor() {
            super();
        }

        build() {
            this.append(
                mkWidget()
                .setStyle('margin-bottom', '16px')
                .setInnerHtml(txx.fwPasswordStep1)
            );

            this.append(
                mkWButton()
                .setStyle('margin-right', '20px')
                .setInnerHtml(txx.fwPasswordSendCode)
                .on('dom.click', message => {
                    this.append(this.step2a, this.step2b);
                    this.step2b.focus();
                })
            );

            this.append(
                mkWidget('span')
                .bind(this.getOwner().controller, 'email')
            );

            this.step2a = mkWidget()
            .setStyle('margin-top', '30px')
            .setInnerHtml(txx.fwPasswordStep2);

            this.step2b = mkIDynamic(500)
            .setStyle('margin-top', '16px')
            .bind(this.getOwner().controller, 'authorization', Binding.valueBinding)
            .on('Input.Pause', message => console.log(message))
        }
    }


    /*****
    *****/
    class EntryForm extends WEditable {
        constructor() {
            super();

            this.grid = mkWGrid({
                rows: ['48px', '10px', '48px'],
                cols: ['auto', '20px', 'auto'],
            });

            this.grid.setAt(0, 0,
                mkWidget('div')
                .setClassNames('font-size-5 flex-h-sc')
                .setInnerHtml(txx.fwPasswordEnter)
            );

            this.grid.setAt(2, 0,
                mkWidget('div')
                .setClassNames('font-size-5 flex-h-sc')
                .setInnerHtml(txx.fwPasswordConfirm)
            );

            this.grid.setAt(0, 2, 
                mkIPassword()
                .setClassNames('font-size-5 margin-right-8 flex-h-sc')
                //.bind(this.getOwner().controller.password1, 'password', Binding.valueBinding)
            )

            this.grid.setAt(2, 2, 
                mkIPassword()
                .setClassNames('font-size-5 margin-right-8 flex-h-sc')
                //.bind(this.getOwner().password2, 'confirm', Binding.valueBinding)
            )
        }

        subclassCheckValidity() {
            return true;
        }

        subclassGetValue() {
            return this.value;
        }
    }
})();