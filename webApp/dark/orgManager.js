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
     * The OrgManager is the view to enable authorized users to manage, create,
     * modify, activate and deactive, organizations on the system.  If a server
     * has been initialized with the preference Orgs = { active: true}, this view
     * is made available on the sign in menu.  It's implemented as a state machine
     * with three child panels.  When in select mode, authorized users can either
     * select an existing organization or create a totally new organization.
     * When in edit mode, the view is devoted to editing fields of either a new
     * organizaiton or an existing organization that was opened for editing.  This
     * view is also how all non-org users will find and navigate to an organization.
    *****/
    register(class OrgManager extends WPanel {
        constructor() {
            super();
            this.setTitle(txx.fwOrgManagerListTitle);
            this.setRefreshers('OrgCreateOrg', 'OrgModifyOrg');

            this.stm = mkWStateMachine(
                this,
                ['select'],
                ['editor'],
            );

            this.stm.disableUpdates();
            this.stm.appendChild(new OrgCreator(), 'creator', ['select'], ['editor']);
            this.stm.appendChild(new OrgSelector(), 'selector', ['select'], []);
            ('org' in webAppSettings.grants()) ? this.stm.setFlag('editor') : false;
            this.stm.setMode('select');
            this.stm.enableUpdates();
        }
    });


    /*****
     * The OrgCreator is the panel to enable authorized users to create a new
     * organization from scratch.  It's available when the state machine is in
     * 'select' mode.  It's just a button, when clicked creates an new empty
     * DboOrg object and then opens the org editor by setting the state machine
     * to be in 'edit' mode.
    *****/
    class OrgCreator extends WGrid {
        constructor() {
            super({
                rows: ['30px', '48px', '30px'],
                cols: ['0px', '200px', 'auto'],
            });

            this.setAt(1, 1,
                mkIButton()
                .setValue(txx.fwOrgManagerCreateOrg)
                .on('html.click', message => this.createOrg())
            );
        }

        createOrg() {
            let dboOrg = mkDboOrg({
                name: '',
                status: 'active',
                note: '',
                authType: 'simple',
            });

            this.getView().push(new OrgEditor(dboOrg));
        }
    }


    /*****
     * The OrgSelector is the panel to enable users to search for an organization
     * using the organization name.  We're attempting to provide someting somewhat
     * modern.  User's enter parts or snippets of an organization name.  When
     * typeing stops, we wait several milliseconds before contacting the server to
     * see what organizations match what we've typed.  By default, only the number
     * of matching organizaitons is listed.  Click the show-list bottle to open the
     * list, which is active and can be used either switch to that organization or
     * to open that organization for editing.
    *****/
    class OrgSelector extends WGrid {
        constructor() {
            super({
                rows: ['30px', '24px', '8px', '48px', '30px', '8px', '48px', '8px', 'auto'],
                cols: ['auto', 'auto'],
            });

            this.timeout = null;
            this.found = [];

            this.controller = mkActiveData({
                pattern: '',
                showList: false,
            });

            this.bind(this.controller, 'showList', this.updateResult);
            this.setAt(1, 0,mkWidget().set(txx.fwOrgManagerSearch));

            this.setAt(3, 0,
                mkIText()
                .setAttribute('autocomplete', 'off')
                .on('html.keyup', message => this.refresh())
                .bind(this.controller, 'pattern')
                .setFlag('autofocus')
            );

            this.setAt(6, 0, 
                mkWidget('span')
                .append(
                    mkICheckbox().bind(this.controller, 'showList')
                    .setStyle({
                        height: '24px',
                        width: '24px',
                        marginRight: '12px',
                    }),
                    mkWidget('span').set(txx.fwOrgManagerShowList),
                )
            );

            this.orgSelectMenu = mkWPopupMenu()
            .append(
                mkWMenuItem(txx.fwOrgManagerSelectorEdit, 'Edit')
                .setAction(mkFunctionMenuAction(home, (menuItem, message) => this.editOrg(menuItem.getMenu().dboOrg))),
                mkWMenuItem(txx.fwOrgManagerSelectorSwitch, 'Switch')
                .setAction(mkFunctionMenuAction(home, (menuItem, message) => this.switchOrg(menuItem.getMenu().dboOrg))),
            );

            this.updateResult();
        }

        buildList() {
            let table = mkWTable();
            let body = table.getBody();

            for (let dboOrg of this.found) {
                body.mkRowAppend()
                .mkCellAppend(
                    mkWHotSpot().setValue(dboOrg.name)
                    .on('html.click', message => this.clickOrg(dboOrg, message.event))
                )
            }

            return table;
        }

        clickOrg(dboOrg, event) {
            if ('org' in webAppSettings.grants()) {
                this.orgSelectMenu.dboOrg = dboOrg;
                this.orgSelectMenu.open(null, event.x, event.y);
            }
            else {
                this.switchOrg(dboOrg);
            }
        }

        editOrg(dboOrg) {
            this.getView().push(new OrgEditor(dboOrg));
        }

        async refresh() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            this.timeout = setTimeout(async () => {
                this.timeout = null;

                if (this.controller.pattern.trim()) {
                    this.found = await queryServer({
                        messageName: 'OrgSearchOrgs',
                        pattern: this.controller.pattern.trim(),
                    });
                }
                else {
                    this.found = [];
                }

                this.updateResult();
            }, 500);
        }

        async switchOrg(dboOrg) {
            let org = await queryServer({
                messageName: 'SelfSetOrg',
                orgOid: dboOrg.oid,
            });

            if (typeof org == 'object' || org === null) {
                webAppSettings.org = () => org;
                send({ messageName: '#RefreshClient' });
            }
        }

        updateResult() {
            if (this.controller.showList && this.found.length < 20) {
                this.setAt(8, 0, this.buildList());
            }
            else {
                this.setAt(8, 0, mkWidget().set(`${this.found.length}&nbsp;&nbsp;${txx.fwOrgManagerFound}`));
            }
        }
    }


    /*****
     * The OrgEditor enables users to edit editable properties of the organization.
     * This can also be used to activate or inactivate the organization.  When
     * deactivation occurs, the back-end (server), will shut down all active
     * sessions for users that belong to the deactivated organization.  Other-
     * wise, it's just an object editor that connects to the back and updates the
     * properties of the organization.
    *****/
    class OrgEditor extends WPanel {
        constructor(dboOrg) {
            super('form');
            this.dboOrg = dboOrg;
            this.setRefreshers('OrgCreateOrg', 'OrgModifyOrg');
            this.setTitle(txx.fwOrgManagerEditTitle);

            this.orgEditor = mkWObjectEditor()
            .addDbo(
                this.dboOrg, {
                    oid: {
                        hidden: true,
                    },
                    created: {
                        hidden: true,
                    },
                    updated: {
                        hidden: true,
                    },
                    name: {
                        label: txx.fwOrgManagerEditorName,
                        readonly: false,
                        autofocus: true,
                    },
                    status: {
                        label: txx.fwOrgManagerEditorStatus,
                        readonly: false,
                        type: ScalarEnum,
                        choices: [
                            { value: 'active',   text: txx.fwMiscActive },
                            { value: 'inactive', text: txx.fwMiscInactive },
                        ]
                    },
                    note: {
                        label: txx.fwOrgManagerEditorNote,
                        readonly: false,
                    },
                    authType: {
                        label: txx.fwOrgManagerAuthType,
                        readonly: true,
                    },
                }
            );

            this.append(this.orgEditor);
        }

        async refresh() {
            if (this.dboOrg.oid > 0n) {
                console.log('reload org from server..');
            }
        }

        async revert() {
            this.orgEditor.revert();
        }

        async save() {
            if (this.dboOrg.oid > 0n) {
                await queryServer({
                    messageName: 'OrgModifyOrg',
                    dboOrg: mkDboOrg(this.dboOrg).assign(this.orgEditor.getValues()),
                });
            }
            else {
                await queryServer({
                    messageName: 'OrgCreateOrg',
                    dboOrg: mkDboOrg(this.orgEditor.getValues()),
                });
            }
        }
    }
})();