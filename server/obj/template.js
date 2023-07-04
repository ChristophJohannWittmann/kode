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


/*****
 * The single object used for searching and otherwise managing groups of tempate
 * objects.  One of the main features is that the Templates and TemplateObject
 * classes switch between the "content" format an "sections" format.  Contents
 * is a base64 string containing the content as an array of sections.  Each
 * section is an object with the "b64" property being the base64 representation
 * of the content value, whether that value is interpreted as text or as binary.
*****/
singleton(class Templates {
    async getTemplate(dbc, orgOid, oid) {
        if (typeof oid == 'bigint' || typeof oid == 'number') {
            var dboTemplate = await getDboTemplate(dbc, oid);
        }
        else if (typeof oid == 'string') {
            var dboTemplate = await selectOneDboTemplate(dbc, `_name='${oid}'`);
        }

        if (dboTemplate && dboTemplate.ownerOid == orgOid) {
            return mkTemplateObject(dboTemplate);
        }
    }

    async list(dbc, name) {
        let filter = [];

        if (name !== undefined) {
            filter.push(`_name='${name}'`)
        }

        if (filter.length == 0) {
            filter.push('1=1');
        }

        return await selectDboOrg(dbc, filter.join(' AND '), '_name ASC limit 20');
    }

    async search(dbc, orgOid, pattern) {
        try {
            if (pattern.indexOf('*') >= 0) {
                return (await selectDboTemplate(dbc, `_org_oid=${orgOid}`, '_name ASC limit 20'))
                .map(dboTemplate => mkTemplateObject(dboTemplate));
            }
            else {
                return (await selectDboTemplate(dbc, `_name ~* ${dbc.str(dbText, pattern)} AND _org_oid=${orgOid}`, '_name ASC limit 20'))
                .map(dboTemplate => mkTemplateObject(dboTemplate));
            }
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }
});


/*****
 * TemplateObject extends DboTemplate and helps with the management of section
 * values.  The TemplateObject's content is a blob of b64, which is JSON text
 * of an array of sections.  Each section has some properties, including "b64",
 * which is the base64 encoding of the section's content.  This encoding is
 * applied for both text and binary template content.
*****/
register(class TemplateObject extends DboTemplate {
    constructor(properties, session) {
        super(properties);
        this.feedback = '';

        if (this.oid == 0n) {
            if (session) this.orgOid = session.orgOid;
            if (session) this.ownerOid = session.orgOid;
            this.created = mkTime();
        }

        this.updated = mkTime();
    }

    getName() {
        return this.name;
    }

    getSection(name) {
        return this.getSections().filter(section => section.name == name)[0];
    }

    getSectionContent(name) {
        let section = this.getSections().filter(section => section.name == name)[0];
        return section ? mkBuffer(section.b64, 'base64').toString() : '';
    }

    getSectionTextTemplate(name) {
        let section = this.getSections().filter(section => section.name == name)[0];
        return section ? mkTextTemplate(mkBuffer(section.b64, 'base64').toString()) : '';
    }

    getSections() {
        return fromJson(mkBuffer(this.content, 'base64').toString());
    }

    getSectionNames() {
        return this.getSections().map(section => section.name);
    }

    [Symbol.iterator]() {
        this.getSections()[Symbol.iterator]();
    }

    async validate(dbc) {
        let dups = await selectDboTemplate(dbc, `_org_oid=${this.orgOid} AND _name=${dbc.str(dbText, this.name)}`);

        if (dups.length == 1 && dups[0].oid != this.oid) {
            this.feedback = 'fwTemplateEditorDuplicateTemplateName';
            return false;
        }

        let sectionNames = mkStringSet();

        for (let section of this.getSections()) {
            if (sectionNames.has(section.name)) {
                if (section.lang == this.lang) {
                    this.feedback = 'fwTemplateEditorDuplicateSectionName';
                    return false;
                }
            }
            else {
                sectionNames.set(section.name);
            }
        }

        return true;
    }
});