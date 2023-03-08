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
 * Wrapper that Implements a convenient API for building and dynamically managing
 * HTML tables.  Note that we assume we're using the table as a GUI panel for
 * viewing and editing rows of data.  We're not using this widget class group
 * for managing the layout of an HTML surface area.
*****/
register(class WTable extends Widget {
    constructor(widgetStyle) {
        super('table');
        this.append(mkWTableSection('tbody', 'td'));
        this.setWidgetStyle(widgetStyle ? widgetStyle : 'table-basic');
    }

    createHead() {
        if (!this.hasHead()) {
            this.getBody().insertBefore(
                mkTableHead('thead', 'th')
                .setWidgetStyle(this.getWidgetStyle())
            );
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

    setWidgetStyle(widgetStyle) {
        super.setWidgetStyle(widgetStyle);

        if (this.getBody()) {
            this.getBody().setWidgetStyle(widgetStyle);
        }

        if (this.getHead()) {
            this.getHead().setWidgetStyle(widgetStyle);
        }

        return this;
    }
});


/*****
 * This class improves coding efficiency for tbody and thead elements associated
 * with the WTable instance.  The WTableSection creates rows, gets rows, deletes
 * rows and sorts them with clean API method calls.  Regardless of the rows'
 * content uniqueness, individual rows can be indentified with the widget.getId().
*****/
register(class WTableSection extends Widget {
    constructor(sectionTag, cellTag) {
        super(sectionTag);
        this.sectionTag = sectionTag;
        this.cellTag = cellTag;
    }

    getLastRow() {
        let rows = this.children();

        if (rows.length) {
            return rows[rows.length - 1];
        }
    }

    getRowAt(index) {
        if (typeof index == 'number') {
            let rows = this.children();

            if (index >= 0 && index < rows.length) {
                return rows[index];
            }
        }
    }

    getRows(index0, index1) {
        let selected = [];

        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let rows = this.children();

            if (index0 >= 0 && index0 < rows.length) {
                if (index1 >= index0 && index1 < rows.length) {
                    for (let i = index0; i <= index1; i++) {
                        selected.push(rows[i]);
                    }
                }
            }
        }

        return selected;
    }

    getWidgetStyle() {
        return super.getWidgetStyle().replace(`-${this.sectionTag}`, '');
    }

    mkRowAfter(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            let row = mkWTableRow(this.sectionTag, this.cellTag).setWidgetStyle(this.getWidgetStyle());
            this.childAt(index).insertAfter(row);
            return row;
        }
    }

    mkRowAppend() {
        let row = mkWTableRow(this.sectionTag, this.cellTag).setWidgetStyle(this.getWidgetStyle());
        this.append(row);
        return row;
    }

    mkRowBefore(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            let row = mkWTableRow(this.sectionTag, this.cellTag).setWidgetStyle(this.getWidgetStyle());
            this.childAt(index).insertBefore(row);
            return row;
        }
    }

    mkRowPrepend() {
        let row = mkWTableRow(this.sectionTag, this.cellTag).setWidgetStyle(this.getWidgetStyle());
        this.prepend(row);
        return row;
    }

    removeRowAt(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            this.childAt(index).remove();
        }

        return this;
    }

    removeRows(index0, index1) {
        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let rows = this.children();

            if (index0 >= 0 && index0 < this.rows.length) {
                if (index1 >= index0 && index1 < this.rows.length) {
                    for (let i = index0; i <= index1; i++) {
                        this.childAt(index0).remove();
                    }
                }
            }
        }

        return this;
    }

    replaceRowAt(index, ...newRows) {
        if (typeof index == 'number') {
            let rows = this.children();

            if (index >= 0 && index < this.rows.length) {
                rows[index].replace(...newRows);
            }
        }

        return this;
    }

    replaceRows(index0, index1, ...newRows) {
        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let rows = this.children();

            if (index0 >= 0 && index0 < this.rows.length) {
                if (index1 >= index0 && index1 < this.rows.length) {
                    for (let i = index0; i < index1; i++) {
                        rows[index0].remove();
                    }

                    rows[index0].replace(...newRows);
                }
            }
        }

        return this;
    }

    setWidgetStyle(widgetStyle) {
        super.setWidgetStyle(`${widgetStyle}-${this.sectionTag}`);

        for (let row of this) {
            row.setWidgetStyle(widgetStyle);
        }

        return this;
    }
});


/*****
 * This class improves coding efficiency for table row, tr, elements associated
 * with the WTable instance.  The WTableRow creates cells, gets cells, deletes
 * cells and sorts them with clean API method calls.  Regardless of the cells'
 * content uniqueness, individual cells can be indentified with the widget.getId().
*****/
register(class WTableRow extends Widget {
    constructor(sectionTag, cellTag) {
        super('tr');
        this.sectionTag = sectionTag;
        this.cellTag = cellTag;
    }

    getCellAt(index) {
        if (typeof index == 'number') {
            let cells = this.children();

            if (index >= 0 && index < cells.length) {
                return cells[index];
            }
        }
    }

    getCells(index0, index1) {
        let selected = [];

        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let cells = this.children();

            if (index0 >= 0 && index0 < cells.length) {
                if (index1 >= index0 && index1 < cells.length) {
                    for (let i = index0; i <= index1; i++) {
                        selected.push(cells[i]);
                    }
                }
            }
        }

        return selected;
    }

    getLastCell() {
        let cells = this.children();

        if (cells.length) {
            return cells[cells.length - 1];
        }
    }

    getWidgetStyle() {
        return super.getWidgetStyle().replace(`-${this.sectionTag}-tr`, '');
    }

    mkCellAfter(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            let cell = mkWidget(this.cellTag);
            cell.setWidgetStyle(`${this.getWidgetStyle()}-${this.cellTag}`);
            this.childAt(index).insertAfter(cell);
            return this;
        }
    }

    mkCellAppend(value) {
        let cell = mkWidget(this.cellTag);
        cell.setWidgetStyle(`${this.getWidgetStyle()}-${this.cellTag}`);
        cell.append(value);
        this.append(cell);
        return this;
    }

    mkCellAfter(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            let cell = mkWidget(this.cellTag);
            cell.setWidgetStyle(`${this.getWidgetStyle()}-${this.cellTag}`);
            this.childAt(index).insertBefore(cell);
            return this;
        }
    }

    mkCellPrepend(value) {
        let cell = mkWidget(this.cellTag);
        cell.setWidgetStyle(`${this.getWidgetStyle()}-${this.cellTag}`);
        cell.append(value);
        this.append(cell);
        return cell;
    }

    removeCellAt(index) {
        if (typeof index == 'number' && index >= 0 && index < this.length()) {
            this.childAt(index).remove();
        }

        return this;
    }

    removeCells(index0, index1) {
        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let rows = this.children();

            if (index0 >= 0 && index0 < this.rows.length) {
                if (index1 >= index0 && index1 < this.rows.length) {
                    for (let i = index0; i <= index1; i++) {
                        this.childAt(index0).remove();
                    }
                }
            }
        }

        return this;
    }

    replaceCellAt(index, ...newCells) {
        if (typeof index == 'number') {
            let rows = this.children();

            if (index >= 0 && index < this.rows.length) {
                rows[index].replace(...newCells);
            }
        }

        return this;
    }

    replaceCells(index0, index1, ...newCells) {
        if (typeof index0 == 'number' && typeof indez1 == 'number') {
            let rows = this.children();

            if (index0 >= 0 && index0 < this.rows.length) {
                if (index1 >= index0 && index1 < this.rows.length) {
                    for (let i = index0; i < index1; i++) {
                        rows[index0].remove();
                    }

                    rows[index0].replace(...newCells);
                }
            }
        }

        return this;
    }

    setWidgetStyle(widgetStyle) {
        super.setWidgetStyle(`${widgetStyle}-${this.sectionTag}-tr`);

        for (let cell of this) {
            cell.setWidgetStyle(widgetStyle);
        }

        return this;
    }
});