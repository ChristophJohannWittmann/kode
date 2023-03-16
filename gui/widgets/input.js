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
 * Wraps and manages an HTML input element within the framework.  Subclasses
 * have been developed for various HTML input elements with differing type=
 * attributes.  Not all HTML inputs have been translated because exclusions
 * don't really make sense within the client framework: hidden, reset, and
 * submit have NOT been implemented.  This class provides most features that
 * are required for specific input types.  One big exception is validation.
 * The details of configuring and validating each specific type are performed
 * by each specific subclass.
*****/
register(class WInput extends WEditable {
    constructor(type) {
        super('input');
        this.setAttribute('type', type);
        this.setWidgetStyle('input');

        this.on('dom.input', message => {
            this.valueChanged(message.event.target.value);
        });
    }

    subclassCheckValidity() {
        return this.node.checkValidity();
    }

    subclassGetValue() {
        return this.node.value;
    }

    subclassSetValue(value) {
        this.node.value = value;
    }
});


/*****
 * A list of Widget subclass declarations for supported HTML input types.  They
 * can be constructed directly using the mkTypeInpud() notaiton, and will wrap
 * the underlying HTML element that's consktructed.
*****/
register(class IButton extends WInput {
    constructor() {
        super('button');
        this.setWidgetStyle('button');
    }
});

register(class ICheckbox extends WInput {
    constructor() {
        super('checkbox');
        this.setWidgetStyle('checkbox');
    }

    getValue() {
        return this.node.checked;
    }

    setValue(bool) {
        this.node.checked = bool;
        return this;
    }
});

register(class IColor extends WInput {
    constructor() {
        super('color');
    }
});

register(class IDate extends WInput {
    constructor() {
        super('date');
    }

    getValue() {
        return mkTime(this.getAttribute('value'));
    }

    setValue(value) {
        this.setAttribute('value', value.toISOString().substr(0, 10));
        return this;
    }
});

register(class IDateTime extends WInput {
    constructor() {
        super('datetime-local');
    }

    getValue() {
        return mkTime(this.getAttribute('value'));
    }

    setValue(value) {
        this.setAttribute('value', value.toISOString().substr(0, 19));
        return this;
    }
});

register(class IEmail extends WInput {
    constructor() {
        super('email');
    }
});

register(class IFile extends WInput {
    constructor() {
        super('file');
    }
});

register(class IHidden extends WInput {
    constructor() {
        super('hidden');
    }
});

register(class IImage extends WInput {
    constructor() {
        super('image');
    }
});

register(class IMonth extends WInput {
    constructor() {
        super('month');
    }
});

register(class INumber extends WInput {
    constructor() {
        super('number');
    }
});

register(class IPassword extends WInput {
    constructor() {
        super('password');
    }
});

register(class IRadio extends WInput {
    constructor() {
        super('radio');
        this.setWidgetStyle('radio');
    }

    getValue() {
        return this.node.checked;
    }

    setValue(bool) {
        this.node.checked = bool;
        return this;
    }
});

register(class IRange extends WInput {
    constructor() {
        super('range');
    }
});

register(class IReset extends WInput {
    constructor() {
        super('reset');
    }
});

register(class ISearch extends WInput {
    constructor() {
        super('search');
    }
});

register(class ISubmit extends WInput {
    constructor() {
        super('submit');
    }
});

register(class ITel extends WInput {
    constructor() {
        super('tel');
    }
});

register(class IText extends WInput {
    constructor() {
        super('text');
    }
});

register(class ITime extends WInput {
    constructor() {
        super('time');
    }

    getValue() {
        return mkTime(this.getAttribute('value'));
    }

    setValue(value) {
        this.setAttribute('value', value.toISOString().substr(11, 8));
        return this;
    }
});

register(class IUrl extends WInput {
    constructor() {
        super('url');
    }
});

register(class IWeek extends WInput {
    constructor() {
        super('week');
    }
});


/*****
 * Extended input types.  These are input types with some features to enhanced
 * what's available in HTML 5.  Many of these are simply text inputs using custom
 * verification regular expressions.
*****/
register(class IHost extends IText {
    constructor() {
        super();
        this.setAttribute('pattern', '^[0-9A-Za-z-_]+(\\.[0-9A-Za-z-_]+)*$');
    }
});

register(class IIp extends IText {
    constructor() {
        super();
        this.setAttribute('pattern', `(^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$)|(^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)`);
    }
});


/*****
 * This is nice user-friendly widget that behaves somewhat like the search bar on
 * Google.  When the user presses a key, it starts a timer, which runs out within
 * a specified number of milliseconds, at which point and Input.Pause message is
 * generated.
*****/
register(class IDynamic extends IText {
    constructor(milliseconds) {
        super();
        this.setAttribute('autocomplete', 'off');
        this.timeout = null;
        this.milliseconds = milliseconds ? milliseconds : 800;
        this.on('dom.keyup', message => this.handleKeyUp());
    }

    handleKeyUp() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => this.handleTimeout(), this.milliseconds);
    }

    handleTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.send({
            messageName: 'Input.Pause',
            input: this,
        });
    }
});
