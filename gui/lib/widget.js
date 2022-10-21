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
 * From a framework perspective, the widget is the fundamental building block for
 * the GUI.  Widgets wrap HTML element, events, data, and other programming logic
 * into functional GUI units.  This base class, Widget, should be considered
 * to be abstract, although it can technically used on its own.  The basic widget
 * requires external logic to dynamically populate the Widgets components.  We
 * prefer to subclass and add features within the subclass to encapsulate the
 * needed GUI features.  HTML Elements belonging to a widget are braned with a
 * symbol property that refers back to the owning widget.  The HtmlElement class
 * has an owingWidget() method that returns either the widget or null if not part
 * of a widget.
*****/
register(class Widget extends Emitter {
    static nextId = 1;
    static initialized = {};
    static widgetKey = Symbol('widget');

    constructor(tagName) {
        super();
        this.binding = null;
        this.bindingSuppress = false;
        this.widgetId = Widget.nextId++;
        this.selector = `widget${this.widgetId}`;
        this.styleRule = styleSheet.createRule(`#${this.selector} {}`);

        if (typeof tagName == 'string') {
            this.htmlElement = htmlElement(tagName);
            this.htmlElement.setAttribute('id', this.selector);
            this.brand(this.htmlElement);
        }
        else {
            throw new Error(`mkWidget(), expecting a tagName string: ${tagName}`);
        }
    }

    append(...args) {
        this.htmlElement.append(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'append',
            widget: this,
            widgets: args,
        });

        return this;
    }

    bindingRecv() {
        if (this.binding) {
            this.set(this.binding.activeData[this.binding.key]);
        }

        return this;
    }

    bindingSend(value) {
        if (this.binding) {
            this.bindingSuppress = true;
            this.binding.activeData[this.binding.key] = value;
        }

        return this;
    }

    bindingStart(activeData, key) {
        let recv = message => {
            if (!this.bindingSuppress) {
                this.bindingRecv();
            }

            this.bindingSuppress = false;
        };

        ActiveData.on(activeData, recv, message => message.key == key);
        this.binding = { activeData: activeData, key: key, recv: recv };
        this.set(activeData[key]);
        return this;
    }

    bindingStop() {
        if (this.binding) {
            ActiveData.off(this.binding.activeData, this.binding.recv);
            this.binding = null;
        }

        return this;
    }

    brand(arg) {
        let htmlElement = reducio(arg);
        htmlElement[Widget.widgetKey] = this;
        return this;
    }

    childAt(index) {
        let children = this.htmlElement.children();

        if (index >= 0 && index < children.length) {
            let child = children[index];

            if (child instanceof HtmlElement) {
                return child.owningWidget();
            }
        }

        return null;
    }

    clear() {
        this.htmlElement.clear();

        this.send({
            messageName: 'Widget.Changed',
            type: 'clear',
            widget: this,
        });

        return this;
    }

    clearAttribute(name) {
        this.htmlElement.clearAttribute(name);
        return this;
    }

    clearClassName(className) {
        this.htmlElement.clearClassName(className);

        this.send({
            messageName: 'Widget.Changed',
            type: 'clearClassName',
            widget: this,
            className: className,
        });

        return this;
    }

    clearClassNames() {
        this.htmlElement.clearClassNames();
        return this;
    }

    dir() {
        this.htmlElement.dir();
        return this;
    }

    getAttribute(name) {
        return this.htmlElement.getAttribute(name);
    }

    getClassNames() {
        return this.htmlElement.getClassNames();
    }

    hasClassName(className) {
        return this.htmlElement.hasClassName(className);
    }

    log() {
        this.htmlElement.log();
        return this;
    }

    off(messageName, handler) {
        if (messageName.startsWith('html.')) {
            this.htmlElement.off(messageName.substr(5), handler)
        }
        else {
            super.off(messageName, handler);
        }
    }

    on(messageName, handler, filter) {
        if (messageName.startsWith('html.')) {
            this.htmlElement.on(messageName.substr(5), handler, filter)
        }
        else {
            super.on(messageName, handler, filter);
        }
    }

    once(messageName, handler, filter) {
        if (messageName.startsWith('html.')) {
            this.htmlElement.once(messageName.substr(5), handler, filter)
        }
        else {
            super.once(messageName, handler, filter);
        }
    }

    prepend(...args) {
        this.htmlElement.prepend(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'prepend',
            widget: this,
            widgets: args,
        });

        return this;
    }

    remove() {
        this.send({
            messageName: 'Widget.Changed',
            type: 'remove',
            widget: this,
        });

        this.htmlElement.remove();
        return this;
    }

    replace(...widgets) {
        let filtered = widgets.filter(w => w instanceof Widget);
        this.htmlElement.replace(...filtered);

        this.send({
            messageName: 'Widget.Changed',
            type: 'replace',
            widget: this,
            widgets: filtered,
        });

        return this;
    }

    set(...args) {
        this.clear();
        this.htmlElement.append(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'set',
            widget: this,
            widgets: args,
        });

        return this;
    }

    setAttribute(name, value) {
        this.htmlElement.setAttribute(name, value);
        return this;
    }

    setClassName(className) {
        this.htmlElement.setClassName(className);

        this.send({
            messageName: 'Widget.Changed',
            tyype: 'setClassName',
            widget: this,
            className: className,
        });

        return this;
    }

    setClassNames(classNames) {
        this.htmlElement.setClassNames(classNames);
        return this;
    }

    tagName() {
        return this.htmlElement.tagName();
    }

    toggleClassName(className) {
        this.htmlElement.toggleClassName(className);

        if (this.hasClassName(className)) {
            this.send({
                messageName: 'Widget.Changed',
                type: 'setClassName',
                widget: this,
                className: className,
            });
        }
        else {
            this.send({
                messageName: 'Widget.Changed',
                type: 'clearClassName',
                widget: this,
                className: className,
            });
        }

        return this;
    }
});