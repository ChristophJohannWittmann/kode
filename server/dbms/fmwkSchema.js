/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
 * This is the schema used by the basic framework infrastructure.  This schema
 * will support a lot of the essential administrative functions that are common
 * across all applications.  Hence, things such as authentication, user mgmt,
 * and session management are required by this schema.
*****/
exports = module.exports = opts => `[
    {
        name: 'lock',
        columns: [
            { name: 'orgOid',     type: dbInt64          },
            { name: 'userOid',    type: dbInt64          },
            { name: 'objectType', type: dbText, size: 50 },
            { name: 'objectOid',  type: dbInt64         },
        ],
        indexes: [
            'orgOid:asc',
            'userOid:asc',
            'objectOid:asc',
        ]
    },
    {
        name: 'user',
        columns: [
            { name: 'orgOid',    type: dbInt64           },
            { name: 'userName',  type: dbText, size: 100 },
            { name: 'title',     type: dbText, size:  50 },
            { name: 'firstName', type: dbText, size: 100 },
            { name: 'lastName',  type: dbText, size: 100 },
            { name: 'suffix',    type: dbText, size:  50 },
            { name: 'emailOid',  type: dbInt64           },
        ],
        indexes: [
            'userName:asc',
            'lastName:asc',
            'firstName:asc',
            'lastName:asc, firstName:asc',
        ]
    },
    {
        name: 'credentials',
        columns: [
            { name: 'ownerType',  type: dbText, size:   50 },
            { name: 'ownerOid',   type: dbInt64            },
            { name: 'account',    type: dbText, size:  100 },
            { name: 'password',   type: dbText, size: 1000 },
            { name: 'salt',       type: dbInt64            },
            { name: 'key',        type: dbText, size:  100 },
            { name: 'expiration', type: dbTime             },
        ],
        indexes: [
            'ownerType:asc',
        ]
    },
    {
        name: 'organization',
        columns: [
            { name: 'name', type: dbText, size: 50 },
            { name: 'type', type: dbText, size: 20 },
        ],
        indexes: [
            'name:asc, type:asc',
        ]
    },
    {
        name: 'uri',
        columns: [
            { name: 'ownerType', type: dbText, size:   20 },
            { name: 'ownerOid',  type: dbInt64            },
            { name: 'scheme',    type: dbText, size:   10 },
            { name: 'uri',       type: dbText, size:  200 },
            { name: 'host',      type: dbText, size:   20 },
            { name: 'user',      type: dbText, size:  200 },
            { name: 'domainOid', type: dbInt64            },
            { name: 'query',     type: dbText, size: 1000 },
            { name: 'fragment',  type: dbText, size: 1000 },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
        ]
    },
    {
        name: 'address',
        columns: [
            { name: 'ownerType',   type: dbText, size:  20 },
            { name: 'ownerOid',    type: dbInt64           },
            { name: 'street',      type: dbText, size: 100 },
            { name: 'building',    type: dbText, size:  50 },
            { name: 'poBox',       type: dbText, size:  20 },
            { name: 'city',        type: dbText, size: 100 },
            { name: 'region',      type: dbText, size: 100 },
            { name: 'postalCode',  type: dbText, size:  20 },
            { name: 'countryCode', type: dbText, size:   6 },
            { name: 'geo',         type: dbJson            },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
        ]
    },
]`;
