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
        let org = mkDboOrg(trx.dboOrg);
        await org.save(await trx.connect());
        return org;
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
        // TODO
        // Stub to remove the org's individual DBMS.  This will remove
        // data that's specific to the app and the org.  Note that the
        // org object is never removed from the main OLTP DBMS.  It's only
        // marked as being closed or inactive.
        console.log('OrgRemoveOrg ENDPOINT STUB');
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
