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
 * Thee following classes have a module-only context and are accesses via the
 * functional API used for creating instances of them.  They provide a way of
 * building node trees that represent HTML documents.  These node trees are
 * dynamically built and are modifiable, based on programming conditions.  The
 * ultimate purpose of this API is to dynamially generate HTML using a server-
 * side API.
*****/
class Node {
    constructor(type) {
        this.type = type;
        this.parent = null;
        this.children = [];
    }

    append(node) {
        node.parent = this;
        this.children.push(node);
    }

    prepend(node) {
        node.parent = this;
        this.children.unshift(node);
    }
}

class Text extends Node {
    constructor(value) {
        super('text');
        this.text = value.toString();
    }

    copy() {
        return new Text(this.text);
    }

    async toCompact() {
        return `${this.text}`;
    }

    async toVisual(indent) {
        return `${indent ? indent : ''}${this.text}\n`;
    }
}

class Script extends Node {
    constructor(code) {
        super('code');
        this.code = code;
    }

    copy() {
        return new Script(this.code);
    }

    async toCompact() {
        let minifyPath = PATH.join(env.nodeModulePath, 'minify/bin/minify.js');
        let jsPath = await writeTemp(this.code, 'js');
        return (await execShell(`node ${minifyPath} ${jsPath}`)).stdout.trim();
    }

    async toVisual(indent) {
        return npmBEAUTIFY.js(this.code, { indent_size: 2 }).split('\n').map(line => {
            return `${indent}${line}`;
        }).join('\n') + '\n';
    }
}

class Attribute extends Node {
    constructor(name, value) {
        super('attribute');
        this.name = name;
        this.value = value;
    }

    copy() {
        return new Attribute(this.name, this.value);
    }

    async toCompact() {
        if (this.value !== undefined) {
            return ` ${this.name}="${this.value}"`
        }
        else {
            return ` ${this.name}`            
        }
    }

    async toVisual() {
        if (this.value !== undefined) {
            return ` ${this.name}="${this.value}"`
        }
        else {
            return ` ${this.name}`            
        }
    }
}

class Element extends Node {
    static voids = mkSet(
        'area',
        'base',
        'br',
        'col',
        'command',
        'embed',
        'hr',
        'img',
        'input',
        'keygen',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
    );

    constructor(tagName) {
        super('element');
        this.tagName = tagName.toLowerCase();
        this.void = Element.voids.has(this.tagName);
    }

    copy() {
        let copy = new Element(this.tagName);

        for (let child of this.children) {
            copy.append(child.copy());
        }

        return copy;
    }

    async toCompact() {
        let tag = [`<${this.tagName}`];

        for (let child of this.children) {
            if (child.type == 'attribute') {
                tag.push(await child.toCompact());
            }
        }

        tag.push('>');

        for (let child of this.children) {
            if (child.type != 'attribute') {
                tag.push(await child.toCompact());
            }
        }

        if (!this.void) {
            tag.push(`</${this.tagName}>`);
        }

        return tag.join('');
    }

    async toVisual(indent) {
        let tag = [
            `${indent ? indent : ''}`,
            `<${this.tagName}`,
        ];

        for (let child of this.children) {
            if (child.type == 'attribute') {
                tag.push(await child.toVisual());
            }
        }

        tag.push('>\n');

        for (let child of this.children) {
            if (child.type != 'attribute') {
                tag.push(await child.toVisual(indent + '  '));
            }
        }

        if (!this.void) {
            tag.push(indent);
            tag.push(`</${this.tagName}>`);
        }

        tag.push('\n');
        return tag.join('');
    }
}

class Document extends Node {
    constructor() {
        super('document');
        this.html = new Element('html');
    }

    append(node) {
        node.parent = this;
        this.html.append(node);
    }

    copy() {
        let copy = new Document();
        copy.html = this.html.copy();
        return copy;
    }

    async toCompact() {
        return '<!DOCTYPE html>' + await this.html.toCompact('');
    }

    async toVisual() {
        return '<!DOCTYPE html>\n' + await this.html.toVisual('');
    }
}


/*****
 * These are the publically avaialbe functions that are used for building the
 * js or pseudo html code.  Any HTML web page may be dynamically built on the
 * web server using just these four little functions.  The values returned by
 * them are instances of the above list classes.  Please note the intended use
 * for this API is to programmatically and dynamically build HTML documents,
 * whose content is based on a specific programming context.
*****/
register(function htmlDocument(...children) {
    let doc = new Document();

    for (let child of children) {
        doc.append(child);
    }

    return doc;
});

register(function htmlElement(tagName, ...children) {
    let el = new Element(tagName);

    for (let child of children) {
        el.append(child);
    }

    return el;
});

register(function htmlAttribute(name, value) {
    return new Attribute(name, value);
});

register(function htmlText(value) {
    return new Text(value);
});

register(function htmlScript(code) {
    return new Script(code);
});
