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
 * Keys used by the module configuration object.  The concept being that all
 * non-Symbol keys are actual usable configuration values.  All of the book
 * keeping properties use symbol keys.
*****/
const moduleKey = Symbol('module');
const pathKey = Symbol('path');


/*****
*****/
register(class ModuleConfig {
    constructor(module) {
        this[moduleKey] = module;
        this[pathKey] = PATH.join(env.configPath, `${module.settings.container}.json`);
    }

    getPath() {
        return this[pathKey];
    }

    getReferences() {
        if ('references' in this) {
            return this.references;
        }
        else {
            return [];
        }
    }

    async load() {
        if (await pathExists(this[pathKey])) {
            let stats = await FILES.stat(this[pathKey]);

            if (stats.isFile()) {
                try {
                    let buffer = await FILES.readFile(this[pathKey]);
                    let jso = fromJson(buffer.toString());
                    Object.assign(this, jso);

                    if (this.validateConfig(jso) !== true) {
                        Object.keys(this).forEach(key => delete this[key]);
                        return `Configuration failed validation.`;
                    }
                }
                catch (e) {
                    return `${e.stack}`;
                }
            }
            else {
                return `Unable to open file.`;
            }
        }
        else {
            return `Path does not exist.`;
        }

        return true;
    }

    validateConfig(jso) {
        if (this[moduleKey].settings.configuration) {
            return this.validateConfigObject(this[moduleKey].settings.configuration, jso);
        }
        else {
            return true;
        }
    }

    validateConfigArray(setting, jso) {
        if (jso === undefined) {
            if (def.required) {
                return false;
            }
        }
        else if (Array.isArray(jso)) {
            for (let index = 0; index < jso.length; index++) {
                let valid;

                if (setting.of.type == 'array') {
                    valid = this.validateConfigObject(setting.of, jso[index]);
                }
                else if (setting.of.type == 'object') {
                    valid = this.validateConfigObject(setting.of, jso[index]);
                }
                else {
                    valid = this.validateConfigScalar(setting.of, jso[index]);
                }

                if (!valid) {
                    return false;
                }
            }
        }
        else {
            return false;
        }

        return true;
    }

    validateConfigObject(setting, jso) {
        if (jso === undefined) {
            if (setting.required) {
                return false;
            }
        }
        else if (typeof jso == 'object' && !Array.isArray(jso)) {
            for (let key in setting) {
                let valid;

                if (setting[key].type == 'array') {
                    valid = this.validateConfigArray(setting[key], jso[key]);
                }
                else if (setting[key].type == 'object') {
                    valid = this.validateConfigObject(setting[key], jso[key]);
                }
                else {
                    valid = this.validateConfigScalar(setting[key], jso[key]);
                }

                if (!valid) {
                    return false;
                }
            }
        }
        else {
            return false;
        }

        return true;
    }

    validateConfigScalar(setting, jso) {
        if (jso === undefined) {
            if (setting.required) {
                return false;
            }
        }
        else if (typeof jso != setting.type) {
            return false;
        }

        return true;
    }

    validateSettings() {
        if ('configuration' in this[moduleKey].settings) {
            if (typeof this[moduleKey].settings.configuration == 'object') {
                let stack = Object.values(this[moduleKey].settings.configuration);

                while (stack.length) {
                    let setting = stack.pop();

                    if (typeof setting == 'object') {
                        if (!('required' in setting)) {
                            logPrimary(`    Module configuration.required not found.`);
                            return false;
                        }
                        else if (typeof setting.required != 'boolean') {
                            logPrimary(`    Module configuration.required not of type boolean: "${setting.required}"`);
                            return false;
                        }

                        if (setting.type == 'string') {
                            continue;
                        }
                        else if (setting.type == 'number') {
                            continue;
                        }
                        else if (setting.type == 'boolean') {
                            continue;
                        }
                        else if (setting.type == 'object') {
                            if (typeof setting.properties == 'object') {
                                for (let subSetting of Object.values(setting.properties)) {
                                    stack.push(subSetting);
                                }
                            }
                            else {
                                logPrimary(`    Module configuration setting.properties is NOT of type "object".`);
                                return false;
                            }
                        }
                        else if (setting.type == 'array') {
                            if (typeof setting.of == 'object') {
                                setting.of.required = false;
                                stack.push(setting.of);
                            }
                            else {
                                logPrimary(`    Module configuration array.of is NOT of type "object".`);
                                return false;
                            }
                        }
                        else {
                            logPrimary(`    Module configuration setting.type "${setting.type}" not supported.`);
                            return false;
                        }
                    }
                    else {
                        logPrimary(`    Module configuration setting "${setting}" is NOT of type "object".`);
                        return false;
                    }
                }
            }
            else {
                logPrimary(`    Module configuration is NOT of type "object".`);
                return false;
            }
        }

        return true;
    }
});
