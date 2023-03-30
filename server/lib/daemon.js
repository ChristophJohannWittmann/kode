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
 * A daemon is by definition a service that runs in the application's primary
 * process.  A daemon must extend class Daemon and must be defined as a single
 * class.  The daemon is automatically loaded as part of the based server load.
 * A daemon can also be defined in a module if the preceeding rules are observed.
 * When the Daemon-based single instance is created, all properties from the
 * object instance that (a) begin with "on" and (b) are javascript functions
 * will be integrated into the Daemon by registering message handlers for each
 * of those functions.
 * 
*****/
register(class Daemon extends NonJsonable {
    constructor() {
        super();
        let suffix = Reflect.getPrototypeOf(this).constructor.name;

        for (let propertyName of Object.getOwnPropertyNames(Reflect.getPrototypeOf(this))) {
            if (propertyName.startsWith('on') && typeof this[propertyName] == 'function') {
                let messageName = `#${suffix}${propertyName.substr(2)}`;
                Ipc.on(messageName, async message => await this[propertyName](message));
                on(messageName, async message => await this[propertyName](message));
            }
        }
    }
});
