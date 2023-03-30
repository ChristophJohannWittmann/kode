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
 * Wrapper that Implements a convenient API for building and dynamically managing
 * HTML tables.  Note that we assume we're using the table as a GUI panel for
 * viewing and editing rows of data.  We're not using this widget class group
 * for managing the layout of an HTML surface area.
*****/
register(class WTable extends Widget {
    constructor(widgetStyle) {
        super('table');
        this.append((this.head = mkWTableHead()).conceal());
        this.append(this.body = mkWTableBody());
        this.setWidgetStyle(widgetStyle ? widgetStyle : 'table-basic');
    }

    getBody() {
        return this.body;
    }

    getHead() {
        return this.head;
    }

    setWidgetStyle(widgetStyle) {
        super.setWidgetStyle(widgetStyle);
        let stack = [this.body];

        while (stack.length) {
            let node = stack.pop();

            if (node instanceof WTableBody) {
                node.setWidgetStyle(`${widgetStyle}-tbody`);
                node.children().forEach(child => stack.push(child));
            }
            else if (node instanceof WTableRow) {
                node.setWidgetStyle(`${widgetStyle}-tbody-tr`);
                node.children().forEach(child => stack.push(child));
            }
            else if (node instanceof WTableCell) {
                node.setWidgetStyle(`${widgetStyle}-td`);
            }
        }

        stack = [this.head];

        while (stack.length) {
            let node = stack.pop();

            if (node instanceof WTableHead) {
                node.setWidgetStyle(`${widgetStyle}-thead`);
                node.children().forEach(child => stack.push(child));
            }
            else if (node instanceof WTableRow) {
                node.setWidgetStyle(`${widgetStyle}-thead-tr`);
                node.children().forEach(child => stack.push(child));
            }
            else if (node instanceof WTableCell) {
                node.setWidgetStyle(`${widgetStyle}-th`);
            }
        }

        return this;
    }
});


/*****
 * Encapsulation of the tbody HTML element.
*****/
register(class WTableBody extends Widget {
    constructor(arg) {
        super(arg instanceof Node ? arg : 'tbody');
    }
});


/*****
 * Encapsulation of the tr HTML element.
*****/
register(class WTableRow extends Widget {
    constructor(arg) {
        super(arg instanceof Node ? arg : 'tr');
    }
});


/*****
 * Encapsulation of the td HTML element.
*****/
register(class WTableCell extends Widget {
    constructor(arg) {
        super(arg instanceof Node ? arg : 'td');
    }
});


/*****
 * Encapsulation of the thead HTML element.
*****/
register(class WTableHead extends Widget {
    constructor(arg) {
        super(arg instanceof Node ? arg : 'thead');
    }
});


/*****
 * Encapsulation of the th HTML element.
*****/
register(class WTableHeadCell extends Widget {
    constructor(arg) {
        super(arg instanceof Node ? arg : 'th');
    }
});