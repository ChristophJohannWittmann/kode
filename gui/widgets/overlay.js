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
register(class WOverlay extends Widget {
    static nextZ = 100;

    constructor(opts) {
        super('div');
        this.settings = {};
        this.blurred = null;
        this.overlaid = null;
        this.opts = typeof opts == 'object' ? opts : new Object();
        this.settings.position = 'absolute';
        this.settings.zIndex = WOverlay.nextZ++;
        this.settings.backgroundColor = typeof opts.backgroundColor == 'string' ? opts.backgroundColor : '#F7F7F7';
        this.settings.opacity = this.opts.opacity ? this.opts.opacity.toString() : .4;
    }

    center() {

    }

    hide() {
        if (this.overlaid) {
            this.remove();
            this.overeload = null;
            this.blurred ? this.blurred.focus() : false;
        }

        return this;
    }

    showOver(arg) {
        if (!this.overlaid) {
            this.overlaid = mkHtmlElement(reducio(arg)).widget();
            this.overlaidOffset = this.overlaid.getOffset();

            for (let item of ['left', 'top', 'width', 'height']) {
                if (typeof this.opts[item] == 'string') {
                    this.settings[item] = this.opts[item];
                }
                else if (typeof this.opts[item] == 'number') {
                    this.settings[item] = `${this.opts[item]}px`;
                }
                else {
                    this.settings[item] = `${this.overlaidOffset[item]}px`;
                }
            }

            this.setStyle(this.settings);
            this.overlaid.append(this);

            this.blurred = doc.activeElement();
            this.blurred.blur();
        }

        return this;
    }
});
