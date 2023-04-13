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
 * The Orgs object is a helper to provide functions for scanning, searching, and
 * manipulating org objects.  Commonly used algorithms are implemented here and
 * should be used throughout the server-side framework code.
*****/
singleton(class Orgs {
    constructor() {
    }

    async list(dbc, name, status) {
        let filter = [];

        if (name !== undefined) {
            filter.push(`_name=${dbc.str(dbText, name)}`)
        }

        if (status !== undefined) {
            filter.push(`_status=${dbc.str(dbText, status)}`)
        }

        if (filter.length == 0) {
            filter.push('1=1');
        }

        return await selectDboOrg(dbc, filter.join(' AND '), '_name ASC limit 20');
    }

    async search(dbc, pattern) {
        try {
            if (pattern.indexOf('*') >= 0) {
                return await selectDboOrg(dbc, '', '_name ASC limit 20');
            }
            else {
                return await selectDboOrg(dbc, `_name ~* ${dbc.str(dbText, pattern)}`, '_name ASC limit 20');
            }
        }
        catch (e) {
            return [];
        }
    }
});


/*****
 * The Org class extends DboOrg by adding features that are required for loading
 * and managing an organizaton.  Some of primary challenges around this pertain
 * to maintenance of the organizational databases.  Orgs do have the options of
 * provided schemas and a schemaNames.js file that computes an array of schema
 * names (registered) that should be part of the org's schema.  Since this call
 * accepts an org oid, each org's schema can be unique depending on what the
 * schema names function products.
*****/
register(class Org extends DboOrg {
    constructor(dboOrg) {
        super(dboOrg);
        this.extensions = {};
    }

    generateDatabaseName() {
        let dbName;
        let org = this;
        eval('dbName=`' + env.orgs.dbName + "`");
        return dbName;
    }

    async generateDatabaseSettings() {
        let orgDbSettings = {};
        let mainDbSettings = DbDatabase.getSettings('@');

        if (mainDbSettings) {
            for (let key in mainDbSettings) {
                if (key == 'database') {
                    orgDbSettings.database = this.generateDatabaseName();
                }
                else if (key == 'schemas') {
                    orgDbSettings.schemas = await this.getSchemaNames();
                }
                else {
                    orgDbSettings[key] = mainDbSettings[key];
                }
            }
        }

        return orgDbSettings;
    }

    getDatabase() {
        return DbDatabase.databases[`@${this.generateDatabaseName()}`];
    }

    async getSchemaNames() {
        let schemaNames = [];

        for (let thunk of Thunk.thunks) {
            schemaNames = schemaNames.concat(await thunk.orgSchemaFunc(this));
        }

        return schemaNames;
    }

    async loadExtensions() {
        this.extensions = {};
        let dbc = await dbConnect();

        for (let dboOrgExt of await selectDboOrgExt(dbc, `_org_oid=${this.oid}`)) {
            this.extensions[dboOrgExt.name] = fromJson(mkBuffer(dboOrgExt, 'base64').toString());
        }

        await dbc.rollback();
        await dbc.free();
    }

    async registerDatabase() {
        let dbName = `@${this.generateDatabaseName()}`;
        let dbSettings = await this.generateDatabaseSettings();
        return mkDbDatabase(dbName, dbSettings);
    }

    async upgradeSchema() {
        let dbDatabase = this.getDatabase();
        await dbDatabase.upgrade();
        return this;
    }
});


/*****
 * An org ext or extension is of way of allowing modules to add features and data
 * to the org DBMS system.  It's part of the framework as well.  This object is
 * pretty self explanatory and provides a named value, and object, that is to be
 * associated with the organziation specified by its orgOid property.
*****/
register(class OrgExt extends DboOrgExt {
    constructor(data) {
        if (data instanceof DboOrgExt) {
            super(data);
            this.data = typeof this.data == 'object' ? this.data : fromJson(mkBuffer(this.data, 'base64').toString());
        }
        else if (data instanceof DboOrg) {
            super();
            this.orgOid = data.oid;
            this.name = '';
            this.data = {};
        }
        else {
            super();
            this.orgOid = 0n;
            this.name = '';
            this.data = {};
        }
    }

    async save(dbc) {
        if (this.orgOid > 0n) {
            let data = this.data;
            this.data = mkBuffer(toJson(data)).toString('base64');
            await super.save(dbc);
            this.data = data;
        }

        return this;
    }
});
