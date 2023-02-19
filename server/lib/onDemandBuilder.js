/*****
 * Copyright (c) 2017-2022 Kode Programming
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
 * On-demend GUI components are GUI classes that are not downloaded along with
 * the client or application framework code.  A client application may want to
 * restrict access to certain GUI components such as org editor or user editor
 * to users that are authorized.  Moreover, it may make sense to provide onl
 * the basic GUI components for opening the web app to improve download time.
 * On demend GUI components are loaded after the web app if up and running for
 * the user.
*****/
register(async function buildOnDemand(lib, paths) {
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

                        if (className in lib) {
                            throw new Error(`Dupulicate class name encountered while loading on-demand objects: "${className}"`);
                        }
                        else {
                            lib[className] = mkBuffer(Config.debug ? await minifyJs(js) : js).toString('base64');
                        }
                    }
                }
            }
        }
    }
});
