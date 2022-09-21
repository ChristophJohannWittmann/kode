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


{
    /*****
     * Internal variables used for managing the database connections for the
     * process.  Each connection is established with a unique key based on the
     * db client softare, e.g., postgres, sql server, the DBMS hostname, and
     * the database name.  Since connections are very specific, the pools must
     * also be specific.
    *****/
    const pools = {};
    const clients = {};
    const idle = 30000;
    
    
    /*****
     * There is actually just one database client, dbClient, that's used for
     * all database types.  It's a wrapper that provides state-management
     * features.  The dbClient needs to be passed the client class for the
     * specific DBMS server when constructed.  This happens when the DBMS-
     * specific software is required, during which time that software calls the
     * registerDbClient() to register in the clients object.  Hence, the API
     * is exactly the same for all DBMS client software.
    *****/
    class DbClient {
        constructor(client, settings) {
            this.client = new client(settings);
            this.settings = settings;
            this.connected = false;
            this.querying = false;
            this.transaction = false;
        }
        
        async cancel() {
            if (this.connected && this.querying) {
                await this.client.cancel();
            }
        }

        async close() {
            if (this.connected) {
                if (this.querying) {
                    await this.client.cancel();
                }
                
                if (this.transaction) {
                    await this.client.rollback();
                }
             
                await this.client.close();
                this.connected = false;
            }
        }
        
        async commit() {
            if (this.connected && this.transaction) {
                await this.query('COMMIT');
                this.transaction = false;
            }
        }
        
        async connect(settings) {
            if (!this.connected) {
                await this.client.connect();
                this.connected = true;
            }
        }

        async createDatabase(dbName) {
            return await this.client.createDatabase(dbName);
        }

        async createTable(tableDef) {
            return await this.client.createTable(tableDef);
        }

        async dropDatabase(dbName) {
            return await this.client.dropDatabase(dbName);
        }

        async dropTable(tableName) {
            return await this.client.dropTable(tableName);
        }

        async existsDatabase(dbName) {
            if (this.settings.switches.has('dba')) {
                return await this.client.existsDatabase(dbName);
            }
            else {
                return false;
            }
        }
        
        async free() {
            Pool.free(this);
        }

        async listDatabases() {
            if (this.settings.switches.has('dba')) {
                return await this.client.listDatabases();
            }
            else {
                return [];
            }
        }
    
        async loadSchema(schema) {
            return await this.client.loadSchema(schema);
        }
        
        async query(sql, opts) {
            return new Promise(async (ok, fail) => {
                if (this.connected && !this.querying) {
                    this.querying = true;
                    let result = await this.client.query(sql, opts);
                    
                    if (!result.ok) {
                        throw new Error(`Query Error --\nDBMS: "${this.settings.dbms}"\nSQL:  "${sql}"\n`);
                    }
                    
                    this.querying = false;
                    ok(result);
                }
                else {
                    ok({ error: 'DBMS client not connected.' });
                }
            });
        }
        
        async rollback() {
            if (this.connected && this.transaction) {
                await this.query('ROLLBACK');
                this.transaction = false;
            }
        }
        
        async startTransaction() {
            if (this.connected && !this.transaction) {
                await this.query('START TRANSACTION');
                this.transaction = true;
            }
        }
        
        types() {
            return this.client.types();
        }
    }
    
    
    /*****
     * Create a DBMS connection using the configuration settings based on the
     * passed "config" argument.  If the config argument is a string, we'll
     * fetch the configuration data from the loaded configuration.  If an
     * object is passed, that object will be used.  That object must match
     * the layout of the settings in the application configuration JSON.
    *****/
    register(async function dbConnect(config, ...switches) {
        if (typeof config == 'string') {
            this.config = Config.databases[config];
        }
        else if (typeof config == 'object') {
            this.config = config;
        }
        else {
            throw new Error(`Invalid DBMS configurtion: ${config}`);
        }

        let switchSet = mkSet(switches);

        let settings = {
            switches: switchSet,
            dbms: this.config.dbms,
            hostname: this.config.hostname ? this.config.hostname : 'localhost',
            database: this.config.database ? this.config.database : '',
            username: this.config.username ? this.config.username : '',
            password: this.config.password ? this.config.password : '',
            privateKey: this.config.privateKey ? this.config.privateKey : '',
            privatePath: this.config.privatePath ? this.config.privatePath : '',
            port: this.config.port ? this.config.port : 0,
            libPath: this.config.libPath ? this.config.libPath : '',
        };

        const poolKey = `${settings.dbms}_${settings.hostname}_${settings.database}`;
        
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
    });
    
    
    /*****
     * Registers the specified DBMS client software with this module. Note, this
     * function should be called exactly once for each supported DBMS client
     * application.
    *****/
    register(async function registerDbClient(name, client) {
        clients[name] = client;
    });
}
