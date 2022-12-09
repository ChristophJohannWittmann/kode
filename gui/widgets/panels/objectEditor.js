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
register(class WObjectEditor extends WTable {
    constructor(readonly) {
        super();
        this.fields = mkActiveData();
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
                            this.fields[property] = value;

                            if ('readonly' in opts) {
                                readonly = readonly || opts.readonly;
                            }

                            if (!('type' in opts)) {
                                opts.type = WScalar.selectType(this.fields[property]);
                            }

                            this.getBody().mkRow()
                            .mkCell(opts.label ? opts.label : property)
                            .mkCell(mkWScalar(this.fields, property, opts));
                        }
                    }
                    else {
                        this.fields[property] = value;
                        let readonly = this.readonly || WScalar.dboReadonlyByDefault(property);
                        let type = WScalar.selectType(this.fields[property]);
                        let opts = { readonly: readonly, type: type };

                        this.getBody().mkRow()
                        .mkCell(property)
                        .mkCell(mkWScalar(this.fields, property, opts));
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
                            this.fields[property] = value;

                            if ('readonly' in opts) {
                                readonly = readonly || opts.readonly;
                            }

                            if (!('type' in opts)) {
                                opts.type = WScalar.selectType(this.fields[property]);
                            }

                            this.getBody().mkRow()
                            .mkCell(opts.label ? opts.label : property)
                            .mkCell(mkWScalar(this.fields, property, opts));
                        }
                    }
                    else {
                        this.fields[property] = value;
                        let type = WScalar.selectType(this.fields[property]);
                        let opts = { readonly: this.readonly, type: type };

                        this.getBody().mkRow()
                        .mkCell(property)
                        .mkCell(mkWScalar(this.fields, property, opts));
                    }
                }
            }
        }

        return this;
    }

    value() {
        return ActiveData.value(this.fields);
    }
});
