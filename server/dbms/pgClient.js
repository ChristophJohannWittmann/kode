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
 * Each native DBMS client must implement an entry in its own types object to
 * to help generate SQL that's specific to that DBMS application.  pgTypes
 * implements both encode() and type().  type() returns the PostgreSQL type
 * used for the column of the specified dbType.  For instance, a dbBin type
 * is implemented on PostgreSQL as a bytea.  encode() takes a value and creates
 * the SQL representation for that javascript value.
*****/
const pgTypes = {
    dbBin: {
        type: () => 'bytea',
        fmwk: () => global.dbBin,
        encode: value => `E'\\x${value.toString('hex')}'`,
    },

    dbBool: {
        type: () => 'bool',
        fmwk: () => global.dbBool,
        encode: value => value === true ? 'true' : 'false',
    },

    dbFloat32: {
        type: () => 'float4',
        fmwk: () => global.dbFloat32,
        encode: value => value.toString(),
    },

    dbFloat64: {
        type: () => 'float8',
        fmwk: () => global.dbFloat64,
        encode: value => value.toString(),
    },

    dbInt16: {
        type: () => 'int2',
        fmwk: () => global.dbInt16,
        encode: value => value.toString(),
    },

    dbInt32: {
        type: () => 'int4',
        fmwk: () => global.dbInt32,
        encode: value => value.toString(),
    },

    dbInt64: {
        type: () => 'int8',
        fmwk: () => global.dbInt64,
        encode: value => value.toString(),
    },

    dbJson: {
        type: () => 'json',
        fmwk: () => dbJson,
        encode: value => `'${escDbms(toJson(value))}'`,
    },

    dbKey: {
        type: () => 'bigserial primary key',
        fmwk: () => global.dbKey,
        encode: value => value.toString(),
    },

    dbText: {
        type: () => 'varchar',
        fmwk: () => global.dbText,
        encode: value => `'${escDbms(value)}'`,
    },

    dbTime: {
        type: () => 'timestamp',
        fmwk: () => global.dbTime,
        encode: value => `'${value.jsDate.toISOString()}'`,
    },
  
    dbBinArray: {
        type: () => '_bytea',
        fmwk: () => global.dbBinArray,
        encode: array => `ARRAY[E:'\\x${array.map(el => el.toString("hex")).join("',E:'\\x")}']::bytea[]`,
    },
  
    dbBoolArray: {
        type: () => '_bool',
        fmwk: () => global.dbBoolArray,
        encode: array => `ARRAY[${array.map(el => el ? "true" : "false").join(",")}]::bool[]`,
    },
  
    dbFloat32Array: {
        type: () => '_float4',
        fmwk: () => global.dbFloat32Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::float4[]`,
    },
  
    dbFloat64Array: {
        type: () => '_float8',
        fmwk: () => global.dbFloat64Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::float4[]`,
    },
  
    dbInt16Array: {
        type: () => '_int2',
        fmwk: () => global.dbInt16Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int2[]`,
    },
  
    dbInt32Array: {
        type: () => '_int4',
        fmwk: () => global.dbInt32Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int4[]`,
    },
  
    dbInt64Array: {
        type: () => '_int8',
        fmwk: () => global.dbInt64Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int8[]`,
    },
  
    dbJsonArray: {
        type: () => '_json',
        fmwk: () => global.dbJsonArray,
        encode: array => `ARRAY['${array.map(el => escDbms(JSON.stringify(el))).join("','")}']::json[]`,
    },
  
    dbTextArray: {
        type: () => '_varchar',
        fmwk: () => global.dbTextArray,
        encode: array => `ARRAY['${array.map(el => escDbms(toJson(el))).join("','")}']::varchar[]`,
    },
  
    dbTimeArray: {
        type: () => '_timestamp',
        fmwk: () => global.dbTimeArray,
        encode: array => `ARRAY['${array.map(el => el.jsDate.toISOString()).join("','")}']::timestamp[]`,
    },
};


/*****
 * When reading the DBMS schema in a raw manner, we need to determine the
 * virtual framework-based type we're referring to.  Since not all mappings are
 * always one-to-one, we have a function that will use additional logic to
 * return both framework DBMS type for the column.
*****/
const pgReverseMap = {
    bytea:      pgTypes.dbBin,
    bool:       pgTypes.dbBool,
    float4:     pgTypes.dbFloat32,
    float8:     pgTypes.dbFloat64,
    int2:       pgTypes.dbInt16,
    int4:       pgTypes.dbInt32,
    int8:       pgTypes.dbInt64,
    json:       pgTypes.dbJson,
    varchar:    pgTypes.dbText,
    timestamp:  pgTypes.dbTime,
    _bytea:     pgTypes.dbBinArray,
    _bool:      pgTypes.dbBoolArray,
    _float4:    pgTypes.dbFloat32Array,
    _float8:    pgTypes.dbFloat64Array,
    _int2:      pgTypes.dbInt16Array,
    _int4:      pgTypes.dbInt32Array,
    _int8:      pgTypes.dbInt64Array,
    _json:      pgTypes.dbJsonArray,
    _varchar:   pgTypes.dbTextArray,
    _timestamp: pgTypes.dbTimeArray,
};


/*****
 * Each DBMS client supported by this framework must be able to load a complete
 * schema definition in the standard form.  The standard form means it matches
 * the schema that's built with the original schema definition.  The primary need
 * for this class is to be able to compare the definition of a schema with what's
 * implemented on the server. The output of such a comparison is used for applying
 * modifications to the implemented schema on the server.
*****/
class PgSchema {
    constructor(pg) {
        this.pg = pg;
        this.tableDefs = [];
    }

    async load() {
        let result = await this.pg.query(`SELECT table_name FROM information_schema.TABLES WHERE table_schema='public' AND table_catalog='${dbName}'`);
        
        for (let table of result.rows) {
            await this.tableDef(table.table_name);
        }

        return this.tableDefs;
    }
    
    async tableDef(tableName) {
        let tableDef = {
            name: toCamelCase(tableName),
            columns: [],
            indexes: []
        };
        
        let result = await this.pg.query(`SELECT table_catalog, table_name, column_name, ordinal_position, udt_name FROM information_schema.COLUMNS WHERE table_catalog='${this.dbName}' AND table_name='${tableName}' ORDER BY ordinal_position`);
        
        for (let column of result.rows) {
            let columnName = toCamelCase(column.column_name);
            
            if (columnName == 'oid') {
                var fmwkType = global.dbKey;
                tableDef.columns.push({ name: columnName, type: fmwkType });
            }
            else {
                var fmwkType = this.pgReverseMap[column.udt_name].fmwk();
                
                if (fmwkType.name() == 'dbText') {
                    tableDef.columns.push({ name: columnName, type: fmwkType, size: -1 });
                }
                else {
                    tableDef.columns.push({ name: columnName, type: fmwkType });
                }
            }
        }
        
        result = await this.pg.query(`SELECT X.indexname, I.indnatts, I.indisunique, I.indisprimary, I.indkey, I.indoption FROM pg_indexes AS X JOIN pg_class AS C ON C.relname=X.indexname JOIN pg_index AS I ON I.indexrelid=C.oid WHERE X.tablename='${tableName}'`);
        
        for (let row of result.rows) {
            let index = [];
            
            for (let i = 0; i < row.indkey.length; i++) {
                let columnIndex = row.indkey[i] - 1;
                index.push(`${tableDef.columns[columnIndex].name} ${row.indoption[i] ? 'DESC' : 'ASC'}`);
            }
            
            tableDef.indexes.push(index);
        }
        
        this.tableDefs.push(tableDef);
    }
}


/*****
 * Each DBMS client supported by this framework must be able to return a new DB
 * admin object, which is used for performing DBA tasks for the application
 * server.  Features inclucde database management, column management, index
 * management, and database reflection.
*****
class PgAdmin {
    constructor(pg) {
        this.pg = pg;
    }
 
    async createColumn(tableName, columnName, dbType) {
        let table = `_${toSnakeCase(tableName)}`;
        let column = `_${toSnakeCase(columnName)}`;
        let pgType = pgTypes[dbType.name()];
        let value = pgType.encode(dbType.init());
 
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
 
        await dbc.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${pgType.type()}`);
        await dbc.query(`UPDATE ${table} SET ${column}=${value}`);
 
        await dbc.commit();
        await dbc.free();
    }

    async createIndex(tableName, indexColumns) {
        let table = `_${toSnakeCase(tableName)}`;
 
        let columns = indexColumns.map(indexColumn => {
            return `_${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
        }).join(', ');
 
        let name = table + indexColumns.map(indexColumn => {
            return `_${toSnakeCase(indexColumn.columnName)}`;
        }).join('');
 
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
        await dbc.query(`CREATE INDEX ${name} on ${table} (${columns})`);
        await dbc.commit();
        await dbc.free();
    }

    async dropColumn(tableName, columnName) {
        let table = `_${toSnakeCase(tableName)}`;
        let column = `_${toSnakeCase(columnName)}`;
        let sql = `ALTER TABLE ${table} DROP COLUMN ${column}`;
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
        await dbc.query(sql);
        await dbc.commit();
        await dbc.free();
    }

    async dropIndex(indexName) {
        let sql = `DROP INDEX _${toSnakeCase(indexName)}`;
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
        await dbc.query(sql);
        await dbc.commit();
        await dbc.free();
    }
}
*/


/*****
 * The PgClient class wraps the PG addon with a full set of the required
 * functions for a native DBMS client.  All of the methods are pretty much
 * just there to call the native addon class.  In some cases, like commit(),
 * rollback(), and startTransaction(), those functions just call the native
 * query() function.
*****/
class PgClient {
    //static PG = require('pg');

    constructor(settings) {
        this.dbConn = null;
        this.settings = settings;
        this.settings.binaryMode = false;
        this.settings.port ? true : this.settings.port = 5433;
        this.settings.database ? true : this.settings.database = 'postgres';
        this.settings.switches.has('dba') ? this.settings.database = 'postgres' : false;
    }

    async cancel() {
        await this.dbConn.cancel();
    }

    async close() {
        await this.dbConn.close();
    }
    
    async connect() {
        this.dbConn = await PgClient.connect(this.settings);
        console.log(dbConn);
    }

    async createDatabase(dbName) {
        await this.query(`CREATE DATABASE ${toSnakeCase(dbName)}`);
    }

    async createTable(tableDef) {
        let columns = tableDef.columnArray.map(columnDef => {
            let name = `_${toSnakeCase(columnDef.name)}`;
            let type = pgTypes[columnDef.type.name()].type();
            return `${name} ${type}`;
        }).join(', ');
 
        await this.query(`CREATE TABLE _${toSnakeCase(tableDef.name)} (${columns});`);
 
        for (let indexDef of tableDef.indexArray) {
            let indexColumns = indexDef.columnArray.map(indexColumn => {
                return `_${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
            }).join(', ');
 
            await this.query(`CREATE INDEX _${toSnakeCase(indexDef.name)} on _${toSnakeCase(tableDef.name)} (${indexColumns});`);
        }
    }

    async dropDatabase(dbName) {
        await this.query(`DROP DATABASE ${toSnakeCase(dbName)}`);
    }

    async dropTable(tableName) {
        await this.query(`DROP TABLE _${toSnakeCase(tableName)}`);
    }

    async existsDatabase(dbName) {
        let result = await this.query(`SELECT datname FROM pg_database`);
        let set = mkSet(result.rows.map(row => row.datname));
        return set.has(dbName);
    }
 
    async listDatabases() {
        let result = await this.query(`SELECT datname FROM pg_database WHERE datname not in ('postgres', 'template0', 'template1')`);
        return mkSet(result.rows.map(row => row.datname));
    }
    
    async loadSchema(schema) {
        let pgSchema = new PgSchema(this);
        await pgSchema.load();
        return pgSchema;
    }
    
    async query(sql, opts) {
        if (opts && opts.returnOid) {
            let result = await this.dbConn.query(sql + " RETURNING _oid");
            result.oid = result.rows[0]._oid;
            return result;
        }
        else {
            return await this.dbConn.query(sql);
        }
    }
    
    types() {
        return pgTypes;
    }
}


/*****
 * Once the client classes have been compiled and are available in the
 * lexical scopre, this code will register the PostgreSQL client with the
 * DbClient module.
*****/
registerDbClient('postgres', PgClient);
