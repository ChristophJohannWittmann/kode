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


/*****
 * Wrap the Promise-based function from the child_process builtin module to make
 * it ready as an asynchronous or async call: await execShell('ls -l');
*****/
register(async function execShell(script) {
    return new Promise((ok, fail) => {
        CHILDPROC.exec(script, (error, stdout, stderr) => {
            ok({
                error: error,
                stdout: stdout,
                stderr: stderr,
            });
        });        
    });
});


/*****
 * For each of the passed relative or absolute paths, recurse each directory
 * to generate an array of the absolute paths to all files in the directory
 * and its subdirectory tree.  The directory and subdirectory are not included
 * in the returned result.
*****/
register(async function recurseDirectories(...args) {
    let dirs = [];
    let stack = [await PATH.resolve(PATH.resolve(...args))];

    while (stack.length) {
        let path = stack.pop();
  
        try {
            let stats = await FILES.stat(path);
  
            if (stats.isDirectory()) {
                dirs.push(path);

                (await FILES.readdir(path)).forEach(fileName => {
                    stack.push(`${path}/${fileName}`);
                });
            }
        } catch (e) {}
    }
  
    dirs.shift();
    return dirs;
});


/*****
 * For each of the passed relative or absolute paths, recurse each directory
 * to generate an array of the absolute paths to all files in the directory
 * and its subdirectory tree.  The directory and subdirectory are not included
 * in the returned result.
*****/
register(async function recurseFiles(...args) {
    let files = [];
    let stack = [await PATH.resolve(PATH.resolve(...args))];

    while (stack.length) {
        let path = stack.pop();
  
        try {
            let stats = await FILES.stat(path);
  
            if (stats.isDirectory()) {
                (await FILES.readdir(path)).forEach(fileName => {
                    stack.push(`${path}/${fileName}`);
                });
            }
            else if (stats.isFile()) {
                files.push(path);
            }
        } catch (e) {}
    }
  
    return files;
});
