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
    
    async [ mkEndpoint('ActivateOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('DeactivateOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('ListOrgs', 'org', { notify: false }) ](trx) {
        let dbc = await trx.connect();
        return await Orgs.list(dbc, trx.name, trx.status);
    }
    
    async [ mkEndpoint('ModifyOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('RecoverOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('RemoveOrg', 'org', { notify: true }) ](trx) {
    }
    
    async [ mkEndpoint('SearchOrgs', 'org', { notify: false }) ](trx) {
        //let dbc = await trx.connect();
        //return await Orgs.search(dbc, trx.pattern);

        return [
            mkDboOrg({ oid: 1n, name: 'Nathan Casino', status: 'active', description: 'North Hollywood', authType: 'simple' }),
            mkDboOrg({ oid: 2n, name: 'Five Winds', status: 'active', description: 'Indiana', authType: 'twofactor' }),
            mkDboOrg({ oid: 3n, name: 'Big Slots Vegas', status: 'active', description: 'On the Strip', authType: 'simple' }),
            mkDboOrg({ oid: 4n, name: 'Herbal Valley Casino', status: 'inactive', description: '', authType: 'simple' }),
        ];
    }
});
