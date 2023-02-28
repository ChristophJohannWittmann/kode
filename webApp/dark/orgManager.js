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
            this.setTitle(txx.fwOrgManagerTitle);
            this.editor = new OrgEditor(this);

            this.stm = mkWStateMachine(
                this,
                ['select', 'edit'],
                ['editor'],
            );

            this.stm.on('StateMachine', message => {
                if (message.mode == 'select') {
                    this.setTitle(txx.fwOrgManagerListTitle);
                }
                else if (message.mode == 'edit') {
                    this.setTitle(`${txx.fwOrgManagerEditTitle}: ${this.editor.controller.name}`);
                }
            });

            this.stm.disableUpdates()
            .appendChild(new OrgCreator(this), ['select'], ['editor'])
            .appendChild(mkWHrLite(), ['select'], ['editor'])
            .appendChild(new OrgSelector(this), ['select'], [])
            .appendChild(this.editor, ['edit'], ['editor']);
            ('org' in webAppSettings.grants()) ? this.stm.setFlag('editor') : false;
            this.stm.enableUpdates();
        }

        closeOrg() {
        }

        createOrg() {
            this.editOrg(mkDboOrg({
                name: 'Organization Name',
                status: 'active',
                description: 'organization info',
                authType: 'simple',
            }));
        }

        editOrg(dboOrg) {
            ActiveData.assign(this.editor.dboObject, dboOrg);
            this.editor.set(toJson(dboOrg, true));
            this.stm.setMode('edit');
        }

        selcectOrg(dboOrg) {
        }
    });


    /*****
    *****/
    class OrgCreator extends WGrid {
        constructor(orgManager) {
            super({
                rows: ['30px', '48px', '30px'],
                cols: ['0px', '200px', 'auto'],
            });

            this.orgManager = orgManager;

            this.setAt(1, 1,
                mkIButton()
                .setValue(txx.fwOrgManagerCreateOrg)
                .on('html.click', message => this.orgManager.createOrg())
            );
        }
    }


    /*****
    *****/
    class OrgSelector extends WGrid {
        constructor(orgManager) {
            super({
                rows: ['30px', '24px', '8px', '48px', '30px', '8px', '48px', '8px', 'auto'],
                cols: ['auto', 'auto'],
            });

            this.timeout = null;
            this.orgManager = orgManager;
            this.found = [];

            this.controller = mkActiveData({
                pattern: '',
                showList: false,
            });

            this.bind(this.controller, 'showList', this.updateResult);
            this.setAt(1, 0,mkWidget().set(txx.fwOrgManagerSearch));

            this.setAt(3, 0,
                mkIText()
                .on('html.keydown', message => {
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                        this.timeout = null;
                    }

                    this.timeout = setTimeout(async () => {
                        this.timeout = null;

                        if (this.controller.pattern.trim()) {
                            this.found = await queryServer({
                                messageName: 'SearchOrgs',
                                pattern: this.controller.pattern.trim(),
                            });
                        }
                        else {
                            this.found = [];
                        }

                        this.updateResult();
                    }, 500);
                })
                .bind(this.controller, 'pattern')
            );

            this.setAt(6, 0, 
                mkWidget('span')
                .append(
                    mkICheckbox().bind(this.controller, 'showList')
                    .setStyle({
                        height: '24px',
                        width: '24px',
                        marginRight: '10px',
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
                    .on('html.click', message => this.orgManager.editOrg(dboOrg))
                )
            }

            return table;
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
        constructor(orgManager) {
            super('form');
            this.orgManager = orgManager;
            this.controller = mkActiveData(mkDboOrg());
        }
    }
})();