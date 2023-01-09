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
register(class WPopupMenu extends Widget {
    constructor() {
        super('div');
        this.showing = false;
        this.setWidgetStyle('popup-menu');
    }

    attach(widget, opts) {
    }

    close() {
        if (this.parent() && this.showing) {
        }

        return this;
    }

    detach() {
    }

    open() {
        if (this.parent() && !this.showing) {
        }

        return this;
    }
});


/*****
*****/
register(class WMenuItem extends Widget {
    constructor(text, image, shortcut) {
        super('span');
        this.setWidgetStyle('popup-menu-item');
        this.append(text);

        if (image) {
        }

        this.on('html.click', message => this.onClick(message));
    }

    onClick(message) {
        console.log(message);
    }
});
