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

            this.stm.disableUpdates()
            .appendChild(new OrgCreator(), 'creator', ['select'], ['editor'])
            .appendChild(new OrgSelector(), 'selector', ['select'], [])
            .appendChild(new OrgEditor(), 'editor', ['edit'], ['editor'])
            this.stm.enableUpdates();
            
            this.stm.getWidget('creator').on('CreateOrg', message => this.createOrg());
            this.stm.getWidget('selector').on('ClickOrg', message => this.clickOrg(message));
            this.stm.getWidget('editor').on('CloseEditor', message => this.closeEditor());
            this.stm.getWidget('editor').on('NameChanged', message => this.nameChanged(message.name));

            if ('org' in webAppSettings.grants()) {
                this.stm.setFlag('editor');

                this.orgSelectMenu = mkWPopupMenu()
                .append(
                    mkWMenuItem('hello', 'dolly')
                )
            }

            this.stm.setMode('select');
        }

        clickOrg(message) {
            /*
            this.setTitle(txx.fwOrgManagerEditTitle);
            this.stm.getWidget('editor').setDboOrg(dboOrg);
            this.stm.setMode('edit');
            */
            console.log(message.dboOrg);

            if ('org' in webAppSettings.grants()) {
                this.orgSelectMenu.open(null, message.event.x, message.event.y);
            }
            else {
            }
        }

        closeEditor() {
            this.setTitle(txx.fwOrgManagerListTitle);
            this.stm.setMode('select');
        }

        createOrg() {
            let dboOrg = mkDboOrg({
                name: 'Organization Name',
                status: 'active',
                note: '',
                authType: 'simple',
            });

            this.setTitle(txx.fwOrgManagerEditTitle);
            this.stm.getWidget('editor').setDboOrg(dboOrg);
            this.stm.setMode('edit');
        }

        editOrg(dboOrg) {
        }

        async refresh() {
            console.log('REFRESHING.....');
            await this.stm.getWidget('creator').refresh();
            await this.stm.getWidget('selector').refresh();
            await this.stm.getWidget('editor').refresh();
        }

        async selectOrg(dboOrg) {
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
                .on('html.click', message => this.send({ messageName: 'CreateOrg' }))
            );
        }

        async refresh() {
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

            this.updateResult();
        }

        buildList() {
            let table = mkWTable();
            let body = table.getBody();

            for (let dboOrg of this.found) {
                body.mkRowAppend()
                .mkCellAppend(
                    mkWHotSpot().setValue(dboOrg.name)
                    .on('html.click', message => this.send({
                        messageName: 'ClickOrg',
                        dboOrg: dboOrg,
                        event: message.event,
                    }))
                )
            }

            return table;
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

        async cancel() {
            this.send({ messageName: 'CloseEditor' });
        }

        async refresh() {
        }

        async save() {
            if (this.orgEditor.value().oid == 0n) {
                if (await queryServer({
                    messageName: 'OrgCreateOrg',
                    dboOrg: ActiveData.value(this.orgEditor.value()),
                })) {
                    this.send({ messageName: 'CloseEditor' });                    
                }
                else {
                    await mkWAlertDialog({ text: 'Failed' });
                }
            }
            else {
                let dboClone = clone(this.dboOrg);
                Object.assign(dboClone, this.orgEditor.value())

                if (await queryServer({
                    messageName: 'OrgModifyOrg',
                    dboOrg: ActiveData.value(dboClone),
                })) {
                    this.send({ messageName: 'CloseEditor' });                    
                }
                else {
                    await mkWAlertDialog({ text: 'Failed' });
                }
            }
        }

        setDboOrg(dboOrg) {
            this.clear();

            this.dboOrg = dboOrg;
            this.orgEditor = mkWObjectEditor()
            .addDbo(
                dboOrg, {
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
            .on('html.click', message => this.cancel());

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