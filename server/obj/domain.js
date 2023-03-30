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
 * A developer-helper object that provides streamlined utilities for managing
 * internet domain database objects.  Some of these helper functions replace
 * single DboObject calls, while other replace multiple function calls.
*****/
singleton(class Domains {
    constructor() {
    }

    async ensureFromName(dbc, name) {
        let normal = name.toLowerCase().trim();
        let domain = await selectOneDboDomain(dbc, `_name=${dbc.str(dbText, normal)}`);

        if (!domain) {
            let segments = normal.split('.');

            domain = mkDboDomain({
                name: name,
                tld: segments[segments.length - 1],
                lastVerified: mkTime(0),
            });

            await domain.save(dbc);
        }

        return domain;
    }

    async getFromName(dbc, name) {
        let normal = name.toLowerCase().trim();
        return await selectOneDboDomain(dbc, `_name=${dbc.str(dbText, normal)}`);
    }

    async getFromOid(dbc, oid) {
        return await getDboDomain(dbc, oid);
    }
});
