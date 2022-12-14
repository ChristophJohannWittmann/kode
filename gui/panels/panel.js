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
register(class WPanel extends Widget {
    constructor() {
        super('table');
        super.setWidgetStyle('panel');

        super.append(mkWidget('tbody').append(
            mkWidget('tr').append(
                mkWidget('td').setWidgetStyle('panel-title').append(
                    mkWH2().setStyle('display', 'inline')
                ),
                mkWidget('td').setWidgetStyle('panel-ctls').append(
                    mkWHotSpot().set('action-goes-here'),
                ),
            ),
            mkWidget('tr').append(
                mkWidget('td')
                .setAttribute('colspan', '2')
                .setWidgetStyle('panel-content')
            )
        ));

        this.heading = super.childAt(0).childAt(0).setStyle('display', 'none');
        this.title = this.heading.childAt(0).childAt(0);
        this.ctls = this.heading.childAt(1);
        this.content = super.childAt(0).childAt(1).childAt(0);
        this.controls = {};
    }

    append(...args) {
        this.content.append(...args);
        return this;
    }

    childAt(index) {
        this.content.childAt(index);
        return null;
    }

    children() {
        return this.content.children();
    }

    clear() {
        this.content.clear();
        return this;
    }

    clearTitle() {
        this.title.set('');
        return this;
    }

    get() {
        return this.content.get();
    }

    getTitle() {
        return this.title.get();
    }

    hideHeading() {
        this.heading.setStyle('display', 'none');
        return this;
    }

    prepend(...args) {
        this.content.prepend(...args);
        return this;
    }

    set(innerHtml) {
        this.content.set(innerHtml);
        return this;
    }

    setTitle(title) {
        this.title.set(title);
        return this;
    }

    showHeading() {
        this.heading.setStyle('display', 'inline');
        return this;
    }

    [Symbol.iterator]() {
        return this.content[Symbol.iterator]();
    }
});
