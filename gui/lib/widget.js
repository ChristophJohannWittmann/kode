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
    static initialized = mkSet();

    constructor(tagName) {
        super();
        this.widgetId = Widget.nextId++;
        this.selector = `widget${this.widgetId}`;
        this.type = Reflect.getPrototypeOf(this).constructor;
        this.typeName = Reflect.getPrototypeOf(this).constructor.name;
        this.style = styleSheet.createRule(`#${this.selector} {}`);

        let clss = Reflect.getPrototypeOf(this).constructor;
        console.log(classHierarchyList(this));

        while (true) {
            if (!Widget.initialized.has(clss.name)) {
                if ('initializeWidgetClass' in clss) {
                    clss.initializeWidgetClass();
                }

                Widget.initialized.set(clss.name);
                let match = clss.toString().match(/extends[ \t\n\r]+([A-Za-z0-9_]+)[ \t\n\r]+\{/m);

                if (match) {
                    if (match[1] in window) {
                        if (match[1] != 'Widget') {
                            clss = window[match[1]];
                            continue;
                        }
                    }
                }

                break;
            }
        }

        this.htmlElement = htmlElement(tagName)
        .setAttribute('id', this.selector)
        .setClassName('widget')
        .setClassName(`${this.classStyleName()}`);
    }

    classStyleName() {
        return `.wstyle-${this.typeName.toLowerCase()}`;
    }

    classStyleSelector() {
        return `wstyle-${this.typeName.toLowerCase()}`;
    }

    static initializeWidgetClass() {
        Widget.style = styleSheet.createRule(`.widget {
            height: 100%;
            width: 100%;
        }`);
    }
});