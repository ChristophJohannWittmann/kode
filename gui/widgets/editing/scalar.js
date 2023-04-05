/*****
 * Copyright (c) 2017-2023 Kode Programming
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


(() => {
    /*****
     * Here are some utility functions that are required for generating strings
     * representations of timestamp values.  Note that the browser's language and
     * local will ultimately determine the output format that's presented because
     * the builtin string conversion functions are based on language and locale.
    *****/
    const dateStr = value => {
        if (value instanceof Time) {
            return value.toLocaleDateString()
        }
        else if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        else {
            return value.toString();
        }
    };

    const dateTimeStr = value => {
        if (value instanceof Time) {
            return value.toLocaleString()
        }
        else if (value instanceof Date) {
            return value.toLocaleString();
        }
        else {
            return value.toString();
        }
    };

    const timeStr = value => {
        if (value instanceof Time) {
            return value.toLocaleTimeString()
        }
        else if (value instanceof Date) {
            return value.toLocaleTimeString();
        }
        else {
            return value.toString();
        }
    };


    /*****
     * This is a global mapping that relates supported scalar types with the
     * widgets used for viewing and editing a scalar value.  A scalar is the
     * lowest guy in the editing hierarchy.  They are editors that edit a
     * single (scalar) value.  Each of these defined types are specific types
     * of edtiors that perform the real work of a scalar.  The WScalar object
     * iteself is a DIV, which provides the box or container for the underlying
     * editor or viewer type.
    *****/
    define('ScalarBool', {
        mkViewer: opts => mkICheckbox().setAttribute('disabled', true),
        mkEditor: opts => mkICheckbox(),
    });

    define('ScalarColor', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIColor().setWidgetStyle('scalar'),
    });

    define('ScalarDate', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot(dateStr) : mkWColdSpot(dateStr),
        mkEditor: opts => mkIDate().setWidgetStyle('scalar'),
    });

    define('ScalarDateTime', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot(dateTimeStr) : mkWColdSpot(dateTimeStr),
        mkEditor: opts => mkIDateTime().setWidgetStyle('scalar'),
    });

    define('ScalarEmail', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIEmail().setWidgetStyle('scalar'),
    });

    define('ScalarEnum', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkWSelect().setWidgetStyle('scalarselect').setOptions(opts.choices),
    });

    define('ScalarHost', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIHost().setWidgetStyle('scalar'),
    });

    define('ScalarIp', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIIp().setWidgetStyle('scalar'),
    });

    define('ScalarMonth', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIMonth().setWidgetStyle('scalar'),
    });

    define('ScalarNumber', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkINumber().setWidgetStyle('scalar'),
    });

    define('ScalarTel', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkITel().setWidgetStyle('scalar'),
    });

    define('ScalarText', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIText().setWidgetStyle('scalar'),
    });

    define('ScalarTime', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot(timeStr) : mkWColdSpot(timeStr),
        mkEditor: opts => mkITime().setWidgetStyle('scalar'),
    });

    define('ScalarUrl', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIUrl().setWidgetStyle('scalar'),
    });

    define('ScalarWeek', {
        mkViewer: opts => !opts.disabled ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIWeek().setWidgetStyle('scalar'),
    });
})();


/*****
 * A scalar is a viewer and editor for a single scalar value.  The concept being
 * that there should be a common way to view and edit the set of scalar values
 * on widget, whether the value is self standading or part of a non-scalar data
 * cluster such as an object or an array.  Other non-scalar types will include
 * a subset selector, e.g., something with radio buttons.  One useful feature is
 * the ability to rename the messages, which enables one to provide a more
 * coherent set of message names for messages from the proxied object.
*****/
register(class WScalar extends Widget {
    constructor(activeData, key, opts) {
        super('div');
        this.activeKey = key;
        this.activeData = activeData;
        this.viewer = opts.type.mkViewer(opts).bind(activeData, key, Binding.valueBinding);
        this.editor = opts.type.mkEditor(opts).bind(activeData, key, Binding.valueBinding);
        this.extra = null;
        this.append(this.viewer, this.editor);
        opts.readonly ? this.setReadOnly() : this.setReadWrite();

        if (opts.menu instanceof WPopupMenu) {
            opts.menu.attach(this, 'dom.click');
        }

        for (let messageName of ['dom.click', 'Widget.Changed', 'Widget.Modified', 'Widget.Validity']) {
            this.editor.on(messageName, message => this.bubble(message));
            this.viewer.on(messageName, message => this.bubble(message));
        }
    }

    blur() {
        this.editor.blur();
        return this;
    }

    bubble(message) {
        message.htmlElement = this;
        this.send(message);
    }

    clearExtra(widget) {
        if (this.extra) {
            this.extra.remove();
            this.extra = null;
            this.clearClassName('flex-h-sc');
        }

        return this;
    }

    focus() {
        this.editor.focus();
        return this;
    }

    getActiveData() {
        return this.activeData;
    }

    getActiveKey() {
        return this.activeKey;
    }

    getExtra() {
        return this.extra;
    }

    isReadonly() {
        return this.readonly;
    }

    isReadwrite() {
        return !this.readonly;
    }

    isValid() {
        return this.editor.node.checkValidity();
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

    setExtra(widget) {
        if (!this.extra) {
            this.extra = widget;
            this.append(this.extra);
            this.setClassName('flex-h-sc');
        }

        return this;
    }

    setReadOnly() {
        this.editor.conceal();
        this.viewer.reveal();
        return this;
    }

    setReadWrite() {
        this.viewer.conceal();
        this.editor.reveal();
        return this;
    }
});
