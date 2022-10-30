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
register(class WText extends InputBaseWidget {
    constructor(entryFilter) {
        super('textarea', 'textarea');
        this.setEntryFilter(entryFilter);

        this.on('html.input', message => {
            this.valueChanged(message.event.target.value);
        });

        doc.on('keydown', message => {
            if (this.entryFilter) {
                this.entryFilter.handle(event, this);
            }
        });

        doc.on('keyup', message => {
            if (this.entryFilter) {
                this.entryFilter.handle(event, this);
            }
        });
    }

    clearEntryFilter() {
        this.entryFilter = null;
        return this;
    }

    clearSelection() {
        return this;
    }

    getCaretCol() {
    }

    getCaretIndex() {
    }

    getCaretRow() {
    }

    getCol(index) {
    }

    getRow(index) {
    }

    getEntryFilter() {
        return this.entryFilter;
    }

    getSelection() {
    }

    hasEntryFilter() {
        return this.entryFilter !== null;
    }

    hasSelection() {
        return this.htmlElement.node.selectionStart != this.htmlElement.node.selectionEnd;
    }

    insertAt(index) {
    }

    insertAfterCaret() {
    }

    insertBeforeCaret() {
    }

    setEntryFilter(entryFilter) {
        this.entryFilter = entryFilter ? entryFilter : null;
        return this;
    }

    setSelection(selection) {
        return this;
    }
});