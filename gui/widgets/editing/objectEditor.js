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
 * The object editor provides a ready-made panel for viewing and editing objects.
 * There are two primary methods for adding fields to be edited: addDbo() and
 * addObj().  AddObj() are for objects in general, while addDbo() is specifically
 * written to facilitate editing of Dbo Objects by being aware of the semantics
 * of some of the common DBMS table columns.  This form automatically builds a
 * form-like table used for viewing and editing object properties.  Additionally,
 * each method accepts options data, which specifies editing and viewing options
 * for each field.
*****/
register(class WObjectEditor extends WEditor {
    constructor(readonly) {
        super();
        this.table = mkWTable();
        this.append(this.table);
        this.fields = mkActiveData();
    }

    add(obj, options) {
        for (let property in options) {
            let opts = Object.assign(new Object(), options[property]);
            let value = '';

            if (property in obj) {
                if (typeof obj[property] != 'object' || obj[property] instanceof Time || obj[property] instanceof Date) {
                    value = obj[property];
                }
            }

            if (!opts.hidden) {
                this.fields[property] = value;
                opts.readonly = opts.readonly === true;
                opts.disabled = opts.disabled === true;
                opts.type = opts.type ? opts.type : WScalar.selectType(value);

                this.table.append(
                    mkWTableRow().append(
                        mkWTableCell()
                        .setInnerHtml(opts.label ? opts.label : property),
                        mkWTableCell()
                        .setPanelState('focus', opts.focus)
                        .append(mkWScalar(this.fields, property, opts))
                        .setMenu(opts.menu)
                    )
                );
            }
        }

        for (let property in obj) {
            if (!(property in options)) {
                this.fields[property] = obj[property];
            }
        }

        return this;
    }

    addBreak(content) {
        this.table.append(
            mkWTableRow().append(
                mkWTableCell()
                .setAttribute('colspan', '2')
                .append(content)
            )
        );

        return this;
    }

    addField(property, value, options) {
        let opts = Object.assign(new Object(), options);

        if (typeof value == 'object' && !(value instanceof Time) && !(value instanceof Date)) {
            value = '';
        }

        if (!opts.hidden) {
            this.fields[property] = value;
            opts.readonly = opts.readonly === true;
            opts.disabled = opts.disabled === true;
            opts.type = opts.type ? opts.type : WScalar.selectType(value);
            let scalar;

            this.table.append(
                mkWTableRow().append(
                    mkWTableCell()
                    .setInnerHtml(opts.label ? opts.label : property),
                    mkWTableCell()
                    .setPanelState('focus', opts.focus)
                    .append((scalar = mkWScalar(this.fields, property, opts)))
                    .setMenu(opts.menu)
                )
            );

            if (opts.extra instanceof Widget) {
                scalar.setExtra(opts.extra);
            }
        }
    }

    getActiveData() {
        return this.fields;
    }

    getField(name) {
        for (let fieldName in ActiveData.value(this.fields)) {
            if (fieldName == name) {
                return this.fields[fieldName];
            }
        }
    }

    getFields() {
        const values = ActiveData.value(this.fields);
        return Object.entries(values).map(entry => ({ name: entry[0], value: entry[1] }));
    }

    getValues() {
        return ActiveData.value(this.fields);
    }
});
