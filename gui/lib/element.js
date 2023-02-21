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
 * Creates a new, independent copy of a DOM node as a new instance.  This does
 * NOT perform a deep copy!  It is used by the deep copy algorithm, but focuses
 * on a single node.  The trick here is to determine the how to create copy of
 * the specifid node.  The returned value is a wrapper.
*****/
register(function copyDocNode(arg) {
    if (arg instanceof Text) {
        return mkDocText(arg.wholeText);
    }
    else if (arg instanceof DocText) {
        return mkDocText(arg.node.wholeText);
    }
    else if (arg instanceof HTMLElement) {
        return mkHtmlElement(arg.name());
    }
    else if (arg instanceof HtmlElement) {
        return mkHtmlElement(arg.node.nodeName);
    }
    else if (arg instanceof Widget) {
        return mkHtmlElement(arg.htmlElement.node.nodeName);
    }
    else if (arg instanceof SVGElement) {
        return mkSvgElement(arg.node.nodeName);
    }
    else if (arg instanceof SvgElement) {
        return mkSvgElement(arg.name());
    }
    else if (arg instanceof MathMLElement) {
        return mkMathElement(are.node.nodeName);
    }
    else if (arg instanceof MathElement) {
        return mkMathElement(arg.name());
    }
    else {
        return document.createTextNode(arg);
    }
});


/*****
 * Analyzes the argument type with and returns which DocNode or DocElement type
 * to return to the caller.  In any case, the returned value is always once of
 * the wrapper objects defined in this source file.  If we're unable to find
 * any specific type of object, just return a Text node using the argument as
 * the value to be converted to text.
*****/
register(function wrapDocNode(arg) {
    if (arg instanceof Text) {
        return mkDocText(arg);
    }
    else if (arg instanceof DocText) {
        return arg;
    }
    else if (arg instanceof HTMLElement) {
        return mkHtmlElement(arg);
    }
    else if (arg instanceof HtmlElement) {
        return arg;
    }
    else if (arg instanceof Widget) {
        return arg.htmlElement;
    }
    else if (arg instanceof SVGElement) {
        return mkSvgElement(arg);
    }
    else if (arg instanceof SvgElement) {
        return arg;
    }
    else if (arg instanceof MathMLElement) {
        return mkMathElement(arg);
    }
    else if (arg instanceof MathElement) {
        return arg;
    }
    else {
        return document.createTextNode(arg);
    }
});


/*****
 * Reverses the effect of any DOM node wrapping by returning the naked DOM node
 * object.  The return node extends beyond HTML because it includes our wrapper
 * objects as well as SVG and MathML elements, both of which extend Node.
*****/
register(function unwrapDocNode(arg) {
    if (arg instanceof Text) {
        return arg;
    }
    else if (arg instanceof DocText) {
        return arg.node;
    }
    else if (arg instanceof HTMLElement) {
        return arg;
    }
    else if (arg instanceof HtmlElement) {
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
 * The DocNode class provides a wrapper for existing DOM HTMLElements and Text
 * objects.  This class is NOT used for creating new objects.  It's only for
 * wrapping existing objects with a more efficient API.  DocNode is the base
 * class for DocText and HtmlElement.  Methods in this class are applicable for
 * both types of derived object instances.
*****/
register(class DocNode {
    constructor(node) {
        this.node = node;
    }

    append(...args) {
        for (let arg of args) {
            this.node.appendChild(unwrapDocNode(arg));
        }

        return this;
    }

    clear() {
        this.node.replaceChildren();
        return this;
    }

    children() {
        let children = [];

        for (let i = 0; i < this.node.childNodes.length; i++) {
            children.push(wrapDocNode(this.node.childNodes.item(i)));
        }

        return children;
    }

    dir() {
        console.dir(this.node);
        return this;
    }

    doc() {
        return mkDoc(this.node.ownerDocument);
    }

    firstChild() {
        if (this.node.firstChild) {
            return wrapDocNode(this.node.firstChild);
        }

        return null;
    }

    insertAfter(...args) {
        if (this.node.parentNode) {
            let nextSibling = this.node.nextSibling;
  
            if (nextSibling) {
                for (let arg of args) {
                    this.node.parentNode.insertBefore(unwrapDocNode(arg), nextSibling);
                }
            }
            else {
                for (let arg of args) {
                    this.node.parentNode.appendChild(unwrapDocNode(arg));
                }
            }
        }
  
        return this;
    }

    insertBefore(...args) {
        if (this.node.parentNode) {
            for (let arg of args) {
                this.node.parentNode.insertBefore(unwrapDocNode(arg), this.node);
            }
        }

        return this;
    }

    isElement() {
        return this.node instanceof DocElement;
    }
  
    isSame(arg) {
        return unwrapDocNode(arg).isSameNode(this.node);
    }

    isText() {
        return this.node instanceof Text;
    }

    lastChild() {
        if (this.node.lastChild) {
            return wrapDocNode(this.node.lastChild);
        }

        return null;
    }

    length() {
        return this.children().length;
    }

    log() {
        console.log(this.node);
        return this;
    }

    name() {
        return this.node.nodeName.toLowerCase();
    }
  
    nextSibling() {
        if (this.node.nextSibling) {
            return wrapDocNode(this.node.nextSibling);
        }

        return null;
    }
  
    parent() {
        if (this.node.parentNode) {
            return wrapDocNode(this.node.parentNode);
        }
        else {
            return null;
        }
    }
  
    parentElement() {
        if (this.node.parentElement) {
            return wrapDocNode(this.node.parentElement);
        }
        else {
            return null;
        }
    }

    prepend(...args) {
        if (this.node.childNodes.length) {
            let beforeChild = this.node.firstChild;

            for (let arg of args) {
                this.node.insertBefore(unwrapDocNode(arg), beforeChild);
            }
        }
        else {
            for (let arg of args) {
                this.node.appendChild(unwrapDocNode(arg));
            }
        }

        return this;
    }
  
    prevSibling() {
        if (this.node.previousSibling) {
            return wrapDocNode(this.node.previousSibling);
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
                inserted = unwrapDocNode(args[0]);
                this.node.parentNode.replaceChild(inserted, this.node);

                for (let i = 1; i < args.length; i++) {
                    let node = unwrapDocNode(args[i]);
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

    [Symbol.iterator]() {
        return this.children()[Symbol.iterator]();
    }

    textContent() {
        return this.node.textContent;
    }

    type() {
        return this.node.nodeType;
    }

    value() {
        return this.node.nodeValue;
    }
});


/*****
 * The DocText element is a wrapper the DOM built in Text class.  Instances
 * of DocText are return in API class that refer to the underlying Text class.
 * Moreover, DocText provides a link-free copy function.
*****/
register(class DocText extends DocNode {
    constructor(arg) {
        super(unwrapDocNode(arg));
    }

    copy() {
        return copyDocNode(this);
    }
  
    text() {
        return this.node.wholeText;
    }
});


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
 * An element is distinguished from an HTML Element to be more generic.  It is
 * the base class/interface for node types such as HTMLElement, SVGElement, and
 * MathMLElement.  It has attributes, children, a parent, ... etc.  Just keep
 * in min that this wrapper class is non-specific.
*****/
register(class DocElement extends DocNode {
    constructor(node) {
        super(node);
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

    copy() {
        let copy = copyDocNode(this);

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
        let stack = [this];

        while(stack.length) {
            let docNode = stack.shift();
            array.push(docNode);

            for (let child of docNode) {
                array.push(child);
            }
        }

        return array;
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

    getInnerHtml() {
        return this.node.innerHTML;
    }

    getOuterHtml() {
        return this.node.outerHTML;
    }

    hasAttribute(name) {
        return mkStringSet(this.node.getAttributeNames()).has(name);
    }

    hasClassName(className) {
        return this.node.classList.contains(className);
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

    setInnerHtml(innerHtml) {
        this.node.innerHTML = innerHtml;
        return this;
    }

    setOuterHtml(outerHtml) {
        this.node.outerHTML = outerHtml;
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
 * The HtmlElement provides a wrapper for the underlying DOM HTMLElement object.
 * Primarily, it's an extension or refrinement of the underlying DOM API and is
 * oriented to facilitate chaining function calls, where possible.  Note that get
 * and has calls do NOT logically support chaining.  Additionally, this class
 * also wraps the standard Emitter class to make the event-structure associated
 * with an HMTLElement fits within the framework API for events and messaging.
*****/
register(class HtmlElement extends DocElement {
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
            super(document.createElement('noname'));
        }

        this.node[HtmlElement.propagationKey] = {};
    }

    blur() {
        this.node.blur();
        return this;
    }

    clearData(key) {
        delete this.node.dataset[name];
        return this;
    }

    focus() {
        this.node.focus();
        return this;
    }

    getData(key) {
        return this.node.dataset[key];
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
                if (node.nodeName.toLowerCase() in { body:0, head:0, html:0 }) {
                    break;
                }

                x += node.offsetLeft;
                y += node.offsetTop;
                node = node.offsetParent;
            }
        }

        return { left:x, top:y, width:dx, height:dy };
    }

    getOffsetBottom() {
        return this.node.offsetBottom;
    }

    getOffsetLeft() {
        return this.node.offsetLeft;
    }

    getOffsetRight() {
        return this.node.offsetRight;
    }

    getOffsetTop() {
        return this.node.offsetTop;
    }

    getStyle(propertyName, value) {
        return this.node.style[propertyName];
    }

    hasData(key) {
        return key in this.node.dataset;
    }

    setData(name, value) {
        this.node.dataset[name] = value;
        return this;
    }

    setStyle(propertyName, value) {
        this.node.style[propertyName] = value;
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

    register(function importElement(outerHtml) {
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
