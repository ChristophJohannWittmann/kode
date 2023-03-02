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
        this.title = null;
        this.remainOpen = false;
        this.circuits = mkMessageProxy(this);
        this.setWidgetStyle('panel');

        this.invalid = 0;
        this.modified = 0;

        this.on('Widget.Changed', async message => await this.onChanged(message));
        this.on('Widget.Modified', async message => await this.onModified(message));
        this.on('Widget.Validity', async message => await this.onValidity(message));

        this.refreshers = mkStringSet();
        global.on('#NotifyClient', message => this.onNotify(message));
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

    clearRefreshers(...endpointNames) {
        this.refreshers.clear(...endpointNames);
        return this;
    }

    clearRemainOpen() {
        this.remainOpen = false;
        return this;
    }

    clearTitle() {
        if (this.title instanceof Widget) {
            this.title.remove();
            this.title = null;
        }

        return this;
    }

    getRemainOpen() {
        return this.remainOpen;
    }

    getTitle() {
        if (this.title) {
            return this.title.get();
        }
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
        return this.modified > 0;
    }

    isValid() {
        return this.invalid == 0;
    }

    async onChanged(message) {
    }

    async onModified(message) {
        message.modified ? this.modified++ : this.modified--;
    }

    onNotify(message) {
        if (this.refreshers.has(message.endpoint)) {
            this.refresh();
        }
    }

    async onValidity(message) {
        message.valid ? this.invalid-- : this.invalid++;
    }

    prepend(...args) {
        super.prepend(...args);

        for (let widget of args) {
            this.wire(widget);
        }

        return this;
    }

    async refresh() {
    }

    async revert() {
        this.invalid = 0;
        this.modified = 0;

        for (let widget of this) {
            if (typeof widget.revert == 'function') {
                await widget.revert();
            }
        }
    }

    async save() {
    }

    setRefreshers(...endpointNames) {
        this.refreshers.set(...endpointNames);
        return this;
    }

    setRemainOpen() {
        this.remainOpen = true;
        return this;
    }

    setTitle(title) {
        if (typeof title == 'string') {
            if (this.title) {
                this.clearTitle();
            }

            this.title = mkWidget('h3').set(title.trim()).setClassName('margin-left-6');
            this.prepend(this.title);
        }

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

    async update() {
        this.invalid = 0;
        this.modified = 0;

        for (let widget of this) {
            if (typeof widget.update == 'function') {
                await widget.update();
            }
        }
    }
});
