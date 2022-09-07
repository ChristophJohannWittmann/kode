/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
 * The heart of an application is managing DBMS records, which is performed
 * often and there's lots of code doing so.  The purpose of this template is to
 * register classes and functions take care of the drudgery of writing code to
 * to perform these types of operations. Every table from every schema uses this
 * feature to register classes and function that simplify programmatic use of
 * the DBMS tables and records.
*****/
register(function defineDboType(schemaTable) {
    const prefix = `${schemaTable.schema.name[0].toUpperCase()}${schemaTable.schema.name.substr(1)}`;
    const body = `${schemaTable.name[0].toUpperCase()}${schemaTable.name.substr(1)}`;
    const className = `${prefix}${body}`;
    const table = `_${toSnakeCase(schemaTable.name)}`;
    const columns = schemaTable.columnArray.map(column => `_${toSnakeCase(column.name)}`);
    
    let code =
`{
    register(class ${className} {
        constructor(properties) {
            schemaTable.columnArray.forEach(column => this[column.name] = column.type.init());
            this.set(properties);
        }
        
        async erase(dbc) {
            if (this.oid) {
                let sql = "DELETE FROM ${table} WHERE _oid=" + this.oid;
                await dbc.query(sql);
            }
            
            return this;
        }
        
        async save(dbc) {
            let types = dbc.types();
             
            if (this.oid) {
                this.updated = new Date();
             
                let values = Object.keys(this)
                .filter(key => key in schemaTable.columnMap && key != 'oid')
                .map(key => {
                    let columnName = "_" + toSnakeCase(key);
                    let driverType = types[schemaTable.columnMap[key].type.name()];
                    return columnName + "=" + driverType.encode(this[key]);
                }).join(',');
             
                let sql = "UPDATE ${table} SET " + values + " WHERE _oid=" + this.oid;
                await dbc.query(sql);
            }
            else {
                this.created = new Date();
                this.updated = new Date();
             
                let values = Object.keys(this)
                .filter(key => key in schemaTable.columnMap && key != 'oid')
                .map(key => {
                    let columnName = "_" + toSnakeCase(key);
                    let driverType = types[schemaTable.columnMap[key].type.name()];
                    return driverType.encode(this[key]);
                }).join(',');
             
                let sql = "INSERT INTO ${table} (${columns.filter(colName => colName != '_oid').join(',')}) VALUES(" + values + ")";
                let result = await dbc.query(sql, { returnOid: true });
                this.oid = result.oid;
            }
            
            return this;
        }
        
        set(properties) {
            if (typeof properties == 'object') {
                Object.keys(properties).forEach(key => {
                    if (key in this) {
                        this[key] = properties[key];
                    }
                });
            }
            
            return this;
        }
    });
    
    register(async function erase${className}(dbc, where) {
        let whereClause = '';
        let orderClause = '';
        let types = dbc.types();
        
        if (where) {
            if (typeof where == 'object') {
                let wheres = Object.keys(where)
                .filter(key => key in schemaTable.columnMap)
                .map(key => {
                    let driverType = types[schemaTable.columnMap[key].type.name()];
                    return "_" + toSnakeCase(key) + "=" + driverType.encode(where[key]);
                });
             
                if (wheres.length) {
                    whereClause = " WHERE " + wheres.join(',');
                }
            }
            else {
                whereClause = " WHERE " + where;
            }
        }
        
        let sql = "DELETE FROM ${table}" + whereClause;
        await dbc.query(sql);
    });
    
    register(async function get${className}(dbc, oid) {
        let sql = "SELECT ${columns.join(',')} FROM ${table} WHERE _oid=" + oid;
        let result = await dbc.query(sql);
        let obj = mk${className}();

        if (result.rows.length == 1) {
            let row = result.rows[0];
            
            Object.keys(row).forEach(key => {
                obj[toCamelCase(key)] = row[key];
            });
        }

        return obj;
    });
    
    register(async function select${className}(dbc, where, order) {
        let objs = [];
        let whereClause = '';
        let orderClause = '';
        let types = dbc.types();
        
        if (where) {
            if (typeof where == 'object') {
                let wheres = Object.keys(where)
                .filter(key => key in schemaTable.columnMap)
                .map(key => {
                    let driverType = types[schemaTable.columnMap[key].type.name()];
                    return "_" + toSnakeCase(key) + "=" + driverType.encode(where[key]);
                });
             
                if (wheres.length) {
                    whereClause = " WHERE " + wheres.join(',');
                }
            }
            else {
                whereClause = " WHERE " + where;
            }
        }
        
        if (order) {
            let orders = Object.keys(order)
            .filter(key => key in schemaTable.columnMap)
            .map(key => {
                let driverType = types[schemaTable.columnMap[key].type.name()];
                return "_" + toSnakeCase(key) + " " + order[key].toUpperCase();
            });
         
            if (orders.length) {
                orderClause = " ORDER BY " + orders.join(',');
            }
        }
        
        let sql = "SELECT ${columns.join(',')} FROM ${table}" + whereClause + orderClause;
        let result = await dbc.query(sql);
        
        result.rows.forEach(row => {
            let obj = mk${className}();
            objs.push(obj);
         
            Object.keys(row).forEach(key => {
                obj[toCamelCase(key)] = row[key];
            });
        });

        return objs;
    });
    
    register(async function update${className}(dbc, where, properties) {
        let whereClause = '';
        let types = dbc.types();
        
        if (where) {
            if (typeof where == 'object') {
                let wheres = Object.keys(where)
                .filter(key => key in schemaTable.columnMap)
                .map(key => {
                    let driverType = types[schemaTable.columnMap[key].type.name()];
                    return "_" + toSnakeCase(key) + "=" + driverType.encode(where[key]);
                });
             
                if (wheres.length) {
                    whereClause = " WHERE " + wheres.join(',');
                }
            }
            else {
                whereClause = " WHERE " + where;
            }
        }
        
        if (!properties || typeof properties != 'object') {
            return;
        }
        
        let sets = Object.keys(properties)
        .filter(key => key in schemaTable.columnMap)
        .map(key => {
            let columnName = "_" + toSnakeCase(key);
            let driverType = types[schemaTable.columnMap[key].type.name()];
            return columnName + "=" + driverType.encode(properties[key]);
        }).join(',');
        
        let sql = "UPDATE ${table} SET " + sets + whereClause;
        await dbc.query(sql);
    });
}`;

    eval(code);
});
