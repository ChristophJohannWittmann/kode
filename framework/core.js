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
    let prefix = '';
    let container = global;

    global.getContainer = function(links) {
        let container = global;

        if (links !== undefined) {
            for (let link of links.split('.')) {
                if (!(link in container)) {
                    container[link] = new Object();
                }

                container = container[link];
            }
        }

        return container;
    }

    global.getContainerPrefix = function() {
        return prefix;
    }

    global.setContainer = function(links) {
        if (links !== undefined) {
            container = global;
            chain = [];

            for (let link of links.split('.')) {
                chain.push(link);

                if (!(link in container)) {
                    container[link] = new Object();
                }

                container = container[link];
            }

            chain = chain.join('.');
            prefix = `${chain}.`;
        }
    }


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
                return { '#DATE': value.valueOf() };
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
            else if (value instanceof Buffer) {
                return { '#BUFFER': value.toString()('base64') };
            }
            else if (value instanceof Binary) {
                return { '#BINARY': value.toString('base64') };
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
