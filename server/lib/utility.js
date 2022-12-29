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
 isFile() and isDirectory() are used for performing a one-line asynchronouse
 check on an absolute path provides as the single argument to the function.
*****/
register(async function isDirectory(path) {
    if (await pathExists(path)) {
        let stats = await FILES.stat(path);
        return stats.isDirectory();
    }

    return false;
});


/*****
 isFile() and isDirectory() are used for performing a one-line asynchronouse
 check on an absolute path provides as the single argument to the function.
*****/
register(async function isFile(path) {
    if (await pathExists(path)) {
        let stats = await FILES.stat(path);
        return stats.isFile();
    }

    return false;
});


/*****
 * Minify our CSS before sending off to the client.  The primary purpose is to
 * decrease the data-transfer footprint of the stylesheet before transfer.  It
 * also provides a bit of obfuscation to make some of the more interesting bits
 * of this framework more difficult to reverse engineer.  (Not really important.)
*****/
register(async function minifyCss(verbose) {
    const options = {};
    return await (new npmCssMinifier(options).minify(verbose)).styles;
});


/*****
 * Minify HTML markup text to have a smaller download size.  Our Primary goal
 * is NOT to obfuscate the HTML markup, but rather to provide a more modest
 * download footprint for generated javascript in a non-testing environment.
*****/
register(async function minifyHtml(verbose) {
    const options = {
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        removeHtmlComments: true,
        removeTagWhitespace: true,
    };

    return (await npmHtmlMinifier.minify(verbose, options));
});


/*****
 * Minify our javascript code being sent to the client.  Kode javascript is
 * difficult to minify for browser use because we use a number of features in
 * javascript that are somewhat advanced and are potentially destroyed with
 * full on minification.  We're not really looking for mangling.  We're just
 * trying to compress the code a bit to reduce the size of the download.
*****/
register(async function minifyJs(verbose) {
    const options = {
        compress: {
            arrows: false,
            booleans: false,
            collapse_vars: false,
            comparisons: false,
            computed_props: false,
            conditionals: false,
            dead_code: false,
            directives: false,
            evaluate: false,
            hoist_props: false,
            if_return: false,
            inline: false,
            keep_fargs: false,
            loops: false,
            negate_iife: false,
            properties: false,
            reduce_vars: false,
            reduce_funcs: false,
            sequences: false,
            side_effects: false,
            switches: false,
            typeofs: false,
            unused: false,
        },
        mangle: {
            keep_classnames: true,
            keep_fnames: true,
            reserved: [],
        }
    };

    return (await npmJsMinifier.minify({ code: verbose }, options)).code;
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
 * A utility to simplify dealing with temporary files.  Each function call writes
 * a new file to the temporary directory/folder.  The return valus is a handle
 * the provides both a read() and rm() function, which simplifies code that uses
 * the temporary file and then wants to clean up.
*****/
let nextTempId = 1;

register(async function writeTemp(content) {
    let tempId = nextTempId++;
    let path = PATH.join(env.tempPath, `PID${env.pid}U${tempId}`);
    await FILES.writeFile(path, content);

    return {
        tempId: tempId,
        path: path,
        read: async () => await FILES.read(path),
        rm: async () => await FILES.rm(path),
    };
});
