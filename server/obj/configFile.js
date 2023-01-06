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
 * This function loads, creates, and manages a class used for managing the main
 * server configuration file.  It's name must be builtin.json, which means it's
 * the configuration file for the "builtin" namespace.  This class is used by
 * system administrators when managing the server configuration.
*****/
register(async function loadConfigFile(name) {
    let exists = true;
    const filePath = PATH.join(env.configPath, `${name}.json`);

    class ServerSettings {
        constructor() {
            return new Promise(async (ok, fail) => {
                if (await isFile(filePath)) {
                    try {
                        let buffer = await FILES.readFile(filePath);
                        let object = fromJson(buffer.toString());
                        Object.assign(this, object);
                    }
                    catch (e) {}
                }

                ok(this);
            });
        }

        [Symbol.iterator]() {
            Object.keys(this)[Symbol.iterator]();
        }

        async save() {
            await FILES.writeFile(filePath, toJson(this, true));
        }
    }

    return await (new ServerSettings());
});
