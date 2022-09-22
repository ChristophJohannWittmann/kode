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
*****/
class DbDatabaseDiff {
    constructor(settings, isUpgrade) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
    }
    
    async downgrade() {
        if (!this.isUpgrade) {
            await dbDrop(this.settings, this.settings.database);
        }
    }
    
    toString() {
        return `(DATABASE DIFF) DATABASE: "${this.settings.database}" STATUS: "${this.isUpgrade ? 'missing' : 'extra'}"`;
    }
    
    async upgrade() {
        if (this.isUpgrade) {
            await dbCreate(this.settings, this.settings.database);
        }
    }
}

class DbTableDiff {
    constructor(settings, isUpgrade, tableInfo, prefix) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.tableInfo = tableInfo
        this.prefix = prefix;
    }
    
    async downgrade() {
        if (!this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            dbc.query(`DROP TABLE _${this.tableInfo}`);
            await dbc.free();
        }
    }
    
    toString() {
        let prefix = this.prefix ? `[${this.prefix}]` : '';
        let tableName = this.isUpgrade ? this.tableInfo.name : this.tableInfo;
        return `(TABLE DIFF   ) DATABASE: "${this.settings.database}" TABLE: "${prefix}${tableName}" STATUS: "${this.isUpgrade ? 'missing' : 'extra'}"`;
    }
    
    async upgrade() {
        if (this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            const prefix = this.prefix ? `_${this.prefix}_` : '_';

            let columns = this.tableInfo.columnArray.map(columnDef => {
                let name = `${prefix}${toSnakeCase(columnDef.name)}`;
                let type = dbc.types()[columnDef.type.name()].type();
                return `${name} ${type}`;
            }).join(', ');

            await dbc.query(`CREATE TABLE ${prefix}${toSnakeCase(this.tableInfo.name)} (${columns});`);
     
            for (let indexDef of this.tableInfo.indexArray) {
                let indexColumns = indexDef.columnArray.map(indexColumn => {
                    return `${prefix}${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
                }).join(', ');
     
                await dbc.query(`CREATE INDEX ${prefix}${toSnakeCase(indexDef.name)} on ${prefix}${toSnakeCase(this.tableInfo.name)} (${indexColumns});`);
            }

            await dbc.free();
        }
    }
}

class DbColumnDiff {
    constructor(settings, isUpgrade, columnInfo) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.columnInfo = columnInfo;
    }
    
    async downgrade() {
    }
    
    toString() {
    }
    
    async upgrade() {
    }
}

class DbIndexDiff {
    constructor(settings, isUpgrade, indexInfo) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.indexInfo = indexInfo;
    }
    
    async downgrade() {
    }
    
    toString() {
    }
    
    async upgrade() {
    }
}


/*****
*****/
register(class DbSchemaAnalyzer {
    constructor(configName, schemas) {
        return new Promise(async (ok, fail) => {
            this.configName = configName;
            this.schemas = schemas;
            this.settings = Config.databases[this.configName];
            this.diffs = [];

            if (await this.analyzeDb()) {
                if (await this.analyzeTables()) {
                    ok(this);
                }
            }

            ok(this);
        });
    }

    async analyzeDb() {
        if ((await dbList(this.settings)).has(this.settings.database)) {
            return true;
        }
        else {
            this.diffs.push(new DbDatabaseDiff(this.settings, true));

            for (let schemaInfo of this.schemas) {
                let schema = DbSchemaContainer.schemas[schemaInfo.schemaName];

                schemaInfo.prefixes.forEach(prefix => {
                    for (let tableDef of schema.tableArray) {
                        this.diffs.push(new DbTableDiff(this.settings, true, tableDef, prefix));
                    }
                });
            }
            return false;
        }
    }

    async analyzeTables() {
        let schemaDef = await dbSchema(this.settings);
    }
});
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
}
*/
