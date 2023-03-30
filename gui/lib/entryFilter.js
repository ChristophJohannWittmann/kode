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
 * TextArea handlers are singleton objects whose job is to add type specific
 * editing features to a plain old WTextArea widget.  These handlers are not trivial
 * and can required significant programming efforts.  The core functionality for
 * building a value-added editor is to create a singleton instance subclassing
 * TextAreaHandler with features that can enhance or automate the editing feature
 * set.  We want the final text editing instances to be singletons to increase
 * WTextArea construction performance.
*****/
(()  => {
    const types = {
        keydown: 'Down',
        keyup: 'Up',
    };

    register(class EntryFilter {
        constructor() {
        }

        checkValidity(ta) {
            return true;
        }

        handle(evt, ta) {
            if (evt.type in types) {
                let method = this[`on${evt.code}${types[evt.type]}`];

                if (!method && evt.code.startsWith('Key')) {
                    method = this[`onKey${types[evt.type]}`];
                }

                if (method) {
                    Reflect.apply(method, this, [evt, wrapDocNode(evt.target)]);
                    evt.preventDefault();
                }
            }
        }

        tabSelectionLeft(ta, delta) {
            ta.silence();
            let removed = 0;
            let rows = ta.getRowStarts();
            let selectedRows = ta.getSelectedRows();
            let selection = ta.getSelection();

            for (let i = selectedRows[0]; i <= selectedRows[1]; i++) {
                let count = 0;
                let index = rows[i] - removed;

                for (let j = 0; j < ta.getTabSize(); j++) {
                    let char = ta.getText(index);

                    if (char && char.match(/[ \t]/)) {
                        count++;
                    }
                }

                ta.deleteAt(index, count);
                removed += count;
            }

            ta.setSelection(
                selection.start - ta.getTabSize(),
                selection.end - removed
            );

            ta.resume();
        }

        tabSelectionRight(ta, delta) {
            ta.silence();
            let added = 0;
            let rows = ta.getRowStarts();
            let selectedRows = ta.getSelectedRows();
            let fill = fillWithChar(delta, ' ');

            for (let i = selectedRows[0]; i <= selectedRows[1]; i++) {
                ta.insertAt(rows[i] + added, fill);
                added += fill.length;
            }

            ta.setSelection(
                ta.getSelectionStart() - added + ta.getTabSize(),
                ta.getSelectionEnd()
            );

            ta.resume();
        }
    });
})();