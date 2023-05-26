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
 * Qualtrics web API Object.  Note that there is a single object per server
 * process, with reentrant methods which make that single instance reusable for
 * all of the needs within a single process.  We use the oauth2 bearer token
 * approach, which requires the timeout of that token on a regular basis.  Rather
 * then waiting for the bearer token to NOT work due to expiration, we remove
 * the token within 40 seconds of expiration, which then forces the next Qualtrics
 * call to fetch a new bearer token.  Note that if we're unable to sucessfully
 * fetch a bearer token, the Qualtrics object will be marked as invalid.
*****/
register(class Qualtrics {
    static clients = {};

    constructor(name) {
        if (name in Qualtrics.clients) {
            return Qualtrics.clients[name];
        }
        else {
            if (name in Config.apis.qualtrics) {
                this.valid = true;
                this.config = clone(Config.apis.qualtrics[name]);
                this.bearerToken = '';
            }
            else {
                this.valid = false;
            }
        }
    }

    async call(name, body, mime) {
        if (this.valid) {
            if (body && mime) {
                var func = async () => {
                    return mkHttpClient().post(
                        {
                            host: `${this.config.serverId}.qualtrics.com`,
                            path: `${this.config.path}/${name}`,
                        },
                        mime,
                        body,
                        {
                            Authorization: `Bearer ${this.bearerToken}`
                        }
                    );
                };
            }
            else {
                var func = async () => {
                    return mkHttpClient().get(
                        {
                            host: `${this.config.serverId}.qualtrics.com`,
                            path: `${this.config.path}/${name}`,
                        },
                        {
                            Authorization: `Bearer ${this.bearerToken}`
                        }
                    );
                };
            }

            if (this.bearerToken == '') {
                await this.getBearerToken();
            }

            if (this.valid) {
                let result = await func();

                if (result.status == 200) {
                    return result.content;
                }
            }
        }

        return null;
    }

    static clear(name) {
        if (name) {
            Qualtrics.clients[name];
        }
        else {
            Qualtrics.clients = {};
        }
    }

    async getBearerToken() {
        try {
            this.bearerToken = '';
            let result = await mkHttpClient().post(
                {
                    host: `${this.config.serverId}.qualtrics.com`,
                    path: '/oauth2/token',
                },
                'application/x-www-form-urlencoded',
                `grant_type=client_credentials&scope=${this.config.scope}`,
                {
                    Authorization: 'Basic ' + mkBuffer(`${this.config.key}:${this.config.secret}`).toString('base64'),
                }
            );

            if (result.status == 200 && typeof result.content == 'object') {
                if (result.content.token_type.toLowerCase() == 'bearer') {
                    this.bearerToken = result.content.access_token;
                    setTimeout(() => this.bearerToken = '', (result.content.expires_in - 40) * 1000);
                    return;
                }
            }

            this.valid = false;
        }
        catch (e) {}
    }
});