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
 * A pool implements the concept of a pool of ressources.  The pool contains
 * items that decay over time and will tie up resources when instantiated.
 * The pool manages resources by creating new resources as necessary but
 * preferring to return a freed resource to the caller rather than creating a
 * new one.  Eventually, after idleTime milliseconds, the resource is closed
 * and system resources are freed up.  To use a pool, an object MUST provide
 * a ctor and have a close() member.  Everything else is up to the pool class.
*****/
register(class Pool {
    static lookAhead = 600;
    static idKey = Symbol('#PoolId');
    static poolKey = Symbol('#Pool');
    static expireKey = Symbol('#Expire');

    constructor(make, max, idle) {
        this.make = make;
        this.idle = idle;
        this.max = max;
        this.nextId = 1;
        this.freed = [];
        this.inuse = {};
        this.pending = [];
        this.timeout = null;
    }

    alloc(...args) {
        return new Promise(async (ok, fail) => {
            if (this.freed.length) {
                this.clearTimeout();
                let resource = this.freed.shift();
                this.inuse[resource[Pool.idKey]] = resource;
                delete resource[Pool.id];
                this.setTimeout();
                ok(resource);
            }
            else {
                if (this.count() < this.max) {
                    let resource = await this.make(...args);
                    resource[Pool.poolKey] = this;
                    resource[Pool.idKey] = this.nextId++;
                    this.inuse[resource[Pool.idKey]] = resource;

                    if ('free' in resource) {
                        let base = resource.free;

                        resource.free = async (...args) => {
                            await Reflect.apply(base, resource, args);
                            await this.free(resource);
                        };
                    }
                    else {
                        resource.free = async () => {
                            await this.free(resource);
                        };
                    }

                    ok(resource);
                }
                else {
                    this.pending.push(async (resource) => {
                        ok(resource);
                    });
                }
            }
        });
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    count() {
        return this.freed.length + Object.keys(this.inuse).length;
    }

    async discard() {
        this.timeout = null;
        let threshold = Date.now() + Pool.lookAhead;

        while (this.freed.length) {
            let resource = this.freed[0];

            if (resource[Pool.expireKey] < threshold) {
                this.freed.shift();
                await resource.close();
            }
            else {
                break;
            }
        }

        this.setTimeout();
    }

    async free(resource) {
        if (this.pending.length) {
            this.pending.shift()(resource);
        }
        else {
            this.freed.push(resource);
            delete this.inuse[resource[Pool.idKey]];
            resource[Pool.expireKey] = Date.now() + this.idle;
            this.setTimeout();
        }
    }

    freeCount() {
        return this.freed.length;
    }

    inuseCount() {
        return Object.keys(this.inuse).length;
    }

    setTimeout() {
        if (!this.timeout && this.freed.length) {
            let millis = this.freed[0][Pool.expireKey] - Date.now();
            this.timeout = setTimeout(async () => await this.discard(), millis);
        }
    }
});
