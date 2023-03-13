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
    constructor() {
        super('form');
        this.invalid = 0;
        this.modified = 0;
        this.listening = [];
        this.setWidgetStyle('editor');
        global.on('#NotifyClient', message => this.onServerNotify(message));
    }

    append(...args) {
        super.append(...args);
        return this;
    }

    clear() {
        this.children().forEach(child => this.ignore(child));
        super.clear();
        return this;
    }

    ignore() {
        for (let listener of this.listening) {
            listener.emitter.off(listener.messageName, listener.handler);
        }

        this.listening = {};
        return this;
    }

    insertAfter(...args) {
        super.insertAfter(...args);
        return this;
    }

    insertBefore(...args) {
        super.insertBefore(...args);
        return this;
    }

    isModified() {
        return this.modified > 0;
    }

    listen() {
        let stack = this.children();

        while (stack.length) {
            let item = stack.pop();

            if (item instanceof WEditor || item instanceof WEditable) {
                let modifiedHandler = message => this.onChildModified(message);
                let validityHandler = message => this.onChildValidity(message);
                item.on('Widget.Modified', modifiedHandler);
                item.on('Widget.Validity', validityHandler);
                this.listening.push({ messageName: 'Widget.Modified', emitter: item, handler: modifiedHandler });
                this.listening.push({ messageName: 'Widget.Validity', emitter: item, handler: validityHandler });
            }
            else if (item instanceof WScalar) {
                let modifiedHandler = message => this.onChildModified(message);
                let validityHandler = message => this.onChildValidity(message);
                item.editor.on('Widget.Modified', modifiedHandler);
                item.editor.on('Widget.Validity', validityHandler);
                this.listening.push({ messageName: 'Widget.Modified', emitter: item.editor, handler: modifiedHandler });
                this.listening.push({ messageName: 'Widget.Validity', emitter: item.editor, handler: validityHandler });
            }
            else if (item instanceof Widget) {
                item.children().forEach(child => stack.push(child));
            }
        }

        return this;
    }

    isValid() {
        return this.invalid == 0;
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

    onServerNotify(message) {
        if (this.refreshers.has(message.endpoint)) {
            this.refresh();
        }
    }

    prepend(...args) {
        super.prepend(...args);
        return this;
    }

    revert() {
        this.invalid = 0;
        this.modified = 0;            
    }

    async save() {
        return this;
    }

    async update() {
        this.invalid = 0;
        this.modified = 0;

        for (let docNode of this) {
            if (docNode instanceof WEditor) {
                await docNode.update();
            }
        }
    }
});