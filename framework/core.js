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


(() => {
    /*****
     * Since "global" instance defined on the browser, this code will ensure
     * that "global" is defined and can be used in the rest of the core of the
     * framework.
    *****/
    try {
        window.global = window;
        global.platform = 'client';
    }
    catch (e) {
        global.platform = 'server';
    }
 
 
    /*****
     * Current object specifies where new objects will be registered.  The
     * framework objects are registered directly to the global object, while
     * it is highly recommened that all other modules specify an object, in
     * which to register classes and functions.
    *****/
    let chain = '';
    let container = global;
    global['#CHAIN'] = '';

    global.getContainer = function(links) {
        if (links === undefined) {
            return container;
        }
        else {
            let container = global;

            for (let link of links.split('.')) {
                if (!(link in container)) {
                    container[link] = new Object();
                }

                container = container[link];
            }

            return container;
        }
    };

    global.setContainer = function(links) {
        if (links !== undefined) {
            container = global;
            chain = [];

            for (let link of links.split('.')) {
                chain.push(link);

                if (!(link in container)) {
                    container[link] = new Object({ '#CHAIN': chain.join('.') });
                }

                container = container[link];
            }

            chain = chain.join('.');
        }

        return container;
    };


    /*****
     * Symbols used for tagging constructors, singletons and other objects as
     * part of the coding framework.
    *****/
    const SymbolCtor = Symbol('ctor');
    const SymbolJsonable = Symbol('jsonable');
    const SymbolSingleton = Symbol('singleton');
 
 
    /*****
     * Register a function or a class in the current namespace.  Classes must
     * have upper case (PascalCase), while functions must use camelCase naming.
     * For classes, a mkFunction() is created in the specified namespace.  For
     * functions, they are just added to the namespace for use later on.
    *****/
    global.define = (name, value) => {
        if (name in container) {
            throw new Error(`Symbol "${name}" already defined in container "${chain}".`);
        }

        container[name] = value;
    };
 
 
    /*****
     * Register a function or a class in the current namespace.  Classes must
     * have upper case (PascalCase), while functions must use camelCase naming.
     * For classes, a mkFunction() is created in the specified namespace.  For
     * functions, they are just added to the namespace for use later on.
    *****/
    global.register = func => {
        if (typeof func == 'function' && func.name) {
            if (!(func.name in container)) {
                if (func.toString().startsWith('class')) {
                    if (func.name.match(/^[A-Z]/)) {
                        let makerName = `mk${func.name}`;
                        func[SymbolCtor] = { container: chain, maker: makerName };

                        let makerFunc = (...args) => {
                            let made = Reflect.construct(func, args);
                            return made;
                        };

                        container[makerName] = makerFunc;
                        container[`${func.name}`] = func;
                        return makerFunc;
                    }
                    else {
                        throw new Error(`register(), class name must start with an upper-case letter: ${func.name}`);
                    }
                }
                else {
                    if (func.name.match(/^[a-z]/)) {
                        container[`${func.name}`] = (...args) => {
                            return Reflect.apply(func, container, args);
                        };
                    }
                    else {
                        throw new Error(`register(), function name must start with an lower-case letter: ${func.name}`);
                    }
                }
            }
            else {
                throw new Error(`register(), name already exists in container: ${func.name}`);
            }
        }
        else {
            throw new Error(`register(), invalid argument: ${func.toString()}`);
        }
    };
 
 
    /*****
     * The singleton function automatically creates a single instance of an
     * object of the passed class.  Singletons don't need to be created using
     * this framework function, but this function is useful the following
     * reasons: (a) Neither the class nor a mkFunction() are registered, (b)
     * the singleton is registered right after being called, and (c) if the
     * constructor returns a Promise, the onSingletons() function can be called
     * to wait until all of the pending singletons are constructed.  The code
     * is as follows:  await onSingletons().
    *****/
    {
        let waiting = [];
        let singletons = 0;
 
        global.singleton = func => { 
            if (typeof func == 'function' && func.name) {
                if (!(func.name in container)) {
                    if (func.toString().startsWith('class')) {
                        if (func.name.match(/^[A-Z]/)) {
                            return new Promise(async (ok, fail) => {
                                singletons++;
                                let obj = new func();
                                obj[SymbolSingleton] = true;
                                
                                if (obj instanceof Promise) {
                                    container[func.name] = await obj;
                                }
                                else {
                                    container[func.name] = obj;
                                }
                                
                                singletons--;
                                
                                if (singletons == 0) {
                                    for (let waiter of waiting) {
                                        waiter();
                                    }
                                    
                                    waiting = [];
                                }
                                
                                ok(container[func.name]);
                            });
                        }
                        else {
                            throw new Error(`singleton(), class name must start with an upper-case letter: ${func.name}`);
                        }
                    }
                    else {
                        throw new Error(`singleton(), name already exists in container: ${func.name}`);
                    }
                }
                else {
                    throw new Error(`singleton(), the arg to singleton must be a javascript class: ${func.name}`);
                }
            }
            else {
                throw new Error(`singleton(), invalid argument: ${func.toString()}`);
            }
        };
 
        global.onSingletons = async () => {
            return new Promise((ok, fail) => {
                if (singletons > 0) {
                    const done = () => { ok() };
                    waiting.push(done);
                }
                else {
                    ok();
                }
            });
        }
    }
 
 
    /*****
     * There are three levels of Jsonability: (1) fully jsonable, (2) partially
     * jsonable, and (3) not jsonable.  Fully jsonable means that an object is
     * restored at the endpoint be creating a new instance of the specified objet.
     * Hence, all of the methods and features are restored.  Partial jsonables
     * can be sent, but only a generic object will be sent.  Finally, a non-
     * jsonable will not be converted to JSON.  For instance, Emitters are marked
     * as non-jsonable.
    *****/
    register(class Jsonable {
        constructor() {
            this[SymbolJsonable] = true;
        }
    });

    register(class NonJsonable {
        constructor() {
            this[SymbolJsonable] = false;
        }
    });


    /*****
     * There are two variants of Buffer.  In the server, Buffer extends the builtin
     * Buffer class by providing some additional features.  On the browser, it's
     * a class the implements the same features based on a uint8 array.  This makes
     * coding buffers the same on both the client and server.  Additionally, the
     * framework buffer is JSON transferable so that buffers can be easily sent
     * between processes, cluster hosts, and the application clients.
    *****/
    if (platform == 'server') {
        register(function mkBuffer(...args) {
            return Buffer.from(...args);
        });
    }
    else {
        register(class Buffer {
            constructor(value, encoding) {
                this.set(value, encoding);
            }
          
            set(value, encoding) {
                if (typeof value == 'string') {
                    switch (encoding) {
                        case 'hex':
                            if (value.length % 2 != 0) {
                                throw new Error('Hex string comprised of odd character count!');
                            }
          
                            this.jsArray = new Uint8Array(value.length/2);
                            let array = new DataView(this.jsArray.buffer);
          
                            for (let i = 0; i < value.length; i += 2) {
                                let byte = parseInt(value[i], 16) * 16 + parseInt(value[i + 1], 16);
                                array.setUint8(i/2, byte);
                            }
                            break;

                        case 'b64':
                        case 'base64':
                            let binary = atob(value);
                            this.jsArray = (new TextEncoder()).encode(binary);
                            break;

                        default:
                            this.jsArray = (new TextEncoder()).encode(value);
                    }
                }
                else {
                    this.jsArray = new Uint8Array(value);
                }
            }

            toString(encoding) {
                switch (encoding) {
                    case 'hex':
                        let bytes = [];
                        let array = new DataView(this.jsArray.buffer);
          
                        for (let i = 0; i < array.byteLength; i++) {
                            let byte = array.getUint8(i);
                            bytes.push(byte.toString(16));
                        }
          
                        return bytes.join('');

                    case 'b64':
                    case 'base64':
                        let string = (new TextDecoder()).decode(this.jsArray);
                        return btoa(string);

                    default:
                        return (new TextDecoder()).decode(this.jsArray);
                }
            }
        });
    }


    /*****
     * JSON conversion for dates is somewhat problematic.  Dates are converted to
     * a string when strifified, but there's not good way to identify that a date
     * should be parsed back into a Date without already knowing which specific
     * properties or values should be restored as a date.  Hence, the extended
     * version for JSON conversion uses the Kode extended JSON format to be able
     * to automatically identify and restore the orignal values.  This new toJSON
     * function for the Date prototype takes care of this for dates.
    *****/
    let extension = true;
    const stringifyDate = Date.prototype.toJSON;
    const stringifyBuffer = Buffer.prototype.toJSON;

    Date.prototype.toJSON = function() {
        if (extension) {
            return { '#DATE': this.valueOf() };
        }
        else {
            return Reflect.apply(stringifyDate, this, []);
        }
    };

    Buffer.prototype.toJSON = function() {
        if (extension) {
            return { '#BUFFER': this.toString('base64') };
        }
        else {
            return Reflect.apply(stringifyBuffer, this, []);
        }
    };


    /*****
     * As specified above, these functions provide backward compatibility with
     * Javascript's builtin JSON features.  Within the Kode framework, develoeprs
     * need to use these global functions in place of JSON.stirngify() and
     * JSON.parse().
    *****/
    register(function toStdJson(value, humanReadable) {
        extension = false;

        if (humanReadable) {
            return JSON.stringify(value, null, 4);
        }
        else {
            return JSON.stringify(value);
        }
    });

    register(function fromStdJson(value, humanReadable) {
        return JSON.parse(value);
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
     * to strings before they even reach the strinigifier function.
    *****/
    register(function toJson(value, humanReadable) {
        extension = true;

        return JSON.stringify(value, (key, value) => {
            if (value === null) {
                return { '#NULL': 0 };
            }
            else if (Number.isNaN(value)) {
                return { '#NAN': 0 };
            }
            else if (typeof value == 'symbol') {                
                return undefined;
            }
            else if (value instanceof Date) {
                return { '#TIME': value.valueOf() };
            }
            else if (value instanceof Time) {
                return { '#TIME': value.time() };
            }
            else if (value instanceof RegExp) {
                return { '#REGEX': value.toString() };
            }
            else if (typeof value == 'function') {
                return { '#FUNC': mkBuffer(value.toString()).toString('base64') };
            }
            else if (typeof value == 'bigint') {
                return { '#BIG': value.toString() };
            }
            else if (typeof value == 'object') {
                if (ActiveData.isActiveData(value)) {
                    let obj = new Object({ '#ACTIVE': 'ActiveData' });
                    Object.assign(obj, ActiveData.value(value));
                    return obj;
                }
                else if (value[SymbolSingleton]) {
                    return undefined;
                }
                else if (value[SymbolJsonable] === false) {
                    return undefined;
                }
                else if (value[SymbolJsonable]) {
                    let obj = new Object();
                    obj['#CTOR'] = Reflect.getPrototypeOf(value).constructor[SymbolCtor];
                    Object.assign(obj, value);
                    delete obj[SymbolJsonable];
                    return obj;
                }
                else {
                    return value;
                }
            }
     
            return value;
        }, humanReadable ? 4 : 0);
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
                else if ('#NAN' in value) {
                    return NaN;
                }
                else if ('#TIME' in value) {
                    return mkTime(value['#TIME']);
                }
                else if ('#REGEX' in value) {
                    return new RegExp(value['#REGEX']);
                }
                else if ('#FUNC' in value) {
                    return mkBuffer(value['#FUNC'], 'base64').toString();
                }
                else if ('#BUFFER' in value) {
                    return mkBuffer(value['#BUFFER'], 'base64');
                }
                else if ('#BIG' in value) {
                    return BigInt(value['#BIG']);
                }
                else if ('#ACTIVE' in value) {
                    delete value['#ACTIVE'];
                    return mkActiveData(value);
                }
                else if ('#CTOR' in value) {
                    let ctorContainer = getContainer(value['#CTOR'].container);

                    if (!(value['#CTOR'].maker in ctorContainer)) {
                        let restoreChainTo = chain;
                        setContainer(value['#CTOR'].container);

                        eval(`
                            register(class ${value['#CTOR'].maker.substr(2)} extends Jsonable {
                                constructor(value) {
                                    super();
                                    Object.assign(this, value);
                                }
                            });
                        `);

                        setContainer(restoreChainTo);
                    }

                    return ctorContainer[value['#CTOR'].maker](value);
                }
            }
     
            return value;
        }
    )});
})();
