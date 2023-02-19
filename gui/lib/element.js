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
 * A wrapper class for native DOM-related events.  The intention is to provide
 * additional data and additional features to enhance code that uses and handles
 * HTML-generated events.
*****/
(() => {
    const eventKey = Symbol('event');

    const eventProxy = {
        get: (ev, name) => {
            if (name in ev) {
                return ev[name];
            }
            else if (name in ev[eventKey]) {
                return ev[eventKey][name];
            }
            else {
                return null;
            }
        },
    };

    register(class HtmlEvent extends NonJsonable {
        constructor(event) {
            super();
            this[eventKey] = event;
            return new Proxy(this, eventProxy);
        }

        composedPath(...args) {
            return this[eventKey].composedPath(...args);
        }

        preventDefault(...args) {
            return this[eventKey].preventDefault(...args);
        }

        rawEvent() {
            return this[eventKey];
        }

        stopImmediatePropagation(...args) {
            return this[eventKey].stopImmediatePropagation(...args);
        }

        stopPropagation(...args) {
            return this[eventKey].stopPropagation(...args);
        }
    });
})();


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
    else if (arg instanceof SVGElement) {
        return arg;
    }
    else if (arg instanceof SvgElement) {
        return arg.node;
    }
    else if (arg instanceof MathMLElement) {
        return arg;
    }
    else if (arg instanceof MathElement) {
        return arg.node;
    }
    else {
        return document.createTextNode(arg);
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
        console.dir(this.node);
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
            else {
                this.node.parentNode.removeChild(this.node);
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
        return makeHtmlText(this.text());
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
    static propagationKey = Symbol('propagation');

    constructor(arg) {
        if (arg instanceof HTMLElement) {
            super(arg);
        }
        else if (arg instanceof HtmlElement) {
            super(arg.node)
        }
        else if (typeof arg == 'string') {
            super(document.createElement(arg.toLowerCase()));
        }
        else {
            super(document.createElement('notag'));
        }

        this.node[HtmlElement.propagationKey] = {};
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

    blur() {
        this.node.blur();
        return this;
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

    clearClassNames() {
        this.node.className = '';
        return this;
    }

    clearData(key) {
        delete this.node.dataset[name];
        return this;
    }

    copy() {
        let copy = mkHtmlElement(this.tagName());

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

    disablePropagation(eventName) {
        delete this.node[HtmlElement.propagationKey][eventName];
    }

    enablePropagation(eventName) {
        this.node[HtmlElement.propagationKey][eventName] = true;
    }

    enum() {
        let array = [];
        let stack = [this.node];

        while(stack.length) {
            let node = stack.pop();

            for (let i = 0; i < node.childNodes.length; i++) {
                let child = node.childNodes.item(i);

                if (child instanceof Element) {
                    stack.push(child);
                    array.push(mkHtmlElement(child));
                }
            }
        }

        return array;
    }

    focus() {
        this.node.focus();
        return this;
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

    getInnerHtml() {
        return this.node.innerHTML;
    }

    getOffset() {
        let x = 0;
        let y = 0;
        let dx = 0;
        let dy = 0;
        let node = this.node;

        if (node) {
            dx = node.offsetWidth;
            dy = node.offsetHeight;

            while (node) {
                if (node.tagName.toLowerCase() in { body:0, head:0, html:0 }) {
                    break;
                }

                x += node.offsetLeft;
                y += node.offsetTop;
                node = node.offsetParent;
            }
        }

        return { left:x, top:y, width:dx, height:dy };
    }

    getStyle(propertyName, value) {
        return this.node.style[propertyName];
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

    length() {
        return this.children().length;
    }

    off(messageName, handler) {
        if ('EMITTER' in this.node) {
            this.node.EMITTER.off(messageName, handler);
        }

        return this;
    }

    on(messageName, handler) {
        if (!('EMITTER' in this.node)) {
            this.node.EMITTER = mkEmitter();
            this.node.LISTENERS = new Object();
        }

        if (!(messageName in this.node.LISTENERS)) {
            this.node.addEventListener(messageName, event => {
                if (!Object.is(this.node, event.target)) {
                    let propagation = event.target[HtmlElement.propagationKey];

                    if (!propagation || !(event.type in propagation)) {
                        return;
                    }
                }

                this.node.EMITTER.send({
                    messageName: event.type,
                    htmlElement: this,
                    widget: this[Widget.widgetKey],
                    event: mkHtmlEvent(event),
                });
            });
        }

        this.node.EMITTER.on(messageName, handler);
        return this;
    }

    once(messageName, handler) {
        if (!('EMITTER' in this.node)) {
            this.node.EMITTER = mkEmitter();
            this.node.LISTENERS = new Object();
        }

        if (!(messageName in this.node.LISTENERS)) {
            this.node.addEventListener(messageName, event => {
                if (!Object.is(this.node, event.target)) {
                    let propagation = event.target[HtmlElement.propagationKey];

                    if (!propagation || !(event.type in propagation)) {
                        return;
                    }
                }

                this.node.EMITTER.send({
                    messageName: event.type,
                    htmlElement: this,
                    widget: this[Widget.widgetKey],
                    event: mkHtmlEvent(event),
                });
            });
        }

        this.node.EMITTER.once(messageName, handler);
        return this;
    }

    outerHtml() {
        return this.node.outerHTML;
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

    queryOne(selector) {
        if (typeof selector == 'string' && selector != '') {
            let selected = this.node.querySelector(selector);

            if (selected) {
                return mkHtmlElement(selected);
            }
        }

        return null;
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

    setClassNames(classNames) {
        this.node.className = classNames;
        return this;
    }

    setData(name, value) {
        this.node.dataset[name] = value;
        return this;
    }

    setInnerHtml(innerHtml) {
        this.node.innerHTML = innerHtml;
        return this;
    }

    setStyle(propertyName, value) {
        this.node.style[propertyName] = value;
        return this;
    }

    [Symbol.iterator]() {
        return this.children()[Symbol.iterator]();
    }

    tagName() {
        return this.node.tagName.toLowerCase();
    }

    toggleClassName(className) {
        this.node.classList.toggle();
        return this;
    }

    widget() {
        if (Widget.widgetKey in this.node) {
            return this.node[Widget.widgetKey];
        }
        else {
            let widget = mkWidget('DUMMY');
            widget.htmlElement = this;
            widget.setAttribute('widget-class', 'Widget');
            widget.brand(this);
            return widget;
        }
    }
});


/*****
 * This is a nice little tricky thing for creating an HTML element from HTML
 * text.  The first point is that this won't work unless the HTML passsed to
 * this function is the outer HTML for a single HEML element.  It doesn't work
 * on fragments.  The second point is that we need first create an element with
 * the proper tagName and then attach that tag to our <COMPILER></COMPILER>
 * HTML element.  Next, set the outer HTML equal to the outerHtml paramrter.
 * The browser compiles it and replaces the original stub with a new stub.
 * That's why we need to then fetch the first child from either the parent or
 * the <COMPILER></COMPILER> HTML element.
*****/
(() => {
    const requiredParents = {
        'td': ['table', 'tr'],
        'th': ['table', 'tr'],
        'tr': ['table'],
    };

    register(function htmlImport(outerHtml) {
        const match = outerHtml.match(/< *([0-9A-Za-z]+)/);

        if (match) {
            let tagName = match[1];
            const compilerElement = document.createElement('div');
            document.documentElement.appendChild(compilerElement);

            if (tagName in requiredParents) {
                let parent;

                requiredParents[tagName].forEach(tagName => {
                    let element = document.createElement(tagName);
                    parent ? parent.appendChild(element) : compilerElement.appendChild(element);
                    parent = element;
                });

                let stub = document.createElement(tagName);
                parent.appendChild(stub);
                stub.outerHTML = outerHtml;
                parent.appendChild(stub);
                stub = parent.children[0];
                parent.replaceChildren();
                compilerElement.replaceChildren();
                compilerElement.replace();
                return mkHtmlElement(stub);                
            }
            else {
                let stub = document.createElement(tagName);
                compilerElement.appendChild(stub);
                stub.outerHTML = outerHtml;
                stub = compilerElement.children[0];
                compilerElement.replaceChildren();
                compilerElement.replace();
                return mkHtmlElement(stub);
            }
        }
    });
})();
