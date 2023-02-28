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
singleton(class Orgs {
    async createOrg(dbc, opts) {
    }

    async getOrg(dbc, arg) {
    }

    async list(dbc, name, status) {
        let filter = [];

        if (name !== undefined) {
            filter.push(`_name='${name}'`)
        }

        if (status !== undefined) {
            filter.push(`_status='${status}'`)
        }

        if (filter.length == 0) {
            filter.push('1=1');
        }

        return await selectDboOrg(dbc, filter.join(' AND '), '_name ASC');
    }

    async search(dbc, pattern) {
        return await selectDboOrg(dbc, `_name ~* '${pattern}'`, '_name ASC');
    }
});


/*****
*****/
register(class OrgObject extends DboOrg {
    constructor(properties) {
        super(properties);
    }
});