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
singleton(class Templates {
    async getTemplate(dbc, oid) {
    }

    async list(dbc, name) {
        let filter = [];

        if (name !== undefined) {
            filter.push(`_name='${name}'`)
        }

        if (filter.length == 0) {
            filter.push('1=1');
        }

        return await selectDboOrg(dbc, filter.join(' AND '), '_name ASC limit 20');
    }

    async search(dbc, orgOid, pattern) {
        /*
        return [
            mkTemplateObject({
                oid: 3n,
                orgOid: 2n,
                ownerType: 'DboOrg',
                ownerOid: 2n,
                name: 'User Verify',
                parts: [
                    { name: 'body', mime: 'text/html', b64: 'PGh0bWw+CiAgICA8aGVhZD4KICAgIDwvaGVhZD4KICAgIDxib2R5PgogICAgICAgIDxoMT5QbGVhc2UgVmVyaWZ5IFlvdXJzZWxmPC9oMT4KICAgIDwvYm9keT8KPC9odG1sPg==' },
                    { name: 'subject', mime: 'text/plain', b64: `PGh0bWw+CiAgICA8aGVhZD4KICAgIDwvaGVhZD4KICAgIDxib2R5PgogICAgICAgIDxoMT5QbGVhc2UgVmVyaWZ5IFlvdXJzZWxmPC9oMT4KICAgIDwvYm9keT8KPC9odG1sPg==` },
                ]
            })
        ];
        */

        try {
            if (pattern.indexOf('*') >= 0) {
                return (await selectDboTemplate(dbc, `_org_oid=${orgOid}`, '_name ASC limit 20'))
                .map(dboTemplate => mkTemplateObject(dboTemplate));
            }
            else {
                return (await selectDboTemplate(dbc, `_name ~* '${pattern}' AND _org_oid=${orgOid}`, '_name ASC limit 20'))
                .map(dboTemplate => mkTemplateObject(dboTemplate));
            }
        }
        catch (e) {
            return [];
        }
    }
});


/*****
*****/
register(class TemplateObject extends DboTemplate {
    constructor(properties) {
        super(properties);
    }

    getName() {
        return this.name;
    }

    getPartNames() {
        return Object.keys(this.parts);
    }

    [Symbol.iterator]() {

    }
});