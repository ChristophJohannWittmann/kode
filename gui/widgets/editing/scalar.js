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


(() => {
    /*****
     * Here are some utility functions that are required for generating strings
     * representations of timestamp values.
    *****/
    const dateStr = value => {
        if (value instanceof Time) {
            return value.localeDateStr()
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
            return value.localeDateTimeStr()
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
            return value.localeTimeStr()
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
     * widgets used for viewing and editing a scalar value.
    *****/
    define('ScalarBool', {
        mkViewer: opts => mkICheckbox().setWidgetStyle('scalarcheckbox').setAttribute('disabled', true),
        mkEditor: opts => mkICheckbox().setWidgetStyle('scalarcheckbox'),
    });

    define('ScalarColor', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIColor().setWidgetStyle('scalar'),
    });

    define('ScalarDate', {
        mkViewer: opts => opts.menu ? mkWHotSpot(dateStr) : mkWColdSpot(dateStr),
        mkEditor: opts => mkIDate().setWidgetStyle('scalar'),
    });

    define('ScalarDateTime', {
        mkViewer: opts => opts.menu ? mkWHotSpot(dateTimeStr) : mkWColdSpot(dateTimeStr),
        mkEditor: opts => mkIDateTime().setWidgetStyle('scalar'),
    });

    define('ScalarEmail', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIEmail().setWidgetStyle('scalar'),
    });

    define('ScalarEnum', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkWSelect().setWidgetStyle('scalarselect').setOptions(opts.choices),
    });

    define('ScalarHost', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIHost().setWidgetStyle('scalar'),
    });

    define('ScalarIp', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIIp().setWidgetStyle('scalar'),
    });

    define('ScalarMonth', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIMonth().setWidgetStyle('scalar'),
    });

    define('ScalarNumber', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkINumber().setWidgetStyle('scalar'),
    });

    define('ScalarTel', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkITel().setWidgetStyle('scalar'),
    });

    define('ScalarText', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIText().setWidgetStyle('scalar'),
    });

    define('ScalarTime', {
        mkViewer: opts => opts.menu ? mkWHotSpot(timeStr) : mkWColdSpot(timeStr),
        mkEditor: opts => mkITime().setWidgetStyle('scalar'),
    });

    define('ScalarUrl', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
        mkEditor: opts => mkIUrl().setWidgetStyle('scalar'),
    });

    define('ScalarWeek', {
        mkViewer: opts => opts.menu ? mkWHotSpot() : mkWColdSpot(),
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
define('WScalar', class WScalar extends Widget {
    static dboReadonly = mkStringSet('oid', 'created', 'updated');

    static routed = [
        'html.click',
        'html.dblclick',
        'Widget.Changed',
        'Widget.Modified',
        'Widget.Validity',
    ];

    constructor(activeData, key, opts) {
        super('div');
        this.viewer = opts.type.mkViewer(opts).bind(activeData, key);
        this.editor = opts.type.mkEditor(opts).bind(activeData, key);
        opts.readonly ? this.setReadOnly() : this.setReadWrite();
        let proxy = mkMessageProxy(this);

        for (let messageName of WScalar.routed) {
            proxy.route(this.editor, messageName);
            proxy.route(this.viewer, messageName);
        }

        if (opts.menu instanceof WPopupMenu) {
            opts.menu.attach(this, 'html.click');
        }
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
        return this;
    }

    setReadWrite() {
        this.clear();
        this.append(this.editor);
        return this;
    }
});


/*****
 * The reason for taking this syntactically longer approach to defined WScalar
 * is that I want to be able to call mkScalar() with a opts.type value that
 * can be used to select from a WScalar subclass to construct.
*****/
define(`mkWScalar`, (activeData, key, opts) => {
    return new WScalar(activeData, key, opts)
});
