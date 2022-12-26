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
 * The framework provides various different classes of navbars, some with hooks
 * for a specific look and feel and some that are expandable and customiablable.
 * Navbars may appear anywhere in the application.  The primary requirements for
 * a real navbar is that extends WPanel, which is the primary widget type that's
 * a container for several child widgets.  The WNavBar01 is like a heading or
 * horizontal title bar at the top of some panel.  The left contains a title,
 * image or organization logo, while the right is a dedicated area for controls.
*****/
register(class WNavBar01 extends WPanel {
    constructor() {
        super();
        this.ctlMap = {};
        this.nameMap = new WeakMap();
        this.info = mkWidget('div');
        this.ctls = mkWidget('div');
        this.append(this.info, this.ctls);
        this.setWidgetStyle('navbar01');
    }

    appendCtl(name, ctl) {
        if (ctl instanceof WCtl && !(name in this.ctlMap)) {
            ctl.setClassName(`${this.getWidgetStyle()}-ctl`);
            this.ctls.append(ctl);
            this.ctlMap[name] = ctl;
        }

        return this;
    }

    clearCtls() {
        this.ctlMap = {};
        this.ctls.clear();
        this.nameMap = new WeakMap();
        return this;
    }

    getCtl(name) {
        return this.ctlMap[name];
    }

    getCtlAt(index) {
        return this.ctls.childAt(index);
    }

    getInfo() {
        let info = this.ctls.children();
        return info.length ? info[0] : null;
    }

    getLength() {
        return this.ctls.children().length();
    }

    insertCtlAfter(anchorName, name, ctl) {
        if (anchorName in this.ctlMap && !(name in this.ctlMap)) {
            let anchor = this.ctlMap[anchorName];
            ctl.setClassName(`${this.getWidgetStyle()}-ctl`);
            anchor.insertAfter(anchor, ctl);
            this.ctlMap[name] = ctl;            
        }

        return this;
    }

    insertCtlBefore(ctlName, name, ctl) {
        if (anchorName in this.ctlMap && !(name in this.ctlMap)) {
            if (ctl instanceof WCtl) {
                let anchor = this.ctlMap[anchorName];
                ctl.setClassName(`${this.getWidgetStyle()}-ctl`);
                anchor.insertBefore(anchor, ctl);
                this.ctlMap[name] = ctl;            
            }
        }

        return this;
    }

    popCtl() {
        if (this.ctls.length()) {
            let ctl = this.ctls.childAt(0);
            ctl.remove();
            return ctl;
        }

        return null;
    }

    prependCtl(name, ctl) {
        if (ctl instanceof WCtl && !(name in this.ctlMap)) {
            if (ctl instanceof WCtl) {
                ctl.setClassName(`${this.getWidgetStyle()}-ctl`);
                this.ctls.prepend(ctl);
                this.ctlMap[name] = ctl;
            }
        }

        return this;
    }

    pushCtl(name, ctl) {
        return this.prependCtl(name, ctl);
    }

    removeCtl(name) {
        if (name in this.ctlMap) {
            let ctl = this.ctlMap[name];
            delete this.ctlMap[name];
            ctl.remove();
        }

        return this;
    }

    setInfo(arg) {
        this.info.clear();
        this.info.append(arg);
        return this;
    }

    setWidgetStyle(widgetStyle) {
        if (widgetStyle.startsWith('navbar')) {
            super.setWidgetStyle(widgetStyle);

            if (this.info) {
                this.info.setWidgetStyle(`${widgetStyle}-info`);
                this.ctls.setWidgetStyle(`${widgetStyle}-ctls`);
            }

            for (let ctl of this) {
            }
        }
    }

    shiftCtl() {
        if (this.ctls.length()) {
            let children = this.ctls.children();
            let ctl = children[children.length - 1];
            ctl.remove();
            return ctl;
        }

        return null;
    }

    unshiftCtl(name, ctl) {
        return this.appendCtl(name, ctl);
    }

    [Symbol.iterator]() {
        return this.ctls.children()[Symbol.iterator]();
    }
});
