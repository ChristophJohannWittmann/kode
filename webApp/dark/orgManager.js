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
            super('div');
            this.setRefreshers('OrgCreateOrg', 'OrgModifyOrg');

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwOrgManagerListTitle)
            );

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
                .on('dom.click', message => this.createOrg())
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

            this.found = [];

            this.controller = mkActiveData({
                pattern: '',
                showList: false,
            });

            this.bind(this.controller, 'showList', this.updateResult);
            this.setAt(1, 0,mkWidget().setInnerHtml(txx.fwOrgManagerSearch));

            this.setAt(3, 0,
                mkIDynamic(500)
                .setAttribute('autocomplete', 'off')
                .bind(this.controller, 'pattern', Binding.valueBinding)
                .setPanelState('focus', true)
                .on('Input.Pause', message => this.refreshList())
            );

            this.setAt(6, 0, 
                mkWidget('span')
                .append(
                    mkICheckbox().bind(this.controller, 'showList', Binding.valueBinding)
                    .setStyle({
                        height: '24px',
                        width: '24px',
                        marginRight: '12px',
                    }),
                    mkWidget('span').setInnerHtml(txx.fwOrgManagerShowList),
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
            const table = mkWTable();
            const body = table.getBody();

            for (let dboOrg of this.found) {
                body.mkRowAppend()
                .mkCellAppend(
                    mkWHotSpot().setValue(dboOrg.name)
                    .on('dom.click', message => this.clickOrg(dboOrg, message.event))
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

        async refreshList() {
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
                this.setAt(8, 0, mkWidget().setInnerHtml(`${this.found.length}&nbsp;&nbsp;${txx.fwOrgManagerFound}`));
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
            this.setFlag('transient');
            this.setRefreshers('OrgCreateOrg', 'OrgModifyOrg');
            this.refresh();
        }

        async refresh() {
            if (this.dboOrg.oid > 0n) {
                let org = await queryServer({ messageName: 'OrgGetOrg', orgOid: this.dboOrg.oid });

                if (org.updated > this.dboOrg.updated) {
                    this.dboOrg = org;
                }
            }
            
            this.ignore();
            this.clear();

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwOrgManagerEditTitle)
            );
            
            let orgEditor = this.orgEditor;

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
                        focus: true,
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

            orgEditor ? orgEditor.remove() : false;
            this.ignore();
            this.append(this.orgEditor);
            this.listen();
            super.refresh();
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