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
*****/
register(class Widget extends Emitter {
    static nextId = 1;
    static initialized = {};
    static widgetKey = Symbol('widget');

    constructor(tagName) {
        super();
        this.widgetId = Widget.nextId++;
        this.selector = `widget${this.widgetId}`;
        this.styleRule = styleSheet.createRule(`#${this.selector} {}`);

        if (!tagName) {
            throw new Error(`Widget.ctor, tagName argument must be provided.`);
        }

        this.htmlElement = htmlElement(tagName);
        this.htmlElement.setAttribute('id', this.selector);
        this.htmlElement.setClassName('widget');
        this.brand(this.htmlElement);
    }

    append(...args) {
        this.htmlElement.append(...args);
        return this;
    }

    brand(arg) {
        let htmlElement = reducio(arg);
        htmlElement[Widget.widgetKey] = this;
        return this;
    }

    clear() {
        this.htmlElement.clear();
        return this;
    }

    clearClassName(className) {
        this.htmlElement.clearClassName(className);
        return this;
    }

    getClassNames() {
        return this.htmlElement.getClassNames();
    }

    hasClassName(className) {
        return this.htmlElement.hasClassName(className);
    }

    prepend(...args) {
        this.htmlElement.prepend(...args);
        return this;
    }

    setClassName(className) {
        this.htmlElement.setClassName(className);
        return this;
    }

    tagName() {
        return this.htmlElement.tagName();
    }

    toggleClassName(className) {
        this.htmlElement.toggleClassName(className);
        return this;
    }
});