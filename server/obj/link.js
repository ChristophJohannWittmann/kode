/**
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
 */


/*****
 * The Webx built to handle link processing.  The standard is to have a URL/
 * path of /link with a search:  https://hostname/link?<link-code>.  Every
 * existing system link is unique and has its own instructions for responding
 * to being opened.  This Webx responds with content in the standard manner
 * and may also provide headers to deal with issues such a redirect.
*****/
if (CLUSTER.isWorker) {
    Ipc.on('#ServerReady:http', async message => {
        ResourceLibrary.register(builtinModule, {
            url: '/link',
            webx: 'Linkx',
        });
    });

    register(class Linkx extends Webx {
        constructor(module, reference) {
            super(module, reference);
        }

        async handleGET(req, rsp) {
            let dbc = await dbConnect();

            try {
                let link = await mkLink(dbc, req.query());
                let result = await link.open(dbc);

                if (result) {
                    if ('headers in result') {
                        for (let headerName in result.headers) {
                            rsp.setHeader(headerName, result.headers[headerName]);
                        }
                    }

                    rsp.end(200, result.mime, result.content);
                }
                else {
                    rsp.endStatus(404);
                }

                await dbc.commit();
                await dbc.free();
            }
            catch (e) {
                await dbc.rollback();
                await dbc.free();
                rsp.endStatus(500);
            }
        }
    });
}


/*****
 * The link class creates and manages limited use black-box systems links that
 * provide a number of system features for users with things as common as email
 * verification, new user welcome automated authentication, and single-use links
 * to enter data into a web application.  A link is made with an object
 * containing propeties that describe it's use, including a function this is
 * saved as a string and then evaluated when the link is opened at a later time.
 * This function MUST refer to globally available classes and functions because
 * it is evaluated after being reconstituted from the DBMS.  The link has features
 * for limiting the number of times it can be used and for expiring based on a
 * given timestamp.
*****/
register(class Link extends DboLink {
    constructor(dbc, arg) {
        super();

        return new Promise(async (ok, fail) => {
            if (typeof arg == 'object') {
                this.opens = 0;
                this.limit = arg.limit ? arg.limit : 1;
                this.expires = arg.expires ? arg.expires : mkTime('max');
                this.reason = arg.reason ? arg.reason : '';
                this.reasonType = arg.reasonType ? arg.reasonType : '';
                this.reasonOid = arg.reasonOid ? arg.reasonOid : 0n;
                this.func = arg.func ? arg.func : ()=>{};
                this.args = arg.args ? arg.args : {};
                this.closed = false;
                this.closedOn = mkTime(0);

                if (this.validate()) {
                    await this.generateCode(dbc);
                    await this.save(dbc);
                }
            }
            else if (typeof arg == 'bigint') {
                let dbo = await getDboLink(dbc, arg);
                dbo ? Object.assign(this, dbo) : false;
            }
            else if (typeof arg == 'string') {
                let dbo = await selectOneDboLink(dbc, `_code='${arg}'`);
                dbo ? Object.assign(this, dbo) : false;
            }

            this.ready = this.oid == 0n ? false : true;
            ok(this);
        });
    }

    async close(dbc) {
        if (this.ready) {
            this.closed = true;
            this.closedOn = mkTime();
            await this.save(dbc);
        }

        return this;
    }

    async generateCode(dbc) {
        let rand = Crypto.random(-1000000000, 1000000000);
        this.code = await Crypto.hash('sha512', `${mkTime().toString()}${rand}`, 'base64url');

        while ((await selectDboLink(dbc, `_code='${this.code}'`)).length) {
            rand = Crypto.random(-1000000000, 1000000000);
            this.code = await Crypto.hash('sha512', `${mkTime().toString()}${rand}`, 'base64url');
        }
    }

    async isAvailable(dbc) {
        if (this.oid > 0) {
            if (!this.closed) {
                if (this.opens < this.limit) {
                    if (this.expires.valueOf() > Date.now()) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    async open(dbc) {
        if (await this.isAvailable(dbc)) {
            this.opens++;

            if (this.opens >= this.limit) {
                await this.close(dbc);
            }
            else {
                await this.save(dbc);                
            }

            let reason = {
                reason: this.reason,
                reasonType: this.reasonType,
                reasonOid: this.reasonOid,
            };

            let func = mkBuffer(this.func, 'base64').toString();

            try {
                return await eval(`(async (dbc, args, reason) => await (${func})(dbc, args, reason))(dbc, this.args, reason)`);
            }
            catch (e) {
                return false;
            }
        }

        return false;
    }

    validate() {
        if (typeof this.limit != 'number') return false;
        if (!(this.expires instanceof Date)) return false;
        if (typeof this.reason != 'string') return false;
        if (typeof this.reasonType != 'string') return false;
        if (typeof this.reasonOid != 'bigint') return false;
        if (typeof this.args != 'object') return false;

        if (typeof this.func == 'function') {
            this.func = mkBuffer(this.func.toString()).toString('base64');
            return true;
        }
        else {
            return false;
        }
    }
});
