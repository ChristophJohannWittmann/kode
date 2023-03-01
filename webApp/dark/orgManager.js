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
    register(class OrgManager extends WPanel {
        constructor() {
            super();
            this.setTitle(txx.fwOrgManagerListTitle);
            this.setRefreshers('OrgCreateOrg', 'OrgModifyOrg');

            this.stm = mkWStateMachine(
                this,
                ['select', 'edit'],
                ['editor'],
            );

            this.stm.disableUpdates();
            this.stm.appendChild(new OrgCreator(), 'creator', ['select'], ['editor']);
            this.stm.appendChild(new OrgSelector(), 'selector', ['select'], []);
            this.stm.appendChild(new OrgEditor(), 'editor', ['edit'], ['editor']);
            ('org' in webAppSettings.grants()) ? this.stm.setFlag('editor') : false;            
            this.stm.setMode('select');
            this.stm.enableUpdates();
        }
    });


    /*****
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
                name: 'Organization Name',
                status: 'active',
                note: '',
                authType: 'simple',
            });

            this.getOwner().setTitle(txx.fwOrgManagerEditTitle);
            this.getStateMachine().getWidget('editor').setDboOrg(dboOrg);
            this.getStateMachine().setMode('edit');
        }
    }


    /*****
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
            )

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
                .setAction(mkFunctionMenuAction((menuItem, message) => this.editOrg(menuItem.getMenu().dboOrg))),
                mkWMenuItem(txx.fwOrgManagerSelectorSwitch, 'Switch')
                .setAction(mkFunctionMenuAction((menuItem, message) => this.switchOrg(menuItem.getMenu().dboOrg))),
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
            this.getOwner().setTitle(txx.fwOrgManagerEditTitle);
            this.getStateMachine().getWidget('editor').setDboOrg(dboOrg);
            this.getStateMachine().setMode('edit');
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

        switchOrg(dboOrg) {
            console.log('switch Org');
            console.log(dboOrg);
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
    *****/
    class OrgEditor extends WPanel {
        constructor() {
            super('form');
        }

        async close() {
            this.getOwner().setTitle(txx.fwOrgManagerListTitle);
            this.getStateMachine().setMode('select');
        }

        async refresh() {
            this.close();
        }

        async save() {
            if (this.dboOrg) {
                if (this.dboOrg.oid == 0n) {
                    if (await queryServer({
                        messageName: 'OrgCreateOrg',
                        dboOrg: mkDboOrg(ActiveData.value(this.orgEditor.value())),
                    })) {
                        this.close();
                    }
                    else {
                        await mkWAlertDialog({ text: txx.fwOrgManagerEditorSaveFailed });
                    }
                }
                else {
                    let dboOrg = mkDboOrg(this.dboOrg, this.orgEditor.value());

                    if (await queryServer({
                        messageName: 'OrgModifyOrg',
                        dboOrg: dboOrg,
                    })) {
                        this.close;
                    }
                    else {
                        await mkWAlertDialog({ text: txx.fwOrgManagerEditorSaveFailed });
                    }
                }
            }
        }

        setDboOrg(dboOrg) {
            this.clear();
            this.dboOrg = dboOrg;

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

            this.orgSave = mkIButton().setValue(txx.fwNavDone)
            .on('html.click', message => this.save());

            this.orgCancel = mkIButton().setValue(txx.fwNavCancel)
            .on('html.click', message => this.close());

            this.append(
                this.orgEditor,
                mkWidget('div').append(
                    this.orgSave,
                    mkWSpace(24),
                    this.orgCancel,
                )
                .setClassName('flex-h-cc')
                .setStyle('margin-top', '20px')
            );
        }
    }
})();