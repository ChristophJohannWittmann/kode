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
*****/
register(class WPanel extends WArea {
    constructor() {
        super({
            tagName: 'div',
            rows: [
                {
                    height: 1,
                    columns: [
                        { area: 'title',   width: 7 },
                        { area: 'control', width: 3 },,
                    ],
                },
            ]
        });

        /*
        this.ctl = mkActiveData({
            title: '',
            readonly: true,
            modified: true,
            closable: true,
        });

        this.controls = mkGridLayout({
            rows: ['30px', 'auto'],
            rowGap: '0px',
            cols: [],
            colGap: '1px',
        }).setWidgetStyle('panel-controller');
        */
    }

    clearClosable() {
    }

    clearContent() {
    }

    clearModified() {
    }

    clearTitle() {
    }

    getClosable() {
    }

    getContent() {
    }

    getModified() {
    }

    getTitle() {
    }

    setClosable() {
    }

    setContent(widget) {
    }

    setModified() {
    }

    setReadOnly() {
    }

    setReadWrite() {
    }

    setTitle(title) {
    }
});
