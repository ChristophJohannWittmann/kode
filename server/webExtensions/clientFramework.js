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
*****/
const clientFrameworkPaths = [
    'framework/core.js',
    'framework',
    'gui/lib',
    'gui/widgets',
    'gui/views',
];


/*****
*****/
exports = module.exports = register(class ClientFramework extends WebExtension {
    constructor() {
        super();
    }

    async init() {
        let raw = [];
        let fileArray = [];
        let fileSet = mkSet();

        for (let path of clientFrameworkPaths) {
            let absPath = PATH.join(env.kodePath, path);

            if (!fileSet.has(absPath)) {
                fileSet.set(absPath);
                fileArray.push(absPath);
            }
        }

        for (let path of fileArray) {
            let stats = await FILES.stat(path);

            if (path.endsWith('.js') && stats.isFile()) {
                let code = Config.minify ? await minify(path) : (await FILES.readFile(path)).toString();
                raw.push(code);
            }
            else if (stats.isDirectory()) {
                for (let filePath of await recurseFiles(path)) {
                    stats = await FILES.stat(filePath);

                    if (filePath.endsWith('.js') && stats.isFile()) {
                        let code = Config.minify ? await minify(filePath) : (await FILES.readFile(filePath)).toString();
                        raw.push(code);
                    }
                }
            }

            this.framework = { '': raw.join('') };
        }
    }

    async handleGET(req, rsp) {
        if (!(rsp.encoding in this.framework)) {
            this.framework[rsp.encoding] = await compress(rsp.encoding, this.framework['']);
        }

        rsp.preEncoded = true;
        rsp.end(this.framework[rsp.encoding]);
    }
});
