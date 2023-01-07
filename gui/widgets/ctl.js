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

        this.setMenu(
            mkWPopupMenu()
        );
    }

    disable() {
        super.disable();
        this.setWidgetStyle(`${this.getWidgetStyle()}-disabled`);
        return this;
    }

    enable() {
        super.enable();
        this.setWidgetStyle(this.getWidgetStyle().replace('-disabled', ''));
        return this;
    }
});


/*****
 * In essence, the WCtls widget manages a rectangular space on the GUI with a set
 * of contorllers or ctls.  Each ctl must extend WCtl and will be layed out in an
 * ordered manner in the specified direction: up, down, left, or right.  The WCtls
 * widget has the features necessary for a stack-like application area, because
 * the calling code can push() and pop() widgets on and off of the stack.  That
 * pushing and popping would presumeably bne driven by adding or removing a view
 * to that stack.
*****/
register(class WCtls extends Widget {
    constructor() {
        super('div');
        this.setDirection('rev');
        this.setOrientation('horz');
        this.map = new WeakMap();
    }

    clear() {
        this.clear();
        this.map = new WeakMap();
        return this;
    }

    getAll() {
        return this.children();
    }

    getAt(index) {
        return this.childAt(index);
    }

    insertAfter(anchor, ctl) {
        if (this.map.has(anchor) && !this.map.has(ctl)) {
            ctl.setWidgetStyle(`${this.getWidgetStyle()}-ctl`);
            this.dir == 'fwd' ? anchor.insertAfter(ctl) : this.anchor.insertBefore(ctl);
            this.ctlMap.set(ctl, ctl);
        }

        return this;
    }

    insertBefore(anchor, ctl) {
        if (this.map.has(anchor) && !this.map.has(ctl)) {
            ctl.setWidgetStyle(`${this.getWidgetStyle()}-ctl`);
            this.dir == 'fwd' ? anchor.insertBefore(ctl) : this.anchor.insertAfter(ctl);
            this.ctlMap.set(ctl, ctl);
        }

        return this;
    }

    length() {
        return this.children().length;
    }

    pop() {
        if (this.length() > 0) {
            let ctl = this.dir == 'fwd' ? this.children()[this.length() - 1] : this.children()[0];
            this.map.delete(ctl);
            ctl.remove();
        }

        return this;
    }

    push(ctl) {
        if (ctl instanceof WCtl && !this.map.has(ctl)) {
            ctl.setWidgetStyle(`${this.getWidgetStyle()}-ctl`);
            this.map[name] = ctl;
            this.dir == 'fwd' ? this.append(ctl) : this.prepend(ctl);
        }

        return this;
    }

    removeAt(index) {
        if (this.lenth() > 0) {
            if (this.index < this.length()) {
                let ctl = this.children()[index];
                this.map.delete(ctl);
                ctl.remove();
            }
        }
    }

    remove(ctl) {
        if (this.map.has(ctl)) {
            this.map.delete(ctl);
            ctl.remove();
        }

        return this;
    }

    setDirection(dir) {
        if (dir in { fwd:0, rev:0 }) {
            this.dir = dir;
        }

        return this;
    }

    setOrientation(orientation) {
        if (orientation in { horz:0, vert:0 }) {
            this.orientation = orientation;
            this.setWidgetStyle(`ctls-${orientation}`);
        }

        return this;
    }

    shift() {
        if (this.length() > 0) {
            let ctl = this.dir == 'fwd' ? this.children()[0] : this.children()[this.length() - 1];
            this.map.delete(ctl);
            ctl.remove();
        }

        return this;
    }

    unshift(ctl) {
        if (ctl instanceof WCtl && !this.map.has(ctl)) {
            ctl.setWidgetStyle(`${this.getWidgetStyle()}-ctl`);
            this.map[name] = ctl;
            this.dir == 'fwd' ? this.prepend(ctl) : this.append(ctl);
        }

        return this;
    }
});
