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
 * Helper to manage the maxlength and minlength properties on an HTML input
 * widget.  Maxlength specifies a length cutoff for text input type inputs.
 * This also includes tel, email, and other indeterminate text input types.
*****/
register(class LengthHelper extends Helper {
    constructor(widget) {
        super(widget);
    }

    helperClearMaxLength() {
        this.setAttribute.clearAttribute('maxlenth');
    }

    helperClearMinLength() {
        this.setAttribute.clearAttribute('maxlength');
    }

    helperGetMaxLength() {
        if (this.hasAttribute('maxlength')) {
            return this.getAttribute('maxlenngth');
        }

        return null;
    }

    helperGetMinLength() {
        if (this.hasAttribute('minlength')) {
            return this.getAttribute('minlength');
        }

        return null;
    }

    helperSetMaxLength(maxlength) {
        this.setAttribute('maxlength', maxlength);
    }

    helperSetMinLength(minlength) {
        this.setAttribute('minlength', minlength);
    }
});
