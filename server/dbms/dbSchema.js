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
 * Not all DBMS's support all of the data types listed in this module.  Hence,
 * a driver for a specifi database can use this object as a placeholder to
 * notify the developer when an attempt to use an unsupported type has occured.
*****/
global.dbUnsupportedType = {
    decode: (type, value) => { throw new Error(`Unsupported DBMS data type: ${type.name}`) },
    encode: (type, value) => { throw new Error(`Unsupported DBMS data type: ${type.name}`) },
};


/*****
 * This is an exhaustive enumeration of the DBMS column types available.  Not
 * every column can be used on all databases.  For instance, PostgreSQL is known
 * for its support of array type, which is not supported on all DBMS's.  Hence,
 * develop your schema carefully if you whish to maintain portability.
*****/
global.dbBin = {
    name: () => 'dbBin',
    init: () => mkBinary(),
    check: value => {
        if (typeof value == 'object' && value instanceof Binary) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbBin": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbBool = {
    name: () => 'dbBool',
    init: () => false,
    check: value => {
        if (typeof value == 'boolean') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbBool": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbFloat32 = {
    name: () => 'Float32',
    init: () => 0.0,
    check: value => {
        if (typeof value == 'number') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbFloat32": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbFloat64 = {
    name: () => 'Float64',
    init: () => 0.0,
    check: value => {
        if (typeof value == 'number') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbFloat64": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt16 = {
    name: () => 'dbInt16',
    init: () => 0,
    check: value => {
        if (typeof value == 'number') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt16": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt32 = {
    name: () => 'dbInt32',
    init: () => 0,
    check: value => {
        if (typeof value == 'number') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt32": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt64 = {
    name: () => 'dbInt64',
    init: () => 0n,
    check: value => {
        if (typeof value == 'bigint') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt64": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbJson = {
    name: () => 'dbJson',
    init: () => new Object(),
    check: value => {
        if (typeof value == 'object') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbJson": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbKey = {
    name: () => 'dbKey',
    init: () => 0n,
    check: value => {
        if (typeof value == 'bigint') {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbKey": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbText = {
    name: () => 'dbText',
    init: () => '',
    check: value => {
        return value !== null ? value.toString() : '';
    }
};

global.dbTime = {
    name: () => 'dbTime',
    init: () => new Date(),
    check: value => {
        if (typeof value == 'object') {
            if (value instanceof Time) {
                return value;
            }
            else if (value instanceof Date) {
                return mkTime(value);
            }
            else if (value instanceof bigint) {
                return mkTime(Number(bigint));
            }
        }
        else {
            throw new Error(`DB Data Type: "DbInt64": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbBinArray = {
    name: () => 'dbBinArray',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbBinArray": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbBoolArray = {
    name: () => 'dbBoolArray',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbBoolArray": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbFloat32Array = {
    name: () => 'dbFloat32Array',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbFloat32Array": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbFloat64Array = {
    name: () => 'dbFloat64Array',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbFloat64Array": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt16Array = {
    name: () => 'dbInt16Array',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt16Array": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt32Array = {
    name: () => 'dbInt32Array',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt32Array": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbInt64Array = {
    name: () => 'dbInt64Array',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbInt64Array": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbJsonArray = {
    name: () => 'dbJsonArray',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbJsonArray": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbTextArray = {
    name: () => 'dbTextArray',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbTextArray": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};

global.dbTimeArray = {
    name: () => 'dbTimeArray',
    init: () => new Array(),
    check: value => {
        if (Array.isArray(value)) {
            return value;
        }
        else {
            throw new Error(`DB Data Type: "DbTimeArray": Set() with invalid value type. ${value} ${typeof value}`);
        }
    }
};


/*****
 * This is a DBMS independent representation of a DBMS schema.  In effect, it's
 * a type of compiler.  It accepts a schema name and table definitions to
 * generate the generic representation of a schema.  As such, it defines a
 * schema in terms that are the least common denominator across multiple DBMS
 * platforms.  This representation will be used for managing DBMS schemas on
 * all supported DBMS platforms and is used for analyzing existing schemas.
*****/
register(class DbSchema {
    static schemas = {};

    constructor(name, defined, ...tableDefs) {
        if (!defined || name.startsWith('#')) {
            this.name = name;
            this.tableMap = {};
            this.tableArray = [];
            this.defined = defined;

            if (this.defined && !this.name.startsWith('#')) {
                throw new Error(`Schema name does not being with a hashtag: ${this.name}`);
            }
            else if (this.defined && this.name in DbSchema.schemas) {
                throw new Error(`Duplicate DB schema name: ${this.name}`);
            }
            else {
                if (this.defined) {
                    DbSchema.schemas[this.name] = this;
                }
                
                for (let tableDef of tableDefs) {
                    if (this.defined) {
                        tableDef.columns.unshift({ name: 'updated', type: dbTime });
                        tableDef.columns.unshift({ name: 'created', type: dbTime });
                        tableDef.columns.unshift({ name: 'oid',     type: dbKey  });
                        tableDef.indexes.unshift('updated:asc');
                        tableDef.indexes.unshift('created:asc');
                        tableDef.indexes.unshift('oid:asc');
                    }

                    let schemaTable = new DbSchemaTable(this, tableDef);
                    this.tableArray.push(schemaTable);
                    this.tableMap[schemaTable.name] = schemaTable;

                    if (this.defined) {
                        defineDboType(schemaTable);
                    }
                }
            }
        }
        else {
            throw new Error(`Schema name required to begin with "#": "${name}"`);
        }
    }

    [Symbol.iterator]() {
        return this.tableArray[Symbol.iterator]();
    }

    static [Symbol.iterator]() {
        return Object.values(DbSchema.schemas)[Symbol.iterator]();
    }
});

class DbSchemaTable {
    constructor(schema, tableDef) {
        this.schema = schema;
        this.name = tableDef.name;
        this.columnMap = {};
        this.columnArray = [];
        this.indexMap = {};
        this.indexArray = [];

        if (this.schema.defined) {
            if (this.name in this.schema.tableMap) {
                throw new Error(`Duplicate DBMS table name: ${this.name} in schema: ${this.schema.name}`);
            }
        }
  
        tableDef.columns.forEach(columnDef => {
            if (columnDef.name in this.columnMap) {
                throw new Error(`Duplicate column name: schema: ${this.schema.name} table: "${this.name}" column: "${columnDef.name}"`);
            }
            else {
                let schemaColumn = new DbSchemaColumn(this, columnDef);
                this.columnArray.push(schemaColumn);
                this.columnMap[schemaColumn.name] = schemaColumn;
            }
        });

        tableDef.indexes.forEach(IndexDef => {
            let schemaIndex = new DbSchemaIndex(this, IndexDef);
            
            if (schemaIndex.name in this.indexMap) {
                throw new Error(`Duplicate index name: schema: ${this.schema.name} table: "${this.name}" index: "${schemaIndex.name}"`);
            }
            else {
                this.indexArray.push(schemaIndex);
                this.indexMap[schemaIndex.name] = schemaIndex;
            }
        });
    }

    [Symbol.iterator]() {
        return this.columnArray[Symbol.iterator]();
    }
}

class DbSchemaColumn {
    constructor(table, columnDef) {
        this.table = table;
        this.name = columnDef.name;
        this.type = columnDef.type;
        this.size = 'size' in columnDef ? columnDef.size : 0;
    }
}

class DbSchemaIndex {
    constructor(table, indexDef) {
        this.table = table;
        this.columnMap = {};
        this.columnArray = [];
  
        indexDef.trim().split(',').forEach(column => {
            let [ columnName, direction ] = column.trim().split(':');
            columnName = columnName.trim();
            direction = direction.trim();
            
            if (!(columnName in this.table.columnMap)) {
                throw new Error(`Undefined column name for index: schema: ${this.table.schema.name} table: "${this.table.name}" column: "${columnName}"\n`);
            }
            else if (columnName in this.columnMap) {
                throw new Error(`Duplicate column name for index: schema: ${this.table.schema.name} table: "${this.table.name}" column: "${columnName}"\n`);
            }
            else {
                let indexColumn = {
                    columnName: columnName,
                    direction: direction.toLowerCase(),
                };
                
                this.columnArray.push(indexColumn);
                this.columnMap[indexColumn.columnName] = indexColumn;
            }
            
            this.name = [
                `${this.table.name}`,
                `${this.columnArray[0].columnName[0].toUpperCase()}${this.columnArray[0].columnName.substr(1)}`,
                this.columnArray.slice(1).map(indexColumn => `${indexColumn.columnName[0].toUpperCase()}${indexColumn.columnName.substr(1)}`),
            ].join('');
        });
    }
}
