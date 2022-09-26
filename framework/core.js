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


(async () => {
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

    global.JsDate = Date;
 
 
    /*****
     * Set the state of the closure such that register() and singleton() will
     * use the global namespace for registering items within the framework. Note
     * that the Jsonable class is also defined and hard-coded with a namespace
     * of GLOBAL.
    *****/
    nsName = 'GLOBAL';
    nsObject = global[nsName] = global;

    const jsonables = {};
    eval(`jsonables[nsName] = class Jsonable { NAMESPACE() { return 'GLOBAL'; }}`);
    global.Jsonable = jsonables[nsName];
 
 
    /*****
     * Set the current namespace for defining application objects.  When called
     * without an argument, there is no ability to define additional objects
     * with the API.  After the framewokr has been loaded, that's what happens.
     * For each application or module, as loading begins, a call must be made
     * to namespace() to set that value for the following code.
    *****/
    global.namespace = name => {
        if (name === undefined) {
            nsName = null;
            nsObject = null;
            delete global.Jsonable;
        }
        else if (name in global || name == 'global' || name == 'window') {
            throw new Error(`Namespace ${name} is not available for use!`);
        }
        else {
            nsName = name;
            nsObject = global[nsName] = new Object();
            eval(`jsonables[nsName] = class Jsonable { NAMESPACE() { return '${nsName}'; }}`);
            global.Jsonable = jsonables[nsName];
        }
    }
 
 
    /*****
     * Register a function or a class in the current namespace.  Classes must
     * have upper case (PascalCase), while functions must use camelCase naming.
     * For classes, a mkFunction() is created in the specified namespace.  For
     * functions, they are just added to the namespace for use later on.
    *****/
    global.register = func => {
        if (!nsObject) {
            throw new Error(`No declared namespace.`);
        }
 
        if (typeof func == 'function' && func.name) {
            if (func.toString().startsWith('class')) {
                if (func.name.match(/^[A-Z]/)) {
                    nsObject[`${func.name}`] = func;

                    let makerName = `mk${func.name}`;
                    let makerFunc = (...args) => Reflect.construct(func, args);
                    nsObject[makerName] = makerFunc;
                }
                else {
                    throw new Error(`register(), class name must start with an upper-case letter: ${func.name}`);
                }
            }
            else {
                if (func.name.match(/^[a-z]/)) {
                    nsObject[`${func.name}`] = (...args) => {
                        return Reflect.apply(func, nsObject, args);
                    };
                }
                else {
                    throw new Error(`register(), function name must start with an lower-case letter: ${func.name}`);
                }
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
            if (!nsObject) {
                throw new Error(`No declared namespace.`);
            }
 
            if (typeof func == 'function' && func.name) {
                if (func.toString().startsWith('class')) {
                    if (func.name.match(/^[A-Z]/)) {
                        return new Promise(async (ok, fail) => {
                            singletons++;
                            let obj = new func();
                            
                            if (obj instanceof Promise) {
                                nsObject[func.name] = await obj;
                            }
                            else {
                                nsObject[func.name] = obj;
                            }
                            
                            singletons--;
                            
                            if (singletons == 0) {
                                for (let waiter of waiting) {
                                    waiter();
                                }
                                
                                waiting = [];
                            }
                            
                            ok(nsObject[func.name]);
                        });
                    }
                    else {
                        throw new Error(`register(), class name must start with an upper-case letter: ${func.name}`);
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
     * There are times when we want to pass a Jsonable to another process or
     * the client but we don't need to implement that class at the other end.
     * The fromJson() function will call this function to create a class stub
     * Jsonable.  What's useful about this is that when the other end json's
     * the object, upon receipt, it will be unjsoned into an object of the
     * original class.
    *****/
    global.stub = (ns, ctor) => {
        if (!(ns in global)) {
            global[ns] = new Object();
        }

        let prevName = nsName;
        let prevObject = nsObject;
 
        nsName = ns;
        nsObject = global[ns];
        global.Jsonable = jsonables[ns];
 
        eval(`
            global.register(class ${ctor.substr(2)} extends Jsonable {
                constructor() {
                    super();
                }
            });
        `);
 
        nsName = prevName;
        nsObject = prevObject;
        global.Jsonable = jsonables[nsName];
    }
 
 
    /*****
     * By having a global registry of symbols, we have created the foundation
     * for having unique symbols in each namespace and can then serialized
     * symbols and deserialize them and retain their uniqueness.
    *****/
    const SYMBOLS = Symbol('SYMBOLS');
 
    global.mkSymbol = (...args) => {
        let ns;
        let description;
 
        if (args.length == 1) {
            ns = nsName;
            description = args[0];
        }
        else if (args.length == 2) {
            [ ns, description ] = args;
        }
        else {
            return;
        }
 
        if (!(ns in global)) {
            global[ns] = new Object();
            global[ns][SYMBOLS] = new Object();
        }
 
        if (!(SYMBOLS in global[ns])) {
            global[ns][SYMBOLS] = new Object();
        }
 
        if (!(description in global[ns][SYMBOLS])) {
            global[ns][SYMBOLS][description] = Symbol(`${ns}#${description}`);
        }
 
        return global[ns][SYMBOLS][description];
    };
})();
