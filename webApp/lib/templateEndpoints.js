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
 * Templates are at the heart of external person and system communications.  A
 * template provides a name, and a content section with mulitple sections.  The
 * content is actually base64 encoding of a js array.  This package of endpoints
 * provides the means for managing templates for the user's current organization
 * setting.
*****/
register(class TemplateEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }
    
    async [ mkEndpoint('TemplateCreateTemplate', 'template', { notify: true }) ](trx) {
        if (trx.templateData.oid == 0n) {
            let dbc = await trx.connect();
            let template = mkTemplateObject(trx.templateData, trx.session);

            if (await template.validate(dbc) !== true) {
                return { ok: false, feedback: template.feedback };
            }

            await template.save(dbc);
            return { ok: true };
        }

        return { ok: false, feedback: 'fwTemplateEditorErrorWrongEndpoint' };
    }
    
    async [ mkEndpoint('TemplateEraseTemplate', 'template', { notify: true }) ](trx) {
        if (trx.templateData.oid > 0n) {
            let template = mkTemplateObject(trx.templateData, trx.session);

            if (template.ownerType == 'DboOrg' && template.ownerOid == trx.session.orgOid) {
                await template(await trx.connect());
            }
        }

        return { ok: true };
    }
    
    async [ mkEndpoint('TemplateGetTemplate', 'template') ](trx) {
        return await Templates.getTemplate(await trx.connect(), trx.session.orgOid, trx.oid);
    }
    
    async [ mkEndpoint('TemplateModifyTemplate', 'template', { notify: true }) ](trx) {
        if (trx.templateData.oid > 0n) {
            let dbc = await trx.connect();
            let template = mkTemplateObject(trx.templateData, trx.session);

            if (await template.validate(dbc) !== true) {
                return { ok: false, feedback: template.feedback };
            }

            await template.save(dbc);
            return { ok: true };
        }

        return { ok: false, feedback: 'fwTemplateEditorErrorWrongEndpoint' };
    }
    
    async [ mkEndpoint('TemplateSearchTemplates', 'template', { notify: true }) ](trx) {
        return await Templates.search(await trx.connect(), trx.session.orgOid, trx.pattern);
    }
});
