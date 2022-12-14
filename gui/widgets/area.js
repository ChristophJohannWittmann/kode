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
 * An area widget is a CSS-based, display: grid layout to dynamically format
 * widgets on a DIV or similar using CSS instead of the traditional table for
 * formatting content.  WArea uses areas with defined column spans, row spans,
 * and area names to manage the content of the widget.  This code uses an
 * implied grid of equally sized cells.  It's implied because the browser seems
 * to compute the entire grid size from the starting and ending coordinates of
 * each of the areas.
*****/
register(class WArea extends Widget {
    constructor(opts) {
        super(opts.tagName);
        this.areas = {};

        for (let property in opts.areas) {
            let optArea = opts.areas[property];

            if (property in this.areas) {
                throw new Error(`WArea widget: Area: "${property}" is a duplicate area name.`);                
            }

            let area = new Object({
                name: property,
                widget: null,
            });

            this.areas[property] = area;
            [ area.rowMin, area.rowMax ] = this.computeSpan(optArea.row);
            [ area.colMin, area.colMax ] = this.computeSpan(optArea.col);
        }

        this.styleRule.set({
            display: 'grid',
            height: '100%',
            gridTemplateRows: opts.rows,
        });
    }

    clearArea(name) {
        return this;
    }

    computeSpan(arg) {
        if (Array.isArray(arg)) {
            if (arg.length == 2 && typeof arg[0] == 'number' && typeof arg[1] == 'number') {
                return [arg[0], arg[1]];
            }

            throw new Error(`WArea widget missing or invalid "dimension" array declaration.`);
        }
        else if (typeof arg == 'number') {
            return [ arg, arg ];
        }
        else {
            throw new Error(`WArea widget missing or invalid "dimension" declaration.`);
        }
    }

    setArea(name, widget) {
        let area = this.areas[name];

        if (area) {
            if (area.widget) {
                this.clearArea(area.name);
            }

            area.widget = widget;

            area.widget.styleRule.set({
                gridRow: area.rowMin == area.rowMax ? area.rowMin + 1 : `${area.rowMin + 1} / span ${area.rowMax + 1}`,
                gridColumn: area.colMin == area.colMax ? area.colMin + 1 : `${area.colMin + 1} / span ${area.colMax + 1}`,
            });

            this.append(area.widget);
        }

        return this;
    }

    [Symbol.iterator]() {
        return Object.values(this.areas)[Symbol.iterator]();
    }
});