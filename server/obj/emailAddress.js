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
 * A developer-helper object that provides streamlined utilities for managing
 * email address database objects.  Some of these helper functions replace single
 * DboObject calls, while other replace multiple function calls.
*****/
singleton(class EmailAddresses {
    constructor() {
    }

    async ensureFromAddr(dbc, addr) {
        const normal = addr.toLowerCase().trim();
        let emailAddress = await selectOneDboEmailAddress(dbc, `_addr='${normal}'`);

        if (!emailAddress) {
            let domainName;
            emailAddress = mkDboEmailAddress({ addr: normal });
            [ emailAddress.user, domainName ] = normal.split('@');
            let domain = await Domains.ensureFromName(dbc, domainName);
            emailAddress.domainOid = domain.oid;
            emailAddress.lastVerified = mkTime(0);
            emailAddress.lastDelivered = mkTime(0);
            await emailAddress.save(dbc);
        }

        emailAddress.ownerType = 'DboUser';
        emailAddress.ownerOid = 2n;

        return this.pin(dbc, emailAddress);
    }

    async getFromAddr(dbc, addr) {
        const normal = addr.toLowerCase().trim();
        return await this.pin(dbc, await selectOneDboEmailAddress(dbc, `_addr='${normal}'`));
    }

    async getFromOid(dbc, oid) {
        return await this.pin(dbc, await getDboEmailAddress(dbc, oid));
    }

    async getFromUser(dbc, user) {
        if (user) {
            return this.pin(dbc, await selectOneDboEmailAddress(dbc, `_owner_type='DboUser' AND _owner_oid=${user.oid}`));
        }

        return null;
    }

    async getFromUserOid(dbc, oid) {
        return await this.getFromUser(dbc, await getDboUser(dbc, oid));
    }

    async pin(dbc, emailAddress) {
        if (emailAddress) {
            emailAddress.pinned = {};
            emailAddress.pinned.domain = await Domains.getFromOid(dbc, emailAddress.domainOid);

            if (emailAddress.ownerOid) {
                await eval(`(async() => emailAddress.pinned.owner = await get${emailAddress.ownerType}(dbc, emailAddress.ownerOid))()`);
            }
        }

        return emailAddress;
    }
});