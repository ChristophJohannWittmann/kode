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
        this.classData = WidgetClassManager.fromInstance(this);
        this.flexName = null;

        if (!tagName) {
            throw new Error(`Widget.ctor, tagName argument must be provided.`);
        }

        this.htmlElement = htmlElement(tagName);
        this.htmlElement.setAttribute('id', this.selector);
        this.htmlElement.setClassName('widget');
        this.htmlElement.setClassName(this.classData.styleName);
        this.brand(this.htmlElement);
    }

    brand(arg) {
        let htmlElement = reducio(arg);
        htmlElement[Widget.widgetKey] = this;
        return this;
    }

    clearFlex() {
        if (this.flexName) {
            this.htmlElement.clearClassName(this.flexName);
            this.flexName = null;
        }
    }

    static initialize(classData) {
        createBorderStyles(classData);
        createFlexStyles(classData);
    }

    static initializeWidgets() {
        Widget.style = styleSheet.createRule(`.widget {
            height: 100%;
            width: 100%;
        }`);
    }

    setClassName(className) {
        this.htmlElement.setClassName(className);
    }

    setFlex(dir, align) {
        let flexName;

        if (dir in { h:0, v:0}) {
            switch (align) {
                case 'ss':
                case 'cs':
                case 'es':
                case 'sc':
                case 'cc':
                case 'ec':
                case 'se':
                case 'ce':
                case 'ee':
                    flexName = `flex-${dir}-${align}`;
                    break;
            }
        }

        if (flexName) {
            if (this.flexName) {
                this.htmlElement.clearClassName(this.flexName);
            }

            this.flexName = flexName;
            this.htmlElement.setClassName(this.flexName);
        }
    }
});


/*****
*****/
function createBorderStyles(classData) {
    classData.createStyleRule(`.border-none {
        border: none;
    }`);

    classData.createStyleRule(`.border-1-thin {
        border: var(--border1);
    }`);
}


/*****
*****/
function createFlexStyles(classData) {
    classData.createStyleRule(`.flex-h-ss {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-h-cs {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-h-es {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-h-sc {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-h-cc {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-h-ec {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-h-se {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-end;
    }`);

    classData.createStyleRule(`.flex-h-ce {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-end;
    }`);

    classData.createStyleRule(`.flex-h-ee {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: flex-end;
    }`);

    classData.createStyleRule(`.flex-v-ss {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-v-cs {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-v-es {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: flex-start;
    }`);

    classData.createStyleRule(`.flex-v-sc {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-v-cc {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-v-ec {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
    }`);

    classData.createStyleRule(`.flex-v-se {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-end;
    }`);

    classData.createStyleRule(`.flex-v-ce {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-end;
    }`);

    classData.createStyleRule(`.flex-v-ee {
        display: flex;
        flex-direction: column;
        flex-basis: auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: flex-end;
    }`);
}