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


(() => {
    /*****
    *****/
    register(class UserManager extends WPanel {
        constructor() {
            super('form');
            this.setAttribute('autocomplete', 'off');
            this.setRefreshers('UserCreateUser', 'UserModifyUser');

            this.controller = mkActiveData({
                searchPattern: '',
            });

            this.refresh();
        }

        createUser() {
            let dboUser = mkDboUser({
                status: 'active',
                authType: 'simple',
            });

            this.getView().push(new UserEditor(dboUser));
        }

        async refresh() {
            this.ignore();
            this.clear();

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwUserManagerTitle)
            );

            this.append(
                (
                    this.creator = mkWGrid({
                        rows: ['30px', '48px', '30px'],
                        cols: ['0px', '200px', 'auto'],
                    })
                    .setAt(1, 1,
                        mkIButton()
                        .setValue(txx.fwUserManagerCreateUser)
                        .on('dom.click', message => this.createUser())
                    )
                )
            );

            this.append(
                (
                    this.selector = mkWGrid({
                        rows: ['30px', '24px', '8px', '48px', '8px', 'auto'],
                        cols: ['auto', 'auto'],
                    })
                    .setAt(3, 0,
                        mkIDynamic(500)
                        .bind(this.controller, 'pattern', Binding.valueBinding)
                        .setPanelState('focus', true)
                        .on('Input.Pause', message => this.refreshList())
                    )
                    .setAt(5, 0,
                        mkWidget().setInnerHtml('User List Placeholder')
                    )
                )
            );

            this.listen();
        }

        async refreshList() {
        }
    });


    /*****
    *****/
    class UserEditor extends WPanel {
        constructor(dboUser) {
            super('form');
            this.dboUser = dboUser;
            this.setFlag('transient');
            this.setAttribute('autocomplete', 'off');
            this.setRefreshers('UserModifyUser');
            this.refresh();
        }

        async refresh() {
            this.ignore();
            this.clear();

            if (this.dboUser.oid > 0n) {
                let user = await queryServer({ messageName: 'UserGetUser', userOid: this.userOrg.oid });

                if (user.updated > this.dboUser.updated) {
                    this.dboUser = user;
                }
            }

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwUserEditorTitle)
            );

            this.append(
                (
                    this.userEditor = mkWObjectEditor()
                    .addDbo(this.dboUser, {
                        oid: {
                            readonly: true,
                        },
                        created: {
                            hidden: true,
                        },
                        updated: {
                            hidden: true,
                        },
                        title: {
                            label: txx.fwUserEditorUserTitle,
                        },
                        firstName: {
                            label: txx.fwUserEditorFirstName,
                            focus: true,
                        },
                        lastName: {
                            label: txx.fwUserEditorLastName,
                        },
                        suffix: {
                            label: txx.fwUserEditorSuffix,
                        },
                    })
                )
                .listen()
            )

            this.listen();
        }

        async save() {
        }
    }
})();