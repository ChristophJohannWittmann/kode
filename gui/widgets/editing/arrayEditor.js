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
register(class WArrayEditor extends WEditor {
    static properties = {
        property: true,
        label: true,
        readonly: false,
        width: false,
    };

    constructor(messages, columns) {
        super();
        this.table = mkWTable();
        super.append(this.table);
        this.columns = [];
        this.messages = messages;
        this.objects = mkActiveData([]);
        this.proxy = mkMessageProxy(this);

        this.table.appendHead(
            (this.head = mkWTableHead())
            .conceal()
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
                this.head.append(mkWTableHeadCell().setInnerHtml(column.label));
            }
            else {
                this.head.append(mkWTableHeadCell().setInnerHtml(column.property));
            }
        }
    }

    append(...objects) {
        for (let object of objects) {
            this.objects.push(object);
            this.table.append(this.mkRow(this.objects.length - 1));
        }

        return this;
    }

    clear() {
        this.table.getBody().clear();
        ActiveData.clear(this.objects);
    }

    concealHead() {
        this.head.conceal();
    }

    createHead() {
        return this;
    }

    getActiveData() {
        return this.objects;
    }

    /*
    getObject(index) {
        return clone(this.objects[index]);
    }

    insertAfter(index, ...objects) {
        return this;
    }

    insertAfter(index, ...objects) {
        return this;
    }
    */

    length() {
        return this.objects.length;
    }

    mkRow(index) {
        let tr = mkWTableRow();
        let object = this.objects[index];

        for (let column of this.columns) {
            if (column.property in object) {
                tr.append(
                    mkWTableCell()
                    .setInnerHtml(object[column.property])
                );
            }
            else {
                tr.append(mkWTableCell());
            }
        }

        return tr;
    }

    /*
    prepend(...objects) {
        return this;
    }

    removeObject(index) {
        return this;
    }
    */

    revealHead() {
        this.head.reveal();
    }
});
