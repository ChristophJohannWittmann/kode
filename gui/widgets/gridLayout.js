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
*****/
register(class GridLayoutWidget extends Widget {
    constructor(opts) {
        super('div');
        this.setGeometry(opts);
    }

    changeDimensions(dRows, dCols) {
    }

    changeGap(dRow, dCol) {
    }

    clear() {
    }

    clearAt(rowIndex, colIndex) {
    }

    index(row, col) {
        return this.rows*row + col;
    }

    item(row, col) {
        return this.cells[this.index(row, col)];
    }

    static initialize(classData) {
        classData.style.change(`{
            height: 100%;
            width: 100%;
            display: grid;
        }`);
    }

    [Symbol.iterator]() {
        return this.cells[Symbol.iterator]();
    }

    setAt(rowIndex, colIndex, arg) {
    }

    setGeometry(opts) {
        if (opts) {
            this.cells = [];
            this.rows = opts.rows ? opts.rows : 1;
            this.cols = opts.cols ? opts.cols : 1;
            this.rowGap = opts.rowGap ? opts.rowGap : '0px';
            this.colGap = opts.colGap ? opts.colGap : '0px';

            let cols = [];
            for (let i = 0; i < this.cols; i++) cols.push('auto');
            this.styleRule.set({ gridTemplateColumns: cols.join(' ')});


            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    let placeholder = mkWidget('div');
                    placeholder.htmlElement.append(htmlText(this.index(i, j).toString()));

                    placeholder.setFlex('h', 'cc');
                    placeholder.setClassName('border2');
                    placeholder.setClassName('border-r40');

                    this.cells.push(placeholder);
                    this.htmlElement.append(placeholder);
                }
            }
        }
    }
});