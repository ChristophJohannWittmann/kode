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
*****/
register(class OrgEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }
    
    async [ mkEndpoint('OrgCreateOrg', 'org', { notify: true }) ](trx) {
        let org = mkDboOrg(trx.dboOrg);
        await org.save(await trx.connect());
        return true;
    }
    
    async [ mkEndpoint('OrgListOrgs', 'org', { notify: false }) ](trx) {
        let dbc = await trx.connect();
        return await Orgs.list(dbc, trx.name, trx.status);
    }
    
    async [ mkEndpoint('OrgModifyOrg', 'org', { notify: true }) ](trx) {
        let dbc = await trx.connect();
        let org = await getDboOrg(dbc, trx.dboOrg.oid);

        if (org) {
            org.name = trx.dboOrg.name;
            org.status = trx.dboOrg.status;
            org.note = trx.dboOrg.note;
            org.authType = trx.dboOrg.authType;
            await org.save(dbc);
            return true;
        }

        return false;
    }
    
    async [ mkEndpoint('OrgRecoverOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('OrgRemoveOrg', 'org', { notify: true }) ](trx) {
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
