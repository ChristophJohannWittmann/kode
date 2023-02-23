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
    static handlerKey = Symbol('handler');

    constructor(arg) {
        super();
        this[Widget.handlerKey] = {};
        this.id = Widget.nextId++;
        this.selector = `widget${this.id}`;
        this.filters = [];

        this.htmlElement = mkHtmlElement(arg ? arg : 'div');
        this.htmlElement.setAttribute('id', this.selector);
        this.brand(this.htmlElement);
        this.setAttribute('widget-class', `${Reflect.getPrototypeOf(this).constructor.name}`);
        this.setAttribute('widget-border', 'none');

        this.on('html.click', message => {
            doc.send(message);
        });
    }

    append(...args) {
        this.htmlElement.append(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'add',
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
            else if (typeof arg == 'function') {
                mkFunctionBinding(this, activeData, key, arg);
            }
        }
        else {
            mkValueBinding(this, activeData, key);            
        }

        return this;
    }

    blur() {
        this.htmlElement.node.blur();
        return this;
    }

    brand(arg) {
        let naked = unwrapDocNode(arg);

        if (naked && naked[Widget.widgetKey] === undefined) {
            naked[Widget.widgetKey] = this;
        }

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
        return this.htmlElement.children()
        .filter(child => child instanceof DocElement)
        .map(child => child.widget());
    }

    clear() {
        this.htmlElement.clear();

        this.send({
            messageName: 'Widget.Changed',
            type: 'remove',
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

    clearFilters() {
        if (this.filters.length) {
            this.setStyle('filter', this.filters[0].toString());
            this.filters = [];
        }

        return this;
    }

    clearStyle() {
        for (let i = 0; i < this.htmlElement.node.style.length; i++) {
            let styleProperty = this.htmlElement.node.style.item(i);
            this.htmlElement.node.style.removeProperty(styleProperty);
        }

        return this;
    }

    conceal() {
        if (typeof this.cssDisplay == 'undefined') {
            this.cssDisplay = this.getStyle('display');
            this.setStyle('display', 'none');
        }
    }

    dir() {
        this.htmlElement.dir();
        return this;
    }

    disable() {
        this.setAttribute('disabled');
        return this;
    }

    disablePropagation(eventName) {
        this.htmlElement.disablePropagation(eventName);
    }

    enable() {
        this.clearAttribute('disabled');
        return this;
    }

    enablePropagation(eventName) {
        this.htmlElement.enablePropagation(eventName);
    }

    focus() {
        this.htmlElement.node.focus();
        return this;
    }

    get() {
        return this.htmlElement.getInnerHtml();
    }

    getAttribute(name) {
        return this.htmlElement.getAttribute(name);
    }

    getOffset() {
        return this.htmlElement.getOffset();
    }

    getPanel() {
        let parent = this.parent();

        while (parent) {
            if (parent instanceof WPanel) {
                return parent;
            }

            parent = parent.parent();
        }

        return parent;
    }

    getStyle(arg) {
        if (arg) {
            return this.htmlElement.node.style[arg];
        }
        else {
            let style = {};

            for (let i = 0; i < this.htmlElement.node.style.length; i++) {
                let styleProperty = this.htmlElement.node.style.item(i);
                style[styleProperty] = this.htmlElement.node.style[styleProperty];
            }

            return style;
        }
    }

    getValue() {
        return this.get();
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

    height() {
        return this.htmlElement.node.offsetHeight;
    }

    insertAfter(...args) {
        this.htmlElement.insertAfter(...args);
    }

    insertBefore(...args) {
        this.htmlElement.insertBefore(...args);
    }

    isDisabled() {
        return this.hasAttribute('disabled');
    }

    isEnabled() {
        return !this.hasAttribute('disabled');
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

    popFilter() {
        if (this.filters.length) {
            this.filters.pop();
            this.setStyle('filter', this.filters[this.filters.length - 1].toString());

            if (this.filters.length == 1) {
                this.filters.pop();
            }
        }

        return this;
    }

    parent() {
        let parent = this.htmlElement.parent();

        if (parent) {
            return parent.widget();
        }

        return null;
    }

    prepend(...args) {
        this.htmlElement.prepend(...args);

        this.send({
            messageName: 'Widget.Changed',
            type: 'add',
            widget: this,
        });

        return this;
    }

    pushFilter(filter) {
        if (this.filters.length == 0) {
            this.filters.push(mkWFilter(this));
        }

        if (filter instanceof WFilter) {
            this.filters.push(filter);
            this.setStyle('filter', filter.toString());
        }
        else if (typeof filter == 'object') {
            let filterObj = mkWFilter(filter);
            this.filters.push(filterObj);
            this.setStyle('filter', filterObj.toString());
        }
        else if (this.filters.length == 1) {
            this.filters.pop();
        }

        return this;
    }

    queryAll(selector) {
        return this.htmlElement.queryAll(selector).map(htmlElement => htmlElement.widget());
    }

    queryOne(selector) {
        let selected = this.htmlElement.queryOne(selector);

        if (selected) {
            selected = selected.widget();
        }

        return selected;
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
                messageName: 'remove',
                type: 'innerHTML',
                widget: parent.widget(),
            });
        }

        return this;
    }

    replace(...widgets) {
        let parent = this.htmlElement.parent().widget();

        if (parent) {
            let filtered = widgets.filter(w => w instanceof Widget);
            this.htmlElement.replace(...filtered);

            this.send({
                messageName: 'Widget.Changed',
                type: 'replace',
                widget: this,
                replacements: filtered,
            });
        }

        return this;
    }

    reveal() {
        if (typeof this.cssDisplay == 'string') {
            this.setStyle('display', this.cssDisplay);
            delete this.cssDisplay;
        }
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

    setStyle(arg, value) {
        if (typeof arg == 'object') {
            for (let property in arg) {
                let value = arg[property];
                this.htmlElement.node.style[property] = value;
            }
        }
        else {
            arg == 'width' ? console.log(this) : false;
            this.htmlElement.node.style[arg] = value;
        }

        return this;
    }

    setValue(value) {
        this.set(value);
        return this;
    }

    setWidgetStyle(widgetStyle) {
        this.setAttribute('widget-style', widgetStyle);
        return this;
    }

    size() {
        return {
            width: this.htmlElement.node.offsetWidth,
            height: this.htmlElement.node.offsetHeight,
        };
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

    width() {
        return this.htmlElement.node.offsetWidth;
    }
});
