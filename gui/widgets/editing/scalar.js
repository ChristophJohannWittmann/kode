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
(() => {
    function createScalarClass(info) {
        eval(`
            register(class W${info.name} extends ${info.base} {
                constructor(activeData, key, opts) {
                    super();
                    this.bind(activeData, key);
                    opts.readonly ? this.disable() : this.enable();

                    if (this instanceof WSelect) {
                        this.setOptions(opts.choices);
                    }

                    if (opts.menu instanceof WPopupMenu) {
                        this.setMenu(opts.menu);
                    }
                }
                /*
                disable() {
                    super.disable();
                    return this;
                }

                enable() {
                    super.enable();
                    return this;
                }
                */
            });
        `);
    }

    for (let scalarInfo of [
        { name: 'ScalarBool', base: 'ICheckbox' },
        { name: 'ScalarColor', base: 'IColor' },
        { name: 'ScalarDate', base: 'IDate' },
        { name: 'ScalarDateTime', base: 'IDateTime' },
        { name: 'ScalarEmail', base: 'IEmail' },
        { name: 'ScalarEnum', base: 'WSelect' },
        { name: 'ScalarHost', base: 'IHost' },
        { name: 'ScalarHotSpot', base: 'WHotSpot' },
        { name: 'ScalarIp', base: 'IIp' },
        { name: 'ScalarMonth', base: 'IMonth' },
        { name: 'ScalarNumber', base: 'INumber' },
        { name: 'ScalarTel', base: 'ITel' },
        { name: 'ScalarText', base: 'IText' },
        { name: 'ScalarTime', base: 'ITime' },
        { name: 'ScalarUrl', base: 'IUrl' },
        { name: 'ScalarWeek', base: 'IWeek' },
    ]) {
        createScalarClass(scalarInfo);
        eval(`define('${scalarInfo.name}', mkW${scalarInfo.name})`);
    }
})();


/*****
*****/
register(function scalarDboDefaultsToReadOnly(property) {
    return property in {
        oid: 0,
        created: 0,
        updated: 0,
    };
});


/*****
*****/
register(function scalarSelectType(value) {
    if (typeof value == 'object') {
        if (value instanceof Date || value instanceof Time) {
            return ScalarDateTime;
        }
    }
    else if (typeof value == 'number' || typeof value == 'bigint') {
        return ScalarNumber;
    }
    else if (typeof value == 'boolean') {
        return ScalarBool;
    }

    return ScalarText;
});