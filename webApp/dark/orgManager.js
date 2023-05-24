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

            if ('org' in webAppSettings.grants()) {
                this.append(new OrgCreator(this));
            }

            this.append((this.orgSelector = new OrgSelector(this)));
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
        constructor(orgManager) {
            super({
                rows: ['12px', '48px', '12px'],
                cols: ['12px', 'minmax(150px, 200px)', 'auto'],
            });

            this.orgManager = orgManager;

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

            this.getView().push(new OrgEditor(this.orgManager, dboOrg));
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
        constructor(orgManager) {
            super({
                rows: ['12px', '24px', '8px', '48px', '12px', '8px', '48px', '8px', 'auto'],
                cols: ['12px', 'minmax(350px, 90%)', 'auto'],
            });

            this.orgManager = orgManager;

            this.controller = mkActiveData({
                pattern: '',
                showList: false,
            });

            this.bind(this.controller, 'showList', this.refresh);
            this.setAt(1, 1,mkWidget().setInnerHtml(txx.fwOrgManagerSearch));

            this.setAt(3, 1,
                mkIDynamic(500)
                .setAttribute('autocomplete', 'off')
                .bind(this.controller, 'pattern', Binding.valueBinding)
                .setPanelState('focus', true)
                .on('Input.Pause', message => this.refresh())
            );

            this.setAt(6, 1, 
                mkWidget('div')
                .append(
                    mkICheckbox()
                    .bind(this.controller, 'showList', Binding.valueBinding),
                    mkWidget('span').setInnerHtml(txx.fwOrgManagerShowList)
                )
            );

            this.orgSelectMenu = mkWPopupMenu()
            .append(
                mkWMenuItem(txx.fwOrgManagerSelectorEdit, 'Edit')
                .setAction(mkFunctionMenuAction((menuItem, message) => this.editOrg(menuItem.getMenu().getAnchor().getActiveData()))),
                mkWMenuItem(txx.fwOrgManagerSelectorSwitch, 'Switch')
                .setAction(mkFunctionMenuAction((menuItem, message) => this.switchOrg(menuItem.getMenu().getAnchor().getActiveData()))),
            );

            this.resultTable = mkWArrayEditor(
                {
                    property: 'name',
                    label: txx.fwOrgManagerEditorName,
                    readonly: true,
                    menu: this.orgSelectMenu,
                },
            );

            this.refresh();
        }

        editOrg(orgInfo) {
            this.getView().push(new OrgEditor(this.orgManager, orgInfo));
        }

        async refresh() {
            this.resultTable.clear();

            if (this.controller.pattern.trim()) {
                this.resultTable.push(...await queryServer({
                    messageName: 'OrgSearchOrgs',
                    pattern: this.controller.pattern.trim(),
                }));
            }

            if (this.controller.showList) {
                this.setAt(8, 1, this.resultTable);
            }
            else {
                this.setAt(8, 1,
                    mkWidget().setInnerHtml(`${this.resultTable.length()}&nbsp;&nbsp;${txx.fwOrgManagerFound}`)
                );
            }
        }

        async switchOrg(orgInfo) {
            let org = await queryServer({
                messageName: 'SelfSetOrg',
                orgOid: orgInfo.oid,
            });

            if (typeof org == 'object' || org === null) {
                webAppSettings.org = () => org;
                send({ messageName: '#RefreshClient' });
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
        constructor(orgManager, dboOrg) {
            super('form');
            this.dboOrg = dboOrg;
            this.orgManager = orgManager;
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
                .setInnerHtml(txx.fwOrgManagerEditTitle),

                (this.orgEditor = mkWObjectEditor())
                .add(
                    this.dboOrg, {
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
                ),
            );

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

            this.orgManager.orgSelector.refresh();
            this.getView().pop();
        }
    }
})();