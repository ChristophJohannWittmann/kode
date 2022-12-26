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
 * A ctl is a small control providing the functionality required for controls
 * on a menu or navbar.  WCtl objects are implement with a SPAN and are here
 * to ensure a specific WCtl interface is implemented.  This base class contains
 * zero functionality, but is useful because it (1) defines the WCtl API, (2)
 * provides basic features, and (3) provides an empty stub API for features that
 * can be extended by derived classes.
*****/
register(class WCtl extends Widget {
    constructor() {
        super('div');
        this.menu = null;

        this.on('html.click', message => {
            this.send({
                messageName: 'Widget.Click',
                widget: this,
                event: message.event,
            });
        });

        this.on('html.dblclick', message => {
            this.send({
                messageName: 'Widget.DoubleClick',
                widget: this,
                event: message.event,
            });
        });

        doc.on('contextmenu', message => {
            if (Widget.widgetKey in message.event.target) {
                let widget = message.event.target[Widget.widgetKey];

                if (widget.selector == this.selector) {
                    message.event.preventDefault();
                    this.openMenu();
                }
            }
        });
    }

    closeMenu() {
        if (this.menu) {
        }

        return this;
    }

    disable() {
        return this;
    }

    enable() {
        return this;
    }

    openMenu() {
        if (this.menu) {
        }

        return this;
    }
});


/*****
*****/
register(class WCtls extends Widget {
    constructor(tagName) {
        super(tagName);
    }
});
