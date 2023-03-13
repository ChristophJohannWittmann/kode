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
 * The HTML "a" element or anchor is called a link with the widgetverse.  The
 * widget style is set to "link", which provides the UI look and feel needed for
 * links.  Links can also be used like buttons by not setting the href, although
 * that is discouraged since input type="button" is a stanard widget thats geared
 * up for use as a button.
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
        this.setWidgetStyle('link')
        .setAttribute('referrerpolicy', 'no-referrer')
        .setAttribute('href', '#')
        .setAttribute('onclick', 'return false');
    }

    clearDownload() {
        this.clearAttribute('download');
        return this;
    }

    clearHref() {
        this.setAttribute('href', '#');
        this.setAttribute('onclick', 'return false');
        return this;
    }

    clearReferrerPolicy() {
        this.clearAttribute('referrerpolicy');
        return this;
    }

    clearTarget() {
        this.clearAttribute('target');
        return this;
    }

    getDownload() {
        return this.hasAttribute('download');
    }

    getHost() {
        return this.node.host;
    }

    getHostname() {
        return this.node.hostname;
    }

    getHref() {
        return this.getAttribute('href');
    }

    getOrigin() {
        return this.node.origin;
    }

    getPassword() {
        return this.node.password;
    }

    getPathname() {
        return this.node.pathname;
    }

    getPort() {
        return this.node.port;
    }

    getProtocol() {
        return this.node.protocol;
    }

    getReferrerPolicy() {
        return this.getAttribute('referrerpolicy');
    }

    getSearch() {
        return this.node.search;
    }

    getTarget() {
        return this.getAttribute('target');
    }

    getUsername() {
        return this.node.username;
    }

    setDownload() {
        this.setAttribute('download');
        return this;
    }

    setHref(value) {
        this.setAttribute('href', value);
        this.clearAttribute('onclick');
        return this;
    }

    setReferrerPolicy(value) {
        this.setAttribute('target', value);
        return this;
    }

    setTarget(value) {
        this.setAttribute('target', value);
        return this;
    }
});
