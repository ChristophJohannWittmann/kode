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


/*****
 * The fromework endpoints for managing organizations.  These endpoionts are
 * only available to users with orgOid = 0n those with the "org" permission.
 * The other other org-related endpoint that's not found here is in the self
 * endpoints module.  That endpoint is where an user.orgOid == 0n user can
 * select what organization they currently want to open.
*****/
register(class OrgEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }
    
    async [ mkEndpoint('OrgCreateOrg', 'org', { notify: true }) ](trx) {
        let dbc = await trx.connect();
        let dboOrg = mkDboOrg(trx.dboOrg);
        await dboOrg.save(await trx.connect());
        const pref = await selectOneDboPreference(dbc, `_name='Orgs'`);

        if (pref.value.on && typeof pref.value.dbName == 'string' && pref.value.dbName) {
            let dbName;
            let org = dboOrg;
            eval('dbName=`' + pref.value.dbName + '`;');

            if (!(await dbList()).has(dbName)) {
                await dbCreate(null, dbName);
                let org = mkOrg(dboOrg);
                await org.registerDatabase();
                await org.upgradeSchema();
            }
        }

        return dboOrg;
    }
    
    async [ mkEndpoint('OrgGetOrg', 'org', { notify: false }) ](trx) {
        return await getDboOrg(await trx.connect(), trx.orgOid);
    }
    
    async [ mkEndpoint('OrgListOrgs', 'org', { notify: false }) ](trx) {
        let dbc = await trx.connect();
        return await Orgs.list(dbc, trx.name, trx.status);
    }
    
    async [ mkEndpoint('OrgModifyOrg', 'org', { notify: true }) ](trx) {
        let dbc = await trx.connect();
        let org = await getDboOrg(dbc, trx.dboOrg.oid);

        if (org) {
            let deactivated = org.status == 'active' && trx.dboOrg.status != 'active';
            org.name = trx.dboOrg.name;
            org.status = trx.dboOrg.status;
            org.note = trx.dboOrg.note;
            org.authType = trx.dboOrg.authType;
            await org.save(dbc);

            if (deactivated) {
                // TODO
                // If org deactiveate, perform lots of clean-up
                // Orgs.deactivate(org.oid);
                // Need to unceremoniously close all sessions for the org.
                console.log('shut down active sessions for org users.');
            }

            return true;
        }

        return false;
    }
    
    async [ mkEndpoint('OrgRemoveOrg', 'org', { notify: true }) ](trx) {
        const pref = await selectOneDboPreference(dbc, `_name='Orgs'`);
        let org = await getDboOrg(await trx.connect(), trx.orgOid);

        if (pref.value.on && typeof pref.value.dbName == 'string' && pref.value.dbName) {
            let dbName;
            eval('dbName=`' + pref.value.dbName + '`;');

            if (!(await dbList()).has(dbName)) {
                await dbDrop(null, dbName);
            }
        }
    }
    
    async [ mkEndpoint('OrgSearchOrgs', 'org', { notify: false }) ](trx) {
        try {
            let dbc = await trx.connect();
            return await Orgs.search(dbc, trx.pattern);
        }
        catch (e) {
            return [];
        }
    }
});
