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
 * The HotSpot widget is shortcut widget for placing a non-button, non-anchor
 * (i.e., WLink) spot to use for users to click on.  The hot-spot is primarily
 * useful because it has its own widget style of "hotspot".
*****/
register(class WHotSpot extends Widget {
    constructor() {
        super('span');
        this.setWidgetStyle('hotspot');
    }
});


/*****
*****/
register(class WSectionTitle extends Widget {
    constructor(number, text) {
        super();
        this.setWidgetStyle('section-title');
        this.append(mkWHr());
        this.append(mkWidget(`h${number}`).set(text));
        this.append(mkWHr());
    }
});


/*****
 * The following are shortcut classes for creating widgets for frequently used
 * HTML elements.  There are not other features other than the shortcut itself.
*****/
register(class WDiv extends Widget {
    constructor() {
        super('div');
    }
});

register(class WSpan extends Widget {
    constructor() {
        super('span');
    }
});

register(class WH1 extends Widget {
    constructor() {
        super('h1');
    }
});

register(class WH2 extends Widget {
    constructor() {
        super('h2');
    }
});

register(class WH3 extends Widget {
    constructor() {
        super('h3');
    }
});

register(class WH4 extends Widget {
    constructor() {
        super('h4');
    }
});

register(class WH5 extends Widget {
    constructor() {
        super('h5');
    }
});

register(class WH6 extends Widget {
    constructor() {
        super('h6');
    }
});

register(class WHr extends Widget {
    constructor() {
        super('hr');
    }
});
