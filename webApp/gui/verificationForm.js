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


/*****
 * There are multiple instances where it's smart from a security perspective to
 * perform a user verification before proceeding with an action.  Generally, the
 * mechanics of the operation is to send a code by either email or MMS to the
 * user.  The user then types delivered code into the awaiting verification page
 * to complete the verification action.
*****/
register(class VerificationForm extends Widget {
    constructor() {
        super('form');
        this.setAttribute('autocomplete', 'off');
        this.controller = mkActiveData();
        this.refresh();
    }

    async refresh() {
        this.clear();
        this.controller.digits = '';

        this.append(
            mkWidget('h3')
            .setInnerHtml(txx.fwVerificationTitle),

            mkWidget().append(
                mkWFraming().append(
                    mkWidget()
                    .setInnerHtml(txx.fwVerificationStep1)
                    .setStyle('margin-bottom', '15px'),

                    mkIButton()
                    .setValue(txx.fwVerificationSendCode)
                    .setStyle('margin-bottom', '12px')
                    .on('dom.click', message => this.requestCode()),
                )
            ),

            (this.step2 = mkWidget()).append(
                mkWFraming().append(
                    (this.step2a = mkWidget())
                    .setStyle('margin-bottom', '15px')
                    .setInnerHtml(txx.fwVerificationStep2),
                    
                    (this.step2b = mkIDynamic(900))
                    .setStyle('margin-bottom', '12px')
                    .bind(this.controller, 'digits', Binding.valueBinding)
                    .on('Input.Pause', message => this.validateCode()),
                )
            )
            .conceal(),

            (this.feedback = mkWidget()).append(
                mkWFraming().append(
                    this.failure = mkWidget()
                    .setInnerHtml(txx.fwVerificationFailure)
                    .conceal(),

                    this.success = mkWidget()
                    .setInnerHtml(txx.fwVerificationSuccess)
                    .conceal(),
                )
            ).conceal()
        );
    }

    async requestCode() {
        await queryServer({ messageName: 'SelfSendVerificationRequest' });
        this.step2.reveal();
        this.step2b.focus();
    }

    async validateCode() {
        this.feedback.reveal();

        let verificationCode = await queryServer({
            messageName: 'SelfValidateVerificationDigits',
            digits: this.controller.digits,
        });

        if (verificationCode) {
            this.failure.conceal();
            this.success.reveal();
            this.step2b.disable();
            await pauseFor(1200);

            this.send({
                messageName: 'Widget.Verified',
                verificationCode: verificationCode,
            });
        }
        else {
            this.success.conceal();
            this.failure.reveal();
        }
    }
});
