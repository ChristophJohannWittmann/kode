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
 * The InputBaseWidget is conceptually an abstract class whose primary purpose
 * is to provide an API used by the ValueBinding class to make the binding work.
 * All input widgets must subclass InputBaseWidget in order to integrate into
 * the client framework.  Subclasses need to override getValue() and setValue(),
 * and validate().  Moreover, subclasses need to call valueChanged() when it has
 * detected a chnage in value.
*****/
register(class InputBaseWidget extends Widget {
    static autoCompleteEnum = mkStringSet(
        'additional-name',
        'address-level1',
        'address-level2',
        'address-level3',
        'address-level4',
        'address-line1',
        'address-line2',
        'address-line3',
        'bday',
        'bday-day',
        'bday-month',
        'bday-year',
        'cc-additional-name',
        'cc-csc',
        'cc-exp',
        'cc-exp-month',
        'cc-exp-year',
        'cc-family-name',
        'cc-given-name',
        'cc-name',
        'cc-number',
        'cc-type',
        'country',
        'country-name',
        'current-password',
        'email',
        'family-name',
        'given-name',
        'honorific-prefix',
        'honorific-suffix',
        'impp',
        'language',
        'name',
        'new-password',
        'nickname',
        'off',
        'on',
        'one-time-code',
        'organization',
        'organization-title',
        'photo',
        'postal-code',
        'sex',
        'street-address',
        'tel',
        'tel-area-code',
        'tel-country-code',
        'tel-extension',
        'tel-local',
        'tel-national',
        'transaction-amount',
        'transaction-currency',
        'url',
        'username',
    );

    constructor(tagName, widgetStyle) {
        super(tagName);
        this.widgetStyle = widgetStyle;
        this.setAttribute('widget-style', this.widgetStyle);
    }

    blur() {
        this.htmlElement.node.blur();
        return this;
    }

    clearAutoComplete() {
        this.clearAttribute('autocomplete');
        return this;
    }

    clearAutoFocus() {
        this.clearAttribute('autofocus');
        return this;
    }

    clearChecked() {
        this.clearAttribute('checked');
        return this;
    }

    clearEnabled() {
        this.setAttribute('disabled');
        this.setAttribute('widget-style', `${this.widgetStyle}disabled`);
        return this;
    }

    clearMax() {
        this.clearAttribute('max');
        return this;
    }

    clearMaxLength() {
        this.clearAttribute('maxlength');
        return this;
    }

    clearMin() {
        this.clearAttribute('min');
        return this;
    }

    clearMinLength() {
        this.clearAttribute('minlength');
        return this;
    }

    clearPattern() {
        this.clearAttribute('pattern');
        return this;
    }

    clearPlaceholder() {
        this.clearAttribute('placeholder');
        return this;
    }

    clearRequired() {
        this.clearAttribute('required');
        return this;
    }

    focus() {
        this.htmlElement.node.focus();
        return this;
    }

    getAutoComplete() {
        return this.getAttribute('autocomplete');
    }

    getAutoFocus() {
        return !this.hasAttribute('autofocus');
    }

    getChecked() {
        return !this.hasAttribute('checked');
    }

    getEnabled() {
        return !this.hasAttribute('disabled');
    }

    getMax() {
        return !this.getAttribute('max');
    }

    getMaxLength() {
        return !this.getAttribute('maxlength');
    }

    getMin() {
        return !this.getAttribute('min');
    }

    getMinLength() {
        return !this.getAttribute('minlength');
    }

    getPattern() {
        return !this.getAttribute('pattern');
    }

    getPlaceholder() {
        return !this.getAttribute('placeholder');
    }

    getRequired() {
        return this.hasAttribute('required');
    }

    getValue() {
        return null;
    }

    setAutoComplete(value) {
        if (InputBaseWidget.autoCompleteEnum.has(value)) {
            this.setAttribute('autocomplete', value);
        }

        return this;
    }

    setAutoFocus() {
        this.setAttribute('autofocus');
        return this;
    }

    setChecked() {
        this.setAttribute('checked');
        return this;
    }

    setEnabled() {
        this.clearAttribute('disabled');
        this.setAttribute('widget-style', this.widgetStyle);
        return this;
    }

    setMax(value) {
        this.setAttribute('max', value);
        return this;
    }

    setMaxLength(value) {
        this.setAttribute('maxlength', value);
        return this;
    }

    setMin(value) {
        this.setAttribute('min', value);
        return this;
    }

    setMinLength(value) {
        this.setAttribute('minlength', value);
        return this;
    }

    setPattern(value) {
        if (typeof value == 'string') {
            this.setAttribute('pattern', value);
        }
        else if (pattern instanceof RegExp) {
            let regex = value.toString().substr(1);
            let lastIndex = regex.lastIndexOf('/');
            regex = regex.substr(0, lastIndex);
            regex = regex.replace(/\\\\/mg, '\\');
            this.setAttribute('pattern', regex);
        }

        return this;
    }

    setPlaceholder(value) {
        this.setAttribute('placeholder', value);
        return this;
    }

    setRequired(flag) {
        this.setAttribute('required');
        return this;
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
