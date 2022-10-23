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
 * A link widget is a wrapper for an HTML anchor or "a" element.  It's one of
 * primary functional elements of an HTML document.  In essence, we like to make
 * links look either like (a) traidtional/old-style browser links, link-1 style
 * or (2) likea push button, link-2.  By default, link-1 style is chosen.
*****/
register(class WLink extends Widget {
    static referrerPolicyEnum = mkStringSet(
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url',
    );

    static targetEnum = mkStringSet(
        '_blank',
        '_parent',
        '_self',
        '_top',
    );

    constructor() {
        super('a');
        this.setAttribute('target', '_self');
        this.setAttribute('referrerpolicy', 'no-referrer');
    }

    getDownload() {
        return this.hasAttribute('download');
    }

    getHref() {
        return this.getAttribute('href');
    }

    getReferrerPolicy() {
        return this.getAttribute('referrerpolicy');
    }

    getTarget() {
        return this.getAttribute('target');
    }

    setDownload() {
        if (!this.hasAttribute('download')) {
            this.setAttribute('download');
        }

        return this;
    }

    setHref(value) {
        this.setAttribute('href', value);
        return this;
    }

    setReferrerPolicy(value) {
        if (WLink.referrerPolicyEnum.has(value)) {
            this.setAttribute('target', value);
        }

        return this;
    }

    setTarget(value) {
        if (WLink.targetEnum.has(value)) {
            this.setAttribute('target', value);
        }

        return this;
    }
});
