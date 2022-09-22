/*****
 * Copyright (c) 2017-2022 Christoph Wittmann, chris.wittmann@icloud.com
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
{
    "configschema1": [
        {
            name: 'table1',
            columns: [
                { name: 'column1',   type: dbInt64           },
                { name: 'column2',  type: dbText, size: 100  },
                { name: 'column3',  type: dbText, size: 100 },
            ],
            indexes: [
                'column1:asc',
                'column2:asc, column3:asc',
            ]
        },
    ],

    "configschema2": [
        {
            name: 'table1',
            columns: [
                { name: 'column1',   type: dbInt64           },
                { name: 'column2',  type: dbText, size: 100  },
                { name: 'column3',  type: dbText, size: 100 },
            ],
            indexes: [
                'column1:asc',
                'column2:asc, column3:asc',
            ]
        },
        {
            name: 'table2',
            columns: [
                { name: 'column1',   type: dbInt64           },
                { name: 'column2',  type: dbText, size: 100  },
                { name: 'column3',  type: dbText, size: 100 },
            ],
            indexes: [
                'column1:asc',
                'column2:asc, column3:asc',
            ]
        },
    ]
}