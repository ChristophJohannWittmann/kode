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
 * This widget encapsulates the logic necessary for creating and managing a grid
 * using the CSS display = grid setting.  In esssence, given a set of rows and
 * columns, the constructor adds the settings to the grid widget's individual
 * style class, selector #id, to display this widget as per the provided row and
 * column settings.
*****/
register(class WGrid extends Widget {
    static PlaceholderKey = Symbol('WGridPlaceholder');

    constructor(opts) {
        super(opts.tagName);
        this.configure(opts);
    }

    calcIndex(rowIndex, colIndex) {
        return this.cols.length*rowIndex + colIndex;
    }

    clear() {
        for (let i = 0; i < this.rows.length; i++) {
            for (let j = 0; j < this.cols.length; j++) {
                let index = this.calcIndex(i, j);

                if (!this.cells[index][WGrid.PlaceholderKey]) {
                    let placeholder = mkWidget('div');
                    placeholder[WGrid.PlaceholderKey] = true;
                    this.cells[index].replace(placeholder);
                    this.cells[index] = placeholder;
                }
            }
        }

        return this;
    }

    clearAt(rowIndex, colIndex) {
        let index = this.calcIndex(rowIndex, colIndex);

        if (!this.cells[index][WGrid.PlaceholderKey]) {
            let placeholder = mkWidget('div');
            placeholder[WGrid.PlaceholderKey] = true;
            this.cells[index].replace(placeholder);
            this.cells[index] = placeholder;
        }

        return this;
    }

    clearColGap() {
        this.colGap = '0px';
        this.setStyle('col-gap', this.colGap);
        return this;
    }

    clearRowGap() {
        this.colGap = '0px';
        this.setStyle('col-gap', '');
        return this;
    }

    configure(opts) {
        this.cells = [];

        if (Array.isArray(opts.rows)) {
            this.rows = opts.rows;
        }
        else if (typeof opts.rows == 'number' && i > 0) {
            let autos = [];
            for (let i = 0; i < opts.rows; i++) autos.push('auto');
            this.rows = autos.join(' ');
        }
        else {
            this.rows = ['auto'];
        }

        if (Array.isArray(opts.cols)) {
            this.cols = opts.cols;
        }
        else if (typeof opts.cols == 'number' && i > 0) {
            let autos = [];
            for (let i = 0; i < opts.cols; i++) autos.push('auto');
            this.cols = autos.join(' ');
        }
        else {
            this.cols = ['auto'];
        }

        this.setRowGap(opts.rowGap);
        this.setColGap(opts.colGap);

        this.setStyle({
            display: 'grid',
            gridTemplateRows: `${this.rows.join(' ')}`,
            gridTemplateColumns: `${this.cols.join(' ')}`,
            rowGap: `${this.rowGap}`,
            columnGap: `${this.colGap}`,
            height: '100%',
        });

        for (let i = 0; i < this.rows.length; i++) {
            for (let j = 0; j < this.cols.length; j++) {
                let placeholder = mkWidget('div');
                placeholder[WGrid.PlaceholderKey] = true;
                placeholder.setClassName('fill');
                this.cells.push(placeholder);
                this.append(placeholder);
            }
        }
    }

    getAt(rowIndex, colIndex) {
        let index = this.calcIndex(rowIndex, colIndex);
        return this.cells[index];
    }

    setAt(rowIndex, colIndex, widget) {
        let index = this.calcIndex(rowIndex, colIndex);
        this.cells[index].replace(widget);
        this.cells[index] = widget
        return this;
    }

    setColGap(gap) {
        if (typeof gap == 'number') {
            this.colGap = `${gap}px`;
        }
        else if (typeof gap == 'string') {
            this.colGap = gap;
        }
        else {
            this.colGap = '0px';
        }

        this.setStyle('col-gap', this.colGap);
        return this;
    }

    setRowGap(gap) {
        if (typeof gap == 'number') {
            this.rowGap = `${gap}px`;
        }
        else if (typeof gap == 'string') {
            this.rowGap = gap;
        }
        else {
            this.rowGap = '0px';
        }
        
        this.setStyle('col-gap', this.colGap);
        return this;
    }

    [Symbol.iterator]() {
        return this.cells[Symbol.iterator]();
    }
});