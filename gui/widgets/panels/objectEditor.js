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
        return this;
    }

    addObj(obj, options) {
        if (options) {
            for (let property in obj) {
                if (!property.startsWith('#')) {
                    if (typeof obj[property] != 'object') {
                        if (property in options) {
                            this.fields[property] = obj[property];
                            let opts = options[property];

                            this.getBody().mkRow()
                            .mkCell(opts.label ? opts.label : property)
                            .mkCell(mkWActiveValue(this.fields, property, opts));
                        }
                    }
                }
            }
        }
        else {
            for (let property in obj) {
                if (!property.startsWith('#')) {
                    if (typeof obj[property] != 'object') {
                        this.fields[property] = obj[property];

                        this.getBody().mkRow()
                        .mkCell(property)
                        .mkCell(mkWActiveValue(this.fields, property, { type: ValueTypeText }));
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
