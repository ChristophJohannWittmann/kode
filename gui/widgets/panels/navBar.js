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
 * a real navbar is that extends Widget, which is the primary widget type that's
 * a container for several child widgets.  The WNavBar01 is like a heading or
 * horizontal title bar at the top of some panel.  The left contains a title,
 * image or organization logo, while the right is a dedicated area for controls.
*****/
register(class WNavBar extends Widget {
    constructor() {
        super();
        this.ctls = mkWCtls();
        this.info = mkWidget('div');
        this.append(this.info, this.ctls);
        this.setOrientation('horz');
    }

    firstCtl() {
        let children = this.ctls.children();

        if (children.length) {
            return children[0];
        }

        return null;
    }

    getInfo() {
        let info = this.ctls.children();
        return info.length ? info[0] : null;
    }

    lastCtl() {
        let children = this.ctls.children();

        if (children.length) {
            return children[children.length - 1];
        }

        return null;
    }

    pop() {
        this.ctls.pop();
        return this;
    }

    push(ctl) {
        this.ctls.push(ctl)
        return this;
    }

    async revert() {
    }

    setInfo(arg) {
        this.info.clear();
        this.info.append(arg);
        return this;
    }

    setOrientation(orientation) {
        this.orientation = orientation;

        if (orientation in { vert:0, horz:0 }) {
            this.setWidgetStyle(`navbar-${this.orientation}`);
            this.info.setWidgetStyle(`navbar-info-${this.orientation}`)
        }

        return this;
    }
});
