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
 * Panel is the base class for "complex" widgets, which represent a substantial
 * part or all of a visual feature.  The panel works with the application object
 * to provide the implicet navigation for pushing and popping views on a stack.
 * The heading is a strip at the top of the page containing implicit navigation
 * controls and a logo or title or some other such branding or informational
 * data.  The heading can either be shown or hidden.
*****/
register(class WPanel extends Widget {
    static wires = mkStringSet(
        'Widget.Changed',
        'Widget.Modified',
        'Widget.Validity',
    );

    constructor(tagName) {
        super(tagName ? tagName : 'div');
        this.circuits = mkMessageProxy(this);
        this.setWidgetStyle('panel');
        this.valid = true;
        this.modified = false;
    }

    append(...args) {
        super.append(...args);

        for (let widget of args) {
            this.wire(widget);
        }

        return this;
    }

    clear() {
        for (let widget of this.children()) {
            this.unwire(widget);
        }

        super.clear();
        return this;
    }

    insertAfter(...args) {
        super.insertAfter(...args);

        for (let widget of args) {
            this.wire(widget);
        }

        return this;
    }

    insertBefore(...args) {
        super.insertBefore(...args);

        for (let widget of args) {
            this.wire(widget);
        }

        return this;
    }

    isModified() {
        return this.modified;
    }

    isValid() {
        return this.valid;
    }

    async onChanged(message) {
    }

    async onModified(message) {
        this.modified = message.modified;
    }

    async onValidity(message) {
        this.valid = message.valid;
    }

    prepend(...args) {
        super.prepend(...args);

        for (let widget of args) {
            this.wire(widget);
        }

        return this;
    }

    async revert() {
        return this;
    }

    async save() {
        return this;
    }

    wire(widget) {
        for (let wire of WPanel.wires) {
            this.circuits.route(widget, wire);
        }
    }

    unwire(widget) {
        for (let wire of WPanel.wires) {
            this.circuits.unroute(widget, wire);
        }
    }
});
