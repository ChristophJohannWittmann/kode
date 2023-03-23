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
 * The basic widget for wrapping a textarea HTML element.  A raw textarea has
 * very few of the expected features such as fixed-column tabbing.  Hence, a
 * text area can be equipped with or without an entry filter.  Please note
 * that entry filters will be incorporated into editors as they are, extending
 * the usefulness they provide.  Other than entry filters, the WText widget
 * integrates the textarea HTML element into the framework and provides an OO-
 * usability wrapper for the underlying textarea features.
*****/
register(class WTextArea extends WEditable {
    constructor(entryFilter) {
        super('textarea');
        this.setWidgetStyle('textarea');
        this.tabSize = 4;
        this.maxSize = 20000;
        this.setEntryFilter(entryFilter ? entryFilter : mkEssayEntryFilter());

        doc.on('dom.keydown', message => {
            let widget = wrapDocNode(doc.activeElement());

            if (widget instanceof Widget && widget.getId() == this.getId()) {
                if (this.entryFilter) {
                    this.entryFilter.handle(event, this);
                }
            }
        });

        doc.on('dom.keyup', message => {
            let widget = wrapDocNode(doc.activeElement());

            if (widget instanceof Widget && widget.getId() == this.getId()) {
                if (this.entryFilter) {
                    this.entryFilter.handle(event, this);
                }
            }
        });

        this.on('dom.input', message => {
            this.valueChanged(this.getValue());            
        });
    }

    clearEntryFilter() {
        this.entryFilter = null;
        return this;
    }

    clearSelection() {
        this.node.selectionEnd = this.node.selectionStart;
        return this;
    }

    deleteAt(index, count) {
        console.log(index);
        console.log(count);
        return this;
    }

    getCaretIndex() {
        return this.node.selectionStart;
    }

    getCaretPosition() {
        return this.getPosition(this.node.selectionStart);
    }

    getEntryFilter() {
        return this.entryFilter;
    }

    getLength() {
        return this.node.textLength;
    }

    getPosition(index) {
        let rows = this.getRows(index);
        let rowStart = rows[rows.length - 1];

        return {
            row: rows.length - 1,
            col: this.node.selectionStart - rowStart,
        };
    }

    getRows(index) {
        let rows = [0];
        let content = this.getValue();

        for (let i = 0; i < content.length; i++) {
            if (content[i] == '\n') {
                rows.push(i);
            }
        }

        return rows;
    }

    getSelection() {
        if (this.node.selectionStart != this.node.selectionEnd) {
            return {
                start: this.node.selectionStart,
                end: this.node.selectionEnd,
            };
        }
        else {
            return null;
        }
    }

    getTabSize() {
        return this.tabSize;
    }

    hasEntryFilter() {
        return this.entryFilter !== null;
    }

    hasSelection() {
        return this.node.selectionStart != this.node.selectionEnd;
    }

    insertAfterCaret(text) {
        this.insertAt(this.node.selectionStart, text);
        return this;
    }

    insertAt(index, text) {
        let value = this.getValue();
        let revisedValue = value.substring(0, index) + text + value.substring(index);
        let revisedStart = this.node.selectionStart + text.length;
        let revisedEnd = this.node.selectionEnd + text.length;
        this.node.value = revisedValue;
        this.node.setSelectionRange(revisedStart, revisedEnd);
        return this;
    }

    insertBeforeCaret(text) {
        this.insertAt(this.node.selectionStart + 1, text);
        return this;
    }

    isValid() {
        return true;
    }

    moveCaretEnd() {
        this.setCaretPosition(this.node.textLength);
        return this;
    }

    moveCaretEndOfLine() {
        let rows = this.getRows(this.node.selectionStart);
        let index = rows[rows.length - 1];

        while (index < this.node.textLength && this.node.value[index] != '\n') {
            index++;
        }

        this.node.selectionStart = index;
        this.node.selectionEnd = index;
        return this;
    }

    moveCaretStart() {
        this.setCaretPosition(0);
        return this;
    }

    moveCaretStartOfLine() {
        let rows = this.getRows(this.node.selectionStart);
        this.node.selectionStart = rows[rows.length - 1];
        this.node.selectionEnd = rows[rows.length - 1];
        return this;
    }

    setCaretIndex(index) {
        if (index < 0) {
            this.node.selectionStart = 0;
            this.node.selectionEnd = 0;
        }
        else if (index >= this.node.textLength) {
            this.node.selectionStart = this.node.textLength - 1;
            this.node.selectionEnd = this.node.textLength - 1;            
        }
        else {
            this.node.selectionStart = index;
            this.node.selectionEnd = index;
        }

        return this;
    }

    setEntryFilter(entryFilter) {
        this.entryFilter = entryFilter ? entryFilter : null;
        return this;
    }

    setSelection(start, end) {
        if (!start) {
            this.node.select();
        }
        else if (!end) {
            end = this.node.textLength - 1;
            this.node.setSelectionRange(start, end);
        }
        else {
            this.node.setSelectionRange(start, end);
        }

        return this;
    }

    setTabSize(tabSize) {
        this.tabSize = tabSize;
        return this;
    }

    subclassCheckValidity() {
        return true;
    }

    subclassGetValue() {
        return this.node.value;
    }

    subclassSetValue(text) {
        this.silence();
        let scrubbed = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
        this.node.value = scrubbed;
        this.resume();
        return this;
    }
});