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
    const newRowKey = Symbol('new-row');

    register(class WArrayEditor extends WEditor {
        static properties = {
            choices: false,
            classNames: false,
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
            this.rowMap = new Object();

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
                    this.table.getHead().append(
                        mkWTableHeadCell()
                        .setInnerHtml(column.label)
                        .setClassNames(column.classNames)
                    );
                }
                else {
                    this.table.getHead().append(
                        mkWTableHeadCell()
                        .setInnerHtml(column.property)
                        .setClassNames(column.classNames)
                    );
                }
            }
        }

        clear() {
            this.table.getBody().clear();
            ActiveData.clear(this.objects);
            return this;
        }

        clearNew(...indices) {
            if (indices.length) {
                for (let index of indices) {
                    if (index >= 0 && index < this.length()) {
                        delete this.objects[index][newRowKey];
                    }
                }
            }
            else {
                for (let object of this.objects) {
                    delete object[index][newRowKey];
                }                
            }

            return this;
        }

        concealHead() {
            this.table.getHead().conceal();
            return this;
        }

        countNew() {
            return this.objects.reduce(
                (sum, value) => sum + value[newRowKey] ? 1 : 0,
                0
            );
        }

        countOld() {
            return this.objects.reduce(
                (sum, value) => sum + value[newRowKey] ? 0 : 1,
                0
            );
        }

        getActiveData() {
            return this.objects;
        }

        getFirstObject() {
            if (this.objects.length) {
                return this.objects[0];
            }
        }

        getLastObject() {
            if (this.objects.length) {
                return this.objects[this.objects.length - 1];
            }
        }

        getNewObjects() {
            return this.objects.filter(row => row[newRowKey] === true);
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
            this.rowMap[ActiveData.id(activeObject)] = tr;

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
                        opts.choices = column.choices ? column.choices : [];

                        tr.append(
                            mkWTableCell()
                            .append(
                                (scalar = mkWScalar(activeObject, column.property, opts))
                                .setMenu(opts.menu)
                                .setClassNames(column.classNames)
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

            this.send({
                messageName: 'Widget.Changed',
                type: 'array',
                action: 'add',
                object: activeObject,
                tr: tr,
            });

            return tr;
        }

        pop() {
            if (this.objects.length) {
                this.removeObjectAt(0);
            }

            return this;
        }

        push(...objects) {
            for (let object of objects) {
                const activeObject = mkActiveData(object);
                this.objects.push(activeObject);

                if (object[newRowKey]) {
                    activeObject[newRowKey] = true;
                }

                this.table.getBody().append(this.mkRow(activeObject));
                this.modified++;

                if (this.modified == 1) {
                    this.send({
                        messageName: 'Widget.Modified',
                        modified: true,
                        widget: this,
                    });
                }
            }

            this.ignore();
            this.listen();
            return this;
        }

        pushNew(...objects) {
            objects.forEach(object => object[newRowKey] = true);
            return this.push(...objects);
        }

        removeObjectAt(index) {
            if (index >= 0 && index < this.objects.length) {
                let object = this.objects[index];
                let oid = ActiveData.id(object);
                let tr = this.rowMap[oid];
                delete this.rowMap[oid];
                tr.remove();

                delete this.objects[index];

                this.send({
                    messageName: 'Widget.Changed',
                    type: 'array',
                    action: 'remove',
                    object: object,
                    tr: tr,
                });

                if (this.modified == 0) {
                    this.send({
                        messageName: 'Widget.Modified',
                        modified: false,
                        widget: this,
                    });
                }
            }

            return this;
        }

        revealHead() {
            this.table.getHead().reveal();
            return this;
        }

        async revert() {
            await super.revert();
            let done = false;

            while (!done) {
                done = true;

                for (let i = 0; i < this.objects.length; i++) {
                    if (this.objects[i][newRowKey]) {
                        done = false;
                        this.removeObjectAt(i);
                    }
                }
            }

            this.ignore();
            this.listen();
        }

        shift() {
            if (this.objects.length) {
                this.removeObjectAt(this.objects.length - 1);
            }

            return this;
        }

        [Symbol.iterator]() {
            return this.objects[Symbol.iterator]();
        }

        unshift(...objects) {
            for (let object of objects) {
                const activeObject = mkActiveData(object);
                this.objects.unshift(activeObject);

                if (object[newRowKey]) {
                    activeObject[newRowKey] = true;
                }

                this.table.getBody().prepend(this.mkRow(activeObject));
                this.modified++;

                if (this.modified == 1) {
                    this.send({
                        messageName: 'Widget.Modified',
                        modified: true,
                        widget: this,
                    });
                }
            }

            this.ignore();
            this.listen();
            return this;
        }

        unshiftNew(...objects) {
            objects.forEach(object => object[newRowKey] = true);
            return this.unshift(...objects);
        }
    });
})();
