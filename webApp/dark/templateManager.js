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
     * The TemplateManager is the entry point for editing/managing framework
     * templates.  The manager is the standard search-box-and-create-button type
     * of view.  Most of the hard work occurs within the template editor object.
     * Clicking on one of the searched/displayed templates will open an instance
     * of the TemplateEditor panel, which is flagged as 'transient'.
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

        async revert() {
            super.revert();
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
     * The exhaustive list of choices of MIME types that are supported by the
     * TemplateEditor class.
    *****/
    const mimeChoices = [
        { value: '*/*',                         text: txx.fwTemplateEditorSectionMime },
        { value: 'text/css',                    text: txx.fwMimeCss },
        { value: 'text/html',                   text: txx.fwMimeHtml },
        { value: 'image/bmp',                   text: txx.fwMimeImageBitmap },
        { value: 'image/gif',                   text: txx.fwMimeImageGif },
        { value: 'image/jpeg',                  text: txx.fwMimeImageJpeg },
        { value: 'image/vnd.microsoft.icon',    text: txx.fwMimeImageMsIcon },
        { value: 'image/png',                   text: txx.fwMimeImagePng },
        { value: 'image/svg+xml',               text: txx.fwMimeImageSvg },
        { value: 'text/plain',                  text: txx.fwMimeText },
    ];


    /*****
     * The TemplateEditor is the panel used for editing the entire contet of a
     * framework template object.  It's rather complex.  In addition to its own
     * scalar properties, each template has an array of sections, each of which
     * are displayed as a table, are modifiable, and are displayed/editoed with
     * a supporting class called TemplateSectionEditor.  All of these features
     * are crammed in to support the WEditor feature set.
    *****/
    class TemplateEditor extends WPanel {
        constructor(templateManager, templateOid) {
            super('form');
            this.templateManager = templateManager;
            this.templateOid = templateOid;
            this.setFlag('transient');
            this.setAttribute('autocomplete', 'off');
            this.setRefreshers('TemplateCreateTemplate', 'TemplateModifyTemplate');
            this.showing = null;
            this.refresh();
        }

        copySection(sectionData) {
            console.log(sectionData);
        }

        async createSection() {
            let sectionData = {
                name: '',
                mime: '*/*',
                lang: '**',
                b64: '',
                text: '',
            };

            this.sectionArray.pushNew(sectionData);
            this.sectionArray.revealHead();
            this.ignore();
            this.listen();
        }

        eraseSection(sectionData) {
            console.log(sectionData);
        }

        async refresh() {
            if (this.templateOid > 0n) {
                let templateData = await queryServer({ messageName: 'TemplateGetTemplate', oid: this.templateOid });

                if (templateData) {
                    if (this.templateData) {
                        if (templateData.updated.isLE(this.templateData.updated)) {
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
                        deflang: webAppSettings.lang(),
                        content: '',
                    });
                }
            }

            let sections = (() => {
                if (this.templateData.content.length) {
                    let array = fromJson(mkBuffer(this.templateData.content, 'base64'));
                    array.forEach(section => section.text = mkBuffer(section.b64, 'base64').toString());
                    return array;
                }
                else {
                    return [];
                }
            })();

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
                    deflang: {
                        label: txx.fwTemplateEditorDefaultLanguage,
                        type: ScalarEnum,
                        choices: Languages.getChoices(),
                    },
                }),

                mkWGrid({
                    rows: ['24px', '48px', '24px'],
                    cols: ['6px', '150px', 'auto'],
                })
                .setAt(1, 1,
                    mkIButton()
                    .setValue(txx.fwTemplateEditorCreateSection)
                    .on('dom.click', message => this.createSection())
                ),

                (this.sectionArray = mkWArrayEditor(
                    {
                        property: 'name',
                        label: txx.fwTemplateEditorSectionName,
                        messages: ['dom.focusin'],
                    },
                    {
                        property: 'mime',
                        label: txx.fwMimeMime,
                        messages: ['dom.focusin'],
                        type: ScalarEnum,
                        choices: mimeChoices,
                        classNames: 'screen-l',
                    },
                    {
                        property: 'lang',
                        label: txx.fwTemplateEditorSectionLanguage,
                        messages: ['dom.focusin'],
                        type: ScalarEnum,
                        choices: Languages.getChoices(),
                        classNames: 'screen-l',
                    },
                ))
                .push(...sections)
                .on('dom.focusin', message => {
                    let editor = this.editorMap[ActiveData.id(message.htmlElement.pinned.data)];

                    if (!Object.is(editor, this.showing)) {
                        this.ignore();

                        if (this.showing) {
                            this.showing.remove();
                        }

                        this.showing = editor;
                        this.append(this.showing);
                        this.showing.getEditBox().adjustHeight();
                        this.listen();
                    }
                })
                .on('Widget.Changed', message => this.onWidgetChanged(message)),
            );

            for (let sectionData of this.sectionArray) {
                let editor = new TemplateContentEditor(this, sectionData);
                editor.getEditBox().setAutoHeight();
                this.editorMap[ActiveData.id(sectionData)] = editor;
            }

            this.sectionArray.length() ? this.sectionArray.revealHead() : this.sectionArray.concealHead();
            this.listen();
            super.refresh();
        }

        onWidgetChanged(message) {
            if (message.type == 'array') {
                if (message.action == 'remove') {
                    let id = ActiveData.id(message.object);
                    let templateContentEditor = this.editorMap[id];
                    delete this.editorMap[id];
                    templateContentEditor.remove();
                    this.sectionArray.length() ? false : this.sectionArray.concealHead();
                }
                else if (message.action == 'add') {
                    let id = ActiveData.id(message.object);
                    let editor = new TemplateContentEditor(this, message.object);
                    editor.getEditBox().setAutoHeight();
                    this.editorMap[ActiveData.id(message.object)] = editor;
                    this.sectionArray.revealHead();
                }
            }
        }

        async save() {
            let templateData = this.templateEditor.getValues();

            templateData.content = mkBuffer(toJson(this.sectionArray.getValues().map(section => {
                section.b64 = mkBuffer(section.text).toString('base64');
                delete section.text;
                return section;
            }))).toString('base64');

            if (templateData.oid == 0n) {
                let result = await queryServer({
                    messageName: 'TemplateCreateTemplate',
                    templateData: templateData,
                });

                if (!result.ok) {
                    await mkWAlertDialog({ text: txx[result.feedback] });
                    return;
                }
            }
            else {
                let result = await queryServer({
                    messageName: 'TemplateModifyTemplate',
                    templateData: templateData,
                });

                if (!result.ok) {
                    await mkWAlertDialog({ text: txx[result.feedback] });
                    return;
                }
            }

            this.templateManager.refreshList();
            this.getView().pop();
        }
    }


    /*****
     * The TemplateContentEditor is what's displayed at the bottom of the window
     * for the selected template section.  For text types, it enables entry and
     * editing of the text values.  For image types, it displays the image, which
     * can be deleted via the "Delete" GUI button.  For SVG images, it provides an
     * editor for modifying image path.  SVG images are a framework widget.  Not
     * any old SVG class may be viewed or edited here.
    *****/
    class TemplateContentEditor extends WPanel {
        constructor(templateEditor, sectionData) {
            super('div');
            this.templateEditor = templateEditor;

            this.append(
                (this.controlPanel = mkWNavBar())
                .setInfo(
                    mkWidget('span')
                    .bind(sectionData, 'name')
                )
                .push(
                    mkWCtl()
                    .setInnerHtml(txx.fwTemplateEditorSectionCopy)
                    .setWidgetStyle('ctls-horz-ctl')
                    .on('dom.click', message => this.templateEditor.copySection(sectionData))
                )
                .push(
                    mkWCtl()
                    .setInnerHtml(txx.fwTemplateEditorSectionDelete)
                    .setWidgetStyle('ctls-horz-ctl')
                    .on('dom.click', message => this.templateEditor.eraseSection(sectionData))
                ),

                (this.editBox = mkWTextArea(EssayEntryFilter))
                .bind(sectionData, 'text', Binding.valueBinding)
                .setStyle({
                    marginLeft: '3px',
                    width: 'calc(100% - 19px)',
                }),
            );

            this.listen();
        }

        getEditBox() {
            return this.editBox;
        }
    }
})();