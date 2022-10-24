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
 * The grid layout widget employs the use of the more recent display: grid;
 * Once constructed, the geometry is static and there are no features to change
 * this.  To dynamically change the grid geometry, you need to construct and
 * initialize a replacement grid layout widget and place it on the document.
*****/
register(class WGridLayout extends Widget {
    static PlaceholderKey = Symbol('placeholder');

    constructor(opts) {
        super('div');
        this.cells = [];
        this.setClassName('fill');

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

        if (typeof opts.rowGap == 'number') {
            this.rowGap = `${opts.rowGap}px`;
        }
        else if (typeof opts.rowGap == 'string') {
            this.rowGap = opts.rowGap;
        }
        else {
            this.rowGap = '0px';
        }

        if (typeof opts.colGap == 'number') {
            this.colGap = `${opts.colGap}px`;
        }
        else if (typeof opts.colGap == 'string') {
            this.colGap = opts.colGap;
        }
        else {
            this.colGap = '0px';
        }

        this.styleRule.set({
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
                placeholder[WGridLayout.PlaceholderKey] = true;
                placeholder.setClassName('fill');
                this.cells.push(placeholder);
                this.append(placeholder);
            }
        }
    }

    bind() {
    }

    calcIndex(rowIndex, colIndex) {
        return this.cols.length*rowIndex + colIndex;
    }

    clear() {
        for (let i = 0; i < this.rows.length; i++) {
            for (let j = 0; j < this.cols.length; j++) {
                let index = this.calcIndex(i, j);

                if (!this.cells[index][WGridLayout.PlaceholderKey]) {
                    let placeholder = mkWidget('div');
                    placeholder[WGridLayout.PlaceholderKey] = true;
                    this.cells[index].replace(placeholder);
                    this.cells[index] = placeholder;
                }
            }
        }

        return this;
    }

    clearAt(rowIndex, colIndex) {
        let index = this.calcIndex(rowIndex, colIndex);

        if (!this.cells[index][WGridLayout.PlaceholderKey]) {
            let placeholder = mkWidget('div');
            placeholder[WGridLayout.PlaceholderKey] = true;
            this.cells[index].replace(placeholder);
            this.cells[index] = placeholder;
        }

        return this;
    }

    clearColGap() {
        this.colGap = '0px';
        this.styleRule.settings().colGap = this.colGap;
        return this;
    }

    clearRowGap() {
        this.colGap = '0px';
        this.styleRule.settings().colGap = this.colGap;
        return this;
    }

    getAt(rowIndex, colIndex) {
        let index = this.calcIndex(rowIndex, colIndex);
        return this.cells[index];
    }

    set(innerHtml) {
    }

    setAt(rowIndex, colIndex, widget) {
        let index = this.calcIndex(rowIndex, colIndex);
        this.cells[index].replace(widget);
        this.cells[index] = widget
        return widget;
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

        this.styleRule.settings().colGap = this.colGap;
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

        this.styleRule.settings().rowGap = this.rowGap;
        return this;
    }

    [Symbol.iterator]() {
        return this.cells[Symbol.iterator]();
    }
});