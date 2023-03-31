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
 * Entity permissions must stored here in the host single repositry for active
 * permissions.  This very simple daemon is here to maintain permission integrity.
 * In fact, permissions should only be managed during the server bootstrap
 * process.
*****/
singleton(class PermissionsManager extends Daemon {
    constructor() {
        super();
        this.permissions = {
            dbms: {
                name: 'dbms',
                fmwk: true,
                editor: '',
            },
            org: {
                name: 'org',
                fmwk: true,
                editor: '',
            },
            system: {
                name: 'system',
                fmwk: true,
                editor: '',
            },
            template: {
                name: 'template',
                fmwk: true,
                editor: '',
            },
            ticket: {
                name: 'ticket',
                fmwk: true,
                editor: '',
            },
            user: {
                name: 'user',
                fmwk: true,
                editor: '',
            },
        };
    }

    async onClearPermission(message) {
        if (message.permission in this.permissions) {
            if (!this.permissions[message.permission].fmwk) {
                delete this.permissions[message.permission];
            }
        }
    }

    async onHasPermission(message) {
        Message.reply(message, message.permission in this.permissions);
    }

    async onListPermissions(message) {
        Message.reply(message, this.permissions);
    }

    async onSetPermission(message) {
        let perm = clone(message.permission);
        perm.fmwk = false;
        perm.editor = typeof perm.editor == 'string' ? perm.editor : '';

        if (!(perm.name in this.permissions)) {
            this.permissions[perm.name] = perm;
        }
    }
});
