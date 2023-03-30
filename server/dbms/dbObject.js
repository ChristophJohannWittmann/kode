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


/****
*****/
global.dboThunks = [];


/*****
 * Base class is used for identifying any of the defined Dbo object classes.
 * You can do "instanceof DboBase" to check whether an object is some sort of
 * subclasss of an object that is part of a database schema.
*****/
register(class DboBASE extends Jsonable {
    constructor() {
        super();
    }
});


/*****
 * The heart of an application is managing DBMS records, which is performed
 * often and there's lots of code doing so.  The purpose of this template is to
 * register classes and functions take care of the drudgery of writing code to
 * to perform these types of operations. Every table from every schema uses this
 * feature to register classes and function that simplify programmatic use of
 * the DBMS tables and records.
*****/
register(function defineDboType(schemaTable) {
    const tableName = `_${toSnakeCase(schemaTable.name)}`;
    const className = `Dbo${schemaTable.name[0].toUpperCase()}${schemaTable.name.substr(1)}`;
    const chain = getContainer()['#CHAIN'];
    const prefix = chain ? `${chain}.` : '';
    const container = getContainer(prefix);

    const fwdMap = {};
    const revMap = {};

    schemaTable.columnArray.forEach(column => fwdMap[column.name] = ({
        name: `_${toSnakeCase(column.name)}`,
        type: column.type,
        size: column.size,
    }));

    schemaTable.columnArray.forEach(column => revMap[`_${toSnakeCase(column.name)}`] = ({
        name: column.name,
        type: column.type,
    }));

    dboThunks.push({
        chain: prefix,
        container: container,
        className: className,
        properties: fwdMap,
    });
    
    eval(`
    register(class ${className} extends DboBASE {
        constructor(values) {
            super();
            this.init();
            this.set(values);
        }

        copy() {
            let copy = ${prefix}mk${className}();

            for (let propertyName in fwdMap) {
                copy[propertyName] = this[propertyName];
            }

            copy.oid = 0n;
            copy.created = mkTime();
            copy.updated = mkTime();

            return copy;
        }

        async erase(dbc) {
            if (this.oid > 0n) {
                await dbc.query("DELETE FROM ${tableName} WHERE _oid=" + this.oid);
                this.oid = 0n;
                return this;
            };
        }

        init() {
            for (let memberName in fwdMap) {
                this[memberName] = fwdMap[memberName].type.init();
            }

            return this;
        }

        async insert(dbc) {
            this.created = mkTime();
            this.updated = mkTime();

            let dbcTypes = dbc.dbClass().dbTypes();
            let sql = ['INSERT INTO ${tableName}'];
            sql.push('(${Object.keys(fwdMap).filter(key => key != 'oid').map(key => "_" + toSnakeCase(key)).join(',')})');

            sql.push(
                "VALUES(" +
                Object.keys(fwdMap).filter(key => key != 'oid').map(key => {
                    let propertyMeta = fwdMap[key];
                    return dbcTypes[propertyMeta.type.name()].encode(this[key]);
                }).join(',') +
                ")"
            );

            let result = await dbc.query(sql.join(' '), true);
            this.oid = result.data;
        }

        meta() {
            let meta = {};

            for (let property in fwdMap) {
                meta[property] = {
                    name: property,
                    dbType: global[fwdMap[property].type.name()],
                    dbTypeName: fwdMap[property].type.name(),
                };
            }

            return meta;
        }

        async save(dbc) {
            if (this.oid == 0n) {
                await this.insert(dbc);
            }
            else {
                await this.update(dbc);
            }

            return this;
        }

        set(values) {
            if (typeof values == 'object') {
                for (let key in values) {
                    if (key in fwdMap) {
                        this[key] = fwdMap[key].type.check(values[key]);
                    }
                }
            }
        }

        toDbms(dbc, propertyName) {
            if (propertyName in fwdMap) {
                let dbcTypes = dbc.dbClass().dbTypes();
                let propertyMeta = fwdMap[propertyName];
                return dbcTypes[propertyMeta.type.name()].encode(this[propertyName])
            }

            return 'NULL';
        }

        static toDbmsValue(dbc, propertyName, value) {
            if (propertyName in fwdMap) {
                let dbcTypes = dbc.dbClass().dbTypes();
                let propertyMeta = fwdMap[propertyName];
                return dbcTypes[propertyMeta.type.name()].encode(value)
            }

            return 'NULL';
        }

        async update(dbc) {
            this.updated = mkTime();

            let dbcTypes = dbc.dbClass().dbTypes();
            let sql = ['UPDATE ${tableName}'];

            sql.push(
                "SET " +
                Object.keys(fwdMap).filter(key => key != 'oid').map(key => {
                    let propertyMeta = fwdMap[key];
                    return propertyMeta.name + "=" + dbcTypes[propertyMeta.type.name()].encode(this[key]);
                }).join(',')
            );

            sql.push("WHERE _oid=" + this.oid);
            let result = await dbc.query(sql.join(' '));
            return this;
        }
    });
    
    register(async function create${className}(...args) {
        let ${className}Obj = mk${className}();

        for (let arg of args) {
            if (typeof arg == 'object') {
                for (let propertyName in fwdMap) {
                    if (propertyName in arg) {
                        ${className}Obj[propertyName] = arg[propertyName];
                    }
                }
            }
        }

        return ${className}Obj;
    });

    register(async function erase${className}(dbc, where) {
        if (typeof where == 'string') {
            await dbc.query("DELETE FROM ${tableName} WHERE " + where);
        }
        else if (typeof where == 'number' || typeof where == 'bigint') {
            await dbc.query("DELETE FROM ${tableName} WHERE _oid=" + where);
        }
        else if (where === undefined || where === null) {
            await dbc.query("DELETE FROM ${tableName}");
        }
    });

    register(async function get${className}(dbc, oid) {
        let sql = ['SELECT'];
        sql.push('${Object.keys(fwdMap).map(key => "_" + toSnakeCase(key)).join(',')}');
        sql.push('FROM ${tableName}');
        sql.push("WHERE _oid=" + oid);
        let result = await dbc.query(sql.join(' '));

        if (result.data.length) {
            let data = {};
            let dbcTypes = dbc.dbClass().dbTypes();

            Object.entries(result.data[0]).forEach(entry => {
                let field = revMap[entry[0]];
                let dbcType = dbcTypes[field.type.name()];
                data[toCamelCase(entry[0])] = dbcType.decode(entry[1]);
            });

            return mk${className}(data);
        }
        else {
            return mk${className}();
        }
    });

    register(async function select${className}(dbc, where, order) {
        let sql = ['SELECT'];
        sql.push('${Object.keys(fwdMap).map(key => "_" + toSnakeCase(key)).join(',')}');
        sql.push('FROM ${tableName}');
        where ? sql.push("WHERE " + where) : false;
        order ? sql.push("ORDER BY " + order) : false;
        let result = await dbc.query(sql.join(' '));

        if (result.data.length) {
            let array = [];
            let dbcTypes = dbc.dbClass().dbTypes();

            for (let row of result.data) {
                let data = {};

                Object.entries(row).forEach(entry => {
                    let field = revMap[entry[0]];
                    let dbcType = dbcTypes[field.type.name()];
                    data[toCamelCase(entry[0])] = dbcType.decode(entry[1]);
                });

                array.push(mk${className}(data));
            }

            return array;
        }
        else {
            return [];
        }
    });

    register(async function selectOne${className}(dbc, where, order) {
        let sql = ['SELECT'];
        sql.push('${Object.keys(fwdMap).map(key => "_" + toSnakeCase(key)).join(',')}');
        sql.push('FROM ${tableName}');
        where ? sql.push("WHERE " + where) : false;
        order ? sql.push("ORDER BY " + order) : false;
        let result = await dbc.query(sql.join(' '));

        if (result.data.length) {
            let array = [];
            let dbcTypes = dbc.dbClass().dbTypes();
            let data = {};

            Object.entries(result.data[0]).forEach(entry => {
                let field = revMap[entry[0]];
                let dbcType = dbcTypes[field.type.name()];
                data[toCamelCase(entry[0])] = dbcType.decode(entry[1]);
            });

            return (mk${className}(data));
        }
        else {
            return null;
        }
    });

    register(async function update${className}(dbc, changes, where) {
        let updated = mkTime();
        let dbcTypes = dbc.dbClass().dbTypes();
        let sql = ['UPDATE ${tableName}'];

        if (typeof changes == 'string') {
            sql.push("SET " + changes);
        }
        else {
            sql.push(
                "SET " +
                Object.keys(changes).filter(key => key != 'oid').map(key => {
                    let propertyMeta = fwdMap[key];
                    return propertyMeta.name + "=" + dbcTypes[propertyMeta.type.name()].encode(changes[key]);
                }).join(',')
            );
        }

        if (where) {
            if (typeof where == 'string') {
                sql.push("WHERE " + where);
            }
            else if (typeof where == 'number' || typeof where == 'bigint') {
                sql.push("WHERE _oid=" + where);
            }
        }

        let result = await dbc.query(sql.join(' '));
    });
    `);
});
