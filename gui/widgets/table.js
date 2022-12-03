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
 * Wrapper that Implements a convenient API for building and dynamically managing
 * HTML tables.  Note that we assume we're using the table as a GUI panel for
 * viewing and editing rows of data.  We're not using this widget class group
 * for managing the layout of an HTML surface area.
*****/
register(class WTable extends Widget {
    constructor(widgetStyle) {
        super('table');
        this.setWidgetStyle(widgetStyle ? widgetStyle : 'table-basic');
        this.append(mkWTableBody(this.getWidgetStyle()));
    }

    createHead() {
        if (!this.hasHead()) {
            this.getBody().insertBefore(mkTableHead(this.getWidgetStyle()));
        }

        return this;
    }

    getBody() {
        for (let child of this) {
            if (child.tagName() == 'tbody') {
                return child;
            }
        }
    }

    getHead() {
        for (let child of this) {
            if (child.tagName() == 'thead') {
                return child;
            }
        }
    }

    hasHead() {
        return this.getHead() != null;
    }

    removeHead() {
        let head = this.getHead();

        if (head) {
            head.remove();
        }

        return this;
    }
});

register(class WTableBody extends Widget {
    constructor(tableWidgetStyle) {
        super('tbody');
        this.tableWidgetStyle = tableWidgetStyle;
        this.setWidgetStyle(`${tableWidgetStyle}-tbody`);
    }

    mkRow() {
        let row = mkWTableBodyRow(this.tableWidgetStyle);
        this.append(row);
        return row;
    }
});

register(class WTableHead extends Widget {
    constructor(tableWidgetStyle) {
        super('thead');
        this.tableWidgetStyle = tableWidgetStyle;
        this.setWidgetStyle(`${tableWidgetStyle}-thead`);
    }

    mkRow() {
        let row = mkWTableHeadRow(this.tableWidgetStyle);
        this.append(row);
        return row;
    }
});

register(class WTableBodyRow extends Widget {
    constructor(tableWidgetStyle) {
        super('tr');
        this.tableWidgetStyle = tableWidgetStyle;
        this.setWidgetStyle(`${tableWidgetStyle}-body-tr`);
    }

    mkCell(value) {
        let cell = mkWidget('td');
        cell.setWidgetStyle(`${this.tableWidgetStyle}-td`);
        cell.append(value);
        this.append(cell);
        return this;
    }
});

register(class WTableHeadRow extends Widget {
    constructor(tableWidgetStyle) {
        super('tr');
        this.tableWidgetStyle = tableWidgetStyle;
        this.setWidgetStyle(`${tableWidgetStyle}-head-tr`);
    }

    mkCell(value) {
        let cell = mkWidget('td');
        cell.setWidgetStyle(`${this.tableWidgetStyle}-td`);
        cell.append(value);
        this.append(cell);
        return this;
    }
});