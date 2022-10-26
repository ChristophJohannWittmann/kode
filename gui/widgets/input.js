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
register(class ButtonInput extends InputWidget {
    constructor() {
        super('button');
    }
});

register(class CheckboxInput extends InputWidget {
    constructor() {
        super('checkbox');
    }
});

register(class ColorInput extends InputWidget {
    constructor() {
        super('color');
    }
});

register(class DateInput extends InputWidget {
    constructor() {
        super('date');
    }
});

register(class DateTimeInput extends InputWidget {
    constructor() {
        super('datetime-local');
    }
});

register(class EmailInput extends InputWidget {
    constructor() {
        super('email');
    }
});

register(class FileInput extends InputWidget {
    constructor() {
        super('file');
    }
});

register(class HiddenInput extends InputWidget {
    constructor() {
        super('hidden');
    }
});

register(class ImageInput extends InputWidget {
    constructor() {
        super('image');
    }
});

register(class MonthInput extends InputWidget {
    constructor() {
        super('month');
    }
});

register(class NumberInput extends InputWidget {
    constructor() {
        super('number');
    }
});

register(class PasswordInput extends InputWidget {
    constructor() {
        super('password');
    }
});

register(class RadioInput extends InputWidget {
    constructor() {
        super('radio');
    }
});

register(class RangeInput extends InputWidget {
    constructor() {
        super('range');
    }
});

register(class ResetInput extends InputWidget {
    constructor() {
        super('reset');
    }
});

register(class Search extends InputWidget {
    constructor() {
        super('search');
    }
});

register(class SubmitInput extends InputWidget {
    constructor() {
        super('submit');
    }
});

register(class TelInput extends InputWidget {
    constructor() {
        super('tel');
    }
});

register(class TextInput extends InputWidget {
    constructor() {
        super('text');
    }
});

register(class TimeInput extends InputWidget {
    constructor() {
        super('time');
    }
});

register(class UrlInput extends InputWidget {
    constructor() {
        super('url');
        mkPlaceholderHelper(this);
    }
});

register(class WeekInput extends InputWidget {
    constructor() {
        super('week');
    }
});