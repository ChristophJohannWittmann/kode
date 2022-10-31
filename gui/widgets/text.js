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
 * The basic widget for wrapping a textarea HTML element.  A raw textarea has
 * very few of the expected features such as fixed-column tabbing.  Hence, a
 * text area can be equipped with or without an entry filter.  Please note
 * that entry filters will be incorporated into editors as they are, extending
 * the usefulness they provide.  Other than entry filters, the WText widget
 * integrates the textarea HTML element into the framework and provides an OO-
 * usability wrapper for the underlying textarea features.
*****/
register(class WText extends InputBaseWidget {
    constructor(entryFilter) {
        super('textarea', 'textarea');
        this.tabSize = 4;
        this.maxSize = 20000;
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
        this.htmlElement.node.selectionEnd = this.htmlElement.node.selectionStart;
        return this;
    }

    getCaretIndex() {
        return this.htmlElement.node.selectionStart;
    }

    getCaretPosition() {
        return this.getPosition(this.htmlElement.node.selectionStart);
    }

    getEntryFilter() {
        return this.entryFilter;
    }

    getLength() {
        return this.htmlElement.node.textLength;
    }

    getPosition(index) {
        let rows = this.getRows(index);
        let rowStart = rows[rows.length - 1];

        return {
            row: rows.length - 1,
            col: this.htmlElement.node.selectionStart - rowStart,
        };
    }

    getRows(index) {
        let rows = [0];
        let content = this.get();

        for (let i = 0; i < content.length; i++) {
            if (content[i] == '\n') {
                rows.push(i);
            }
        }

        return rows;
    }

    getSelection() {
        if (this.htmlElement.node.selectionStart != this.htmlElement.node.selectionEnd) {
            return {
                start: this.htmlElement.node.selectionStart,
                end: this.htmlElement.node.selectionEnd,
            };
        }
        else {
            return null;
        }
    }

    getTabOut(char) {
        let col = this.getCaretPosition().col;
        let count = col % this.tabSize;
        char = char ? char : ' ';
        return fillWithChar(this.tabSize - count, char);
    }

    getTabSize() {
        return this.tabSize;
    }

    getValue() {
        return this.htmlElement.node.value;
    }

    hasEntryFilter() {
        return this.entryFilter !== null;
    }

    hasSelection() {
        return this.htmlElement.node.selectionStart != this.htmlElement.node.selectionEnd;
    }

    insertAfterCaret(text) {
        this.insertAt(this.htmlElement.node.selectionStart, text);
        return this;
    }

    insertAt(index, text) {
        let value = this.getValue();
        let revisedValue = value.substring(0, index) + text + value.substring(index);
        let revisedStart = this.htmlElement.node.selectionStart + text.length;
        let revisedEnd = this.htmlElement.node.selectionEnd + text.length;
        this.htmlElement.node.value = revisedValue;
        this.htmlElement.node.setSelectionRange(revisedStart, revisedEnd);
        return this;
    }

    insertBeforeCaret(text) {
        this.insertAt(this.htmlElement.node.selectionStart + 1, text);
        return this;
    }

    moveCaretEnd() {
        this.setCaretPosition(this.htmlElement.node.textLength);
        return this;
    }

    moveCaretEndOfLine() {
        let rows = this.getRows(this.htmlElement.node.selectionStart);
        let index = rows[rows.length - 1];

        while (index < this.htmlElement.node.textLength && this.htmlElement.node.value[index] != '\n') {
            index++;
        }

        this.htmlElement.node.selectionStart = index;
        this.htmlElement.node.selectionEnd = index;
        return this;
    }

    moveCaretStart() {
        this.setCaretPosition(0);
        return this;
    }

    moveCaretStartOfLine() {
        let rows = this.getRows(this.htmlElement.node.selectionStart);
        this.htmlElement.node.selectionStart = rows[rows.length - 1];
        this.htmlElement.node.selectionEnd = rows[rows.length - 1];
        return this;
    }

    setCaretIndex(index) {
        if (index < 0) {
            this.htmlElement.node.selectionStart = 0;
            this.htmlElement.node.selectionEnd = 0;
        }
        else if (index >= this.htmlElement.node.textLength) {
            this.htmlElement.node.selectionStart = this.htmlElement.node.textLength - 1;
            this.htmlElement.node.selectionEnd = this.htmlElement.node.textLength - 1;            
        }
        else {
            this.htmlElement.node.selectionStart = index;
            this.htmlElement.node.selectionEnd = index;
        }

        return this;
    }

    setEntryFilter(entryFilter) {
        this.entryFilter = entryFilter ? entryFilter : null;
        return this;
    }

    setSelection(start, end) {
        if (!start) {
            this.htmlElement.node.select();
        }
        else if (!end) {
            end = this.htmlElement.node.textLength - 1;
            this.htmlElement.node.setSelectionRange(start, end);
        }
        else {
            this.htmlElement.node.setSelectionRange(start, end);
        }

        return this;
    }

    setTabSize(tabSize) {
        this.tabSize = tabSize;
        return this;
    }

    setValue(text) {
        let scrubbed = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
        this.htmlElement.node.value = scrubbed;
        return this;
    }
});