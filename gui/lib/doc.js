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
 * The framework API wrapper for the DOM document object.  Our primary purpose
 * is to simplifiy the complexity and histority mess associated with the long
 * history of the document API.
*****/
register(class Document extends Emitter {
    constructor(doc) {
        super();
        this.doc = doc;
    }

    body() {
        return mkHtmlElement(this.doc.body);
    }

    getStyleSheet(title) {
        if (title) {
            for (let styleSheet of this.getStyleSheets()) {
                if (styleSheet.title() == title) {
                    return styleSheet;
                }
            }

            return null;
        }
        else {
            return mkStyleSheet(this.doc.styleSheets[0]);
        }
    }

    getStyleSheets() {
        let styleSheets = [];

        for (let sheet of this.doc.styleSheets) {
            styleSheets.push(mkStyleSheet(sheet));
        }

        return styleSheets;
    }

    head() {
        return mkHtmlElement(this.doc.head);
    }

    html() {
        return mkHtmlElement(this.doc.documentElement);
    }

    query(selector) {
        if (typeof selector == 'string' && selector != '') {
            let selected = this.doc.querySelector(selector);

            if (selected) {
                return mkHtmlElement(selected);
            }
        }

        return null;
    }

    queryAll(selector) {
        let selected = [];
      
        if (typeof selector == 'string' && selector != '') {
            let nodeList = document.querySelectorAll(selector);
      
            for (let i = 0; i < nodeList.length; i++) {
                selected.push(mkHtmlElement(nodeList.item(i)));
            }
        }

        return selected;
    }

    title() {
        return this.doc.title;
    }

    url() {
        return this.doc.URL;
    }
});
