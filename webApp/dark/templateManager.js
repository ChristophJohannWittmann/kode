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
    register(class TemplateManager extends WPanel {
        constructor() {
            super('div');

            this.controller = mkActiveData({
                searchPattern: '',
            });

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwTemplateTitle),
            
                mkWGrid({
                        rows: ['12px', '48px', '12px'],
                        cols: ['12px', '150px', 'auto'],
                })
                .setAt(1, 1,
                    mkIButton()
                    .setValue(txx.fwTemplateEditorCreateTemplate)
                    .on('dom.click', message => {
                        this.getView().push(new TemplateEditor(this, 0n));
                    })
                ),

                mkWGrid({
                        rows: ['12px', 'auto', '12px', '48px', '24px', 'auto'],
                        cols: ['12px', 'minmax(350px, 90%)', 'auto'],
                })
                .setAt(1, 1,
                    mkWidget()
                    .setClassNames('font-size-4')
                    .setInnerHtml(txx.fwTemplateSearch)
                )
                .setAt(3, 1,
                    mkIDynamic(500)
                    .setPanelState('focus', true)
                    .bind(this.controller, 'searchPattern', Binding.valueBinding)
                    .on('Input.Pause', message => this.refreshList())
                )
                .setAt(5, 1,
                    (this.matches = mkWArrayEditor(
                        {
                            property: 'name',
                            label: txx.fwTemplateEditorName,
                            readonly: true,
                            messages: ['dom.click'],
                        }
                    ))
                    .on('dom.click', message => {
                        let templateOid = message.htmlElement.getPinned('data').oid;
                        this.getView().push(new TemplateEditor(this, templateOid));
                    })
                ),
            );

            this.refreshList();
        }

        async refreshList() {
            if (this.controller.searchPattern.trim()) {
                var templateArray = await queryServer({
                    messageName: 'TemplateSearchTemplates',
                    pattern: this.controller.searchPattern.trim(),
                });
            }
            else {
                var templateArray = [];
            }

            this.matches.clear();
            this.matches.push(...templateArray);
        }
    });


    /*****
    *****/
    class TemplateEditor extends WPanel {
        constructor(templateManager, templateOid) {
            super('div');
            this.templateManager = templateManager;
            this.templateOid = templateOid;
            this.setFlag('transient');
            this.setAttribute('autocomplete', 'off');
            this.setRefreshers('TemplateModifyTemplate');
            this.showing = null;
            this.refresh();
        }

        async refresh() {
            if (this.templateOid > 0n) {
                let templateData = await queryServer({ messageName: 'TemplateGetTemplate', oid: this.templateOid });

                if (templateData) {
                    if (this.templateData) {
                        if (templateData.updated.isLE(this.templateData.getField('updated'))) {
                            return;
                        }
                    }

                    this.templateData = templateData;
                }
                else {
                    return;
                }
            }
            else {
                if (this.templateData) {
                    return;
                }
                else {
                    this.templateData = new Object({
                        oid: 0n,
                        created: mkTime(),
                        updated: mkTime(),
                        orgOid: webAppSettings.org() ? webAppSettings.org().oid : 0n,
                        ownerType: 'DboOrg',
                        ownerOid: webAppSettings.org() ? webAppSettings.org().oid : 0n,
                        name: '',
                        //sections: [],
                        sections: [
                            { name: 'Body', mime: 'text/html', lang: 'en', b64: 'PGh0bWw+CiAgICA8aGVhZD4KICAgIDwvaGVhZD4KICAgIDxib2R5PgogICAgICAgIDxoMT5QbGVhc2UgVmVyaWZ5IFlvdXJzZWxmPC9oMT4KICAgIDwvYm9keT8KPC9odG1sPg==' },
                            { name: 'Subject', mime: 'text/plain', lang: 'en', b64: `UGxlYXNlIHZlcmlmeSB5b3VyIGVtYWlsIGFkZHJlc3M=` },
                        ],
                    });
                }
            }

            this.ignore();
            this.clear();
            this.editorMap = {};

            this.append(
                mkWidget('h3')
                .setInnerHtml(txx.fwTemplateEditorTitle),

                (this.templateEditor = mkWObjectEditor())
                .add(this.templateData, {
                    name: {
                        label: txx.fwTemplateEditorName,
                        focus: true,
                    },
                }),

                mkWGrid({
                    rows: ['12px', '48px', '12px'],
                    cols: ['6px', '150px', 'auto'],
                })
                .setAt(1, 1,
                    mkIButton()
                    .setValue(txx.fwTemplateEditorCreateSection)
                    .on('dom.click', message => {
                        console.log('clicked CREATE SECTION BUTTON.')
                    })
                ),

                (this.sectionArray = mkWArrayEditor(
                    {
                        property: 'name',
                        label: txx.fwTemplateEditorSectionName,
                        messages: ['dom.focusin'],
                    },
                    {
                        property: 'mime',
                        label: txx.fwTemplateEditorSectionMime,
                        messages: ['dom.focusin'],
                        type: ScalarEnum,
                        choices: [
                            { value: 'text/css',    text: txx.fwTemplateEditorSectionTypeCss },
                            { value: 'text/html',   text: txx.fwTemplateEditorSectionTypeHtml },
                            { value: 'text/plain',  text: txx.fwTemplateEditorSectionTypeText },
                        ]
                    },
                ))
                .push(...this.templateData.sections)
                .on('dom.focusin', message => {
                    let editor = this.editorMap[ActiveData.id(message.htmlElement.pinned.data)];

                    if (!Object.is(editor, this.showing)) {
                        this.ignore();

                        if (this.showing) {
                            this.showing.remove();
                        }

                        this.showing = editor;
                        this.append(this.showing);
                        this.showing.adjustHeight();
                        this.listen();
                    }
                }),
            );

            for (let sectionData of this.sectionArray) {
                let editor = new TemplateContentEditor(sectionData).setAutoHeight();
                this.editorMap[ActiveData.id(sectionData)] = editor;
            }

            this.listen();
            super.refresh();
        }

        async save() {
            console.log('SAVE...');
            /*
            let userData = this.userEditor.getValues();

            if (userData.oid == 0n) {
                let result = await queryServer({
                    messageName: 'UserCreateUser',
                    userData: userData,
                });

                if (!result.ok) {
                    await mkWAlertDialog({ text: txx[result.feedback] });
                    return;
                }
            }
            else {
                await queryServer({
                    messageName: 'UserModifyUser',
                    userData: userData,
                });
            }

            this.userManager.refreshList();
            this.getView().pop();
            */
        }
    }


    /*****
    *****/
    class TemplateContentEditor extends WTextArea {
        constructor(sectionData) {
            super(EssayEntryFilter);
            sectionData.text = mkBuffer(sectionData.b64, 'base64').toString();
            this.bind(sectionData, 'text', Binding.valueBinding);

            this.setStyle({
                marginLeft: '3px',
                width: 'calc(100% - 19px)',
                fontFamily: 'courier',
                fontSize: '14px',
            });

            console.log(Languages.selectIso1(mkStringSet('en', 'de', 'fr', 'es')));
        }
    }
})();