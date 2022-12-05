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
 * A set is an implementation of a set of keys for string values.  We have this
 * because it's a much better implementation that the underlying js engine's
 * Set.  This class may be somewhat slower, but it's API is much more like that
 * of an array and is much more modern that the js engine's Set.
*****/
register(class StringSet extends Jsonable {
    constructor(...args) {
        super();
        this.values = {};
        this.set(...args);
    }
  
    static arrayify(...args) {
        let array = [];
        let flat = args.flatMap(e => e);
  
        for (let i = 0; i < flat.length; i++) {
            let arg = flat[i];
  
            if (arg instanceof Set) {
                array = array.concat(Object.keys(arg.values));
            }
            else if (Array.isArray(arg)) {
                array = array.concat(arg);
            }
            else if (typeof arg == 'object') {
                if (arg !== null) {
                    array = array.concat(Object.keys(arg));
                }
            }
            else if (typeof arg == 'string') {
                array.push(arg);
            }
        }
  
        return array;
    }
  
    clear(...args) {
        if (args.length) {
            StringSet.arrayify(...args).forEach(el => delete this.values[el.toString()]);
        }
        else {
            this.values = {};
        }
    }
  
    empty() {
        return Object.keys(this.values).length == 0;
    }
  
    equals(...args) {
        let keys = Object.keys(this.values);
        let array = StringSet.arrayify(...args);
  
        if (keys.length = array.length) {
            for (let i = 0; i < array.length; i++) {
                let el = array[i];
  
                if (!(el in this.values)) {
                    return false;
                }
            }
  
            return true;
        }
        return false;
    }
  
    forEach(cb) {
        Object.keys(this.values).forEach(key => {
            cb(key);
        });
    }
  
    has(str) {
        return this.hasAll(str);
    }
  
    hasAll(...args) {
        if (!args.length) {
            return false;
        }
        
        let array = StringSet.arrayify(...args);
  
        for (let i = 0; i < array.length; i++) {
            if (!(array[i] in this.values)) {
                return false;
            }
        }
  
        return true;
    }
  
    hasAny(...args) {
        if (!args.length) {
            return false;
        }

        let array = StringSet.arrayify(...args);
  
        for (let i = 0; i < array.length; i++) {
            if (array[i] in this.values) {
                return true;
            }
        }
  
        return false;
    }
  
    intersect(...args) {
        let intersection = mkStringSet();

        args.froEach(arg => {
            if (this.has(arg)) {
                intersection.set(arg);
            }
        });
  
        return intersection;
    }
  
    isSubsetOf(...args) {
        let superset = {};
        StringSet.arrayify(...args).forEach(el => superset[el] = '');
        let keys = Object.keys(this.values);
  
        for (let i = 0; i < keys.length; i++) {
            if (!(keys[i] in superset)) {
                return false;
            }
        }
  
        return true;
    }
  
    isSupersetOf(...args) {
        return set.subsetOf(...args);
    }
  
    length() {
        return Object.keys(this.values).length;
    }
  
    list() {
        return Object.keys(this.values);
    }
  
    set(...args) {
        StringSet.arrayify(...args).forEach(el => this.values[el.toString()] = '');
    }

    [Symbol.iterator]() {
        return Object.keys(this.values)[Symbol.iterator]();
    }
  
    union(...args) {
        return mkStringSet(...args);
    }
});
