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
 * An independent class that encapsulates the initialization of the database
 * connection settings based on one of the provided arguments.  DbSettings
 * object instances are required in order connect to and manage a database.
*****/
register(class DbSettings {
    constructor(arg) {
        if (!arg) {
            this.config = Config.databases['@'];
        }
        else if (typeof arg == 'string') {
            if (arg.startsWith('@') && arg in Config.databases) {
                this.config = Config.databases[arg];
            }
            else {
                throw new Error(`Couldn't find database: "${arg}"`);
            }
        }
        else if (arg instanceof DbSettings) {
            return arg;
        }
        else if (typeof arg == 'object') {
            this.config = arg;
        }
        else {
            throw new Error(`Invalid database settings parameter: "${arg}"`);
        }

        this.dbms = this.config.dbms;
        this.host = this.config.host ? this.config.host : 'localhost';
        this.port = this.config.port ? this.config.port : 0;
        this.user = this.config.user ? this.config.user : '';
        this.password = this.config.password ? this.config.password : '';
        this.database = this.config.database ? this.config.database : '';
        this.privateKey = this.config.privateKey ? this.config.privateKey : '';
        this.privateKeyPath = this.config.privateKeyPath ? this.config.privateKeyPath : '';
    }
});


/*****
 * A DbClient is a shell or wrapper for one of the DBMS-specific DBMS clients.
 * MSSQL and PostgreSQL are examples of specific clients.  Each specific client
 * has its own wrapper or API layer to ensure they all behave identially.  In
 * this architecture, any DBMS can be used in any instances as required.  The
 * exact DBMS product is managed by configuration settings.  Note that this
 * class also implements code for managing connects as a pool to ensure server
 * performance.  Note that there is a separate pool for each DBMS instance.
*****/
register(class DbClient {
    static pools = {};
    static clients = {};
    static max = 50;
    static idle = 30000;
    static poolKey = Symbol('#Pool');

    constructor(ctor, settings) {
        this.settings = settings;
        this.client = new ctor(settings);
        this.trans = false;
    }

    async close() {
        await this.client.close();
    }
    
    async commit() {
        if (this.trans) {
            this.trans = false;
            await this.query('COMMIT');
        }
    }
    
    async connect() {
        await this.client.connect();
    }

    dbClass() {
        return this.client.dbClass();
    }
    
    async free() {
        if (this.trans) {
            this.trans = false;
            await this.query('ROLLBACK');
        }
    }
    
    async query(sql, oidFlag) {
        return await this.client.query(sql, oidFlag);
    }
    
    async rollback() {
        if (this.trans) {
            this.trans = false;
            await this.query('ROLLBACK');
        }
    }
    
    async startTransaction() {
        if (!this.trans) {
            this.trans = true;
            await this.query('START TRANSACTION');
        }
    }

    str(type, value) {
        return this.client.str(type, value);
    }
});


/*****
 * These are the globally available DBMS functions used for connecting and
 * administering a database management system.  The most commonly, pgConnect,
 * returns an open DBMS connection.  The other functions provide DBA features
 * that are generally DBMS specific.  Hence, they are encapsulated within the
 * code the DBMS-specific client.
*****/
register(async function dbConnect(arg) {
    const settings = mkDbSettings(arg);
    const poolKey = `${settings.dbms}_${settings.host}_${settings.database}`;
    
    if (!(poolKey in DbClient.pools)) {
        let pool = mkPool(
            async () => {
                let dbc = mkDbClient(DbClient.clients[settings.dbms], settings);
                await dbc.connect();
                return dbc;
            },
            DbClient.max,
            DbClient.idle
        );

        DbClient.pools[poolKey] = pool;
    }

    let dbc = await DbClient.pools[poolKey].alloc();
    dbc[DbClient.poolKey] = poolKey;
    return dbc;
});

register(async function dbCreate(arg) {
    let settings = mkDbSettings(arg); 
    await DbClient.clients[settings.dbms].dbCreate(settings, settings.database);
});

register(async function dbDrop(arg) {
    let settings = mkDbSettings(arg); 
    await DbClient.clients[settings.dbms].dbDrop(settings, settings.database);
});

register(async function dbList(arg) {
    let settings = mkDbSettings(arg); 
    return DbClient.clients[settings.dbms].dbList(settings);
});

register(async function dbSchema(arg) {
    let settings = mkDbSettings(arg);
    let tableDefs = await DbClient.clients[settings.dbms].dbSchema(settings);
    return mkDbSchema('', false, ...tableDefs);
});

register(function dbSized(arg) {
    let settings = mkDbSettings(arg); 
    return DbClient.clients[settings.dbms].dbSized();
});

register(function dbTypes(arg) {
    let settings = mkDbSettings(arg);
    return DbClient.clients[settings.dbms].dbTypes();
});


/*****
 * Registers the specified DBMS client software with this module. Note, this
 * function should be called exactly once for each supported DBMS client
 * application.
*****/
register(async function registerDbClient(name, client) {
    DbClient.clients[name] = client;
});
