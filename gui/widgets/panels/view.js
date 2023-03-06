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
 * A view is an area of the window, or all of it, that's a WStack, on which
 * panels or views are pushed and popped.  What's really important about this
 * is the need to dynamically the WCtl objects in a WCtls panel in response to
 * events within the WStack and it's descendants.
*****/
register(class WView extends WPanel {
    static internalNav = Symbol('Internal');

    constructor(tagName, horz, fwd) {
        super(tagName ? tagName : 'div');
        this.nav = mkWNavBar();
        this.stack = mkWStack();
        this.append(this.nav);
        this.append(mkHtmlElement('hr'));
        this.append(this.stack);

        this.done =
        mkWCtl()
        .set(txx.fwNavDone)
        .setWidgetStyle('ctls-horz-ctl')
        .on('html.click', async message => this.onDone(message));

        this.cancel =
        mkWCtl()
        .set(txx.fwNavCancel)
        .setWidgetStyle('ctls-horz-ctl')
        .on('html.click', async message => this.onCancel(message));
        this.on('Widget.Cancel', async message => await this.onCancel(message));
        this.on('Widget.Done', async message => await this.onDone(message));

        this.done[WView.internalNav] = true;
        this.cancel[WView.internalNav] = true;
    }

    adjustCtls() {
        let top = this.stack.top();

        if (top) {
            let lastExternal = this.getLastExternalCtl();
            let valid = typeof top.isValid == 'function' ? top.isValid() : true;
            let modified = typeof top.isModified == 'function' ? top.isModified() : false;

            if (!this.done.parent()) {
                if (lastExternal) {
                    lastExternal.insertBefore(this.done);
                }
                else {
                    this.nav.ctls.prepend(this.done);
                }
            }

            if (modified) {
                if (!this.cancel.parent()) {
                    this.done.insertBefore(this.cancel);
                }

                if (valid) {
                    top.remainOpen ? this.done.disable() : this.done.enable();
                }
                else {
                    this.done.disable();
                }
            }
            else {
                this.cancel.remove();
                top.remainOpen ? this.done.disable() : this.done.enable();
            }
        }
        else {
            this.cancel.remove();
            this.done.remove();
        }
    }

    getLastExternalCtl() {
        let lastExternal = null;

        for (let ctl of this.nav.ctls.children().reverse()) {
            if (ctl[WView.internalNav]) {
                break;
            }

            lastExternal = ctl;
        }

        return lastExternal;
    }

    getStack() {
        return this.stack;
    }

    length() {
        return this.stack.length;
    }

    async onCancel(message) {
        if (this.isModified()) {
            await this.revert();
            this.adjustCtls();
        }

        return this;
    }

    async onDone(message) {
        if (this.isValid()) {
            if (this.isModified()) {
                await this.save();
            }

            this.pop();
        }
    }

    async onModified(message) {
        super.onModified(message);
        this.adjustCtls();
    }

    async onValidity(message) {
        await super.onValidity(message);
        this.adjustCtls();
    }

    pop() {
        if (this.stack.length()) {
            let popped = this.stack.top();
            this.stack.pop();
            this.adjustCtls();

            this.send({
                messageName: 'View.Pop',
                view: this,
                popped: popped,
            });
        }

        return this;
    }

    promote(widget) {
        if (this.stack.promote(widget)) {
            this.adjustCtls();

            this.send({
                messageName: 'View.Promote',
                view: this,
                widget: widget,
            });
        }

        return this;
    }

    push(widget) {
        if (this.stack.push(widget)) {
            this.adjustCtls();

            this.send({
                messageName: 'View.Push',
                view: this,
                widget: widget,
            });
        }

        return this;
    }

    pushCtl(ctl) {
        ctl[WView.internalNav] = false;
        let lastExternal = this.getLastExternalCtl();
        ctl.setWidgetStyle('ctls-horz-ctl');

        if (lastExternal) {
            lastExternal.insertBefore(ctl);
        }
        else {
            this.nav.ctls.prepend(ctl);
        }

        return this;
    }

    async revert() {
        super.revert();
        let top = this.top();

        if (top && typeof top.revert == 'function') {
            await top.revert();
        }
    }

    async save() {
        let top = this.top();

        if (top && typeof top.save == 'function') {
            await top.save();
        }
    }

    top() {
        return this.stack.top();
    }

    async update() {
        super.update();
        let top = this.top();

        if (top && typeof top.update == 'function') {
            await top.update();
        }
    }
});
