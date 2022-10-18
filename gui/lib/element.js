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
 * Normalization means to convert the passed element into either a standard DOM
 * Text object or a standard HTMLElement object.  An acceptable argument must
 * be either of those two or one of the wrapper types, HtmlText or HtmlElement.
*****/
register(function reducio(arg) {
    if (arg instanceof HTMLElement) {
        return arg;
    }
    else if (arg instanceof HtmlElement) {
        return arg.node;
    }
    else if (arg instanceof Text) {
        return arg;
    }
    else if (arg instanceof HtmlText) {
        return arg.node;
    }
    else if (arg instanceof Widget) {
        return arg.htmlElement.node;
    }
    else {
        throw new Error(`Unsupported argument type: ${arg}`);
    }
});


/*****
 * The HtmlNode class provides a wrapper for existing DOM HTMLElements and Text
 * objects.  This class is NOT used for creating new objects.  It's only for
 * wrapping existing objects with a more efficient API.  HtmlNode is the base
 * class for HtmlText and HtmlElement.  Methods in this class are applicable for
 * both types of derived object instances.
*****/
register(class HtmlNode {
    constructor(node) {
        this.node = node;
    }

    dir() {
        console.dir(this._node);
        return this;
    }

    firstChild() {
        if (this.node.firstChild) {
            let child = this.node.firstChild;

            if (child instanceof HTMLElement) {
                return mkHtmlElement(child);
            }
            else {
                return mkHtmlText(child);
            }
        }

        return null;
    }

    insertAfter(...args) {
        if (this.node.parentNode) {
            let nextSibling = this.node.nextSibling;
  
            if (nextSibling) {
                for (let arg of args) {
                    this.node.parentNode.insertBefore(reducio(arg), nextSibling);
                }
            }
            else {
                for (let arg of args) {
                    this.node.parentNode.appendChild(reducio(arg));
                }
            }
        }
  
        return this;
    }

    insertBefore(...args) {
        if (this.node.parentNode) {
            for (let arg of args) {
                this.node.parentNode.insertBefore(reducio(arg), this.node);
            }
        }

        return this;
    }

    isElement() {
        return this.node instanceof HTMLElement;
    }
  
    isSame(arg) {
        if (arg instanceof Node) {
            return this.node.isSameNode(arg);
        }
        else if (arg instanceof DomNode) {
            return this.node.isSameNode(arg.node);
        }
        else {
            return false;
        }
    }

    isText() {
        return this.node instanceof Text;
    }

    lastChild() {
        if (this.node.lastChild) {
            let child = this.node.firstChild;

            if (child instanceof HTMLElement) {
                return mkHtmlElement(child);
            }
            else {
                return mkHtmlText(child);
            }
        }

        return null;
    }

    log() {
        console.log(this.node);
        return this;
    }
  
    nextSibling() {
        if (this.node.nextSibling) {
            return mkHtmlElement(this.node.nextSibling);
        }

        return null;
    }
  
    parent() {
        if (this.node.parentNode) {
            return mkHtmlElement(this.node.parentNode);
        }
        else {
            return null;
        }
    }
  
    prevSibling() {
        if (this.node.previousSibling) {
            return mkHtmlElement(this.node.previousSibling);
        }
        else {
            return null;
        }
    }

    remove() {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
        }

        return this;
    }

    replace(...args) {
        if (this.node.parentNode) {
            let inserted;

            if (args.length) {
                inserted = reducio(args[0]);
                this.node.parentNode.replaceChild(inserted, this.node);

                for (let i = 1; i < args.length; i++) {
                    let node = reducio(args[i]);
                    inserted.insertAfter(node, inserted);
                    inserted = node;
                }
            }
        }

        return this;
    }
});


/*****
 * The HtmlText element is a wrapper the DOM built in Text class.  Instances
 * of HtmlText are return in API class that refer to the underlying Text class.
 * Moreover, HtmlText provides a link-free copy function.
*****/
register(class HtmlText extends HtmlNode {
    constructor(arg) {
        super(reducio(arg));
    }

    copy() {
        return htmlText(this.text());
    }
  
    text() {
        return this.node.wholeText;
    }
});


/*****
 * The HtmlElement provides a wrapper for the underlying DOM HTMLElement object.
 * Primarily, it's an extension or refrinement of the underlying DOM API and is
 * oriented to facilitate chaining function calls, where possible.  Note that get
 * and has calls do NOT logically support chaining.  Additionally, this class
 * also wraps the standard Emitter class to make the event-structure associated
 * with an HMTLElement fits within the framework API for events and messaging.
*****/
register(class HtmlElement extends HtmlNode {
    constructor(arg) {
        super(reducio(arg));
    }

    append(...args) {
        for (let arg of args) {
            this.node.appendChild(reducio(arg));
        }

        return this;
    }

    children() {
        let children = [];

        for (let i = 0; i < this.node.childNodes.length; i++) {
            let child = this.node.childNodes.item(i);

            if (child instanceof Element) {
                children.push(mkHtmlElement(child));
            }
            else if (child instanceof Text) {
                children.push(mkHtmlText(child));
            }
        }

        return children;
    }

    clear() {
        this.node.replaceChildren();
        return this;
    }

    clearAttribute(name) {
        this.node.removeAttribute(name);
        return this;
    }

    clearClassName(className) {
        this.node.classList.remove(className);
        return this;
    }

    clearData(key) {
        delete this.node.dataset[name];
        return this;
    }

    copy() {
        let copy = htmlElement(this.tagName());

        for (let attribute of Object.entries(this.getAttributes())) {
            copy.setAttribute(attribute.name, attribute.value);
        }

        if (this.node.childNodes.length) {
            for (let child of this.children()) {
                copy.append(child.copy());
            }
        }

        return copy;
    }

    getAttribute(name) {
        return this.node.getAttribute(name);
    }

    getAttributeNames() {
        return this.node.getAttributeNames();
    }

    getAttributes() {
        return this.node.getAttributeNames().map(attrName => {
            return { name: attrName, value: this.node.getAttribute(attrName) };
        });
    }

    getClassNames() {
        let set = mkStringSet();

        for (let key of this.node.classList.keys()) {
            set.set(key)
        }

        return set;
    }

    getData(key) {
        return this.node.dataset[key];
    }

    hasAttribute(name) {
        return mkStringSet(this.node.getAttributeNames()).has(name);
    }

    hasClassName(className) {
        return this.node.classList.contains(className);
    }

    hasData(key) {
        return key in this.node.dataset;
    }

    off(messageName, handler) {
        if ('EMITTER' in this.node) {
            this.node.EMITTER.off(messageName, handler);
        }

        return this;
    }

    on(mesageName, handler) {
        if (!('EMITTER' in this.node)) {
            this.node.EMITTER = mkEmitter();
            this.node.LISTENERS = new Object();
        }

        if (!(mesageName in this.node.LISTENERS)) {
            this.node.addEventListener(mesageName, event => this.node.EMITTER.send({
                messageName: event.type,
                event: event,
            }));
        }

        this.node.EMITTER.on(mesageName, handler);
        return this;
    }

    once(mesageName, handler) {
        if (!('EMITTER' in this.node)) {
            this.node.EMITTER = mkEmitter();
            this.node.LISTENERS = new Object();
        }

        if (!(mesageName in this.node.LISTENERS)) {
            this.node.addEventListener(mesageName, event => this.node.EMITTER.send({
                messageName: event.type,
                event: event,
            }));
        }

        this.node.EMITTER.once(mesageName, handler);
        return this;
    }

    owningWidget() {
        if (Widget.widgetKey in this.htmlElement) {
            return this.htmlElement[Widget.widgetKey];
        }

        return null;
    }

    prepend(...args) {
        if (this.node.childNodes.length) {
            let beforeChild = this.node.firstChild;

            for (let arg of args) {
                this.node.insertBefore(reducio(arg), beforeChild);
            }
        }
        else {
            for (let arg of args) {
                this.node.appendChild(reducio(arg));
            }
        }

        return this;
    }

    query(selector) {
        if (typeof selector == 'string' && selector != '') {
            let selected = this.node.querySelector(selector);

            if (selected) {
                return mkHtmlElement(selected);
            }
        }

        return null;
    }

    queryAll(selector) {
        let selected = [];
  
        if (typeof selector == 'string' && selector != '') {
            let nodeList = this.node.querySelectorAll(selector);
  
            for (let i = 0; i < nodeList.length; i++) {
                selected.push(mkHtmlElement(nodeList.item(i)));
            }
        }
  
        return selected
    }

    setAttribute(name, value) {
        if (value === undefined) {
            this.node.setAttribute(name, '');
        }
        else {
            this.node.setAttribute(name, value);
        }

        return this;
    }

    setClassName(className) {
        this.node.classList.add(className);
        return this;
    }

    setData(name, value) {
        this.node.dataset[name] = value;
        return this;
    }

    tagName() {
        return this.node.tagName.toLowerCase();
    }

    toggleClassName(className) {
        this.node.classList.toggle();
        return this;
    }
});


/*****
 * Global functions for creating new DOM nodes.  These functions create new,
 * independent nodes, unlike the wrapper classes provided above.
*****/
register(function htmlText(data) {
    return mkHtmlText(document.createTextNode(data));
});

register(function htmlElement(arg) {
    if (arg.startsWith('@')) {
        return mkHtmlElement(document.createElementNS('http://www.w3.org/2000/svg', arg.substr(1).toLowerCase()));
    }
    else {
        return mkHtmlElement(document.createElement(arg.toLowerCase()));
    }
});
