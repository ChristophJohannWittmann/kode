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
 * An editable object is a base class for things that are user editable and
 * want to plug into the client widget framework.  For the basic framework,
 * the Input, WSelect, and WTextArea extend this class.  This class provides
 * the bookeeping mechanism for editable objects.  The extending class or sub
 * class need to override the following:
 * 
 *      subclassCheckValidity
 *      subclassGetValue
 *      subclassSetValue
 * 
 * In a sense, this base class provides the features or pattern for almost
 * any imaginable GUI input widget.  Hence, to make complex input widgets fit
 * into the framework, just develop them to extend WEditable.
*****/
register(class WEditable extends Widget {
    constructor(tagName) {
        super(tagName);
        this.value = '';
        this.valid = true;
        this.modified = false;
        this.setAttribute('tabindex', 0);
    }

    getValue() {
        return this.subclassGetValue();
    }

    isModified() {
        return this.value != this.subclassGetValue();
    }

    isValid() {
        return this.subclassCheckValidity();
    }

    async revert() {
        if (this.isModified()) {
            this.modified = false;
            this.subclassSetValue(this.value);

            this.send({
                messageName: 'Widget.Changed',
                type: 'value',
                widget: this,
                value: this.value,
            });

            this.send({
                messageName: 'Widget.Modified',
                widget: this,
                modified: false,
            });

            if (this.isValid() != this.valid) {
                this.valid = !this.valid;

                this.send({
                    messageName: 'Widget.Validity',
                    widget: this,
                    valid: this.valid,
                });
            }
        }

        return this;
    }

    setValue(value) {
        this.value = value;
        this.modified = false;
        this.subclassSetValue(value);
        let validity = this.isValid();

        if (this.isValid() != validity) {
            this.send({
                messageName: 'Widget.Validity',
                valid: validity,
                widget: this,
            });
        }

        this.valid = validity;
        return this;
    }

    subclassCheckValidity() {
        return true;
    }

    subclassGetValue() {
        return this.value;
    }

    subclassSetValue(value) {
    }

    valueChanged(value) {
        this.subclassSetValue(value);

        this.send({
            messageName: 'Widget.Changed',
            type: 'value',
            widget: this,
            value: value,
        });

        if (this.isModified() != this.modified) {
            this.modified = !this.modified;

            this.send({
                messageName: 'Widget.Modified',
                widget: this,
                modified: this.modified,
            });
        }

        if (this.isValid() != this.valid) {
            this.valid = !this.valid;

            this.send({
                messageName: 'Widget.Validity',
                widget: this,
                valid: this.valid,
            });
        }
    }
});
