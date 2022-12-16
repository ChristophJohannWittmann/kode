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
    static bindingKey = Symbol('binding');
    static handlerKey = Symbol('handler');

    constructor(arg) {
        super();
        this[Widget.handlerKey] = {};
        this.selector = `widget${Widget.nextId++}`;
        this.styleRule = styleSheet.createRule(`#${this.selector} {}`);
        this[Widget.bindingKey] = 'innerHtml';

        if (arg instanceof HtmlElement) {
            this.htmlElement = arg;
        }
        else {
            this.htmlElement = htmlElement(arg ? arg : 'div');
        }

        this.htmlElement.setAttribute('id', this.selector);
        this.brand(this.htmlElement);
        this.setAttribute('widget-class', `${Reflect.getPrototypeOf(this).constructor.name}`);
    }

    append(...args) {
        this.htmlElement.append(...args);

        this.send({
            messageName: 'Widget.Changed',
            widget: this,
        });

        return this;
    }

    bind(activeData, key, arg) {
        if (arg) {
            if (typeof arg == 'string') {
                mkAttributeBinding(this, activeData, key, arg);
            }
            else if (typeof arg == 'object') {
                mkMapBinding(this, activeData, key, arg);
            }
        }
        else if (this[Widget.bindingKey] == 'innerHtml') {
            mkInnerHtmlBinding(this, activeData, key);
        }
        else if (this[Widget.bindingKey] == 'value') {
            mkValueBinding(this, activeData, key);
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
                return child.widget();
            }
        }

        return null;
    }

    children() {
        return this.htmlElement.children().map(child => child.widget());
    }

    clear() {
        this.htmlElement.clear();

        this.send({
            messageName: 'Widget.Changed',
            type: 'innerHTML',
            widget: this,
        });

        return this;
    }

    clearAttribute(name) {
        this.htmlElement.clearAttribute(name);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: name,
            value: '',
        });

        return this;
    }

    clearClasses() {
        this.setAttribute('class', '');

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: 'classes',
            value: '',
        });

        return this;
    }

    clearClassName(className) {
        this.htmlElement.clearClassName(className);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: 'className',
            value: '',
        });

        return this;
    }

    dir() {
        this.htmlElement.dir();
        return this;
    }

    disablePropagation(eventName) {
        this.htmlElement.disablePropagation(eventName);
    }

    enablePropagation(eventName) {
        this.htmlElement.enablePropagation(eventName);
    }

    get() {
        return this.htmlElement.getInnerHtml();
    }

    getAttribute(name) {
        return this.htmlElement.getAttribute(name);
    }

    getStyle(propertyName) {
        return this.htmlElement.node.style[propertyName];
    }

    getWidgetStyle() {
        return this.getAttribute('widget-style');
    }

    hasAttribute(name) {
        return this.htmlElement.hasAttribute(name);
    }

    hasClassName(className) {
        return this.htmlElement.hasClassName(className);
    }

    insertAfter(...args) {
        this.htmlElement.insertAfter(...args);
    }

    insertBefore(...args) {
        this.htmlElement.insertBefore(...args);
    }

    length() {
        return this.htmlElement.length();
    }

    log() {
        this.htmlElement.log();
        return this;
    }

    off(messageName, handler) {
        super.off(messageName, handler);

        if (messageName.startsWith('html.')) {
            if (messageName in this[Widget.handlerKey]) {
                if (this[Widget.handlerKey][messageName].count-- <= 0) {
                    this.htmlElement.off(messageName.substr(5), this[Widget.handlerKey][messageName].handler);
                    delete this[Widget.handlerKey][messageName];
                }
            }
        }

        return this;
    }

    on(messageName, handler, filter) {
        super.on(messageName, handler, filter);

        if (messageName.startsWith('html.')) {
            this.registerHandler(messageName, false);
        }

        return this;
    }

    once(messageName, handler, filter) {
        super.once(messageName, handler, filter);

        if (messageName.startsWith('html.')) {
            this.registerHandler(messageName, true);
        }

        return this;
    }

    parent() {
        let parent = this.htmlElement.parent();

        if (parent) {
            return parent.widget();
        }
    }

    prepend(...args) {
        this.htmlElement.prepend(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'innerHTML',
            widget: this,
        });

        return this;
    }

    registerHandler(messageName, once) {
        if (messageName in this[Widget.handlerKey]) {
            this[Widget.handlerKey][messageName].count++;
            return this[Widget.handlerKey][messageName].handler;
        }
        else {
            let handler = message => {
                message.messageName = `html.${message.messageName}`;
                this.send(message);
            };

            this[Widget.handlerKey][messageName] = {
                count: 1,
                handler: handler,
            };

            once ? this.htmlElement.once(messageName.substr(5), handler) : this.htmlElement.on(messageName.substr(5), handler);
            return handler;
        }
    }

    remove() {
        let parent = this.htmlElement.parent();

        if (parent) {
            this.htmlElement.remove();

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHTML',
                widget: parent.widget(),
            });
        }

        return this;
    }

    replace(...widgets) {
        let parent = this.htmlElement.parent();

        if (parent) {
            let filtered = widgets.filter(w => w instanceof Widget);
            this.htmlElement.replace(...filtered);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHTML',
                widget: parent.widget(),
            });
        }

        return this;
    }

    set(innerHtml) {
        this.htmlElement.setInnerHtml(innerHtml);

        this.send({
            messageName: 'Widget.Changed',
            type: 'innerHTML',
            widget: this,
        });

        return this;
    }

    setAttribute(name, value) {
        this.htmlElement.setAttribute(name, value);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: name,
            value: value,
        });

        return this;
    }

    setClasses(classes) {
        this.setAttribute('class', classes);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: 'classes',
            value: classes,
        });

        return this;
    }

    setClassName(className) {
        this.htmlElement.setClassName(className);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: 'className',
            value: className,
        });

        return this;
    }

    setStyle(propertyName, value) {
        this.htmlElement.node.style[propertyName] = value;
        return this;
    }

    setWidgetStyle(widgetStyle) {
        this.setAttribute('widget-style', widgetStyle);
        return this;
    }

    [Symbol.iterator]() {
        return this.children()[Symbol.iterator]();
    }

    tagName() {
        return this.htmlElement.tagName();
    }

    toggleClassName(className) {
        this.htmlElement.toggleClassName(className);

        this.send({
            messageName: 'Widget.Changed',
            type: 'attribute',
            widget: this,
            name: 'className',
            value: this.hasClassName() ? className : '',
        });

        return this;
    }

    unbind(activeData) {
        if (activeData) {
            Binding.unbind(activeData, this);
        }
        else {
            Binding.unbindWidget(this);
        }
    }
});
