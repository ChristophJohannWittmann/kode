/*****
 * Copyright (c) 2017-2023 Kode Programming
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
 * Together, WEditable and WEdtor provide the framework for managing editing
 * within the kodeJS application framework.  WEditable provides the features for
 * editing a single (scalar) value, whereas WEditor provides features to manage
 * an entire DOM branch of WEditable and/or WEditor descendants.  WEditor will
 * monitor all of it's descendants to provide a set of unified features to track
 * status and to perform actions such as update() or refert().
*****/
register(class WEditor extends Widget {
    constructor(tagName) {
        super(tagName ? tagName : 'form');
        this.invalid = 0;
        this.modified = 0;
        this.setWidgetStyle('editor');
    }

    enumerate() {
        let widgets = [];
        let stack = this.children();

        while (stack.length) {
            let docElement = stack.pop();

            if (docElement instanceof Widget) {
                if (docElement instanceof WEditor || docElement instanceof WEditable) {
                    widgets.push(docElement);
                }
                else if (docElement instanceof WScalar) {
                    widgets.push(docElement.editor);
                }
                else if (docElement instanceof Widget) {
                    docElement.children().reverse().forEach(child => stack.push(child));
                }
            }
        }

        return widgets;
    }

    ignore() {
        for (let widget of this.enumerate()) {
            super.ignore(widget, 'Widget.Modified', message => this.onChildModified(message));
            super.ignore(widget, 'Widget.Validity', message => this.onChildValidity(message));

            if (widget instanceof WEditor) {
                widget.ignore();
            }
        }

        return this;
    }

    isModified() {
        return this.modified > 0;
    }

    isValid() {
        return this.invalid == 0;
    }

    listen() {
        for (let widget of this.enumerate()) {
            super.listen(widget, 'Widget.Modified', message => this.onChildModified(message));
            super.listen(widget, 'Widget.Validity', message => this.onChildValidity(message));

            if (widget instanceof WEditor) {
                widget.listen();
            }
        }

        return this;
    }

    onChildModified(message) {
        if (message.modified) {
            this.modified++;

            if (this.modified == 1) {
                this.send({
                    messageName: 'Widget.Modified',
                    modified: true,
                    widget: this,
                });
            }
        }
        else {
            this.modified--;

            if (this.modified == 0) {
                this.send({
                    messageName: 'Widget.Modified',
                    modified: false,
                    widget: this,
                });
            }
        }
    }

    onChildValidity(message) {
        if (message.valid) {
            this.invalid--;

            if (this.invalid == 0) {
                this.send({
                    messageName: 'Widget.Validity',
                    valid: true,
                    widget: this,
                });
            }
        }
        else {
            this.invalid++;

            if (this.invalid == 1) {
                this.send({
                    messageName: 'Widget.Validity',
                    valid: false,
                    widget: this,
                });
            }
        }
    }

    async refresh() {
        this.invalid = 0;
        this.modified = 0;

        this.send({
            messageName: 'Widget.Modified',
            widget: this,
            modified: false,
        });

        this.send({
            messageName: 'Widget.Validity',
            widget: this,
            value: true,
        });

        this.restorePanelState();
        return this;
    }

    async revert() {
        for (let widget of this.enumerate()) {
            await widget.revert();
        }

        this.modified = 0;
        return this;
    }

    async save() {
        return this;
    }
});