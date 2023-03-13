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

    const wireNames = mkStringSet(
        'Widget.Changed',
        'Widget.Modified',
        'Widget.Validity',
    );

    register(class Widget extends HtmlElement {
        constructor(arg) {
            if (arg instanceof Node) {
                super(arg);
            }
            else {
                super(typeof arg == 'string' ? arg : 'div');
            }

            this.setCacheInternal('id', nextId++);
            this.resetFlag('concealed');
            this.setId(`widget${this.getCacheInternal('id')}`);
            this.setWidgetStyle('widget');
            this.setAttribute('widget-class', `${Reflect.getPrototypeOf(this).constructor.name}`);
            this.refreshers = mkStringSet();
        }

        append(...args) {
            super.append(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
            });

            return this;
        }

        bind(activeData, key, arg) {
            if (arg === Binding.valueBinding) {
                mkValueBinding(this, activeData, key);
            }
            else if (typeof arg == 'string') {
                mkAttributeBinding(this, activeData, key, arg);
            }
            else if (typeof arg == 'object') {
                mkMapBinding(this, activeData, key, arg);
            }
            else if (typeof arg == 'function') {
                mkFunctionBinding(this, activeData, key, arg);
            }
            else if (arg === undefined) {
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
                value: null,
            });

            return this;
        }

        clearClassName(className) {
            super.clearClassName(className);

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'class',
                value: null,
            });

            return this;
        }

        clearClassNames() {
            this.setAttribute('class', '');

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'class',
                value: null,
            });

            return this;
        }

        clearRefreshers(...endpointNames) {
            this.refreshers.clear(...endpointNames);
            return this;
        }

        clearStyle() {
            super.clearStyle();

            this.send({
                messageName: 'Widget.Changed',
                type: 'style',
                widget: this,
                value: null,
            });

            return this;
        }

        clearValue() {
            this.clearAttribute('value');
            return this;
        }

        conceal() {
            if (!this.getFlag('concealed')) {
                this.silence();
                this.setFlag('concealed');
                this.setCacheInternal('display', this.getStyle('display'));
                this.setStyle('display', 'none');
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
            this.getCacheInternal('propagation').clear(eventName);
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

        getWidgetStyle() {
            return this.getAttribute('widget-style');
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
            });

            return this;
        }

        insertBefore(...args) {
            super.insertBefore(...args);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
            });

            return this;
        }

        off(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.off(messageName, handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.off, this, [messageName, handler, filter]);
            }
        }

        on(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.on(messageName, handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.on, this, [messageName, handler, filter]);
            }
        }

        once(messageName, handler, filter) {
            if (messageName.startsWith('dom.')) {
                return super.once(messageName, handler);
            }
            else {
                return Reflect.apply(Emitter.prototype.once, this, [messageName, handler, filter]);
            }
        }

        popStyle() {
            let styleStack = this.getCacheInternal('styles');

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
            });

            return this;
        }

        pushStyle(styleObj) {
            let style = this.getStyle();
            this.getCacheInternal('styles').push(style);
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
                    type: 'innerHtml',
                    widget: parent,
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
                });
            }

            return this;
        }

        reveal() {
            if (this.getFlag('concealed')) {
                this.silence();
                this.resetFlag('concealed');
                this.setStyle('display', this.getCacheInternal('display'));
                this.clearCacheInternal('display');
                this.resume();
            }

            return this;
        }

        searchAncestor(opts) {
            let parent = this.parent();

            if (opts.type == 'ctor') {
                while (parent && !(parent instanceof opts.ctor)) {
                    parent = parent.parent();
                }
            }
            else if (opts.type == 'flag') {
                while (parent && !parent.getFlag(opts.flagName)) {
                    parent = parent.parent();
                }
            }
            else {
                parent = undefined;
            }

            return parent;
        }

        searchDescendant(opts) {
            let stack = this.children();

            while (stack.length) {
                let descendant = stack.pop();

                if (opts.type == 'flag') {
                    if (descendant.getFlag(opts.flagName)) {
                        return descendant;
                    }
                }

                descendant.children().reverse().forEach(descendant => stack.push(descendant));
            }
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
                type: 'attribute',
                widget: this,
                name: 'class',
                value: this.getAttribute('class'),
            });

            return this;
        }

        setClassNames(classNames) {
            super.setClassNames(classNames);

            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'class',
                value: this.getAttribute('class'),
            });

            return this;
        }

        setInnerHtml(innerHtml) {
            super.setInnerHtml(innerHtml);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
            });

            return this;
        }

        setOuterHtml(outerHtml) {
            super.setOuterHtml(outerHtml);

            this.send({
                messageName: 'Widget.Changed',
                type: 'innerHtml',
                widget: this,
            });

            return this;
        }

        setRefreshers(...endpointNames) {
            this.refreshers.set(...endpointNames);
            return this;
        }

        setStyle(arg, value) {
            super.setStyle(arg, value);

            this.send({
                messageName: 'Widget.Changed',
                type: 'style',
                widget: this,
                value: this.getStyle(),
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
})();
