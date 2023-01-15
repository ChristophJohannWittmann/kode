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


/**
 * Here's a little kludge or adjustment to the underlying PG module.  When the
 * PG, and new Date() as well, are used to convert the timezoneless timestamp
 * from the PG server to a js timesstamp, js automatically shifts the timezeone
 * to UTC, from a value that's already in UTC. Hence, we have a problem.  The
 * solution is to mark each time with +0000 to indicate that it's already in
 * UTC and thus shouldn't be converted.  XXX
 */
const parser1114 = npmPG.types.getTypeParser(1114);

npmPG.types.setTypeParser(1114, function(dateText) {
    return parser1114(`${dateText}+0000`);
});


/*****
 * Need to escape a value such that it can be saved in the database as a string
 * value.  Generally, we know the DBMS standard escape sequences.  Since we're
 * being careful about DBMS-specific approaches, each DBMS module will need to
 * do its own escaping.
*****/
function escape(raw) {
    let escaped = raw.replace(/'/g, "''");
    return escaped;
}


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
        decode: value => mkBinary(value),
    },

    dbBool: {
        type: () => 'bool',
        fmwk: () => global.dbBool,
        encode: value => value === true ? 'true' : 'false',
        decode: value => value,
    },

    dbFloat32: {
        type: () => 'float4',
        fmwk: () => global.dbFloat32,
        encode: value => value.toString(),
        decode: value => value,
    },

    dbFloat64: {
        type: () => 'float8',
        fmwk: () => global.dbFloat64,
        encode: value => value.toString(),
        decode: value => value,
    },

    dbInt16: {
        type: () => 'int2',
        fmwk: () => global.dbInt16,
        encode: value => value.toString(),
        decode: value => value,
    },

    dbInt32: {
        type: () => 'int4',
        fmwk: () => global.dbInt32,
        encode: value => value.toString(),
        decode: value => value,
    },

    dbInt64: {
        type: () => 'int8',
        fmwk: () => global.dbInt64,
        encode: value => value.toString(),
        decode: value => BigInt(value),
    },

    dbJson: {
        type: () => 'json',
        fmwk: () => dbJson,
        encode: value => `'${escape(toJson(value))}'`,
        decode: value => value,
    },

    dbKey: {
        type: () => 'bigserial primary key',
        fmwk: () => global.dbKey,
        encode: value => value.toString(),
        decode: value => BigInt(value),
    },

    dbText: {
        type: () => 'varchar',
        fmwk: () => global.dbText,
        encode: value => `'${escape(value)}'`,
        decode: value => value,
    },

    dbTime: {
        type: () => 'timestamp',
        fmwk: () => global.dbTime,
        encode: value => `'${value.toISOString()}'`,
        decode: value => mkTime(value),
    },
  
    dbBinArray: {
        type: () => '_bytea',
        fmwk: () => global.dbBinArray,
        encode: array => `ARRAY[E:'\\x${array.map(el => el.toString("hex")).join("',E:'\\x")}']::bytea[]`,
        decode: array => array.map(el => mkBinary(el)),
    },
  
    dbBoolArray: {
        type: () => '_bool',
        fmwk: () => global.dbBoolArray,
        encode: array => `ARRAY[${array.map(el => el ? "true" : "false").join(",")}]::bool[]`,
        decode: array => array,
    },
  
    dbFloat32Array: {
        type: () => '_float4',
        fmwk: () => global.dbFloat32Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::float4[]`,
        decode: array => array,
    },
  
    dbFloat64Array: {
        type: () => '_float8',
        fmwk: () => global.dbFloat64Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::float4[]`,
        decode: array => array,
    },
  
    dbInt16Array: {
        type: () => '_int2',
        fmwk: () => global.dbInt16Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int2[]`,
        decode: array => array,
    },
  
    dbInt32Array: {
        type: () => '_int4',
        fmwk: () => global.dbInt32Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int4[]`,
        decode: array => array,
    },
  
    dbInt64Array: {
        type: () => '_int8',
        fmwk: () => global.dbInt64Array,
        encode: array => `ARRAY[${array.map(el => el.toString()).join(",")}]::int8[]`,
        decode: array => array.map(el => BigInt(el)),
    },
  
    dbJsonArray: {
        type: () => '_json',
        fmwk: () => global.dbJsonArray,
        encode: array => `ARRAY['${array.map(el => escape(toJson(el))).join("','")}']::json[]`,
        decode: array => array.map(el => el),
    },
  
    dbTextArray: {
        type: () => '_varchar',
        fmwk: () => global.dbTextArray,
        encode: array => `ARRAY['${array.map(el => escape(toJson(el))).join("','")}']::varchar[]`,
        decode: array => array,
    },
  
    dbTimeArray: {
        type: () => '_timestamp',
        fmwk: () => global.dbTimeArray,
        encode: array => `ARRAY['${array.map(el => el.toISOString()).join("','")}']::timestamp[]`,
        decode: array => array.map(el => mkTime(el)),
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
class PgSchemaDef {
    constructor(pg) {
        this.pg = pg;
        this.tableDefs = [];
    }

    async load() {
        let result = await this.pg.query(`SELECT table_name FROM information_schema.TABLES WHERE table_schema='public' AND table_catalog='${this.pg.settings.database}' ORDER BY table_name`);
        
        for (let table of result.data) {
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
        
        let result = await this.pg.query(`SELECT table_catalog, table_name, column_name, ordinal_position, udt_name FROM information_schema.COLUMNS WHERE table_catalog='${this.pg.settings.database}' AND table_name='${tableName}' ORDER BY ordinal_position`);

        for (let column of result.data) {
            let columnName = toCamelCase(column.column_name);
            
            if (columnName == 'oid') {
                var fmwkType = global.dbKey;
                tableDef.columns.push({ name: columnName, type: fmwkType });
            }
            else {
                var fmwkType = pgReverseMap[column.udt_name].fmwk();
                
                if (fmwkType.name() == 'dbText') {
                    tableDef.columns.push({ name: columnName, type: fmwkType, size: -1 });
                }
                else {
                    tableDef.columns.push({ name: columnName, type: fmwkType });
                }
            }
        }

        result = await this.pg.query(`SELECT X.indexname, I.indnatts, I.indisunique, I.indisprimary, I.indkey, I.indoption FROM pg_indexes AS X JOIN pg_class AS C ON C.relname=X.indexname JOIN pg_index AS I ON I.indexrelid=C.oid WHERE X.tablename='${tableName}'`);
        
        for (let row of result.data) {
            if (!row.indexname.endsWith('_pkey')) {
                let index = [];
                let indkey = row.indkey.split(' ').map(el => parseInt(el));
                let indopt = row.indoption.split(' ').map(el => parseInt(el));
                
                for (let i = 0; i < indkey.length; i++) {
                    let columnIndex = indkey[i] - 1;
                    index.push(`${tableDef.columns[columnIndex].name}:${indopt[i] ? 'DESC' : 'ASC'}`);
                }

                tableDef.indexes.push(index.join(','));
            }
        }
        
        this.tableDefs.push(tableDef);
    }
}


/*****
 * The PgClient class wraps the PG addon with a full set of the required
 * functions for a native DBMS client.  All of the methods are pretty much
 * just there to call the native addon class.  In some cases, like commit(),
 * rollback(), and startTransaction(), those functions just call the native
 * query() function.
*****/
class PgClient {
    constructor(settings) {
        this.pg = null;
        this.settings = settings;
        this.settings.port ? true : this.settings.port = 5433;
        this.settings.database ? true : this.settings.database = 'postgres';
    }

    async close() {
        await this.pg.end();
    }
    
    async connect() {
        this.pg = new npmPG.Client(this.settings);
        await this.pg.connect();
    }

    dbClass() {
        return PgClient;
    }
 
    static async dbCreate(settings, dbName) {
        settings = clone(settings);
        settings.database = 'postgres';
        let pg = new PgClient(settings);
        await pg.connect();
        await pg.query(`CREATE DATABASE ${dbName}`);
        await pg.close();
    }
 
    static async dbDrop(settings, dbName) {
        settings = clone(settings);
        settings.database = 'postgres';
        let pg = new PgClient(settings);
        await pg.connect();
        await pg.query(`DROP DATABASE ${dbName}`);
        await pg.close();
    }
 
    static async dbList(settings) {
        settings = clone(settings);
        settings.database = 'postgres';
        let pg = new PgClient(settings);
        await pg.connect();
        let result = await pg.query(`SELECT datname FROM pg_database`);
        await pg.close();
        return mkStringSet(result.data.map(row => row.datname));
    }
    
    static async dbSchema(settings) {
        let pg = new PgClient(settings);
        await pg.connect();
        let pgSchemaDef = new PgSchemaDef(pg);
        await pgSchemaDef.load();
        await pg.close();
        return pgSchemaDef.tableDefs;
    }

    static dbSized() {
        return false;
    }
    
    static dbTypes() {
        return pgTypes;
    }
    
    async query(sql, oidFlag) {
        try {
            if (oidFlag) {
                let pgResult = await this.pg.query(sql + " RETURNING _oid");

                return {
                    code: 'oid',
                    data: BigInt(pgResult.rows[0]._oid),
                };
            }
            else {
                let pgResult = await this.pg.query(sql);

                return {
                    code: 'rows',
                    data: Array.isArray(pgResult.rows) ? pgResult.rows : [],
                };
            }
        }
        catch (e) {
            return { code: 'error', error: e };
        }
    }
}


/*****
 * Once the client classes have been compiled and are available in the
 * lexical scopre, this code will register the PostgreSQL client with the
 * DbClient module.
*****/
registerDbClient('postgres', PgClient);
