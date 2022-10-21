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
 * The ActiveData, AD, class is very useful for making applications on both the
 * client and server dynamic.  Conceptually, the AD class works like Object.
 * Under the hood, when changes are made to an AD instance, that instance sends
 * out messages providing details on those updated.  In essence, it's like an
 * Object that automatically emits messages when updated.  The implementation
 * is NOT trivial and and employs the use of js proxy objects to intercept
 * property updates to emit information regarding those upates.  Moreover, like
 * Object, ActiveData has a set of static functions rather than instance methods
 * in to prevent naming collisions between prototype functions property keys.
 * Additionally, the ActiveData object has symbolic key instances for bookeeping
 * purposes rather than string keys to avoid naming collisions.
*****/
register(class ActiveData {
    static id = 1;
    static idKey = Symbol('id');
    static pathKey = Symbol('Path');
    static nakedKey = Symbol('Naked');
    static proxyKey = Symbol('Proxy');
    static emitterKey = Symbol('Emitter');
    static rootKey = Symbol('Root');
    static reflection = null;
    static reflecting = false;
    static suppress = false;
  
    static proxy = {
        deleteProperty(nakedActiveData, key) {
            if (key in nakedActiveData) {
                let oldValue = nakedActiveData[key];
  
                if (Array.isArray(nakedActiveData)) {
                    nakedActiveData.splice(key, 1);
                }
                else {
                    delete nakedActiveData[key];
                }
 
                nakedActiveData[ActiveData.emitterKey].send({
                    messageName: 'ActiveData',
                    activeDataId: nakedActiveData[ActiveData.idKey],
                    activeData: nakedActiveData[ActiveData.proxyKey],
                    action: 'delete',
                    key: key,
                    oldValue: oldValue,
                });
 
                return nakedActiveData[ActiveData.proxyKey];
            }
        },
 
        get(nakedActiveData, key) {
            if (ActiveData.reflecting) {
                let refid = `{nakedActiveData[ActiveData.idKey]}-{key}`;
                reflection[refid] = {activeData: nakedActiveData[ActiveData.proxyKey], key: key};
                return nakedActiveData[key];
            }
            else if (key === ActiveData.nakedKey) {
                return nakedActiveData;
            }
            else {
                return nakedActiveData[key];
            }
        },
 
        set(nakedActiveData, key, value) {
            if (key in nakedActiveData) {
                let oldValue = ActiveData.value(nakedActiveData[key]);
 
                if (typeof value == 'object') {
                    ActiveData.assign(nakedActiveData[ActiveData.proxyKey], value);
                }
                else {
                    nakedActiveData[key] = value;
                }
 
                if (!ActiveData.suppress) {
                    nakedActiveData[ActiveData.emitterKey].send({
                        messageName: 'ActiveData',
                        activeDataId: nakedActiveData[ActiveData.idKey],
                        activeData: nakedActiveData[ActiveData.proxyKey],
                        action: 'change',
                        key: key,
                        oldValue: oldValue,
                        newValue: value,
                    });
                }
            }
            else {
                if (Array.isArray(nakedActiveData)) {
                    if (key < 0) {
                        nakedActiveData.unshift(value);
                    }
                    else if (key >= nakedActiveData.length) {
                        nakedActiveData.push(value);
                    }
                }
                else {
                    if (typeof value == 'object') {
                        ActiveData.suppress = true;
                        nakedActiveData[key] = new ActiveData(value, nakedActiveData, key);
                        ActiveData.suppress = false;
                    }
                    else {
                        nakedActiveData[key] = value;
                    }
                }
 
                if (!ActiveData.suppress) {
                    nakedActiveData[ActiveData.emitterKey].send({
                        messageName: 'ActiveData',
                        activeDataId: nakedActiveData[ActiveData.idKey],
                        activeData: nakedActiveData[ActiveData.proxyKey],
                        action: 'add',
                        key: key,
                        value: value
                    });
                }
            }
 
            return nakedActiveData[ActiveData.proxyKey];
        },
    };

    constructor(arg, naked, key) {
        let init;
        let activeData;
  
        if (arg === true) {
            init = false;
            activeData = new Array();
        }
        else if (arg === false) {
            init = false;
            activeData = new Object();
        }
        else if (typeof arg == 'undefined') {
            init = false;
            activeData = new Object();
        }
        else if (Array.isArray(arg)) {
            init = true;
            activeData = new Array();
        }
        else if (typeof arg == 'object') {
            init = true;
            activeData = new Object();
        }
        else  {
            init = false;
            activeData = new Object();
        }
 
        activeData[ActiveData.idKey] = ActiveData.id++;
        activeData[ActiveData.proxyKey] = new Proxy(activeData, ActiveData.proxy);
 
        if (naked) {
            activeData[ActiveData.pathKey] = naked[ActiveData.pathKey] ? `{naked[ActiveData.pathKey]}.{key}` : key;
            activeData[ActiveData.rootKey] = naked[ActiveData.rootKey][ActiveData.proxyKey];
            activeData[ActiveData.emitterKey] = naked[ActiveData.emitterKey];
        }
        else {
            activeData[ActiveData.pathKey] = '';
            activeData[ActiveData.rootKey] = activeData[ActiveData.proxyKey];
            activeData[ActiveData.emitterKey] = mkEmitter();
        }
 
        if (init) {
            ActiveData.assign(activeData[ActiveData.proxyKey], arg);
        }
 
        return activeData[ActiveData.proxyKey];
    }
 
    static assign(proxy, arg) {
        if (typeof proxy == 'object' && proxy[ActiveData.nakedKey] !== undefined) {
            if (Array.isArray(proxy) && Array.isArray(arg)) {
                for (let i = 0; i < arg.length; i++) {
                    proxy[i] = arg[i];
                }
            }
            else if (typeof arg == 'object') {
                for (let key in arg) {
                    proxy[key] = arg[key];
                }
            }
        }
  
        return ActiveData;
    }

    static is(arg1, arg2) {
        if (typeof arg1 == 'object' && typeof arg2 == 'object') {
            if (arg1[ActiveData.idKey] && arg2[ActiveData.idKey]) {
                return arg1[ActiveData.idKey] == arg2[ActiveData.idKey];
            }
        }

        return false;
    }
 
    static isActiveData(arg) {
        if (typeof arg == 'object') {
            return arg[ActiveData.idKey] !== undefined;
        }
 
        return false;
    }
  
    static off(activeData, handler, filter) {
        activeData[ActiveData.emitterKey].off('ActiveData', handler, filter);
        return ActiveData;
    }
 
    static on(activeData, handler, filter) {
        activeData[ActiveData.emitterKey].on('ActiveData', handler, filter);
        return ActiveData;
    }
 
    static once(activeData, handler, filter) {
        activeData[ActiveData.emitterKey].once('ActiveData', handler, filter);
        return ActiveData;
    }
  
    static reflect(func, ...args) {
        ActiveData.reflection = {};
        ActiveData.reflecting = true;

        try {
            func(...args);
        }
        catch (e) {
            console.log('activeData refelction error!');
            console.log(func.toString());
            console.log(e);
        }
        finally {
            ActiveData.reflecting = false;
            return Object.values(ActiveData.reflection);
        }
    }
  
    static root(proxy) {
        if (proxy) {
            return proxy[ActiveData.rootKey];
        }
    }
  
    static value(arg) {
        if (typeof arg == 'object' && arg[ActiveData.idKey]) {
            if (Array.isArray(arg)) {
                let val = [];
 
                for (let i = 0; i < arg.length; i++) {
                    val.push(ActiveData.value(arg[i]));
                }
 
                return val;
            }
            else {
                let val = {};
 
                Object.entries(arg).forEach(entry => {
                    val[entry[0]] = ActiveData.value(entry[1]);
                });
 
                return val;
            }
        }
        else {
            return arg;
        }
    }
});
