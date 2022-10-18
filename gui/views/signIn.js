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
register(class SignInWidget extends Widget {
    constructor() {
        super('div');

        this.grid = mkGridLayoutWidget({
            rows: 3,
            rowGap: '0px',
            cols: 3,
            colGap: '0px',
        });

        this.htmlElement.append(this.grid);

        // *************************************
        // *************************************

        let content = mkWidget('div');
        content.htmlElement.append(htmlText('Hello Widget'));

        content.styleRule.set(`{
            text-align: center;
            vertical-lign: middle;
            font-weight: bold;
            font-size: 20px;
        }`);

        this.grid.setAt(1, 1, content);

        setTimeout(() => {
            for (let cell of this.grid) {
                cell.setFlex('h', 'ee');
            }
        }, 1000);

        // *************************************
        // *************************************
    }

    static initialize(classData) {
        /*
        classData.style.set({
           backgroundColor: 'whitesmoke',
        });
        */
    }
});