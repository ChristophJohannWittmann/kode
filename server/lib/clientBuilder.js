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
 * A useful function that is utilized to build a client library, whether it's the
 * overall client framework or if it's a set of applcation files.  Iterate through
 * the array of paths and load files as encountered.  Files are processed directly
 * while directories ore expanded to load each file and sub-directory file in
 * alphabetical order.  There are files taht must appear before others in client
 * library blob.  Hence, place dependencies earlier on in the paths array, which
 * is the input parameter.  If you have a single file in a directory that needs to
 * be first in line, just put in the path of that file followed by the directory
 * itself.  Don't worry about it.  This code will dedupe file names.  The result
 * is that the individually specified file will appear before the others.
*****/
register(async function buildClientCode(paths) {
    let rawJS = [];
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
            rawJS.push(code);
        }
        else if (stats.isDirectory()) {
            for (let filePath of await recurseFiles(path)) {
                stats = await FILES.stat(filePath);

                if (stats.isFile() && filePath.endsWith('.js') && !fileSet.has(filePath)) {
                    fileSet.set(filePath);
                    let code = (await FILES.readFile(filePath)).toString();
                    rawJS.push(code);
                }
            }
        }
    }

    return Config.debug ? rawJS.join('') : await minifyJs(rawJS.join(''));
});
