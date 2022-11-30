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


(() => {
    /*****
    *****/
    register(class WTable extends Widget {
        constructor(tableStyle) {
            super('table');
            this.tableStyle = tableStyle ? tableStyle : 'table-basic';
            this.setWidgetStyle(this.tableStyle);
            this.head = null;
            this.body = new WRows('tbody', this.tableStyle, 'tr', 'td');
            this.append(this.body);
        }

        createHead() {
            if (!this.head) {
                this.head = new WRows('thead', this.tableStyle, 'tr', 'th');
                this.body.insertBefore(this.head);
            }

            return this;
        }

        getBody() {
            return this.body;
        }

        getHead() {
            return this.head;
        }

        hasHead() {
            return this.head !== null;
        }

        removeHead() {
            if (this.head) {
                this.head.remove();
                this.head = null;
            }

            return this;
        }

        [Symbol.iterator]() {
            return this.body.children()[Symbol.iterator]();
        }
    });


    /*****
    *****/
    class WRows extends Widget {
        constructor(containerTag, tableStyle, rowTag, cellTag) {
            super(containerTag);
            this.tableStyle = `${tableStyle}-${containerTag}`;
            this.rowTag = rowTag;
            this.cellTag = cellTag;
            this.setWidgetStyle(this.tableStyle);
        }

        appendRow(...values) {
            let row = new WRow(this.tableStyle, this.rowTag, this.cellTag);
            row.appendCells(...values);
            this.append(row);
            return this;
        }

        appendRows(...rows) {
            for (let row of rows) {
                let newRow = new WRow(this.tableStyle, this.rowTag, this.cellTag);
                newRow.appendCells(row);
                this.append(newRow);
            }

            return this;
        }

        removeRow(arg) {
            this.childAt(index).remove();
            return this;
        }

        removeRows(index0, index1) {
            for (let i = 0; i < index1 - index0; i++) {
                this.childAt(index0).remove();
            }

            return this;
        }

        replaceRow(index, ...values) {
            let row = new WRow(this.tableStyle, this.rowTag, this.cellTag);
            row.appendCells(...values);
            this.childAt(index).replace(row);
            return this;
        }

        replaceRows(index0, index1, ...rows) {
            this.removeRows(index0, index1);

            for (let row of rows) {
                let newRow = new WRow(this.tableStyle, this.rowTag, this.cellTag);
                newRow.appendCells(row);
                this.insertBefore(index1, newRow);                
            }

            return this;
        }

        length() {
            return this.children().length;
        }
    }


    /*****
    *****/
    class WRow extends Widget {
        constructor(tableStyle, rowTag, cellTag) {
            super(rowTag);
            this.cellTag = cellTag;
            this.rowStyle = `${tableStyle}-row`;
            this.cellStyle = `${tableStyle}-cell`;
            this.setWidgetStyle(this.rowStyle);
        }

        appendCells(...values) {
            for (let value of values) {
                let cell = mkWidget(this.cellTag);
                cell.setWidgetStyle(this.cellStyle);
                cell.append(value);
                this.append(cell);
            }

            return this;
        }

        clearCell(index) {
            this.childAt(index).clear();
            return this;
        }

        insertCellAfter(index, value) {
            this.childAt(index).insertAfter(value);
            return this;
        }

        insertCellBefore(index, value) {
            this.childAt(index).insertBefore(value);
            return this;
        }

        length() {
            return this.children().length;
        }

        removeCell(index) {
            this.childAt(index).remove();
            return this;
        }

        setCell(index, value) {
            this.childAt(index).replace(value);
            return this;
        }
    }
})();