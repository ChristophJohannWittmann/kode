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
 * Diffs are objects used for describing a difference that wes discovered between
 * a schema design also called a "meta" and the actualy database schema.  One of
 * the cool features regarding Diffs is that they are self executing.
*****/
class DbDiff {
    constructor(settings, isUpgrade, isDba) {
        this.settings = settings;
        this.isUpgrade = isUpgrade;
        this.isDba = isDba
    }

    async close() {
        if ('dbc' in this) {
            try {
                await this.dbc.close();
                await this.dbc.free();
                delete this.dbc;
            }
            catch (e) {}
        }
    }

    async connect() {
        try {
            if (this.isDba) {
                this.dbc = await dbConnect(this.settings, 'dba');
            }
            else {
                this.dbc = await dbConnect(this.settings, 'notran');                
            }
        }
        catch (e) {
            log(`Error while connecting to database.`, this.settings.database);
        }
    }
    
    async downgrade() {
        try {
            if (!this.isUpgrade) {
                await this.connect();
                await this.downgradeDiff();
                await this.close();
            }
        }
        catch (e) {
            log(`Error while downgrading database schema.`, e);
        }
    }

    type() {
        return Reflect.getPrototypeOf(this).constructor.name;
    }
    
    async upgrade() {
        try {
            if (this.isUpgrade) {
                await this.connect();
                await this.upgradeDiff();
                await this.close();
            }
        }
        catch (e) {
            log(`Error while upgrading database schema.`, e);
        }
    }
}

class DbDatabaseDiff extends DbDiff {
    constructor(settings, isUpgrade) {
        super(settings, isUpgrade, true);
    }
    
    async downgradeDiff() {
        this.dbc.dropDatabase(this.settings.database);
    }
    
    toString() {
        return `type: ${this.type()}  database: ${this.settings.database}  info: ${this.isUpgrade ? 'missing' : 'extra'}`;
    }
    
    async upgradeDiff() {
        this.dbc.createDatabase(this.settings.database);
    }
}

class DbTableDiff extends DbDiff{
    constructor(settings, isUpgrade, tableInfo) {
        super(settings, isUpgrade, false);
        this.tableInfo = tableInfo;
    }
    
    async downgradeDiff() {
        this.dbc.dropTable(this.tableInfo);
    }
    
    toString() {
        let tableName = this.isUpgrade ? this.tableInfo.name : this.tableInfo;
        return `type: ${this.type()}  database: ${this.settings.database}  table:  ${tableName}  info: ${this.isUpgrade ? 'missing' : 'extra'}`;
    }
    
    async upgradeDiff() {
        this.dbc.createTable(this.tableInfo);
    }
}

/*
class DbColumnDiff extends DbDiff{
    constructor(settings, isUpgrade) {
        super(settings, isUpgrade, false);
    }
    
    async downgradeDiff() {
    }
    
    async upgradeDiff() {
    }
}
class DbColumnDiff {
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
}

class DbIndexDiff extends DbDiff{
    constructor(settings, isUpgrade) {
        super(settings, isUpgrade, false);
    }
    
    async downgradeDiff() {
    }
    
    async upgradeDiff() {
    }
}
class DbIndexDiff {
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
}
*/


/*****
*****/
register(class DbSchemaAnalyzer {
    constructor(schema, configDbName, prefix) {
        this.schema = schema;
        this.prefix = prefix;
        this.settings = Config.databases[configDbName];
        this.diffs = [];
        this.message = '';
    }

    async analyze() {
        try {
            let dbc = await dbConnect(this.settings, 'dba');

            if (!(await dbc.existsDatabase(this.settings.database))) {
                this.diffs.push(new DbDatabaseDiff(this.settings, true));

                for (let tableDef of this.schema.tableArray) {
                    this.diffs.push(new DbTableDiff(this.settings, true, tableDef));
                }
            }

            await dbc.close();
            await dbc.free();

            if (!this.diffs.length) {
            }
        }
        catch (e) {
            this.message = e.stack;
        }
    }
});
