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
 * An overlay is a SPAN element that's raised over the bottom layer of the doc.
 * Given that each overlay may have it's own z-index, overlays are able to
 * overlay each other.  The constructor's opts value normally specifies position,
 * which tells the overlay object how to arrange itself over the overlaid widget.
 * "fill" means that the overlay should exactly cover the overlaid widget
 * pursuiant to the "gap" property.  "center" means that the overlay is centered
 * over the overlaid widget but not match the size of the overlaid.
*****/
register(class WOverlay extends Widget {
    constructor(opts) {
        super('span');
        this.blurred = null;
        this.overlaid = null;
        this.opts = typeof opts == 'object' ? opts : new Object();

        if (!(this.opts.position in { fill:0, center:0 })) {
            this.opts.position = 'fill';
        }

        this.settings = {
            position: 'absolute',
            display: 'block',
        };
    }

    adjustArea() {
        let offset = this.overlaid.getOffset();

        if (this.opts.position == 'fill') {
            if (typeof this.opts.gap == 'number') {
                offset.left = offset.left + this.opts.gap;
                offset.top = offset.top + this.opts.gap;
                offset.width = offset.width - 2*this.opts.gap;
                offset.height = offset.height - 2*this.opts.gap;
            }
        }
        else if (this.opts.position == 'center') {
            let thisOffset = this.getOffset();

            let width = thisOffset.width;
            let height = thisOffset.height;

            if (typeof this.opts.minWidth == 'number') {
                width < this.opts.minWidth ? width = this.opts.minWidth : false;
            }

            if (typeof this.opts.minHeight == 'number') {
                height < this.opts.minHeight ? height = this.opts.minHeight : false;
            }

            let woff = Math.floor((offset.width - width)/2);
            let hoff = Math.floor((offset.height - height)/2);

            offset.left = offset.left + woff;
            offset.top = offset.top + hoff;
            offset.width = offset.width - 2*woff;
            offset.height = offset.height - 2*hoff;
        }

        this.settings.left = `${offset.left}px`;
        this.settings.top = `${offset.top}px`;
        this.settings.width = `${offset.width}px`;
        this.settings.height = `${offset.height}px`;
    }

    hide() {
        if (this.overlaid) {
            this.remove();
            this.overeload = null;
            this.blurred ? this.blurred.focus() : null;
        }

        return this;
    }

    show(htmlElement) {
        if (!this.overlaid) {
            this.overlaid = mkHtmlElement(unwrapDocNode(htmlElement)).widget();
            this.overlaid.append(this);

            this.adjustArea();
            this.setStyle(this.settings);

            this.blurred = doc.activeElement();
            this.blurred.blur();
        }

        return this;
    }
});
