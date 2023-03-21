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
 * The WArrayEditor is the array analog to WObjectEditor for objects.  This class
 * creates a table of rows, each of which presents for a single object.  Hence,
 * the WArrayEditor contains an array objects, that are displayed and perhaps
 * manipulated or edited in place.  Liek the WObjectEditor, each displayed cell
 * is an encapsulating WScalar object.  Each cell of the table may have its own
 * specified pop mneu associated with it.  The WArrayEditor provides management
 * methods to change the set of objects currently being displayed and edited.
*****/
(() => {
    register(class WArrayEditor extends WEditor {
        static properties = {
            className: false,
            disabled: false,
            property: true,
            label: true,
            menu: false,
            messages: false,
            readonly: false,
            type: false,
            width: false,
        };

        constructor(...columns) {
            super();
            this.columns = [];
            this.objects = mkActiveData([]);
            this.proxy = mkMessageProxy(this);

            this.append(
                (this.table = mkWTable())
                .setStyle('border-collapse', 'collapse')
            );

            if (Array.isArray(columns)) {
                for (let column of columns) {
                    if (typeof column == 'object') {
                        for (let key in column) {
                            if (!(key in WArrayEditor.properties)) {
                                throw new Error(`WArrayEditor column definition contains unknwon property: "${key}"`);
                            }
                        }

                        for (let key in WArrayEditor.properties) {
                            if (WArrayEditor.properties[key] && !(key in column)) {
                                throw new Error(`WArrayEditor column definition missing required property: "${key}"`);
                            }
                        }

                        this.columns.push(column);
                    }
                    else {
                        throw new Error(`WArrayEditor column definition NOT of type "object".`);
                    }
                }
            }


            for (let column of this.columns) {
                if (column.label) {
                    this.table.getHead().append(mkWTableHeadCell().setInnerHtml(column.label));
                }
                else {
                    this.table.getHead().append(mkWTableHeadCell().setInnerHtml(column.property));
                }
            }
        }

        clear() {
            this.table.getBody().clear();
            ActiveData.clear(this.objects);
        }

        concealHead() {
            this.table.getHead().conceal();
        }

        getActiveData() {
            return this.objects;
        }

        getObjectAt(index) {
            if (index >= 0 && index < this.objects.length) {
                return this.objects[index];
            }
        }

        length() {
            return this.objects.length;
        }

        mkRow(activeObject) {
            let tr = mkWTableRow();

            for (let column of this.columns) {
                let value = activeObject[column.property];

                if (value !== undefined && value !== null && !column.hidden) {
                    if (typeof value != 'object' || value instanceof Time || value instanceof Date) {
                        let scalar;
                        let opts = {};
                        opts.menu = column.menu;
                        opts.readonly = column.readonly === true;
                        opts.disabled = column.disabled === true;
                        opts.type = column.type ? column.type : WScalar.selectType(value);

                        tr.append(
                            mkWTableCell()
                            .append(
                                (scalar = mkWScalar(activeObject, column.property, opts))
                                .setMenu(opts.menu)
                                .setClassName(column.className)
                            )
                        );

                        scalar.setPinned('data', activeObject);
                        scalar.setPinned('column', column);

                        if (Array.isArray(column.messages)) {
                            for (let messageName of column.messages) {
                                this.proxy.route(scalar, messageName);
                            }
                        }

                        continue;
                    }
                }

                tr.append(mkWTableCell());
            }

            return tr;
        }

        pop() {
            if (this.objects.length) {
                this.objects.pop();
                this.childAt(this.objects.length).remove();
            }

            return this;
        }

        push(...objects) {
            for (let object of objects) {
                let activeObject = mkActiveData(object);
                this.objects.push(activeObject);
                this.table.getBody().append(this.mkRow(activeObject));
            }

            return this;
        }

        removeObjectAt(index) {
            if (index >= 0 && index < this.objects.length) {
                this.objects.splice(index, 1);
                this.childAt(index).remove();
            }

            return this;
        }

        revealHead() {
            this.table.getHead().reveal();
        }

        shift() {
            if (this.objects.length) {
                this.objects.shift();
                this.childAt(0).remove();
            }

            return this;
        }

        unshift(...objects) {
            for (let object of objects) {
                let activeObject = mkActiveData(object);
                this.objects.unshift(activeObject);
                this.table.getBody().prepend(this.mkRow(activeObject));
            }

            return this;
        }
    });
})();
