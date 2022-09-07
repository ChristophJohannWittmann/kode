/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
register(class Pool extends Emitter {
    static lookAhead = 600;
    static id = 1;
    static idKey = Symbol('#Id');
    static poolKey = Symbol('#PoolId');
    static expireKey = Symbol('#Expire');
    static reuseKey = Symbol('#Reuse');
    static pools = {};

    constructor(ctor, idleTime) {
        super();
        this.id = Pool.id++;
        this.resourceId = 1;
        this.ctor = ctor;
        this.freed = [];
        this.allocated = {};
        this.timeout = null;
        this.closed = false;
        this.idleTime = idleTime;
        Pool.pools[this.id] = this;
    }
  
    async alloc(...args) {
        if (!this.closed) {
            if (this.freed.length) {
                let resource = this.freed.shift();
                this.allocated[resource[Pool.poolKey]] = resource;
                return resource;
            }
            else {
                let resource = await this.ctor(...args);
                resource[Pool.idKey] = this.resourceId++;
                resource[Pool.poolKey] = this.id++;
                resource[Pool.expireKey] = 0;
                resource[Pool.reuseKey] = true;
                this.allocated[resource[Pool.idKey]] = resource;
                return resource;
            }
        }
    }
    
    allocCount() {
        return Object.keys(this.allocated).length;
    }
  
    async clean() {
        this.timeout = null;
        let cutoff = DATE().now() + Pool.lookAhead;
  
        while (this.freed.length) {
            let resource = this.freed[0];
  
            if (resource[Pool.expireKey] < cutoff) {
                this.freed.shift();
                await resource.close();
            }
            else {
                break;
            }
        }
  
        if (this.freed.length) {
            let resource = this.freed[0];
            let delta = resource[Pool.expireKey] - DATE().now();
            this.timeout = setTimeout(() => this.clean(), delta);
        }
    }
  
    async close() {
        this.closed = true;
  
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
  
        while (this.freed.length) {
            await this.freed.shift().close();
            this.freed = [];
        }
    }
  
    async create(...args) {
        if (!this.closed) {
            let resource = await this.ctor(...args);
            resource[Pool.idKey] = this.resourceId++;
            resource[Pool.poolKey] = this.id++;
            resource[Pool.expireKey] = 0;
            resource[Pool.reuseKey] = false;
            this.allocated[resource[Pool.idKey]] = resource;
            return resource;
        }
    }
  
    async free(resource) {
        if (this.closed) {
            await resource.close();
        }
        else {
            this.freed.push(resource);
            delete this.allocated[resource[Pool.idKey]];
         
            if (resource[Pool.reuseKey]) {
                resource[Pool.expireKey] = DATE().now() + this.idleTime;
      
                if (!this.timeout) {
                    let delta = resource[Pool.expireKey] - DATE().now() ;
                    this.timeout = setTimeout(() => this.clean(), delta);
                }
            }
            else {
                await resource.close();
            }
        }
    }
    
    static async free(resource) {
        if (Pool.poolKey in resource) {
            let poolId = resource[Pool.poolKey];
            let pool = Pool.pools[poolId];
         
            if (pool && Pool.idKey in resource) {
                let resourceId = resource[Pool.idKey];
         
                if (resourceId in pool.allocated) {
                    await pool.free(resource);
                }
            }
        }
    }
    
    freedCount() {
        return this.freed.length;
    }
});
