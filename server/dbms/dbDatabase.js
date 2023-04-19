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


/*****
 * This is the database or db manager.  A db is defined as a collection of
 * non-conflicting schemas, which means that a db is a collection of schemas,
 * in which there is NO overlap in the names of tables contain within the
 * schemas.  As a result of this definition, a db is a collection of schemas
 * with mutually exclusive table names.
*****/
register(class DbDatabase {
    static databases = {};

    constructor(dbName, dbSettings) {
        if (!dbName.startsWith('@')) {
            throw new Error(`Database name must start with "@": ${dbName}`);
        }

        if (dbName in DbDatabase.databases) {
            return DbDatabase.databases[dbName];
        }

        this.name = dbName;
        this.schemaMap = {};
        this.schemaArray = [];
        this.tableNames = mkStringSet();
        this.settings = dbSettings;
        DbDatabase.databases[this.name] = this;

        for (let schemaName of dbSettings.schemas) {
            if (schemaName in this.schemaMap) {
                throw new Error(`Duplicate schema "${schemaName}" for database "${this.name}".`);
            }
            else if (!(schemaName in DbSchema.schemas)) {
                throw new Error(`Undefined schema "${schemaName}" for database "${this.name}".`);                
            }
            else {
                let schema = DbSchema.schemas[schemaName];
                this.schemaArray.push(schema);
                this.schemaMap[schemaName] = schema;
            }
        }
    }

    static deleteDatabase(name) {
        delete DbDatabase.databases[name];
    }

    deleteSchema(schemaName) {
        if (schemaName in this.schemaMap) {
            delete this.schemaMap[schemaName];
        }

        return this;
    }

    static hasDatabase(databaseName) {
        return databbaseName in DbDatabase.databases;
    }

    hasSchema(schemaName) {
        return schemaName in this.schemaMap;
    }

    static getDatabase(dbName) {
        return DbDatabase.databases[dbName];
    }

    getSchema(schemaName) {
        return this.schemaMap[schemaName];
    }

    static getSettings(dbName) {
        if (dbName in DbDatabase.databases) {
            return DbDatabase.databases[dbName].settings;
        }
    }

    static hasDatabase(dbName) {
        return dbName in DbDatabase.databases;
    }

    setSchema(schemaName) {
        if (!(schemaName in this.schemaMap)) {
            if (!(schemaName in DbSchema.schemas)) {
                throw new Error(`Schema not found: ${schemaName}`);
            }
            else {
                let schema = DbSchema.schemas[schemaName];
                this.schemaArray.push(schema);
                this.schemaMap[schemaName] = schema;
            }
        }

        return this;
    }

    [Symbol.iterator]() {
        let tables = [];

        for (let schema of this.schemaArray) {
            for (let table of schema) {
                tables.push(table);
            }
        }

        return tables[Symbol.iterator]();
    }

    static [Symbol.iterator]() {
        return Object.values(DbDatabase.databases)[Symbol.iterator]();
    }

    async upgrade() {
        let tableMap = {};

        for (let table of this) {
            tableMap[table.name] = table;
        }

        for (let diff of (await mkDbSchemaAnalyzer(this.name, tableMap)).diffs) {
            if (diff.isUpgrade) {
                logPrimary(`    UPGRADING ${diff.toString()}`);
                await diff.upgrade();
            }
        }
    }
});
