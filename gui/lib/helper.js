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
 * A helper is a base class whose purpose is to provide additional features to
 * widgets as needed.  The concept is that the widget constructor or an outside
 * call simply creates helper subclass in order to add a specific feature subset
 * to individual widgets as required or usefule.
*****/
register(class Helper {  
    constructor(widget) {
        this.widget = widget;
        let prototype = Reflect.getPrototypeOf(this);

        for (let property of Object.getOwnPropertyNames(prototype)) {
            if (property.startsWith('helper') && typeof prototype[property] == 'function') {
                let propertyName = `${property[6].toLowerCase()}${property.substr(7)}`;

                if (propertyName.startsWith('set')) {
                    widget[propertyName] = (...args) => {
                        Reflect.apply(prototype[property], widget, args);
                        return widget;
                    }
                }
                else {
                    widget[propertyName] = (...args) => Reflect.apply(prototype[property], widget, args);
                }
            }
        }
    }
});