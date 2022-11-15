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
register(class UserObj extends DboUser {
    constructor(dbc) {
        super();
        this.dbc = dbc;
    }

    async activate() {
    }

    static async authenticate(dbc, email, password) {
        let result = await selectOneDboUser(dbc, `_email='email' AND _status='active'`);

        if (result) {
        }
        else {
            return false;
        }
    }

    async deactivate() {
    }

    static async empty(dbc) {
        let result = await dbc.query(`SELECT COUNT(*) FROM _user`);
        return result.data[0].count == 0;
    }

    static async get(dbc, oid) {
        let dbo = getDboUser(dbc, oid);
        return dbo ? mkUserObj(dbo) : null;
    }

    static async selectByEmail(dbc, email) {
    }

    static async selectByName(dbc, firstname, lastname) {
    }

    static async selectByUserName(dbc, username, status) {
    }

    async sendEmail(email) {
    }

    async sendMMS(mms) {
    }

    async setPassword(password) {
    }

    async validatePassword(password) {
    }

    async zombify() {
    }
});