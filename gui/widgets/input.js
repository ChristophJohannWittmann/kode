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
 * Wraps and manages an HTML input element.  The type is specified as a ctor
 * parameter.  This is a base class for all of the supported types of input
 * types.  It's up to each of the derived types to set the widget-style attribute
 * in the subclass constructor since there are multiple widget styles for the
 * various values supported for the type attribute.
*****/
register(class InputWidget extends Widget {
    constructor(type) {
        super('input');
        this.setAttribute('type', type);
        mkAutoFocusHelper(this);
        mkAutoCompleteHelper(this);

        this.on('html.input', message => {
            //this.valueChanged();

            // ************************************
            // DEPRECATED
            this.send({
                messageName: 'Widget.Changed',
                type: 'attribute',
                widget: this,
                name: 'value',
                value: message.event.target.value,
            });
            // ************************************
        });
    }

    getValue() {
        return this.getAttribute('value');
    }
});
