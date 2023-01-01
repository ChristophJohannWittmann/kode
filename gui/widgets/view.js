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
 * The WView class extends WPanel to provide features associated with a view.
 * A view is an area of the window, or all of it, that's a Wstack, on which
 * panels or views are pushed and popped.  What's really important about this
 * is the need to dynamically the WCtl objects in a WCtls panel in response to
 * events within the WStack and it's descenents.
*****/
register(class WView extends WPanel {
    static ctlsKey = Symbol('ctls');

    constructor(tagName, horz, fwd) {
        super(tagName ? tagName : 'div');

        this.nav = mkWNavBar();
        this.stack = mkWStack();

        this.append(this.nav);
        this.append(this.stack);

        this.done =
        mkWCtl()
        .set(txx.fwNavDone)
        .on('Widget.Click', async message => this.onDone());

        this.on('Widget.Changed', message => this.onChanged(message));
        this.on('Widget.Modified', message => this.onModified(message));
        this.on('Widget.Validity', message => this.onValidity(message));
    }

    async onChanged(message) {
        if (message.type == 'add') {
        }
        else if (message.type == 'remove') {
        }
        else {
        }
    }

    async onModified(message) {
    }

    async onValidity(message) {
    }

    pop() {
        if (this.stack.length() > 0) {
            let widget = this.stack.top();

            if (Array.isArray(widget[WView.ctlsKey])) {
                for (let ctl of widget[WView.ctlsKey].reverse()) {
                    this.nav.remove(ctl);
                }
            }

            if (this.stack.length() == 2) {
                this.nav.pop();
            }

            this.stack.pop();
        }

        return this;
    }

    push(widget) {
        if (this.stack.length() == 1) {
            this.nav.push(this.done);
        }

        if (this.stack.length() > 1) {
            if (this.stack.top() instanceof WPanel) {
            }
        }

        if (widget instanceof WPanel) {
            console.log('wiring in view...');
        }

        if (Array.isArray(widget[WView.ctlsKey])) {
            for (let ctl of widget[WView.ctlsKey].reverse()) {
                this.nav.push(ctl);
            }
        }

        this.stack.push(widget);
        return this;
    }

    top() {
        return this.stack.top();
    }
});
