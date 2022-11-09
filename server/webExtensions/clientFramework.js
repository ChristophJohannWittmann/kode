/*****
 * Copyright (c) 2017-2022 Christoph Wittmann, chris.wittmann@icloud.com
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
'javascript-web-extension';


/*****
 * The array of files and directory, from which to include client files and to
 * load them into the client application framework.  These files only represent
 * the client files belonging to the framework itself.  Each application will
 * also need to 
*****/
const clientFrameworkPaths = [
    'framework/core.js',
    'framework',
    'gui/lib',
    'gui/widgets/inputBase.js',
    'gui/widgets/textArea/entryFilter.js',
    'gui/widgets',
    'gui/editors',
    'gui/panels',
];


/*****
 * A web extension whose purpose is to construct the webapp client framework
 * and to download the appropriate encoding of that framework on demand.  The
 * registered function buildClientLibrary() is reponsible for searching and
 * compiling the final product, which is cached in memory in the individual
 * process for performance purposes.
*****/
register(class ClientFramework extends WebExtension {
    constructor() {
        super();
    }

    async init() {
        this.framework = { '': await buildClientLibrary(clientFrameworkPaths) };
    }

    async handleGET(req, rsp) {
        if (!(rsp.encoding in this.framework)) {
            this.framework[rsp.encoding] = await compress(rsp.encoding, this.framework['']);
        }

        rsp.preEncoded = true;
        rsp.end(this.framework[rsp.encoding]);
    }
});
