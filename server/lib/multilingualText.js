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
 * Think of this as a database of text for a web extension in multiple languages.
 * This resides on the server side and should be loading while the system is
 * being initialized.  Then, when there's a requet, The getLanguage() function is
 * called to generate a JSON object containing the text for the browser/client
 * in one of the languages that has been defined.
*****/
register(class MultilingualText {
    constructor(...args) {
        this.text = {};

        for (let arg of args) {
            this.setText(arg);
        }
    }

    addLanguage(language) {
        if (!(language.toLowerCase() in this.text)) {
            this.text[language.toLowerCase()] = {};
        }
    }

    clone() {
        let clone = mkMultilingualText();
        clone.text = global.clone(this.text);
        return clone;
    }

    finalize() {
        this.missing = [];
        let dictionary = mkStringSet();

        for (let lang in this.text) {
            for (let name in this.text[lang]) {
                dictionary.set(name);
            }
        }

        for (let name of dictionary) {
            for (let lang in this.text) {
                if (!(name in this.text[lang])) {
                    this.missing.push(`${lang}.${name}`);
                    this.text[lang][name] = `${lang}.${name}`;
                }
            }
        }

        return this.missing;
    }

    getLanguage(language) {
            if (language) {
            if (language.toLowerCase() in this.text) {
                return this.text[language.toLowerCase()];
            }
            else if (language.indexOf('-') > 0) {
                let [ lang, region ] = language.toLowerCase().split('-');

                if (lang in this.text) {
                    return this.text[lang];
                }
            }

            return {};
        }
        else {
            return Object.keys(this.text)[0];
        }
    }

    getLanguages() {
        return mkStringSet(Object.keys(this.text));
    }

    getMising() {
        return this.missing;
    }

    hasLanguage(language) {
        if (language.toLowerCase() in this.text) {
            return language;
        }
        else if (language.indexOf('-') > 0) {
            let [ lang, region ] = language.toLowerCase().split('-');

            if (lang in this.text) {
                return lang;
            }
        }

        return false;
    }

    setText(obj) {
        for (let key in obj) {
            let values = obj[key];

            for (let lang in values) {
                let text = values[lang];

                if (typeof text != 'string') {
                    throw new Error(`Multilinguarl text object must be flat containing text values!!\n${toJson(obj, true)}`);
                }

                if (!this.hasLanguage(lang)) {
                    this.addLanguage(lang);
                }

                this.text[lang.toLowerCase()][key] = text;
            }
        }
    }
    
    [Symbol.iterator]() {
        return Object.keys(this.text)[Symbol.iterator]();
    }
});
