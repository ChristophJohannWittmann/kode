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
*****/
register(class SvgWidget extends Widget {
    constructor(tagName) {
        super(tagName ? tagName : 'div');
        this.append(this.svg = mkSvgElement('svg'));
    }

    getHeight() {
        return this.svg.node.height;
    }

    getViewBox() {
        let viewbox = this.svg.node.viewBox.split(' ');

        return {
            x: viewbox[0],
            y: viewbox[1],
            width: viewbox[2],
            height: viewbox[3],
        };
    }

    getWidth() {
        return this.svg.node.width;
    }

    getX() {
        return this.svg.node.x;
    }

    getY() {
        return this.svg.node.y;
    }

    preserveAspectRatio(value) {
        switch (value) {
            case 'none':
            case 'xMinYMin':
            case 'xMidYMin':
            case 'xMaxYMin':
            case 'xMinYMid':
            case 'xMidYMid':
            case 'xMaxYMid':
            case 'xMinYMax':
            case 'xMidYMax':
            case 'xMaxYMax':
                this.svg.node.preserveAspectRatio(value);
                break;
        }

        return this;
    }

    setSize(...size) {
        if (size.length > 1) {
            this.svg.node.x = size[0];
            this.svg.node.y = size[1];
            this.svg.node.width = size[2];
            this.svg.node.height = size[3];
        }
        else if (typeof size[0] == 'object') {
            this.svg.node.x = size[0].x;
            this.svg.node.y = size[0].y;
            this.svg.node.width = size[0].width;
            this.svg.node.height = size[0].height;
        }

        return this;
    }

    setViewBox(...viewbox) {
        if (viewbox.length > 1) {
            this.svg.node.viewBox = `${viewbox[0]} ${viewbox[1]} ${viewbox[2]} ${viewbox[3]}`;
        }
        else {
            this.svg.node.viewBox = viewbox[0];
        }

        return this;
    }
});
