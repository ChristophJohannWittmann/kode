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


/*****
 * A hot spot is implemented as a DIV and provides an alternative to using an A
 * element for interactive / responsive elements for clicking to invoke GUI
 * actions.  The framework approach is to encourage the use of the WLink for
 * anchors to external URLs and the use of WHotSpot for an item to invoked an
 * action on the GUI.  Warm spot and cold spot are analogs.
*****/
register(class WSpot extends Widget {
    constructor(display) {
        super('div');
        this.display = display ? display : value => value.toString();
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.setInnerHtml(this.display(value));
        return this;
    }
});

register(class WHotSpot extends WSpot {
    constructor(display) {
        super(display);
        this.setWidgetStyle('hotspot');
    }
});

register(class WWarmSpot extends WSpot {
    constructor(display) {
        super(display);
        this.setWidgetStyle('warmspot');
    }
});

register(class WColdSpot extends WSpot {
    constructor(display) {
        super(display);
        this.setWidgetStyle('coldspot');
    }
});


/*****
 * Implementation of other miscellaneous widgets.  The primary reason for these
 * classes is convenience.  For instance, maybe we need a widget based on some
 * specific CSS styling.
*****/
register(class WHrLite extends Widget {
    constructor() {
        super('hr');
        this.setWidgetStyle('hr-lite');
    }
});

register(class WSpace extends Widget {
    constructor(width) {
        super('span');
        this.setStyle({
            display: 'inline-block',
            width: `${width}px`,
        });
    }
});


/*****
 * WFraming widget is usefule for formatting blocks of text on panels andd views
 * that have a lot of text that needs to be visually appealing and organized.
 * They will be implemented with a span with a display of inline-block and some
 * other visually appealing borders.
*****/
register(class WFraming extends Widget {
    constructor() {
        super('div');
        this.setWidgetStyle('framing');
    }
});
