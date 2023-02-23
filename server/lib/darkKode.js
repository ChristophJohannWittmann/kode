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
 * Dark code is javascript code that's not download with the initial web
 * extension download from the server.  A "thunk" object on the client site is
 * registered and when an attempt to construct the dark thunk is performed,
 * the dark thunk downloads the full class code, registers the full class to
 * replace the dark thunk and then replaces itself with a new created object
 * of the full class.  For now, it's only working for widgets, of which there
 * may be hundreds to be downloaded.  Future releases may go beyond dark widgets.
*****/
singleton(class DarkKode {
    constructor() {
        this.libs = {};
    }

    getBlob(libName) {
        let blob = [];

        if (libName in this.libs) {
            for (let className in this.libs[libName]) {
                let js =
`register(class ${className} extends DarkWidget {
    constructor(...args) {
        super(...args)
        this.libName = '${libName}';
        this.download(...args);
    }
});`;

                blob.push(Config.debug ? js : minifyJs(js));
            }
        }

        return blob.join('\n');
    }

    getClass(libName, className) {
        if (libName in this.libs) {
            if (className in this.libs[libName]) {
                return this.libs[libName][className];
            }
        }

        return '';
    }

    async import(libName, paths) {
        if (!(libName in this.libs)) {
            this.libs[libName] = {};
        }

        let fileSet = mkStringSet();

        for (let path of paths) {
            let absPath = absolutePath(env.kodePath, path);

            if (!fileSet.has(absPath)) {
                fileSet.set(absPath);
            }
        }

        for (let path of fileSet) {
            let stats = await FILES.stat(path);

            if (stats.isFile() && path.endsWith('.js')) {
                let code = (await FILES.readFile(path)).toString();
                fileSet.set(path);
                raw.push(code);
            }
            else if (stats.isDirectory()) {
                for (let filePath of await recurseFiles(path)) {
                    stats = await FILES.stat(filePath);

                    if (stats.isFile() && filePath.endsWith('.js') && !fileSet.has(filePath)) {
                        fileSet.set(filePath);
                        let js = (await FILES.readFile(filePath)).toString();
                        let match = js.match(/register *\( *class *([a-zA-Z0-9_]+)/m);

                        if (match) {
                            let className = match[1];
                            this.libs[libName][className] = mkBuffer(Config.debug ? js : await minifyJs(js)).toString('base64');
                        }
                    }
                }
            }
        }
    }

    isEmpty(libName) {
        if (libName in this.libs) {
            return Object.keys(this.libs[libName]) == 0;
        }

        return true;
    }

    [Symbol.iterator]() {
        return Object.keys(this.libs)[Symbol.iterator]();
    }

    symbols(libName) {
        if (libName in this.libs) {
            return Object.keys(this.libs[libName]);
        }

        return [];
    }
});
