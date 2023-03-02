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
    constructor(tagName, horz, fwd) {
        super(tagName ? tagName : 'div');

        this.nav = mkWNavBar();
        this.stack = mkWStack();
        this.append(this.nav);
        this.append(mkHtmlElement('hr'));
        this.append(this.stack);
        this.proxy = mkMessageProxy(this);

        this.done =
        mkWCtl()
        .set(txx.fwNavDone)
        .on('html.click', async message => this.onDone(message));

        this.cancel =
        mkWCtl()
        .set(txx.fwNavCancel)
        .on('html.click', async message => this.onCancel(message));

        this.on('Widget.Cancel', async message => await this.onCancel(message));
        this.on('Widget.Done', async message => await this.onDone(message));
    }

    getStack() {
        return this.stack;
    }

    length() {
        return this.stack.length;
    }

    async onCancel(message) {
        this.revert();
        this.invalid = 0;
        this.modified = 0;
        this.cancel.remove();
        this.done.enable();
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

        if (message.modified) {
            this.nav.push(this.cancel);
        }
        else {
            this.cancel.remove();
        }
    }

    async onValidity(message) {
        super.onValidity(message);
        message.valid ? this.done.enable() : this.done.disable();
    }

    pop() {
        let popped = this.stack.pop();
        let top = this.stack.top();

        if (this.stack.length() == 0) {
            let widget = this.nav.pop();
            this.unwire(widget);
        }

        if (top) {
            if (typeof top.isValid == 'function') {
                this.valid = top.isValid();
            }
            else {
                this.valid = true;
            }

            if (typeof top.isModified == 'function') {
                this.modified = top.isModified();
            }
            else {
                this.modified = false;
            }
        }
        else {
            this.valid = true;
            this.modified = false;
        }

        this.send({
            messageName: 'View.Pop',
            view: this,
            popped: popped,
        });

        return this;
    }

    promote(widget) {
        this.stack.promote(widget);

        this.send({
            messageName: 'View.Promote',
            view: this,
            widget: widget,
        });

        return this;
    }

    push(widget) {
        if (this.stack.length() == 0) {
            this.nav.push(this.done);
        }

        if (typeof widget.isValid == 'function') {
            this.valid = widget.isValid();
        }
        else {
            this.valid = true;
        }

        if (typeof widget.isModified == 'function') {
            this.modified = widget.isModified();
        }
        else {
            this.modified = false;
        }

        this.stack.push(widget);
        this.wire(widget);

        this.send({
            messageName: 'View.Push',
            view: this,
            widget: widget,
        });

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
