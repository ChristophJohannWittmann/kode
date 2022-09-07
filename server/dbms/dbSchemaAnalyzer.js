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
*****/
register(class DbDbmsDiff {
    constructor(config, missing) {
        this.type = 'dbms';
        this.config = config;
        this.missing = missing;
    }
    
    async downgrade() {
        if (!this.missing) {
        }
    }
    
    async upgrade() {
        if (this.missing) {
        }
    }
    
    toString() {
        return `type: ${this.type}  dbName: ${this.config.database}  state: ${this.missing ? 'missing' : 'extra'}`;
    }
});


/*****
*****/
register(class DbTableDiff {
    constructor(config, schemaTable, missing) {
        this.type = 'table';
        this.config = config;
        this.schemaTable = schemaTable;
        this.missing = missing;
    }
    
    async downgrade() {
        if (!this.missing) {
        }
    }
    
    async upgrade() {
        if (this.missing) {
        }
    }
    
    toString() {
        return `type: ${this.type}  dbName: ${this.config.database}  table: ${this.schemaTable.name}  state: ${this.missing ? 'missing' : 'extra'}`;
    }
});


/*****
*****/
register(class DbColumnDiff {
    constructor(config, schemaColumn, missing) {
        this.type = 'column';
        this.config = config;
        this.schemaColumn = schemaColumn;
        this.missing = missing;
    }
    
    async downgrade() {
        if (!this.missing) {
        }
    }
    
    async upgrade() {
        if (this.missing) {
        }
    }
    
    toString() {
        return `type: ${this.type}  dbName: ${this.config.database}  table: ${this.schemaColumn.table.name}  column: ${this.schemaColumn.name}  state: ${this.missing ? 'missing' : 'extra'}`;
    }
});


/*****
*****/
register(class DbIndexDiff {
    constructor(config, schemaIndex, missing) {
        this.type = 'index';
        this.config = config;
        this.schemaIndex = schemaIndex;
        this.missing = missing;
    }
    
    async downgrade() {
        if (!this.missing) {
        }
    }
    
    async upgrade() {
        if (this.missing) {
        }
    }
    
    toString() {
        return `type: ${this.type}  dbName: ${this.config.database}  table: ${this.schemaIndex.table.name}  index: ${this.schemaIndex.name}  state: ${this.missing ? 'missing' : 'extra'}`;
    }
});


/*****
*****/
register(class DbSchemaAnalysis {
    constructor(opts) {
        return new Promise(async (ok, fail) => {
            this.meta = opts.meta;
            this.real = opts.real;
            this._diffs = [];
            //await this.analyzeSchemas();
            //console.log($toJson(this, true));
            ok(this);
        });
    }
  
    async analyzeSchemas() {
        for (let database of Object.values(this._databases)) {
            console.log(database);
        }
    }
  
    async analyzeTable() {
    }
  
    analyzeColumns()  {
    }
  
    analyzeIndexes() {
    }
  
    diffs() {
        return this._diffs;
    }
});


/*****
*****/
register(class DbDbAnalysis {
    constructor() {
        return new Promise(async (ok, fail) => {
            /*
            this._hosts = {};
            this._databases = {};

            for (let settings of Cls$DbClient.settingsArray()) {
                let database;
                let hostKey = `${settings.hostname}-${settings.client}`;
                let databaseKey = `${settings.hostname}-${settings.client}-${settings.dbname}`;

                if (databaseKey in this._databases) {
                    throw new Error(`Duplicate database configures: ${databaseKey}`);
                }
                else {
                    database = { key: databaseKey, hostKey: hostKey, exists: false, settings: settings };
                    this._databases[databaseKey] = database;
                }
      
                if (hostKey in this._hosts) {
                    this._hosts[hostKey].databases.set(databaseKey);
                }
                else {
                    this._hosts[hostKey] = {
                        key: hostKey,
                        hostname: settings.hostname,
                        settings: settings,
                        databases: $Set(databaseKey),
                    };
                }
            }
      
            for (let host of Object.values(this._hosts)) {
                let client = Cls$DbClient.client(host.settings);
                let reflected = await client.helper.dbNames(host.settings);
                let databaseMap = {};
      
                for (let databaseKey of host.databases.list()) {
                    let database = this._databases[databaseKey];
                    databaseMap[database.dbname] = database;
      
                    if (!(database.dbname in reflected)) {
                        this._diffs.push($DbDiff('missing', database.settings.dbname, database.settings));
                    }
                    else {
                        database.exists = true;
                    }
                }
      
                for (let dbName of reflected.list()) {
                    if (!(dbName in databaseMap)) {
                        this._diffs.push($DbDiff('extra', dbName, host.settings));
                    }
                }
            }
            */
            
            ok(this);
        });
    }
});
/*
class PgAdmin {
    constructor(settings) {
        this.settings = settings;
        this.database = settings.database;
    }
 
    async create() {
        this.settings.database = 'postgres';
        let dbc = await dbConnect(this.settings, 'notran');
        await dbc.query(`CREATE DATABASE ${this.database}`);
        await dbc.free();
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
 
    async createTable(schemaTable) {
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
 
        let columns = schemaTable.columnArray.map(schemaColumn => {
            let name = `_${toSnakeCase(schemaColumn.name)}`;
            let type = pgTypes[schemaColumn.type.name()].type();
            return `${name} ${type}`;
        }).join(', ');
 
        await dbc.query(`CREATE TABLE _${schemaTable.name} (${columns});`);
 
        for (let schemaIndex of schemaTable.indexArray) {
            let indexColumns = schemaIndex.columnArray.map(indexColumn => {
                return `_${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
            }).join(', ');
 
            await dbc.query(`CREATE INDEX _${toSnakeCase(schemaIndex.name)} on _${schemaTable.name} (${indexColumns})`);
        }
 
        await dbc.commit();
        await dbc.free();
    }
 
    async drop() {
        this.settings.database = 'postgres';
        let dbc = await dbConnect(this.settings, 'notran');
        await dbc.query(`DROP DATABASE ${this.database}`);
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
 
    async dropTable(tableName) {
        let sql = `DROP TABLE _${toSnakeCase(tableName)}`;
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
        await dbc.query(sql);
        await dbc.commit();
        await dbc.free();
    }
 
    async exists() {
        this.settings.database = 'postgres';
        let dbc = await dbConnect(this.settings);
        let result = await dbc.query(`SELECT datname FROM pg_database WHERE datname not in ('postgres', 'template0', 'template1')`);
        await dbc.rollback();
        await dbc.free();
        return mkSet(result.rows.map(row => row.datname)).has(this.database);
    }
 
    async listDatabases() {
        this.settings.database = 'postgres';
        let dbc = await dbConnect(this.settings);
        let result = await dbc.query(`SELECT datname FROM pg_database WHERE datname not in ('postgres', 'template0', 'template1')`);
        await dbc.rollback();
        await dbc.free();
        return mkSet(result.rows.map(row => row.datname));
    }
 
    async loadSchemaDef() {
        this.settings.database = this.database;
        let dbc = await dbConnect(this.settings);
        let schema = await (new PgSchemaDef(dbc, this.database));
        await dbc.rollback();
        await dbc.free();
        return schema;
    }
}
*/
