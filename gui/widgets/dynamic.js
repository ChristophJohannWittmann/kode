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
 * This is a base class for widgets that need to dynamically morph based on
 * changes to a value in an active data repository.  In essence, changes to the
 * value will cause the onChange() method to be invoked.  It's a powerful base
 * class.
*****/
register(class WDynamic extends Widget {
    constructor(tagName, activeData) {
        super(tagName);

        ActiveData.on(activeData, message => {
            if (message.action == 'change') {
                let methodName = `on${message.key[0].toUpperCase()}${message.key.substr(1)}Changed`;

                if (methodName in this) {
                    this[methodName](message);
                }
            }
            else if (message.action == 'add') {
                let methodName = `on${message.key[0].toUpperCase()}${message.key.substr(1)}Added`;

                if (methodName in this) {
                    this[methodName](message);
                }
            }
            else if (message.action == 'delete') {
                let methodName = `on${message.key[0].toUpperCase()}${message.key.substr(1)}Deleted`;

                if (methodName in this) {
                    this[methodName](message);
                }
            }
        });
    }
});
