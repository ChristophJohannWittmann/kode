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
 * DB diffs are classses that describe a difference between a design schema and
 * an actual schema: database, table, column, index.  An upgrade is a change
 * that extends the current schema without affecting current functionality.  A
 * downgrade is a cleanup operate the removes backward compatibility with the
 * intent of cleaning things up.  Downgrades should happen after a period of
 * time to ensure that if a new software version failes, we can still fall back
 * as needed.
*****/
class DbDatabaseDiff {
    constructor(settings, isUpgrade) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.sized = dbSized(this.settings);
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
    constructor(settings, isUpgrade, tableInfo) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.tableInfo = tableInfo
        this.sized = dbSized(this.settings);
    }
    
    async downgrade() {
        if (!this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            dbc.query(`DROP TABLE _${this.tableInfo.name}`);
            await dbc.free();
        }
    }
    
    toString() {
        return `(TABLE DIFF   ) DATABASE: "${this.settings.database}" TABLE: "${this.tableInfo.name}" STATUS: "${this.isUpgrade ? 'missing' : 'extra'}"`;
    }
    
    async upgrade() {
        if (this.isUpgrade) {
            let dbc = await dbConnect(this.settings);

            let columns = this.tableInfo.columnArray.map(columnDef => {
                if (this.sized) {
                    // TODO *** SIZED
                    /*
                    let name = `_${toSnakeCase(columnDef.name)}`;
                    let type = dbTypes(this.settings)[columnDef.type.name()];
                    return `${name} ${type.type()}`;
                    */
                }
                else {
                    let name = `_${toSnakeCase(columnDef.name)}`;
                    let type = dbTypes(this.settings)[columnDef.type.name()];
                    return `${name} ${type.type()}`;
                }
            }).join(', ');

            await dbc.query(`CREATE TABLE _${toSnakeCase(this.tableInfo.name)} (${columns});`);
     
            for (let indexDef of this.tableInfo.indexArray) {
                let indexColumns = indexDef.columnArray.map(indexColumn => {
                    return `_${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
                }).join(', ');

                await dbc.query(`CREATE INDEX _${toSnakeCase(indexDef.name)} on _${toSnakeCase(this.tableInfo.name)} (${indexColumns});`);
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
        this.sized = dbSized(this.settings);
    }
    
    async downgrade() {
        if (!this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            dbc.query(`ALTER TABLE _${toSnakeCase(this.columnInfo.table.name)} DROP COLUMN _${toSnakeCase(this.columnInfo.name)};`);
            await dbc.free();
        }
    }
    
    toString() {
        return `(COLUMN DIFF  ) DATABASE: "${this.settings.database}" TABLE: "${this.columnInfo.table.name}" COLUMN: "${this.columnInfo.name}" STATUS: "${this.isUpgrade ? 'missing' : 'extra'}"`;
    }
    
    async upgrade() {
        if (this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            let type;

            if (this.sized) {
                // TODO *** SIZED
                //type = dbc.types()[this.columnInfo.type.name()].type();
            }
            else {
                type = dbTypes(this.settings)[this.columnInfo.type.name()];
            }

            dbc.query(`ALTER TABLE _${toSnakeCase(this.columnInfo.table.name)} ADD COLUMN _${toSnakeCase(this.columnInfo.name)} ${type.type()};`);
            await dbc.free();
        }
    }
}

class DbIndexDiff {
    constructor(settings, isUpgrade, indexInfo) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.indexInfo = indexInfo;
        this.sized = dbSized(this.settings);
    }
    
    async downgrade() {
        if (!this.isUpgrade) {
            let dbc = await dbConnect(this.settings);
            await dbc.query(`DROP INDEX _${toSnakeCase(this.indexInfo.name)};`);
            await dbc.free();
        }
    }
    
    toString() {
        return `(INDEX DIFF   ) DATABASE: "${this.settings.database}" TABLE: "${this.indexInfo.table.name}" INDEX: "${this.indexInfo.name}" STATUS: "${this.isUpgrade ? 'missing' : 'extra'}"`;
    }
    
    async upgrade() {
        if (this.isUpgrade) {
            let dbc = await dbConnect(this.settings);

            let indexColumns = this.indexInfo.columnArray.map(indexColumn => {
                return `_${toSnakeCase(indexColumn.columnName)} ${indexColumn.direction.toUpperCase()}`;
            }).join(', ');

            await dbc.query(`CREATE INDEX _${toSnakeCase(this.indexInfo.name)} on _${toSnakeCase(this.indexInfo.table.name)} (${indexColumns});`);
            await dbc.free();
        }
    }
}


/*****
 * The DbSchemaAnalyzer performs a deep analysis of a single DBMS database with
 * a map of the design of the tables that are expected to be available on that
 * DBMS server: (1) Check for the existence of the database.  (2) Determine the
 * table diffs.  A diff means that there's either an extra or missing item.  (3)
 * Determine the column diffs for tables that are common to the design and actual
 * schemas.  (4) Determine index diffs for tables that are common to the design
 * and actual schemas.  The generated diffs are self-contained objects can be
 * executed to perform DBMS upgrades or downgrades.
*****/
register(class DbSchemaAnalyzer {
    constructor(dbName, tableMap) {
        return new Promise(async (ok, fail) => {
            this.settings = mkDbSettings(dbName);
            this.database = mkDbDatabase(dbName);
            this.diffs = [];
            this.design = { tableMap: tableMap };
            this.design.tableArray = Object.values(tableMap);

            if (await this.analyzeDb()) {
                await this.analyzeTables();
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

            for (let table of this.database) {
                this.diffs.push(new DbTableDiff(this.settings, true, table));
            }

            return false;
        }
    }

    async analyzeColumns(pair) {
        for (let column of pair.design.columnArray) {
            if (!(column.name in pair.actual.columnMap)) {
                this.diffs.push(new DbColumnDiff(this.settings, true, column));
            }
            else {
                if (column.type.name() != pair.actual.columnMap[column.name].type.name()) {
                    throw new Error(`DBMS column type mismatch: TABLE: "${column.table.name}" COLUMN: "${column.name}"`);
                }
            }
        }

        for (let column of pair.actual.columnArray) {
            if (!(column.name in pair.design.columnMap)) {
                this.diffs.push(new DbColumnDiff(this.settings, false, column));
            }
        }
    }

    async analyzeIndexes(pair) {
        for (let index of pair.design.indexArray) {
            if (!(index.name in pair.actual.indexMap)) {
                this.diffs.push(new DbIndexDiff(this.settings, true, index));                
            }
        }

        for (let index of pair.actual.indexArray) {
            if (!(index.name in pair.design.indexMap)) {
                this.diffs.push(new DbIndexDiff(this.settings, false, index));
            }
        }
    }

    async analyzeTables() {
        this.actual = await dbSchema(this.settings);
        this.intersection = [];

        for (let table of this.design.tableArray) {
            if (table.name in this.actual.tableMap) {
                this.intersection.push({ design: table, actual: this.actual.tableMap[table.name] });
            }
            else {
                this.diffs.push(new DbTableDiff(this.settings, true, table));
            }
        }

        for (let table of this.actual.tableArray) {
            if (!(table.name in this.design.tableMap)) {
                this.diffs.push(new DbTableDiff(this.settings, false, table));
            }
        }

        for (let pair of this.intersection) {
            await this.analyzeColumns(pair);
            await this.analyzeIndexes(pair);
        }
    }
});
