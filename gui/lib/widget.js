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

    constructor(tagName) {
        super();
        this.widgetId = Widget.nextId++;
        this.selector = `widget${this.widgetId}`;
        this.type = Reflect.getPrototypeOf(this).constructor;
        this.typeName = Reflect.getPrototypeOf(this).constructor.name;
        this.style = styleSheet.createRule(`#${this.selector} {}`);

        for (let clss of classHierarchyList(this)) {
            if (clss.name != 'Emitter') {
                if (!(clss.name in Widget.initialized)) {
                    let classStyle = doc.getStyleSheet('webapp').createRule(`${this.classStyleSelector()} {}`);

                    Widget.initialized[clss.name] = {
                        classStyle: classStyle,
                    };

                    if ('initializeWidgetClass' in clss) {
                        clss.initializeWidgetClass(classStyle);
                    }
                }
            }
        }

        this.htmlElement = htmlElement(tagName)
        .setAttribute('id', this.selector)
        .setClassName('widget')
        .setClassName(this.classStyleName())
        .setClassName(`${this.classStyleName()}`);
    }

    classStyleName() {
        return `.wstyle-${this.typeName.toLowerCase()}`;
    }

    classStyle() {
        return Widget.initialized[this.typeName].classStyle;
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