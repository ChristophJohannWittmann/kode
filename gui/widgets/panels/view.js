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
 * A view is a standard framework widget used for framing the view on part of or
 * all of an application or web extension.  The WView widgets has a navigation
 * bar and a WStack for managing multiple widgets that can be viewed.  It's up
 * to the specific application to provide a navigation widget for perusing or
 * navigating the items in the WStack.  A typical application would display a
 * popup menu that's configured to select which of the existing views to promote
 * or whether to create and push a new view on the stack.  This is very much a
 * top-level web app layout.
*****/
(() => {
    const navKey = Symbol('nav');

    register(class WView extends Widget {
        constructor(tagName, horz, fwd) {
            super(tagName ? tagName : 'div');
            this.nav = mkWNavBar();
            this.stack = mkWStack();
            this.append(this.nav);
            this.append(this.stack);

            this.done =
            mkWCtl()
            .setInnerHtml(txx.fwNavDone)
            .setWidgetStyle('ctls-horz-ctl')
            .on('dom.click', async message => this.onDone(message));

            this.cancel =
            mkWCtl()
            .setInnerHtml(txx.fwNavCancel)
            .setWidgetStyle('ctls-horz-ctl')
            .on('dom.click', async message => this.onCancel(message));

            this.on('Widget.Cancel', async message => await this.onCancel(message));
            this.on('Widget.Done', async message => await this.onDone(message));

            this.done[navKey] = true;
            this.cancel[navKey] = true;
        }

        adjustCtls() {
            let top = this.stack.top();

            if (top) {
                let lastExternal = this.getLastExternalCtl();
                let valid = typeof top.isValid == 'function' ? top.isValid() : true;
                let modified = typeof top.isModified == 'function' ? top.isModified() : false;

                if (!this.nav.contains(this.done)) {
                    if (lastExternal) {
                        lastExternal.insertBefore(this.done);
                    }
                    else {
                        this.nav.ctls.prepend(this.done);
                    }
                }

                if (modified) {
                    if (!this.nav.contains(this.cancel)) {
                        this.done.insertBefore(this.cancel);
                    }

                    if (valid) {
                        top.getFlag('noclose') ? this.done.disable() : this.done.enable();
                    }
                    else {
                        this.done.disable();
                    }
                }
                else {
                    this.cancel.remove();
                    top.getFlag('noclose') ? this.done.disable() : this.done.enable();
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
                if (ctl[navKey]) {
                    break;
                }

                lastExternal = ctl;
            }

            return lastExternal;
        }

        listen(widget) {
            super.listen(widget, 'Widget.Modified', message => this.onTopModified(message));
            super.listen(widget, 'Widget.Validity', message => this.onTopValidity(message));
        }

        async onCancel(message) {
            let top = this.stack.top();

            if (typeof top.isModified != 'function' || top.isModified()) {
                await top.revert();
            }

            return this;
        }

        async onDone(message) {
            let top = this.stack.top();

            if (typeof top.isValid != 'function' || top.isValid()) {
                if (typeof top.isModified != 'function' || top.isModified()) {
                    if (typeof top.save == 'function') {
                        return await top.save();
                    }
                }

                this.pop();
            }

            return this;
        }

        onTopModified(message) {
            this.adjustCtls();
        }

        onTopValidity(message) {
            this.adjustCtls();
        }

        pop() {
            let popped = this.stack.pop();

            if (popped) {
                this.ignore();
                let top = this.stack.top();

                if (top) {
                    this.listen(top);
                }

                this.adjustCtls();

                this.send({
                    messageName: 'View.Pop',
                    view: this,
                    popped: popped,
                    top: top,
                });
            }

            return this;
        }

        promote(widget) {
            let top = this.stack.top();

            if (top && top.getFlag('transient')) {
                top.remove();
            }

            let demoted = this.stack.promote(widget);

            if (demoted) {
                this.ignore();
                this.listen(widget);
                this.adjustCtls();

                this.send({
                    messageName: 'View.Promote',
                    view: this,
                    promoted: widget,
                    demoted: demoted,
                });
            }

            return this;
        }

        push(widget) {
            let prior = this.stack.push(widget);

            if (prior && prior.getFlag('transient')) {
                prior.remove();
            }

            if (prior || this.stack.length() == 1) {
                this.ignore();
                this.listen(widget);
            }

            this.adjustCtls();

            this.send({
                messageName: 'View.Push',
                view: this,
                pushed: widget,
                prior: prior,
            });

            return this;
        }

        pushCtl(ctl) {
            ctl[navKey] = false;
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
    });
})();
