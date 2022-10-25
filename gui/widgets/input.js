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
 * Wraps and manages an HTML input element within the framework.  Subclasses
 * have been developed for various HTML input elements with differing type=
 * attributes.  Not all HTML inputs have been translated because exclusions
 * don't really make sense within the client framework: hidden, reset, and
 * submit have NOT been implemented.  This class provides most features that
 * are required for specific input types.  One big exception is validation.
 * The details of configuring and validating each specific type are performed
 * by each specific subclass.
*****/
register(class InputWidget extends InputBaseWidget {
    constructor(type) {
        super('input');
        this.setAttribute('type', type);
        this.widgetStyle = 'input';
        this.setAttribute('widget-style', this.widgetStyle);

        this.on('html.input', message => {
            this.valueChanged(message.event.target.value);
        });
    }

    getEnabled() {
        return this.getAttribute('disabled') === null;
    }

    getRequired() {
        return this.getAttribute('required') !== null;
    }

    getValue() {
        return this.getAttribute('value');
    }

    setEnabled(flag) {
        if (flag) {
            this.clearAttribute('disabled');
            this.setAttribute('widget-style', this.widgetStyle);
        }
        else {
            this.setAttribute('disabled');
            this.setAttribute('widget-style', `${this.widgetStyle}disabled`);
        }
    }

    setRequired(flag) {
        if (this.flag) {
            this.setAttribute('required');
        }
        else {
            this.clearAttribute('required');
        }
    }

    setValue(value) {
        this.setAttribute('value', value);
    }
});
