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
 * A filter is an encapsulation of the string values that can be used for the
 * CSS filter property.  The take the form of "name(value)".  A multifilter
 * sequence is of the form "name1(value) name2(value) ...".  The constructor
 * can initialize a filter from (a) an html element, (b) another filter, (c)
 * an object with filter properties, and (d) no argument.  In the first case,
 * a new filter object is initialized based on the widget's filter style
 * setting.
*****/
register(class WFilter {
    static nextId = 1;

    constructor(arg) {
        this.id = WFilter.nextId++;

        if (arg instanceof Widget) {
            this.properties = {};

            for (let property of arg.getStyle('filter').split(' ')) {
                let match = property.trim().match(/([a-zA-Z0-9_]+)\((.*?)\)/);

                if (match) {
                    this.properties[match[1]] = match[2];
                }
            }
        }
        else if (arg instanceof WFilter) {
            this.properties = clone(arg.properties);
        }
        else if (typeof arg == 'object') {
            this.properties = clone(arg);
        }
        else {
            this.properties = new Object();
        }
    }

    get(propertyName) {
        return propertyName in this.properties ? this.properties[propertyName] : '';
    }

    remove(propertyName) {
        return propertyName in this.properties ? delete this.properties[propertyName] : '';
        return this;
    }

    set(propertyName, value) {
        this.properties[propertyName] = value;
        return this;
    }

    toString() {
        let concat = [];

        for (let propertyName in this.properties) {
            concat.push(`${propertyName}(${this.properties[propertyName]})`);
        }

        return concat.join(' ');
    }
});