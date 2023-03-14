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
 * A WidgetState is defined by the flags and cache values set on that widget and
 * the flags set on it's dependants.  The concept being that for a branch of
 * nodes, the first one (i.e., depth-first search) marked with the "focus" flag
 * will be restored to having focus when the framework places that widget back
 * in view.  If another widget is focused, within the branch, that will take
 * over as having the focus when the branch is made visible again.
*****/
register(class WidgetState {  
    constructor(widget) {
        this.flags = {
            focus: null,
        };

        for (let descendant of widget.descendants()) {
            for (let flagName in this.flags) {
                if (this.flags[flagName] == null) {
                    if (descendant.getFlag(flagName)) {
                        this.flags[flagName] = descendant;
                    }
                }
            }
        }
    }

    restore(timeout) {
        setTimeout(() => {
            if (this.flags.focus) {
                this.flags.focus.focus();
            }
        }, typeof timeout == 'number' ? timeout : 50);
    }

    [Symbol.iterator]() {
        let flags = Object.entries(this.flags).map(entry => ({ name: entry[0], value: entry[1] }));
        return flags[Symbol.iterator]();
    }
});
