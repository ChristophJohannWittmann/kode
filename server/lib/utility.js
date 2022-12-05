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
 * This utility is frequently used when bootstriping the appliation servers an
 * may also be useful in a number of application code area.  It's task is to
 * first detect whether the passed path argument is absolute or relative and
 * then to interpret and return an absolute path, which can be used for finding
 * files on the server.
*****/
register(function absolutePath(base, path) {
    if (PATH.isAbsolute(path)) {
        return path;
    }
    else {
        return PATH.join(base, path);
    }
});


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
 * This function will minify a file based on the content extension of either
 * .js, .css, or .html.  The returned product is nicely compactified and minified
 * to ensure maximum performance over give bandwidth.
*****/
register(async function minify(path) {
    let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
    return (await execShell(`node ${minifyPath} ${path}`)).stdout.trim();
});


/*****
 * As suspected, don't use FS.existsSync() within an async function.  You don't
 * know what the timing of things will be.  In my case, in code embedded way
 * down, all of the timing associated with things were screwed up.  This little
 * wrapper makes our FS.existsSync() call to be safe and asyncronous.
*****/
register(async function pathExists(path) {
    return new Promise(async (ok, fail) => {
        try {
            let handle = await FILES.open(path);
            await handle.close();
            ok(true);
        }
        catch (e) {
            ok(false);
        }
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


/*****
 * Write data to a temporary file and have the temporary file path returned.
 * Optionally, apply an extension to the filename.  Some applications like to
 * have the associated extension in the filename.
*****/
let tempId = 1;

register(async function writeTemp(content, ext) {
    let path = ext ? `PID${env.pid}U${tempId++}.${ext}` : `PID${env.pid}U${tempId++}`;
    await FILES.writeFile(path, content);
    return path;
});
