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
 * This is a global mapping that relates supported scalar types with the
 * widgets used for viewing and editing a scalar value.
*****/
define('ScalarBool', {
    type: 'bool',
    mkViewer: opts => mkICheckbox().setWidgetStyle('scalarcheckbox').setAttribute('disabled', true),
    mkEditor: opts => mkICheckbox().setWidgetStyle('scalarcheckbox'),
});

define('ScalarColor', {
    type: 'color',
    mkViewer: opts => mkIColor().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIColor().setWidgetStyle('scalar'),
});

define('ScalarDate', {
    type: 'date',
    mkViewer: opts => mkIDate().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIDate().setWidgetStyle('scalar'),
});

define('ScalarDateTime', {
    type: 'datetime',
    mkViewer: opts => mkIDateTime().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIDateTime().setWidgetStyle('scalar'),
});

define('ScalarEmail', {
    type: 'email',
    mkViewer: opts => mkIEmail().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIEmail().setWidgetStyle('scalar'),
});

define('ScalarEnum', {
    type: 'enum',
    mkViewer: opts => mkWSelect().setWidgetStyle('scalarselect').setOptions(opts.choices).setAttribute('disabled', true),
    mkEditor: opts => mkWSelect().setWidgetStyle('scalarselect').setOptions(opts.choices),
});

define('ScalarHost', {
    type: 'host',
    mkViewer: opts => mkIHost().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIHost().setWidgetStyle('scalar'),
});

define('ScalarIp', {
    type: 'ip',
    mkViewer: opts => mkIIp().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIIp().setWidgetStyle('scalar'),
});

define('ScalarMonth', {
    type: 'month',
    mkViewer: opts => mkIMonth().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIMonth().setWidgetStyle('scalar'),
});

define('ScalarNumber', {
    type: 'number',
    mkViewer: opts => mkINumber().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkINumber().setWidgetStyle('scalar'),
});

define('ScalarTel', {
    type: 'tel',
    mkViewer: opts => mkITel().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkITel().setWidgetStyle('scalar'),
});

define('ScalarText', {
    type: 'text',
    mkViewer: opts => mkIText().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIText().setWidgetStyle('scalar'),
});

define('ScalarTime', {
    type: 'time',
    mkViewer: opts => mkITime().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkITime().setWidgetStyle('scalar'),
});

define('ScalarUrl', {
    type: 'url',
    mkViewer: opts => mkIUrl().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIUrl().setWidgetStyle('scalar'),
});

define('ScalarWeek', {
    type: 'week',
    mkViewer: opts => mkIWeek().setWidgetStyle('scalar').setAttribute('disabled', true),
    mkEditor: opts => mkIWeek().setWidgetStyle('scalar'),
});


/*****
 * A scalar is a viewer and editor for a single scalar value.  The concept being
 * that there should be a common way to view and edit the set of scalar values
 * on widget, whether the value is self standading or part of a non-scalar data
 * cluster such as an object or an array.  Other non-scalar types will include
 * a subset selector, e.g., something with radio buttons.  One useful feature is
 * the ability to rename the messages, which enables one to provide a more
 * coherent set of message names for messages from the proxied object.
*****/
define('WScalar', class WScalar extends Widget {
    static dboReadonly = mkStringSet('oid', 'created', 'updated');

    constructor(activeData, key, opts) {
        super('span');
        this.viewer = opts.type.mkViewer(opts).bind(activeData, key);
        this.editor = opts.type.mkEditor(opts).bind(activeData, key);
        opts.readonly ? this.setReadOnly() : this.setReadWrite();

        let proxy = mkMessageProxy(this);
        proxy.route(this.editor, 'Widget.Changed');
        proxy.route(this.editor, 'Widget.Validity');
    }

    static dboReadonlyByDefault(propertyName) {
        if (propertyName.endsWith('Oid')) {
            return true;
        }

        return WScalar.dboReadonly.has(propertyName);
    }

    isReadonly() {
        return this.readonly;
    }

    isReadwrite() {
        return !this.readonly;
    }

    isValid() {
        return this.editor.htmlElement.node.checkValidity();
    }

    off(messageName, handler) {
        super.off(messageName, handler);
        return this;
    }

    on(messageName, handler, filter) {
        super.on(messageName, handler, filter);
        return this;
    }

    once(messageName, handler, filter) {
        super.once(messageName, handler, filter);
        return this;
    }

    static selectType(value) {
        if (typeof value == 'object') {
            if (value instanceof Date || value instanceof Time) {
                return ScalarDateTime;
            }
        }
        else if (typeof value == 'number' || typeof value == 'bigint') {
            return ScalarNumber;
        }
        else if (typeof value == 'boolean') {
            return ScalarBool;
        }

        return ScalarText;
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


/*****
 * This is where scalar subclasses are registered as they defined.  The subclass
 * map is essential to selecting which WScalar subclass to create when calling
 * mkWScalar().
*****/
define('ScalarSubclasses', {
});


/*****
 * The reason for taking this syntactically longer approach to defined WScalar
 * is that I want to be able to call mkScalar() with a opts.type value that
 * can be used to select from a WScalar subclass to construct.
*****/
define(`mkWScalar`, (activeData, key, opts) => {
    if (opts && opts.type in ScalarSubclasses) {
        return ScalarSubclasses[opts.type](activeData, key, opts);
    }
    else {
        return new WScalar(activeData, key, opts)
    }
});
