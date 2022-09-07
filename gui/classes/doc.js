/******************************************************************************
 ******************************************************************************/


/**
 */
$(class $Dom {
    static _compilerNode = (() => {
        let compilerElement = document.createElement('COMPILER');
        document.documentElement.appendChild(compilerElement);
        return compilerElement;
    })();
  
    static _requiredParents = {
        'td': ['table', 'tr'],
        'th': ['table', 'tr'],
        'tr': ['table'],
    };
  
    static _createElement(tagName) {
        if (tagName.startsWith('@')) {
            return document.createElementNS('http://www.w3.org/2000/svg', tagName.substr(1));
        }
        else {
            return document.createElement(tagName);
        }
    }
  
    static _wrap(arg) {
        if (arg instanceof Cls$DocNode) {
            return arg;
        }
        else if (arg instanceof Cls$BuilderNode) {
            return arg._docNode;
        }
        else if (arg instanceof HTMLElement) {
            if (arg.$widget) {
                return arg.$widget;
            }
            else {
                return $DocElement(arg);
            }
        }
        else if (arg instanceof Text) {
            return $TextNode(arg);
        }
        else if (typeof arg == 'function') {
            return $TextNode(arg().toString());
        }
        else {
            return $TextNode(arg.toString());
        }
    }
});


/**
 */
$(function $query(selector) {
    if (typeof selector == 'string' && selector != '') {
        let selected = document.querySelector(selector);

        if (selected) {
            return Cls$Dom._wrap(selected);
        }
    }

    return null;
});


/**
 */
$(function $queryAll(selector) {
    let selected = [];
  
    if (typeof selector == 'string' && selector != '') {
        let nodeList = document.querySelectorAll(selector);
  
        for (let i = 0; i < nodeList.length; i++) {
            selected.push(Cls$Dom._wrap(nodeList.item(i)));
        }
    }

    return selected;
});


/**
 */
$(class $DocNode {
    constructor(node) {
        this._node = node;
    }

    copy() {
        return Cls$Dom._wrap(this._node.cloneNode(true));
    }

    dir() {
        console.dir(this._node);
        return this;
    }

    insertAfter(...args) {
        if (this._node.parentNode) {
            let nextSibling = this._node.nextSibling;
  
            if (nextSibling) {
                $flatten(args).forEach(arg => {
                    this._node.parentNode.insertBefore(Cls$Dom._wrap(arg)._node, nextSibling);
                });
            }
            else {
                $flatten(args).forEach(arg => {
                    this._node.parentNode.appendChild(Cls$Dom._wrap(arg)._node);
                });
            }
        }
  
        return this;
    }

    insertBefore(...args) {
        if (this._node.parentNode) {
            $flatten(args).forEach(arg => {
                this._node.parentNode.insertBefore(Cls$Dom._wrap(arg)._node, this._node);
            });
        }

        return this;
    }

    isElement() {
        return this._node instanceof HTMLElement;
    }
  
    isEmpty() {
        return this._node.childNodes.length == 0;
    }
  
    isSameNode(node) {
        if (node instanceof Cls$Node) {
            return this._node.isSameNode(node._node);
        }
        else if (node instanceof Node) {
            return this._node.isSameNode(node);
        }
        else {
            return false;
        }
    }

    isText() {
        return this._node instanceof Text;
    }
  
    isWidget() {
        return this._node.$widget !== undefined;
    }

    log() {
        console.log(this._node);
        return this;
    }
  
    nextSibling() {
        if (this._node.nextSibling) {
            return Cls$Dom._wrap(this._node.nextSibling);
        }
        else {
            return null;
        }
    }
  
    node() {
        return this._node;
    }
  
    nodeType() {
        return this._node._nodeType;
    }

    off(eventName, handler) {
        this._node.removeEventListener(eventName, handler);
        return this;
    }

    on(eventName, handler) {
        this._node.addEventListener(eventName, handler);
        return this;
    }

    once(eventName, handler) {
        this._node.addEventListener(eventName, handler, {once: true});
        return this;
    }
  
    parent() {
        if (this._node.parentNode) {
            return Cls$Dom._wrap(this._node.parentNode);
        }
        else {
            return null;
        }
    }
  
    prevSibling() {
        if (this._node.previousSibling) {
            return Cls$Dom._wrap(this._node.previousSibling);
        }
        else {
            return null;
        }
    }

    remove() {
        if (this._node.parentNode) {
            this._node.parentNode.removeChild(this._node);
        }

        return this;
    }

    replace(...args) {
        if (this._node.parentNode) {
            let nodes = $flatten(args).map(arg => {
                return Cls$Dom._wrap(arg)._node;
            });
  
            this._node.replaceWith(...nodes);
        }
  
        return this;
    }
});


/**
 */
$(class $TextNode extends Cls$DocNode {
    constructor(arg) {
        if (typeof arg == 'string') {
            super(document.createTextNode(arg));
        }
        else if (arg instanceof Text) {
            super(arg);
        }
    }
  
    text() {
        return this._node.wholeText;
    }
});


/**
 */
$(class $DocElement extends Cls$DocNode {
    constructor(...args) {
        if (typeof args[0] == 'string') {
            if (args[0] == 'input') {
                super(Cls$Dom._createElement(args[0]));
  
                if (args.length > 1 && typeof args[1] == 'string') {
                    this._node.setAttribute('type', args[1]);
                }
                else {
                    this._node.setAttribute('type', 'text');
                }
            }
            else if (args[0].match(/^@?[0-9A-Za-z]+$/)) {
                super(Cls$Dom._createElement(args[0]));
            }
            else {
                const match = args[0].match(/< *(@?[0-9A-Za-z]+)/);
                super(Cls$Dom._createElement(match[1]));
                this.outerHtml(args[0]);
            }
        }
        else if (args[0] instanceof Cls$DocElement) {
            super(args[0]._node);
        }
        else if (args[0] instanceof HTMLElement) {
            super(args[0]);
        }
    }

    append(...args) {
        $flatten(args).forEach(arg => {
            this._node.appendChild(Cls$Dom._wrap(arg)._node);
        });
  
        return this;
    }

    appendClass(...args) {
        args.forEach(name => {
            this._node.classList.add(name);
        });
  
        return this;
    }

    attribute(name, value) {
        if (value !== undefined) {
            this._node.setAttribute(name, value);
            return this;
        }
        else {
            return this._node.getAttribute(name);
        }
    }

    children() {
        let childNodes = [];

        for (let i = 0; i < this._node.childNodes.length; i++) {
            childNodes.push(Cls$Dom._wrap(this._node.childNodes.item(i)));
        }

        return childNodes;
    }

    clear() {
        this._node.replaceChildren();
        return this;
    }

    data(name, value) {
        if (value !== undefined) {
            this._node.dataset[name] = value;
            return this;
        }
        else {
            return this._node.dataset[name];
        }
    }

    firstChild() {
        if (this._node.childNodes.length) {
            return Cls$Dom._wrap(this._node.childNodes.item(0));
        }
        else {
            return null;
        }
    }

    innerHtml(...args) {
        if (args.length) {
            this._node.innerHTML = $flatten(args).map(arg => {
                if (arg instanceof Cls$DocElement) {
                    return arg._node.innerHTML;
                }
                else if (arg instanceof HTMLElement) {
                    return arg.innerHTML;
                }
                else if (arg instanceof Cls$TextNode) {
                    return arg._node.wholeText;
                }
                else if (arg instanceof Text) {
                    return arg.wholeText;
                }
                else {
                    return arg.toString();
                }
            }).join('');
  
            return this;
        }
        else {
            return this._node.innerHTML;
        }
    }

    lastChild() {
        if (this._node.childNodes.length) {
            return Cls$Dom._wrap(this._node.childNodes.item(this._node.childNodes.length - 1));
        }
        else {
            return null;
        }
    }

    outerHtml(...args) {
        if (args.length) {
            let outerHTML = $flatten(args).map(arg => {
                if (arg instanceof Cls$DocElement) {
                    return arg._node.innerHTML;
                }
                else if (arg instanceof HTMLElement) {
                    return arg.innerHTML;
                }
                else if (arg instanceof Cls$TextNode) {
                    return arg._node.wholeText;
                }
                else if (arg instanceof Text) {
                    return arg.wholeText;
                }
                else {
                    return arg.toString();
                }
            }).join('');
  
            const match = outerHTML.match(/< *([0-9A-Za-z]+)/);

            if (match[1].toLowerCase() == this._node.tagName.toLowerCase()) {
                if (this._node.parentNode) {
                    this._node.outerHTML = outerHTML;
                }
                else {
                    Cls$Dom._compilerNode.replaceChildren();
  
                    if (this.tagName() in Cls$Dom._requiredParents) {
                        let parent;

                        Cls$Dom._requiredParents[this.tagName()].forEach(tagName => {
                            let stub = Cls$Dom._createElement(tagName);
                            parent ? parent.appendChild(stub) : Cls$Dom._compilerNode.appendChild(stub);
                            parent = stub;
                        });

                        parent.appendChild(this._node);
                        this._node.outerHTML = outerHTML;
                        this._node = Cls$Dom._compilerNode.children[0];
                    }
                    else {
                        Cls$Dom._compilerNode.appendChild(this._node);
                        this._node.outerHTML = outerHTML;
                        this._node = Cls$Dom._compilerNode.children[0];
                    }
  
                    Cls$Dom._compilerNode.replaceChildren();
                }
            }
  
            return this;
        }
        else {
            return this._node.outerHTML;
        }
    }

    prepend(...args) {
        if (this._node.childNodes.length) {
            let beforeChild = this._node.childNodes[0];
  
            $flatten(args).forEach(arg => {
                beforeChild = this._node.insertBefore(Cls$Dom._wrap(arg)._node, beforeChild);
            });
        }
        else {
            $flatten(args).forEach(arg => {
                this._node.appendChild(Cls$Dom._wrap(arg)._node);
            });
        }
  
        return this;
    }

    query(selector) {
        if (typeof selector == 'string' && selector != '') {
            let selected = this._node.querySelector(selector);

            if (selected) {
                return $DocElement(selected);
            }
        }

        return null;
    }

    queryAll(selector) {
        let selected = [];
  
        if (typeof selector == 'string' && selector != '') {
            let nodeList = this._node.querySelectorAll(selector);
  
            for (let i = 0; i < nodeList.length; i++) {
                selected.push($DocElement(nodeList.item(i)));
            }
        }
  
        return selected
    }

    removeAttribute(name) {
        this._node.removeAttribute(name);
        return this;
    }

    removeChildren(...args) {
        $flatten(...args).forEach(arg => {
            if (arg instanceof Cls$Node) {
                this._node.removeChild(arg._node);
            }
            else if (arg instanceof Node) {
                this._node.removeChild(arg);
            }
        });

        return this;
    }

    removeClass(name) {
        args.forEach(name => {
            this._node.classList.remove(name);
        });
    }

    removeData(name) {
        delete this.htmleElement.dataset[name];
        return this;
    }

    replaceChildren(...args) {
        let nodes = $flatten(args).map(arg => Cls$Dom._wrap(arg)._node);
        this._node.replaceChildren(...nodes);
        return this;
    }

    style() {
        return this._node.style;
    }

    tagName() {
        return this._node.tagName.toLowerCase();
    }

    value(value) {
        if (value === undefined) {
            switch (this.tagName()) {
                case 'select':
                    if (this._node.selectedIndex >= 0) {
                        let option = this._node.options[this._node.selectedIndex];
                        return option.value;
                    }
                    else {
                        return undefined;
                    }

                case 'textarea':
                    return this.innerHtml();

                default:
                    return this._node.getAttribute('value');
            }
        }
        else {
            switch (this.tagName()) {
                case 'select':
                    for (var i = 0; i < this._node.options.length; i++) {
                        let option = this._node.options[i];

                        if (option.value == value) {
                            this._node.selectedIndex = i;
                            break;
                        }
                    }
                    break;

                case 'textarea':
                    this.innerHtml(value);
                    break;

                default:
                    this._node.setAttribute('value', value);
                    break;
            }

            return this;
        }
    }
});


/**
 */
$(class $Window {
    constructor() {
    }
  
    location() {
        return window.location;
    }

    off(eventName, handler) {
        window.removeEventListener(eventName, handler);
        return this;
    }

    on(eventName, handler) {
        window.addEventListener(eventName, handler);
        return this;
    }

    once(eventName, handler) {
        window.addEventListener(eventName, handler, {once: true});
        return this;
    }
});


/**
 */
$(class $Document {
    constructor() {
    }
  
    cookie(name, value, opts) {
        let allCookies = this.cookies();
  
        if (value === undefined) {
            return allCookies[name];
        }
  
        let crumbs = [`${name}=${value.toString()}`];
        'path' in opts ? crumbs.push(`path=${opts.path}`) : false;
        'domain' in opts ? crumbs.push(`domain=${opts.domain}`) : false;
  
        let cookieLife = $dateOffset(opts);
        let date = new Date(Date.now() + (cookieLife ? cookieLife : 1*24*60*60*1000));
        crumbs.push(`expires=${date.toUTCString()}`);
  
        'samesite' in opts ? crumbs.push(`samesite=${opts.samesite}`) : false;
        'secure' in opts ? crumbs.push('secure') : false;

        document.cookie = crumbs.join('; ');
        return this;
    }
  
    cookies() {
        let allCookies = {};
  
        $split(document.cookie, ';').forEach(cookie => {
            let [name, value] = $split(cookie.split, '=');
            allCookies[name] = value;
        });
  
        return allCookies;
    }

    off(eventName, handler) {
        document.removeEventListener(eventName, handler);
        return this;
    }

    on(eventName, handler) {
        document.addEventListener(eventName, handler);
        return this;
    }

    once(eventName, handler) {
        document.addEventListener(eventName, handler, {once: true});
        return this;
    }
  
    removeCookie(name) {
        document.cookie = `${name}=gone`;
        return this;
    }
  
    removeCookies() {
        document.cookie.split(';').forEach(cookie => {
            let [name, value] = cookie.split('=');
            this.removeCookie(name.trim());
        });
  
        return this;
    }
});
