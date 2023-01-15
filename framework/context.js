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
 * A context is a way to encode the concept of a context, in which an operation
 * or transaction could occur.  The most specific instance I can think of is for
 * security management.  A context of { org: 17, report: 'my report' } is the
 * context for checking authorization or permissions to do some sort of action on
 * a server.  We use a precise algorithm to generate a crypto string for that
 * context, which is then readily stored in a DBMS or compare with other values
 * to determine wether the context is valid.
*****/
register(class Context {
    constructor(arg) {
        if (typeof arg == 'object') {
            Object.assign(this, clone(arg));
        }
        else if (typeof arg == 'string') {
            this.fromBase64(arg);
        }
    }

    clear() {
        for (let key in this) {
            delete this[key];
        }
    }

    fromBase64(b64) {
        this.clear();
        let stack = fromJson(mkBuffer(b64, 'base64').toString()).reverse().map(el => {
            return {
                obj: this,
                data: el
            };
        });

        while (stack.length) {
            let item = stack.pop();
            let key = Object.keys(item.data)[0];

            if (Array.isArray(item.data[key])) {
                let object = new Object();
                item.obj[key] = object;

                item.data[key].reverse().map(el => {
                    stack.push({
                        obj: object,
                        data: el,
                    });
                });
            }
            else {
                item.obj[key] = item.data[key];
            }
        }
    }

    toBase64() {
        let sorted = [];
        let stack = Object.keys(this).sort().reverse().map(key => {
            return {
                key: key,
                src: this[key],
                dst: sorted,
            };
        });

        while (stack.length) {
            let item = stack.pop();

            if (typeof item.src == 'object' && !Array.isArray(item.src)) {
                let array = new Array();
                let obj = new Object();
                obj[item.key] = array;
                item.dst.push(obj);

                Object.keys(item.src).sort().reverse().forEach(key => {
                    stack.push({
                        key: key,
                        src: item.src[key],
                        dst: array,
                    });
                });
            }
            else {
                let obj = new Object();
                obj[item.key] = item.src;
                item.dst.push(obj);
            }
        }

        return mkBuffer(toJson(sorted)).toString('base64');
    }
});
