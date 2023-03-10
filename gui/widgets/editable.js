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
register(class WEditable extends Widget {
    constructor(tagName) {
        super(tagName);
        this.value = '';
        this.valid = true;
        this.modified = false;
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

    revert() {
        this.subclassSetValue(this.value);
        this.modified = false;
        this.valid = this.isValid();
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
                valid: true,
                widget: this,
            });
        }
    }
});
