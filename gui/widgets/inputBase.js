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
 * The InputBaseWidget is conceptually an abstract class whose primary purpose
 * is to provide an API used by the ValueBinding class to make the binding work.
 * All input widgets must subclass InputBaseWidget in order to integrate into
 * the client framework.  Subclasses need to override getValue() and setValue(),
 * and validate().  Moreover, subclasses need to call valueChanged() when it has
 * detected a chnage in value.
*****/
register(class InputBaseWidget extends Widget {
    constructor(tagName, widgetStyle) {
        super(tagName);
        this.setWidgetStyle(widgetStyle);
        this[Widget.bindingKey] = 'value';
    }

    blur() {
        this.htmlElement.node.blur();
        return this;
    }

    disable() {
        this.setAttribute('disabled');
        this.setWidgetStyle(`${this.getWidgetStyle()}disabled`);
        return this;
    }

    enable() {
        this.clearAttribute('disabled');
        this.setWidgetStyle(this.getWidgetStyle());
        return this;
    }

    focus() {
        this.htmlElement.node.focus();
        return this;
    }

    getValue() {
        return null;
    }

    isDisabled() {
        return this.hasAttribute('disabled');
    }

    setValue(value) {
        return this;
    }

    valueChanged(value) {
        this.send({
            messageName: 'Widget.Changed',
            type: 'value',
            widget: this,
            value: value,
        });
    }
});
