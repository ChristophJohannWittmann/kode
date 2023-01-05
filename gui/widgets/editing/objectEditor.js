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
 * The object editor provides a ready-made panel for viewing and editing objects.
 * There are two primary methods for adding fields to be edited: addDbo() and
 * addObj().  AddObj() are for objects in general, while addDbo() is specifically
 * written to facilitate editing of Dbo Objects by being aware of the semantics
 * of some of the common DBMS table columns.  This form automatically builds a
 * form-like table used for viewing and editing object properties.  Additionally,
 * each method accepts options data, which specifies editing and viewing options
 * for each field.
*****/
register(class WObjectEditor extends WTable {
    constructor(readonly) {
        super();
        this.invalid = 0;
        this.modified = false;
        this.unmodified = {};
        this.modifiable = mkActiveData();
        this.readonly = readonly ? readonly : false;
    }

    addDbo(dbo, options) {
        for (let property in dbo) {
            if (!property.startsWith('#')) {
                let value = dbo[property];

                if (typeof value != 'object' || value instanceof Time || value instanceof Date) {
                    let readonly = this.readonly;

                    if (options && options[property]) {
                        let opts = clone(options[property]);

                        if (!opts.hidden) {
                            this.unmodified[property] = value;
                            this.modifiable[property] = value;

                            if ('readonly' in opts) {
                                readonly = readonly || opts.readonly;
                            }

                            if (!('type' in opts)) {
                                opts.type = WScalar.selectType(this.modifiable[property]);
                            }

                            this.getBody().mkRowAppend()
                            .mkCellAppend(opts.label ? opts.label : property)
                            .mkCellAppend(
                                mkWScalar(this.modifiable, property, opts)
                                .on('Widget.Changed', message => this.onValueChanged(message))
                                .on('Widget.Validity', message => this.onValidityChanged(message))
                            );
                        }
                    }
                    else {
                        this.unmodified[property] = value;
                        this.modifiable[property] = value;
                        let readonly = this.readonly || WScalar.dboReadonlyByDefault(property);
                        let type = WScalar.selectType(this.modifiable[property]);
                        let opts = { readonly: readonly, type: type };

                        this.getBody().mkRowAppend()
                        .mkCellAppend(property)
                        .mkCellAppend(
                            mkWScalar(this.modifiable, property, opts)
                            .on('Widget.Changed', message => this.onValueChanged(message))
                            .on('Widget.Validity', message => this.onValidityChanged(message))
                        );
                    }
                }
            }
        }

        return this;
    }

    addObj(obj, options) {
        for (let property in obj) {
            if (!property.startsWith('#')) {
                let value = obj[property];

                if (typeof value != 'object' || value instanceof Time || value instanceof Date) {
                    let readonly = this.readonly;

                    if (options && options[property]) {
                        let opts = clone(options[property]);

                        if (!opts.hidden) {
                            this.unmodified[property] = value;
                            this.modifiable[property] = value;

                            if ('readonly' in opts) {
                                readonly = readonly || opts.readonly;
                            }

                            if (!('type' in opts)) {
                                opts.type = WScalar.selectType(this.modifiable[property]);
                            }

                            this.getBody().mkRowAppend()
                            .mkCellAppend(opts.label ? opts.label : property)
                            .mkCellAppend(
                                mkWScalar(this.modifiable, property, opts)
                                .on('Widget.Changed', message => this.onValueChanged(message))
                                .on('Widget.Validity', message => this.onValidityChanged(message))
                            );
                        }
                    }
                    else {
                        this.unmodified[property] = value;
                        this.modifiable[property] = value;
                        let type = WScalar.selectType(this.modifiable[property]);
                        let opts = { readonly: this.readonly, type: type };

                        this.getBody().mkRowAppend()
                        .mkCellAppend(property)
                        .mkCellAppend(
                            mkWScalar(this.modifiable, property, opts)
                            .on('Widget.Changed', message => this.onValueChanged(message))
                            .on('Widget.Validity', message => this.onValidityChanged(message))
                        );
                    }
                }
            }
        }

        return this;
    }

    fields() {
        const values = ActiveData.value(this.modifiable);
        return Object.entries(values).map(entry => ({ name: entry[0], value: entry[1] }));
    }

    isModified() {
        return !areEqual(this.unmodified, ActiveData.value(this.modifiable));
    }

    isValid() {
        return this.invalid == 0;
    }

    onValidityChanged(message) {
        if (message.valid) {
            this.invalid--;

            if (this.invalid == 0) {
                this.send({
                    messageName: 'Widget.Validity',
                    valid: true,
                    widget: this,
                })
            }
        }
        else {
            this.invalid++;

            if (this.invalid == 1) {
                this.send({
                    messageName: 'Widget.Validity',
                    valid: false,
                    widget: this,
                })
            }
        }
    }

    onValueChanged(message) {
        let modified = this.isModified();

        this.send({
            messageName: 'Widget.Changed',
            changed: message.widget,
            widget: this,
            type: 'value',
            modified: modified,
        });

        if (modified != this.modified) {
            this.modified = modified;
            
            this.send({
                messageName: 'Widget.Modified',
                widget: this,
                modified: this.modified,
            });
        }
    }

    async revert() {
        this.modified = false;

        for (let property in this.unmodified) {
            this.modifiable[property] = this.unmodified[property];
        }

        this.send({
            messageName: 'Widget.Modified',
            widget: this,
            modified: false,
        });

        return this;
    }

    async update() {
        this.modified = false;

        for (let property in this.unmodified) {
            this.unmodified[property] = this.modifiable[property];
        }

        this.send({
            messageName: 'Widget.Modified',
            widget: this,
            modified: false,
        });

        return this;
    }

    value() {
        return ActiveData.value(this.modifiable);
    }
});
