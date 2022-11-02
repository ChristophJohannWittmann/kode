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
register(class WInput extends InputBaseWidget {
    constructor(type) {
        super('input', 'input');
        this.setAttribute('type', type);

        this.on('html.input', message => {
            this.valueChanged(message.event.target.value);
        });
    }

    getValue() {
        return this.getAttribute('value');
    }

    setValue(value) {
        this.setAttribute('value', value);
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
        this.setAttribute('widget-style', 'button');
    }
});

register(class ICheckbox extends WInput {
    constructor() {
        super('checkbox');
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
});

register(class IDateTime extends WInput {
    constructor() {
        super('datetime-local');
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
});

register(class IUrl extends WInput {
    constructor() {
        super('url');
        mkPlaceholderHelper(this);
    }
});

register(class IWeek extends WInput {
    constructor() {
        super('week');
    }
});