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
(() => {
    let nextId = 1;

    register(class Widget extends HtmlElement {
        constructor(arg) {
            if (arg instanceof Node) {
                super(arg);
            }
            else {
                super(typeof arg == 'string' ? arg : 'div');
            }

            this.setCache('id', nextId++);
            this.setCache('concealed', null);
            this.setCache('styles', []);
            this.setId(`widget${this.getCache('id')}`);
            this.setWidgetStyle('widget');
            this.setAttribute('widget-class', `${Reflect.getPrototypeOf(this).constructor.name}`);
        }

        append(...args) {
            super.append(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
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
                mkInnerHtmlBinding(this, activeData, key);            
            }

            return this;
        }

        clear() {
            super.clear();

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
            });

            return this;
        }

        clearAttribute(name) {
            super.clearAttribute(name);

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: name,
                value: '',
            });

            return this;
        }

        clearCache(name) {
            delete super.getCache('widget')[name];
            return this;
        }

        clearClassName(className) {
            super.clearClassName(className);

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'className',
            });

            return this;
        }

        clearClassNames() {
            this.setAttribute('class', '');

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'className',
            });

            return this;
        }

        clearStyle() {
            super.clearStyle();

            this.send({
                messageName: 'Widget.Changed',
                type: 'style',
                widget: this,
            });

            return this;
        }

        clearValue() {
            this.clearAttribute('value');
            return this;
        }

        conceal() {
            if (this.getCache('concealed') === null) {
                this.silence();
                this.setCache('concealed', new Placeholder(this));
                this.replace(this.getCache('concealed'));
                this.resume();
            }

            return this;
        }

        disable() {
            if (this.isEnabled()) {
                super.disable();

                this.send({
                    messageName: 'Widget.Changed',
                    type: 'attribute',
                    widget: this,
                    name: 'disabled',
                    value: true,
                });

                this.silence();
            }

            return this;
        }

        disablePropagation(eventName) {
            this.getCache('propagation').clear(eventName);
            return this;
        }

        enable() {
            if (this.isDisabled()) {
                super.enable();
                this.resume();

                this.send({
                    messageName: 'Widget.Changed',
                    type: 'attribute',
                    widget: this,
                    name: 'disabled',
                    value: false,
                });
            }

            return this;
        }

        getCache(name) {
            return super.getCache('widget')[name];
        }

        getPanel() {
            let parent = this.parent();

            while (parent && !(parent instanceof WPanel)) {
                parent = parent.parent();
            }

            return parent;
        }

        getView() {
            let parent = this.parent();

            while (parent && !(parent instanceof WView)) {
                parent = parent.parent();
            }

            return parent;
        }

        getWidgetStyle() {
            return this.getAttribute('widget-style');
        }

        hasCache(name) {
            return super.getCache('widget')[name] !== undefined;
        }

        hasValue() {
            return this.hasAttribute('value');
        }

        insertAfter(...args) {
            super.insertAfter(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
            });

            return this;
        }

        insertBefore(...args) {
            super.insertBefore(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
            });

            return this;
        }

        logWidget() {
            console.log(this.getCache('widget'));
            return this;
        }

        off(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.off(messageName.substr(4), handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.off, this, [messageName, handler, filter]);
            }
        }

        on(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.on(messageName.substr(4), handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.on, this, [messageName, handler, filter]);
            }
        }

        once(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.once(messageName.substr(4), handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.once, this, [messageName, handler, filter]);
            }
        }

        popStyle() {
            let styleStack = this.getCache('styles');

            if (styleStack.length) {
                let style = styleStack[styleStack.length - 1];
                this.clearStyle();
                this.setStyle(style);
            }

            return this;
        }

        prepend(...args) {
            super.prepend(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
            });

            return this;
        }

        pushStyle(styleObj) {
            let style = this.getStyle();
            this.getCache('styles').push(style);
            style = clone(style);

            for (let key in styleObj) {
                style[key] = styleObj[key];
            }

            this.clearStyle();
            this.setStyle(style);
            return this;
        }

        remove() {
            let parent = this.parent();

            if (parent) {
                super.remove();

                this.send({
                    messageName: 'remove',
                    type: 'remove',
                    widget: parent,
                    value: parent.children(),
                });
            }

            return this;
        }

        replace(...args) {
            let parent = this.parent();

            if (parent) {
                super.replace(...args);

                this.send({
                    messageName: 'Widget.Changed',
                    type: 'innerHtml',
                    widget: parent,
                    value: parent.children(),
                });
            }

            return this;
        }

        reveal() {
            if (this.getCache('concealed') instanceof Placeholder) {
                this.silence();
                this.getCache('concealed').replace(this);
                this.setCache('concealed', null);
                this.resume();
            }

            return this;
        }

        setAttribute(name, value) {
            super.setAttribute(name, value);

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: name,
                value: value,
            });

            return this;
        }

        setClassName(className) {
            super.setClassName(className);

            this.send({
                messageName: 'Widget.Changed',
                type: 'className',
                widget: this,
                name: 'className',
            });

            return this;
        }

        setClassNames(classNames) {
            super.setClassNames(classNames);

            this.send({
                messageName: 'Widget.Changed',
                type: 'classNames',
                widget: this,
                name: 'classNames',
            });

            return this;
        }

        setCache(name, value) {
            super.getCache('widget')[name] = value;
            return this;
        }

        setInnerHtml(innerHtml) {
            super.setInnerHtml(innerHtml);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
            });

            return this;
        }

        setOuterHtml(outerHtml) {
            super.setOuterHtml(outerHtml);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
                value: this.children(),
            });

            return this;
        }

        setStyle(arg, value) {
            super.setStyle(arg, value);

            this.send({
                messageName: 'Widget.Changed',
                type: 'style',
                widget: this,
                style: this.getStyle(),
            });

            return this;
        }

        setWidgetStyle(widgetStyle) {
            this.setAttribute('widget-style', widgetStyle);
            return this;
        }

        unbind(activeData) {
            if (activeData) {
                Binding.unbind(activeData, this);
            }
            else {
                Binding.unbindWidget(this);
            }

            return this;
        }
    });

    class Placeholder extends Widget {
        constructor(widget) {
            super('div');
            this.widget = widget;
            this.setStyle('display', 'none');
            this.setId(this.widget.getId());
        }

        reveal() {
            this.widget.reveal();
        }
    }
})();
