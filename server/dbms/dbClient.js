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
class DbClient {
    static pools = {};
    static clients = {};
    static idle = 30000;

    constructor(ctor, settings) {
        this.ctor = ctor;
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
    
    async free() {
        if (this.trans) {
            this.trans = false;
            await this.query('COMMIT');
        }

        Pool.free(this);
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

    sized() {
        return this.client.sized();
    }
    
    types() {
        return this.client.types();
    }
}


/*****
*****/
register(async function dbConnect(config) {
    if (typeof config == 'string') {
        this.config = Config.databases[config];
    }
    else if (typeof config == 'object') {
        this.config = config;
    }
    else {
        throw new Error(`Invalid DBMS configurtion: ${config}`);
    }

    let settings = {
        dbms: this.config.dbms,
        host: this.config.host ? this.config.host : 'localhost',
        port: this.config.port ? this.config.port : 0,
        user: this.config.user ? this.config.user : '',
        password: this.config.password ? this.config.password : '',
        database: this.config.database ? this.config.database : '',
        privateKey: this.config.privateKey ? this.config.privateKey : '',
        privateKeyPath: this.config.privateKeyPath ? this.config.privateKeyPath : '',
    };

    /*
    const database = settings.switches.has('dba') ? 'DBA' : settings.database; 
    const poolKey = `${settings.dbms}_${settings.host}_${database}`;
    
    if (!(poolKey in pools)) {
        pools[poolKey] = mkPool(settings => new DbClient(clients[this.config.dbms], settings), idle);
    }
    
    if (switchSet.has('notran') || switchSet.has('dba')) {
        let dbClient = await pools[poolKey].create(settings);
        await dbClient.connect();
        return dbClient;
    }
    else {
        let dbClient = await pools[poolKey].alloc(settings);
        await dbClient.connect();
        await dbClient.startTransaction();
        return dbClient;
    }
    */
    
    let dbClient = new DbClient(DbClient.clients[this.config.dbms], settings);
    await dbClient.connect();
    return dbClient;
});

register(async function dbCreate(settings, dbName) {
    await DbClient.clients[settings.dbms].dbCreate(settings, dbName);
});

register(async function dbDrop(settings, dbName) {
    await DbClient.clients[settings.dbms].dbDrop(settings, dbName);
});

register(async function dbList(settings) {
    return DbClient.clients[settings.dbms].dbList(settings);
});

register(async function dbSchema(settings) {
    let tableDefs = await DbClient.clients[settings.dbms].dbSchema(settings);
    return mkDbSchema('', false, ...tableDefs);
});


/*****
 * Registers the specified DBMS client software with this module. Note, this
 * function should be called exactly once for each supported DBMS client
 * application.
*****/
register(async function registerDbClient(name, client) {
    DbClient.clients[name] = client;
});
