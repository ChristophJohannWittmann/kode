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
 * A very small and simple entry filter for text areas and editors that modify
 * the text area's behavior and make it simpler to use.  One nice feature is
 * the ability to use the widget's tabSize setting to insert spaces into the
 * document that will automatically align to a fixed column number based on the
 * tabSize.
*****/
singleton(class EssayEntryFilter extends EntryFilter {
    constructor() {
        super();

        for (let filterPoint of [
            [ true, '****', 'Enter' ],
            [ true, '****', 'Escape' ],
            [ true, '****', 'Tab' ],
        ]) {
            this.registerFilterPoint(filterPoint);
        }
    }

    onEnterDown(evt, ta) {
        ta.insertAfterCaret('\n');
    }

    onEscapeDown(evt, ta) {
        ta.blur();
    }

    onTabDown(evt, ta) {
        let col = ta.getCaretPosition().col;
        let count = col % ta.getTabSize();

        if (evt.shiftKey) {
        }
        else {
            ta.insertAfterCaret(fillWithChar(ta.getTabSize() - count, ' '));
        }
    }
});