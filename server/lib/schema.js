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
 * The DBMS schemas that are standard or default to the server framework.  Each
 * defined schema is automatically loaded while bootstrapping the server and is
 * available to the server framework as well as other modules.  I've tried to
 * make separate logically organized schemas so that they may be replicated as
 * needed and found useful by outside module developers.
*****/
mkDbSchema(
    '##FRAMEWORK',
    true,
    {
        name: 'address',
        columns: [
            { name: 'ownerType',    type: dbText, size:  20 },
            { name: 'ownerOid',     type: dbInt64           },
            { name: 'street',       type: dbText, size: 100 },
            { name: 'building',     type: dbText, size:  50 },
            { name: 'suite',        type: dbText, size:  50 },
            { name: 'box',          type: dbText, size:  20 },
            { name: 'city',         type: dbText, size: 100 },
            { name: 'region',       type: dbText, size: 100 },
            { name: 'postalCode',   type: dbText, size:  20 },
            { name: 'countryCode',  type: dbText, size:   6 },
            { name: 'verified',     type: dbBool            },
            { name: 'lastVerified', type: dbTime            },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
        ]
    },
    {
        name: 'conf',
        columns: [
            { name: 'name',         type: dbText, size:   50 },
            { name: 'value',        type: dbJson, size: 2000 },
        ],
        indexes: [
            'name:asc',
        ]
    },
    {
        name: 'credentials',
        columns: [
            { name: 'userOid',    type: dbInt64            },
            { name: 'type',       type: dbText, size:   20 },
            { name: 'status',     type: dbText, size:   20 },
            { name: 'crypto',     type: dbText, size: 2000 },
            { name: 'expires',    type: dbTime             },
        ],
        indexes: [
            'userOid:asc',
        ]
    },
    {
        name: 'domain',
        columns: [
            { name: 'name',         type: dbText, size:  200 },
            { name: 'tld',          type: dbText, size:   20 },
            { name: 'verified',     type: dbBool             },
            { name: 'lastVerified', type: dbTime             },
        ],
        indexes: [
            'name:asc',
            'tld:asc',
        ]
    },
    {
        name: 'emailAddress',
        columns: [
            { name: 'ownerType',     type: dbText, size:   20 },
            { name: 'ownerOid',      type: dbInt64            },
            { name: 'domainOid',     type: dbInt64            },
            { name: 'user',          type: dbText, size:  200 },
            { name: 'addr',          type: dbText, size:  200 },
            { name: 'failed',        type: dbBool             },
            { name: 'optedOut',      type: dbBool             },
            { name: 'complained',    type: dbBool             },
            { name: 'verified',      type: dbBool             },
            { name: 'lastVerified',  type: dbTime             },
            { name: 'lastDelivered', type: dbTime             },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
            'domainOid:asc',
            'user:asc',
            'addr:asc',
            'failed:asc',
            'optedOut:asc',
            'complained:asc',
            'verified:asc',
        ]
    },
    {
        name: 'grant',
        columns: [
            { name: 'userOid',      type: dbInt64             },
            { name: 'context',      type: dbText,  size: 4000 },
        ],
        indexes: [
            'userOid:asc',
            'context:asc',
        ]
    },
    {
        name: 'httpLog',
        columns: [
            { name: 'ipAddr',       type: dbText, size:  50 },
            { name: 'cipher',       type: dbText, size:  50 },
            { name: 'method',       type: dbText, size:  20 },
            { name: 'url',          type: dbText, size: 400 },
            { name: 'headers',      type: dbJson            },
            { name: 'status',       type: dbInt32           },
        ],
        indexes: [
            'ipAddr:asc',
            'method:asc',
            'url:asc',
            'status:asc',
        ]
    },
    {
        name: 'msg',
        columns: [
            { name: 'category',     type: dbText, size:   20 },
            { name: 'bulk',         type: dbBool             },
            { name: 'status',       type: dbText, size:   20 },
            { name: 'reason',       type: dbText, size:   50 },
            { name: 'reasonType',   type: dbText, size:   50 },
            { name: 'reasonOid',    type: dbInt64            },
            { name: 'agent',        type: dbText, size:   50 },
            { name: 'msgid',        type: dbText, size:  100 },
        ],
        indexes: [
            'category:asc',
            'bulk:asc',
            'status:asc',
            'reason:asc',
            'reason:asc, reasonType:asc, reasonOid:asc',
            'reasonType:asc, reasonOid:asc',
            'msgid:asc',
        ]
    },
    {
        name: 'msgAttr',
        columns: [
            { name: 'msgOid',       type: dbInt64            },
            { name: 'mime',         type: dbText, size:  100 },
            { name: 'name',         type: dbText, size:   50 },
            { name: 'props',        type: dbJson, size:   -1 },
            { name: 'data',         type: dbText, size:   -1 },
        ],
        indexes: [
            'msgOid:asc',
        ]
    },
    {
        name: 'msgEndpoint',
        columns: [
            { name: 'msgOid',        type: dbInt64           },
            { name: 'category',      type: dbText, size:  30 },
            { name: 'userOid',       type: dbInt64           },
            { name: 'endpointType',  type: dbText, size:  20 },
            { name: 'endpointOid',   type: dbInt64           },
            { name: 'name',          type: dbText, size: 100 },
            { name: 'index',         type: dbInt32           },
            { name: 'status',        type: dbText, size:  20 },
        ],
        indexes: [
            'msgOid:asc',
            'userOid:asc',
            'endpointType:asc',
            'endpointOid:asc',
        ]
    },
    {
        name: 'org',
        columns: [
            { name: 'name',         type: dbText, size: 50 },
            { name: 'status',       type: dbText, size: 50 },
            { name: 'description',  type: dbText, size:100 },
            { name: 'authType',     type: dbText, size: 20 },
        ],
        indexes: [
            'name:asc',
            'status:asc',
            'status:asc, name:asc',
        ]
    },
    {
        name: 'phone',
        columns: [
            { name: 'ownerType',    type: dbText, size:    20 },
            { name: 'ownerOid',     type: dbInt64             },
            { name: 'country',      type: dbText, size:    10 },
            { name: 'number',       type: dbText, size:    30 },
            { name: 'canonical',    type: dbText, size:    50 },
            { name: 'mms',          type: dbBool              },
            { name: 'verified',     type: dbBool              },
            { name: 'lastVerified', type: dbTime              },
            { name: 'error',        type: dbText, size: 1000  },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
            'canonical:asc',
        ]
    },
    {
        name: 'setting',
        columns: [
            { name: 'ownerType',   type: dbText, size:   20 },
            { name: 'ownerOid',    type: dbInt64            },
            { name: 'name',        type: dbText, size:   50 },
            { name: 'value',       type: dbJson, size: 2000 },
        ],
        indexes: [
            'ownerType:asc, ownerOid:asc',
            'name:asc',
        ]
    },
    {
        name: 'systemLog',
        columns: [
            { name: 'message',     type: dbText, size: 2000 },
        ],
        indexes: [
        ]
    },
    {
        name: 'template',
        columns: [
            { name: 'orgOid',      type: dbInt64           },
            { name: 'ownerType',   type: dbText, size:  20 },
            { name: 'ownerOid',    type: dbInt64           },
            { name: 'name',        type: dbText, size: 100 },
            { name: 'content',     type: dbText, size:   0 },
        ],
        indexes: [
            'orgOid:asc',
            'ownerType:asc, ownerOid:asc',
        ]
    },
    {
        name: 'user',
        columns: [
            { name: 'emailOid',     type: dbInt64           },
            { name: 'firstName',    type: dbText, size: 100 },
            { name: 'lastName',     type: dbText, size: 100 },
            { name: 'title',        type: dbText, size:  20 },
            { name: 'suffix',       type: dbText, size:  20 },
            { name: 'status',       type: dbText            },
            { name: 'authType',     type: dbText, size:  20 },
            { name: 'verified',     type: dbBool            },
            { name: 'password',     type: dbBool            },
            { name: 'failures',     type: dbInt32           },
        ],
        indexes: [
            'lastName:asc',
            'firstName:asc',
            'lastName:asc, firstName:asc',
            'authType:asc',
        ]
    },
    {
        name: 'webappLog',
        columns: [
            { name: 'userOid',      type: dbInt64             },
            { name: 'session',      type: dbText,  size:  100 },
            { name: 'endpoint',     type: dbText,  size:   40 },
            { name: 'status',       type: dbText,  size:   40 },
            { name: 'request',      type: dbJson              },
            { name: 'error',        type: dbText,  size: 1000 },
        ],
        indexes: [
            'userOid:asc',
            'session:asc',
            'endpoint:asc',
            'status:asc',
        ]
    },
);