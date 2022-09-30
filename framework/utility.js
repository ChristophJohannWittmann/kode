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
 * This is the most generic and powerful comparison function for two js values.
 * The return value is a simple boolean specifying whether the two argument
 * values are identical.  For aggregate values, objects, that means comparing
 * the instance types and all of their contents to determine if there are any
 * differences.  For arrays, that includes checking the length and order of
 * the array elements.  This function is fully recursive and can deal with
 * circular references.
*****/
register(function areEqual(a, b) {
    let stack = [{ a: a, b: b }];
    let circular = new WeakMap();
    
    while (stack.length) {
        let { a, b } = stack.pop();
        
        if (typeof a == 'object') {
            if (typeof b == 'object') {
                if (circular.has(a)) {
                    if (circular.get(a) !== b) {
                        return false;
                    }
                }
                else {
                    if (a instanceof Reflect.getPrototypeOf(b).constructor) {
                        circular.set(a, b);
         
                        if (Array.isArray(a)) {
                            if (a.length == b.length) {
                                for (let i = 0; i < a.length; i++) {
                                    stack.push({ a: a[i], b: b[i] });
                                }
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            let keysA = Object.keys(a);
         
                            if (keysA.length == Object.keys(b).length) {
                                for (let key of keysA) {
                                    if (key in b) {
                                        stack.push({ a: a[key], b: b[key]});
                                    }
                                    else {
                                        return false;
                                    }
                                }
                            }
                            else {
                                return false;
                            }
                        }
                    }
                    else {
                        return false;
                    }
                }
            }
            else {
                return false;
            }
        }
        else if (a !== b) {
            return false;
        }
    }
    
    return true;
});


/*****
 * Performs a binary search and returns the index, at which to insert the value
 * into the given array.  If the array contains one or more values (in a sequence)
 * of the same value and the provided value matches the sequence, the returned
 * index will be right at the start of that sequence.  Given a valid parameter
 * set, this function will always return a valid index.
*****/
register(function binarySearch(array, func, value) {
    let l = 0;
    let r = array.length - 1;

    while (l <= r) {
        if (value <= func(array[l])) {
            return l;
        }
        else if (value > func(array[r])) {
            return r + 1;
        }

        let m = Math.floor((r - l)/2 + l);
        let v = func(array[m]);

        if (value <= v) {
            r = m;
        }
        else {
            l = m + 1;
        }
    }

    return l;
});


/*****
 * This utility provides a robust algorithm for deeply cloning any javascript
 * value, including objects and arrays with circular references.  When viewing
 * this code below, remember that javascript non-object values, NOVs, are
 * immutable.  Hence, there's no need to clone them.  If an immutable value is
 * passed as the argument, it is simply returned.  If an object is passed, it
 * gets interesting.  Now we have to recursively create new objects to be clones
 * and add values from the source object network.  We need the weak map to
 * keep instances of objects and arrays to know where they link when there are
 * circular references.
*****/
register(function clone(src) {
    if (typeof src == 'object') {
        let map = new WeakMap();
        let dst = Array.isArray(src) ? new Array() : new Object();
        map.set(src, dst);
        let stack = [{ src: src, dst: dst }];
        
        function addObjectValue(src, dst, key, value) {
            if (map.has(value)) {
                dst[key] = map.get(value);
            }
            else {
                let clone = Array.isArray(value) ? new Array() : new Object();
                map.set(value, clone);
                dst[key] = clone;
                stack.push({ src: value, dst: clone });
            }
        }
        
        while (stack.length) {
            let { src, dst } = stack.pop();
         
            if (Array.isArray(src)) {
                for (let i = 0; i < src.length; i++) {
                    let value = src[i];
     
                    if (typeof value == 'object') {
                        addObjectValue(src, dst, i, value);
                    }
                    else {
                        dst[i] = value;
                    }
                }
            }
            else {
                Object.entries(src).forEach(entry => {
                    let [ key, value ] = entry;
                    
                    if (typeof value == 'object') {
                        addObjectValue(src, dst, key, value);
                    }
                    else {
                        dst[key] = value;
                    }
                });
            }
        }
        
        return dst;
    }
    else {
        return src;
    }
});


/*****
 * The escape functions are here to facilitate escaping text depending on
 * the intended use of that text.  Escaping a string for DBMS commands
 * require that apostrophes, "single quotes", are converted into a series
 * of two apostrophes: ' => ''.
*****/
register(function escape(text) {
    return text.replace(/'/mg, "''");
});


/*****
 * The framework's toJson() and fromJson() functions are required in many
 * instances with regards to messaging.  The type and instance information is
 * retained for the core framework objects as well as objects of registered
 * classes.  This is accomplished by taking objects of specific types and
 * generating JSON "escape sequences" that are picked up at the receiving end
 * to recreate and exact copy of the original.  Theese functions DO NOT WORK
 * where objects have circular references such a self-referencing trees.
*****/
register(function fromJson(json) {
    return JSON.parse(json, (key, value) => {
        if (typeof value == 'object' && !Array.isArray(value)) {
            if ('#NULL' in value) {
                return null;
            }
            else if ('#UNDEFINED' in value) {
                return undefined;
            }
            else if ('#NAN' in value) {
                return NaN;
            }
            else if ('#DATE' in value) {
                return new Date(value['#DATE']);
            }
            else if ('#TIME' in value) {
                return mkTime(value['#TIME']);
            }
            else if ('#REGEX' in value) {
                return new RegExp(value['#REGEX']);
            }
            else if ('#FUNC' in value) {
                return mkBinary(value['#FUNC'], 'base64').toString();
            }
            else if ('#BUFFER' in value) {
                return mkBinary(value['#BUFFER'], 'base64');
            }
            else if ('#BIG' in value) {
                return BigInt(value['#BIG']);
            }
            else if ('#SYMBOL' in value) {
                return mkSymbol(...value['#SYMBOL'].split('#'));
            }
            else if ('#ACTIVE' in value) {
                delete value['#ACTIVE'];
                return mkActiveData(value);
            }
            else if ('#NS' in value) {
                let ns = value['#NS'];
                let ctor = value['#CTOR'];
                delete value['#NS'];
                delete value['#CTOR'];
                
                if (ns && (!(ns in global) || !(ctor.substr(2) in global[ns]))) {
                    stub(ns, ctor);
                }
                
                let nsObj = ns ? global[ns] : global;
                let instance = nsObj[ctor]();
                Object.assign(instance, value);
                return instance;
            }
        }
 
        return value;
    }
)});


/*****
 * Takes a single character and builds a string that's as long as the specified
 * count parameter.  It's not padding, it's just a repeating sequence of the
 * same char that's resturned as a string.
*****/
register(function fillWithChar(count, char) {
    char == char === undefined ? '' : char;
    let chars = [];

    for (let i = 0; i < count; i++) {
        chars.push(char);
    }

    return chars.join('');
});


/*****
 * In general, it's useful to be able to convert characters between camelCase,
 * PascalCase, and snake_case.  In our world, PascalCase is just a special case
 * of camelCase.  This function takes a programming word and splits it apart
 * into segments based on the rules of camelCase.  Splitting stops when a non-
 * valid character or end-of-line is encountered.  Note that an underscore is
 * considered to be valid.
*****/
register(function splitCamelCase(str) {
    let word = [];
    let split = [];
  
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
  
        if (char.match(/[A-Z]/)) {
            if (word.length) {
                split.push(word.join(''));
                word = [char.toLowerCase()];
            }
            else {
                word.push(char.toLowerCase());
            }
        }
        else if (char.match(/[a-z0-9_]/)) {
            word.push(char);
        }
        else {
            break;
        }
    }
  
    if (word.length) {
        split.push(word.join(''));
    }
  
    return split;
});


/*****
 * In general, it's useful to be able to convert characters between camelCase,
 * PascalCase, and snake_case.  In our world, PascalCase is just a special case
 * of camelCase.  This function takes a programming word and splits it apart
 * into segments based on the rules of snake_case.  Splitting stops when a non-
 * valid character or end-of-line is encountered.
*****/
register(function splitSnakeCase(str) {
    let word = [];
    let split = [];
  
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
  
        if (char == '_') {
            if (word.length) {
                split.push(word.join(''));
                word = [];
            }
        }
        else if (char.match(/[A-Za-z0-9_]/)) {
            word.push(char.toLowerCase());
        }
    }
  
    if (word.length) {
        split.push(word.join(''));
    }
  
    return split;
});


/*****
 * In general, it's useful to be able to convert characters between camelCase,
 * PascalCase, and snake_case.  These functions are toCamelCase(), toSnakeCase(),
 * and toPascalCase().  These functions do NOT detect the naming style for the
 * passed argument.  It's up to the caller to know.
*****/
register(function toCamelCase(snakeCase) {
    let first = true;
    
    return splitSnakeCase(snakeCase).map(word => {
        if (first) {
            first = false;
            return word;
        }
        else {
            return `${word[0].toUpperCase()}${word.substr(1)}`;
        }
    }).join('');
});


/*****
 * In general, it's useful to be able to convert characters between camelCase,
 * PascalCase, and snake_case.  These functions are toCamelCase(), toSnakeCase(),
 * and toPascalCase().  These functions do NOT detect the naming style for the
 * passed argument.  It's up to the caller to know.
*****/
register(function toPascalCase(snakeCase) {
    return splitSnakeCase(snakeCase).map(word => {
        return `${word[0].toUpperCase()}${word.substr(1)}`;
    }).join('');
});


/*****
 * In general, it's useful to be able to convert characters between camelCase,
 * PascalCase, and snake_case.  These functions are toCamelCase(), toSnakeCase(),
 * and toPascalCase().  These functions do NOT detect the naming style for the
 * passed argument.  It's up to the caller to know.
*****/
register(function toSnakeCase(camelCase) {
    let first = true;
    
    return splitCamelCase(camelCase).map(word => {
        if (first) {
            first = false;
            return word;
        }
        else {
            return `_${word}`;
        }
    }).join('');
});


/*****
 * The framework's toJson() and fromJson() functions are required in many
 * instances with regards to messaging.  The type and instance information is
 * retained for the core framework objects as well as objects of registered
 * classes.  This is accomplished by taking objects of specific types and
 * generating JSON "escape sequences" that are picked up at the receiving end
 * to recreate and exact copy of the original.  Theese functions DO NOT WORK
 * where objects have circular references such a self-referencing trees. Notice
 * the user of the Data prototype modifier.  That's because Dates are converted
 * to strings before they even reach the strinigier function.
*****/
Date.prototype.toJSON = function() {
    return { '#DATE': this.valueOf() };
};

register(function toJson(value, humanReadable) {
    return JSON.stringify(value, (key, value) => {
        if (key == 'JSONABLENAMESPACE') {
            return undefined;
        }
        else if (value === null) {
            return { '#NULL': 0 };
        }
        else if (value === undefined) {
            return { '#UNDEFINED': 0 };
        }
        else if (Number.isNaN(value)) {
            return { '#NAN': 0 };
        }
        else if (value instanceof Time) {
            return { '#TIME': value.time() };
        }
        else if (value instanceof RegExp) {
            return { '#REGEX': value.toString() };
        }
        else if (typeof value == 'function') {
            return { '#FUNC': mkBinary(value.toString()).toString('base64') };
        }
        else if (typeof value == 'bigint') {
            return { '#BIG': value.toString() };
        }
        else if (typeof value == 'symbol') {
            let parts = value.description.split('#');
            
            if (parts.length == 2) {
                return { '#SYMBOL': value.description };
            }
            
            return undefined;
        }
        else if (value instanceof Buffer) {
            return { '#BUFFER': value.str('base64') };
        }
        else if (typeof value == 'object') {
            if (ActiveData.isActiveData(value)) {
                let obj = new Object({ '#ACTIVE': 'ActiveData' });
                Object.assign(obj, ActiveData.value(value));
                return obj;
            }
            else if (Reflect.has(value, 'NAMESPACE')) {
                let obj = new Object();
                obj['#NS'] = value.NAMESPACE();
                obj['#CTOR'] = `mk${Reflect.getPrototypeOf(value).constructor.name}`;
                Object.assign(obj, value);
                return obj;
            }
        }
 
        return value;
    }, humanReadable ? 4 : 0);
});
