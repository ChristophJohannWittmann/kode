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
 * An HTML button element is very different than a type=button input element.
 * The button element's innerHTML is display on the browser, which makes the
 * button very powerful and even complex to use.  The WButton widget class is
 * the base class for a series of planned classes base around the HTML Button
 * Element.
*****/
register(class WButton extends Widget {
    constructor() {
        super('button');
        this.setButtonType();
        this.setWidgetStyle('buttontag');
    }

    setButtonType() {
        this.setAttribute('type', 'button');
        return this;
    }

    setResetType() {
        this.setAttribute('type', 'reset');
        return this;
    }

    setSubmitType() {
        this.setAttribute('type', 'submit');
        return this;
    }
});
