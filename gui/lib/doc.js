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
 * The framework API wrapper for the DOM document object.  Our primary purpose
 * is to simplifiy the complexity and histority mess associated with the long
 * history of the document API.
*****/
register(class Doc extends Emitter {
    constructor(doc) {
        super();
        this.doc = doc;

        [
            'scroll',
            'visibilitychange',
            'wheel',
            'animationcancel',
            'animationend',
            'animationiteration',
            'animationstart',
            'contextmenu',
            'copy',
            'cut',
            'paste',
            'drag',
            'dragend',
            'dragenter',
            'dragleave',
            'dragover',
            'dragstart',
            'drop',
            'fullscreenchange',
            'fullscreenerror',
            'keydown',
            'keyup',
            'DOMContentLoaded',
            'readystatechange',
            'gotpointercapture',
            'lostpointercapture',
            'pointercancel',
            'pointerdown',
            'pointerenter',
            'pointerleave',
            'pointerlockchange',
            'poointerlockerror',
            'pointermove',
            'pointerout',
            'pointerover',
            'pointerup',
            'selectchange',
            'touchcancel',
            'touchend',
            'touchmove',
            'touchstart',
            'transitioncancel',
            'transitionend',
            'transitionrun',
            'transitionstart',
        ].forEach(eventName => this.doc.addEventListener(eventName, event => {
            this.send({
                messageName: eventName,
                event: mkHtmlEvent(event)
            });
        }));
    }

    activeElement() {
        return this.doc.activeElement;
    }

    characterSet() {
        return this.doc.characterSet;
    }

    cookies() {
        return [];
    }

    direction() {
        return this.doc.dir;
    }

    getBody() {
        return mkHtmlElement(this.doc.body);
    }

    getHead() {
        return mkHtmlElement(this.doc.head);
    }

    getHtml() {
        return mkHtmlElement(this.doc.documentElement);
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
            return mkCssStyleSheet(this.doc.styleSheets[0]);
        }
    }

    getStyleSheets() {
        let styleSheets = [];

        for (let sheet of this.doc.styleSheets) {
            styleSheets.push(mkCssStyleSheet(sheet));
        }

        return styleSheets;
    }

    hidden() {
        return this.doc.hidden;
    }

    location() {
        return this.doc.location;
    }

    readyState() {
        return this.doc.readyState;
    }

    referer() {
        return this.doc.referer;
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

    queryOne(selector) {
        if (typeof selector == 'string' && selector != '') {
            let selected = this.doc.querySelector(selector);

            if (selected) {
                return mkHtmlElement(selected);
            }
        }

        return null;
    }

    title() {
        return this.doc.title;
    }

    url() {
        return this.doc.URL;
    }
});
