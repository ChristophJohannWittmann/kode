/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
*****/
class Content {
    constructor(mime, content) {
        this.mime = mime;
        this.content = content;
    }
}


/*****
*****/
singleton(class ContentManager {
    static formatters = {
        binary: buffer => buffer,
        string: buffer => buffer.toString(),
    };

    constructor() {
        this.modules = {};
    }
    
    async get(url, path) {
    }
    
    async register(url, path) {
        console.log(url, path);
    }
});
/*
    static get = async (path) => {
        if (path in $Content._lib) {
            let entry = $Content._lib[path];

            if (!entry.dir) {
                if ('data' in entry) {
                    return {mime: entry.mime, data: entry.data};
                }
                else {
                    let rawContent = await Files.readFile(entry.abs);
                    let mime = $Mime.fromExtension(Path.extname(entry.abs));
                    let content = $Content._formatters[mime.type](rawContent);

                    if ($Config.cacheFlag) {
                        entry.mime = mime.code;
                        entry.data = content;
                    }

                    return {mime: mime, data: content};
                }
            }
        }
        else {
            let pathPart = Path.dirname(path);

            if (pathPart in $Content._lib) {
                let entry = $Content._lib[pathPart];

                if (entry.dir) {
                    let abs = `${entry.abs}/${Path.basename(path)}`;
                    let rawContent = await Files.readFile(abs);
                    let mime = $Mime.fromExtension(Path.extname(path));
                    let content = $Content._formatters[mime.type](rawContent);

                    if ($Config.cacheFlag) {
                        $Content._lib[path] = {
                            rel: path,
                            abs: abs,
                            dir: false,
                            data: content,
                            mime: mime.code
                        };
                    }

                    return {mime: mime.code, data: content};
                }
            }
        }

        return {mime: '', data: null};
    };

    static include = async (path, content, mimeCode) => {
        if (path in $Content._lib) {
            throw new Error(`class: $Content, method: include(), Duplicate Path: ${path}`);
        }

        if (content) {
            $Content._lib[path] = {
                rel: path,
                abs: '',
                dir: false,
                data: content,
                mime: mimeCode
            };

            return;
        }

        let abs = Path.join($Config.applicationPath, path);

        if (FS.existsSync(abs)) {
            let stat = await Files.stat(abs);

            if (stat.isFile()) {
                $Content._lib[path] = {
                    rel: path,
                    abs: abs,
                    dir: false,
                };
            }
            else if (stat.isDirectory()) {
                let stack = [{path: path, abs: abs}];

                while (stack.length) {
                    let {path: path, abs: abs} = stack.pop();
                    let entries = await Files.readdir(abs);

                    for (let i = 0; i < entries.length; i++) {
                        let abs1 = `${abs}/${entries[i]}`;
                        let path1 = `${path}/${entries[i]}`;
 
                        if ((await Files.stat(abs1)).isDirectory()) {
                            $Content._lib[path1] = {
                                rel: path1,
                                abs: abs1,
                                dir: true,
                            };

                            stack.push({path: path1, abs: abs1});
                        }
                    }
                }
            }
            else {
                throw new Error(`class: $Content, method: include(), Invalid filetype: ${path}`);
            }
        }
        else {
            throw new Error(`class: $Content, method: include(), Nonexistent path: ${path}`);
        }
    };
});
*/
