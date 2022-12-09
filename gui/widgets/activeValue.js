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
*****/
define('ValueTypeBool', {
    type: 'bool',
    mkViewer: opts => mkICheckbox().setAttribute('disabled', true),
    mkEditor: opts => mkICheckbox(),
});

/*
define('ValueTypeColor', {
    type: 'color',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkIColor,
});

define('ValueTypeDate', {
    type: 'date',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkIDate,
});

define('ValueTypeDateTime', {
    type: 'datetime',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkIDateTime,
});

define('ValueTypeEmail', {
    type: 'email',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkIEmail,
});
*/

define('ValueTypeEnum', {
    type: 'enum',
    mkViewer: opts => mkWidget('div'),
    mkEditor: opts => mkWSelect().setOptions(opts.values),
});

define('ValueTypeHost', {
    type: 'host',
    mkViewer: opts => mkWidget('div'),
    mkEditor: opts => mkIText(),
});

define('ValueTypeIp', {
    type: 'ip',
    mkViewer: opts => mkWidget('div'),
    mkEditor: opts => mkIText(),
});

/*
define('ValueTypeMonth', {
    type: 'month',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkIMonth,
});

define('ValueTypeNumber', {
    type: 'number',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkINumber,
});

define('ValueTypeTel', {
    type: 'tel',
    mkViewer: () => mkWidget('div'),
    mkEditor: mkITel,
});
*/

define('ValueTypeText', {
    type: 'text',
    mkViewer: opts => mkWidget('div'),
    mkEditor: opts => mkIText(),
});

define('ValueTypeTime', {
    type: 'time',
    mkViewer: opts => mkITime().setAttribute('disabled', true),
    mkEditor: opts => mkITime(),
});

define('ValueTypeUrl', {
    type: 'url',
    mkViewer: opts => mkWidget('div'),
    mkEditor: opts => mkIText(),
});

define('ValueTypeWeek', {
    type: 'week',
    mkViewer: opts => mkIWeek().setAttribute('disabled', true),
    mkEditor: opts => mkIWeek(),
});


/*****
*****/
register(class WActiveValue extends Widget {
    constructor(activeData, key, opts) {
        super('div');
        this.viewer = opts.type.mkViewer(opts).bind(activeData, key);
        this.editor = opts.type.mkEditor(opts).bind(activeData, key);
        opts.readonly ? this.setReadOnly() : this.setReadWrite();
    }

    create

    isReadonly() {
        return this.readonly;
    }

    isReadwrite() {
        return !this.readonly;
    }

    setReadOnly() {
        this.clear();
        this.append(this.viewer);
        this.readonly = true;
        return this;
    }

    setReadWrite() {
        this.clear();
        this.append(this.editor);
        this.readonly = false;
        return this;
    }
});
