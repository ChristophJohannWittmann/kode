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
            this.clear();

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwUserManagerTitle),

                mkWGrid({
                        rows: ['12px', '48px', '12px'],
                        cols: ['12px', '150px', 'auto'],
                })
                .setAt(1, 1,
                    mkIButton()
                    .setValue(txx.fwUserManagerCreateUser)
                    .on('dom.click', message => this.createUser())
                ),

                mkWGrid({
                        rows: ['12px', 'auto', '12px', '48px', '24px', 'auto'],
                        cols: ['12px', 'minmax(350px, 90%)', 'auto'],
                })
                .setAt(1, 1,
                    mkWidget()
                    .setClassNames('font-size-4')
                    .setInnerHtml(txx.fwUserManagerSearch)
                )
                .setAt(3, 1,
                    mkIDynamic(500)
                    .setPanelState('focus', true)
                    .bind(this.controller, 'pattern', Binding.valueBinding)
                    .on('Input.Pause', message => this.refreshList())
                )
                .setAt(5, 1,
                    (this.matching = mkWArrayEditor(
                        ['dom.click'],
                        [
                            { property: 'firstName', label: txx.fwUserEditorFirstName, readonly: true },
                            { property: 'lastName', label: txx.fwUserEditorLastName, readonly: true },
                            { property: 'email', label: txx.fwUserEditorEmail, readonly: true },
                        ]
                    ))
                    .on('dom.click', message => console.log(message))
                )
            );
        }

        async refreshList() {
            let userArray = await queryServer({
                messageName: 'UserSearch',
                criterion: 'search',
                pattern: this.controller.searchPattern
            });

            this.matching.clear();
            this.matching.push(...userArray);

            if (this.matching.length) {
                this.matching.revealHead();
            }
            else {
                this.matching.concealHead();
            }
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
                    .add(this.dboUser, {
                        /*
                        oid: {
                            readonly: true,
                        },
                        created: {
                            hidden: true,
                        },
                        updated: {
                            hidden: true,
                        },
                        emailOid: {
                            hidden: true,
                        },
                        orgOid: {
                            hidden: true,
                        },
                        */
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
                        status: {
                            label: txx.fwUserEditorStatus,
                            type: ScalarEnum,
                            choices: [
                                { value: 'active', text: txx.fwUserEditorStatusActive },
                                { value: 'inactive', text: txx.fwUserEditorStatusInactive },
                            ],
                        },
                        authType: {
                            readonly: true,
                            label: txx.fwUserEditorAuthorizationType,
                        },
                        verified: {
                            readonly: true,
                            label: txx.fwUserEditorVerified,
                        },
                        password: {
                            readonly: true,
                            label: txx.fwUserEditorPassword,
                        },
                        failures: {
                            readonly: true,
                            label: txx.fwUserEditorSignInFailures,
                        },
                    })
                )
            )

            super.refresh();
        }

        async save() {
        }
    }
})();