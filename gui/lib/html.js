/**
 */


/**
 */
$(class $BuilderNode {
    constructor() {
        this._docNode = null;
        this._parentNode = null;
    }

    _attach(parent) {
        this._parentNode = parent;
    }

    _detach() {
        this._parentNode = null;
    }
  
    docNode() {
        return this._docNode;
    }
  
    static _docify(...args) {
        return args.map(arg => {
            if (arg instanceof Cls$BuilderNode) {
                return arg;
            }
            else {
                return $BuilderText(arg);
            }
        });
    }

    insertAfter(...args) {
        if (this._parentNode) {
            let index = this._parentNode.indexOf(this);
            this._detach();
            let docNodes = $BuilderNode._docify(...args);
            this._parentNode.children.splice(index + 1, 0, docNodes);

            docNodes.forEach(docNode => {
                docNode._attach(this._parentNode);
                
                if (docNode._docNode) {
                    this._parentNode._docNode.insertAfter(docNode._docNode);
                }
            });
        }
    }

    insertBefore(...args) {
        if (this._parentNode) {
            let index = this._parentNode.indexOf(this);
            this._detach();
            let docNodes = $BuilderNode._docify(...args);
            this._parentNode.children.splice(index, 0, docNodes);

            docNodes.reverse().forEach(docNode => {
                docNode._attach(this._parentNode);
                
                if (docNode._docNode) {
                    this._parentNode._docNode.insertAfter(docNode._docNode);
                }
            });
        }
    }
  
    parentNode() {
        return this._parentNode;
    }

    remove() {
        if (this._parentNode) {
            let index = this._parentNode.indexOf(this);
            this._detach();
            this._parentNode.children.splice(index, 1);

            if (this._docNode) {
                this._docNode.remove();
            }
        }
    }

    replace(...args) {
        if (this._parentNode) {
            let index = this._parentNode.indexOf(this);
            this._detach();
            let docNodes = $BuilderNode._docify(...args);
            this._parentNode.children.splice(index, 1, docNodes);

            docNodes.forEach(docNode => {
                docNode._attach(this._parentNode);
                
                if (docNode._docNode) {
                    this._parentNode._docNode.insertAfter(docNode._docNode);
                }
            });

            if (this._docNode) {
                this._docNode.remove();
            }
        }
    }
});


/**
 */
$(class $BuilderText extends Cls$BuilderNode {
    constructor(text) {
        super();
        this._text = text;

        if (typeof this._text == 'function') {
            /*
            $cache.reflect(this._text).forEach(dependency => {
                $docManager.registerHandler('changes', dependency.cache, dependency.key, () => {
                    let updated = $TextNode(this._text().toString());
                    this._docNode.replace(updated);
                    this._docNode = updated;
                });
            });

            this._docNode = $TextNode(this._text().toString());
            */
        }
        else {
            this._docNode = $TextNode(this._text.toString());
        }
    }

    copy() {
        return $BuilderText(this._text);
    }
  
    text() {
        return this._text;
    }
});


/**
 */
$(class $BuilderAttribute extends Cls$BuilderNode {
    constructor(name, value) {
        super();
        this._name = name;
        this._value = value;
    }

    _attach(parent) {
        super._attach(parent);

        if (typeof this._value == 'function') {
            /*
            $cache.reflect(this._value).forEach(dependency => {
                $docManager.registerHandler('changes', dependency.cache, dependency.key, () => {
                    this._parentNode._docNode.attribute(this._name, this._value());
                });
            });

            if (this._parentNode && this._parentNode._docNode) {
                this._parentNode._docNode.attribute(this._name, this._value());
            }
            */
        }
        else if (this._name in {'src':0, 'href':0} && SESSION) {
            this._parentNode._docNode.attribute(this._name, `${this._value.toString()}?SESSION=${SESSION}`);
        }
        else {
            this._parentNode._docNode.attribute(this._name, this._value.toString());
        }
    }

    copy() {
        return $BuilderAttribute(this._name, this._value);
    }

    _detach() {
        this._parentNode._docNode.removeAttribute(this._name);
        super._detach();
    }
  
    name() {
        return this._name;
    }
  
    value() {
        return this._value;
    }
});


/**
 */
$(class $DocBuilderEvent extends Cls$BuilderNode {
    constructor(type, handler, once) {
        super();
        this._type = type;
        this._handler = handler;
        this._once = once;
    }

    _attach(parent) {
        super._attach(parent);

        if (this._once) {
            this._parentNode._docNode.once(this._type, this._handler);
        }
        else {
            this._parentNode._docNode.on(this._type, this._handler);
        }
    }

    copy() {
        return $BuilderEvent(this._type, this._handler, this._once);
    }

    _detach() {
        this._parentNode._docNode.off(this._type, this._handler);
        super._detach();
    }
  
    handler() {
        return this._handler;
    }
  
    once() {
        return this._once;
    }
  
    type() {
        return this._type;
    }
});


/**
 */
$(class $BuilderElement extends Cls$BuilderNode {
    constructor(tagName, ...args) {
        super();
        this._tagName = tagName;
        this._docNode = $DocElement(this._tagName);
        this._children = [];
        this.append(...args);
    }

    append(...args) {
        Cls$BuilderNode._docify(...args).forEach(docNode => {
            docNode._attach(this);
            this._children.push(docNode);
            
            if (docNode instanceof Cls$BuilderText || docNode instanceof Cls$BuilderElement) {
                this._docNode.append(docNode._docNode);
            }
        });
    }

    copy() {
        return $BuilderElement(
            this._tagName,
            this._children.map(child => {
                return child.copy();
            })
        );
    }

    indexOf(docNode) {
        for (let i = 0; i < this._children.length; i++) {
            let childNode = this._children[i];

            if (childNode === docNode) {
                return i;
            }
        }

        return -1;
    }

    prepend(...args) {
        docify(...args).reverse().forEach(docNode => {
            docNode._attach(this);
            this._children.unshift(docNode);
            
            if (docNode instanceof Cls$BuilderText || docNode instanceof Cls$BuilderElement) {
                this._docNode.prepend(docNode._docNode);
            }
        });
    }
});


/**
 */
$Global.$doc = $Document();
$Global.$win = $Window();


/**
 */
$Global.$attr    = (name, value) => $BuilderAttribute(name, value);
$Global.$onEvt   = (type, handler) => $BuilderEvent(type, handler, false);
$Global.$onceEvt = (type, handler) => $BuilderEvent(type, handler, true);


/**
 */
$Global.$a          = (...args) => $BuilderElement('a', ...args);
$Global.$abbr       = (...args) => $BuilderElement('abbr', ...args);
$Global.$address    = (...args) => $BuilderElement('address', ...args);
$Global.$area       = (...args) => $BuilderElement('area', ...args);
$Global.$article    = (...args) => $BuilderElement('article', ...args);
$Global.$aside      = (...args) => $BuilderElement('aside', ...args);
$Global.$audio      = (...args) => $BuilderElement('audio', ...args);
$Global.$b          = (...args) => $BuilderElement('b', ...args);
$Global.$base       = (...args) => $BuilderElement('base', ...args);
$Global.$bdi        = (...args) => $BuilderElement('bdi', ...args);
$Global.$bdo        = (...args) => $BuilderElement('bdo', ...args);
$Global.$blockquote = (...args) => $BuilderElement('blockquote', ...args);
$Global.$body       = (...args) => $BuilderElement('body', ...args);
$Global.$br         = (...args) => $BuilderElement('br', ...args);
$Global.$button     = (...args) => $BuilderElement('button', ...args);
$Global.$canvas     = (...args) => $BuilderElement('canvas', ...args);
$Global.$caption    = (...args) => $BuilderElement('caption', ...args);
$Global.$cite       = (...args) => $BuilderElement('cite', ...args);
$Global.$col        = (...args) => $BuilderElement('col', ...args);
$Global.$colgroup   = (...args) => $BuilderElement('colgroup', ...args);
$Global.$data       = (...args) => $BuilderElement('data', ...args);
$Global.$datalist   = (...args) => $BuilderElement('datalist', ...args);
$Global.$del        = (...args) => $BuilderElement('del', ...args);
$Global.$details    = (...args) => $BuilderElement('details', ...args);
$Global.$dd         = (...args) => $BuilderElement('dd', ...args);
$Global.$dfn        = (...args) => $BuilderElement('dfn', ...args);
$Global.$dialog     = (...args) => $BuilderElement('dialog', ...args);
$Global.$div        = (...args) => $BuilderElement('div', ...args);
$Global.$dl         = (...args) => $BuilderElement('dl', ...args);
$Global.$dm         = (...args) => $BuilderElement('dm', ...args);
$Global.$dt         = (...args) => $BuilderElement('dt', ...args);
$Global.$embed      = (...args) => $BuilderElement('embed', ...args);
$Global.$fieldset   = (...args) => $BuilderElement('fieldset', ...args);
$Global.$figcaption = (...args) => $BuilderElement('figcaption', ...args);
$Global.$figure     = (...args) => $BuilderElement('figure', ...args);
$Global.$footer     = (...args) => $BuilderElement('footer', ...args);
$Global.$form       = (...args) => $BuilderElement('form', ...args);
$Global.$h1         = (...args) => $BuilderElement('h1', ...args);
$Global.$h2         = (...args) => $BuilderElement('h2', ...args);
$Global.$h3         = (...args) => $BuilderElement('h3', ...args);
$Global.$h4         = (...args) => $BuilderElement('h4', ...args);
$Global.$h5         = (...args) => $BuilderElement('h5', ...args);
$Global.$h6         = (...args) => $BuilderElement('h6', ...args);
$Global.$head       = (...args) => $BuilderElement('head', ...args);
$Global.$header     = (...args) => $BuilderElement('header', ...args);
$Global.$hgroup     = (...args) => $BuilderElement('hgroup', ...args);
$Global.$hr         = (...args) => $BuilderElement('hr', ...args);
$Global.$html       = (...args) => $BuilderElement('html', ...args);
$Global.$i          = (...args) => $BuilderElement('i', ...args);
$Global.$iframe     = (...args) => $BuilderElement('iframe', ...args);
$Global.$img        = (...args) => $BuilderElement('img', ...args);
$Global.$input      = (...args) => $BuilderElement('input', ...args);
$Global.$ins        = (...args) => $BuilderElement('ins', ...args);
$Global.$kdb        = (...args) => $BuilderElement('kdb', ...args);
$Global.$label      = (...args) => $BuilderElement('label', ...args);
$Global.$legend     = (...args) => $BuilderElement('legend', ...args);
$Global.$li         = (...args) => $BuilderElement('li', ...args);
$Global.$link       = (...args) => $BuilderElement('link', ...args);
$Global.$main       = (...args) => $BuilderElement('main', ...args);
$Global.$map        = (...args) => $BuilderElement('map', ...args);
$Global.$mark       = (...args) => $BuilderElement('mark', ...args);
$Global.$menu       = (...args) => $BuilderElement('menu', ...args);
$Global.$meta       = (...args) => $BuilderElement('meta', ...args);
$Global.$meter      = (...args) => $BuilderElement('meter', ...args);
$Global.$nav        = (...args) => $BuilderElement('nav', ...args);
$Global.$noscript   = (...args) => $BuilderElement('noscript', ...args);
$Global.$object     = (...args) => $BuilderElement('object', ...args);
$Global.$ol         = (...args) => $BuilderElement('ol', ...args);
$Global.$optgroup   = (...args) => $BuilderElement('optgroup', ...args);
$Global.$option     = (...args) => $BuilderElement('option', ...args);
$Global.$output     = (...args) => $BuilderElement('output', ...args);
$Global.$p          = (...args) => $BuilderElement('p', ...args);
$Global.$param      = (...args) => $BuilderElement('param', ...args);
$Global.$path       = (...args) => $BuilderElement('path', ...args);
$Global.$picture    = (...args) => $BuilderElement('picture', ...args);
$Global.$pre        = (...args) => $BuilderElement('pre', ...args);
$Global.$progress   = (...args) => $BuilderElement('progress', ...args);
$Global.$q          = (...args) => $BuilderElement('q', ...args);
$Global.$rb         = (...args) => $BuilderElement('rb', ...args);
$Global.$rp         = (...args) => $BuilderElement('rp', ...args);
$Global.$rt         = (...args) => $BuilderElement('rt', ...args);
$Global.$rtc        = (...args) => $BuilderElement('rtc', ...args);
$Global.$ruby       = (...args) => $BuilderElement('ruby', ...args);
$Global.$s          = (...args) => $BuilderElement('s', ...args);
$Global.$samp       = (...args) => $BuilderElement('samp', ...args);
$Global.$script     = (...args) => $BuilderElement('script', ...args);
$Global.$section    = (...args) => $BuilderElement('section', ...args);
$Global.$select     = (...args) => $BuilderElement('select', ...args);
$Global.$slot       = (...args) => $BuilderElement('slot', ...args);
$Global.$small      = (...args) => $BuilderElement('small', ...args);
$Global.$source     = (...args) => $BuilderElement('source', ...args);
$Global.$span       = (...args) => $BuilderElement('span', ...args);
$Global.$strong     = (...args) => $BuilderElement('strong', ...args);
$Global.$style      = (...args) => $BuilderElement('style', ...args);
$Global.$sub        = (...args) => $BuilderElement('sub', ...args);
$Global.$summary    = (...args) => $BuilderElement('summary', ...args);
$Global.$sup        = (...args) => $BuilderElement('sup', ...args);
$Global.$table      = (...args) => $BuilderElement('table', ...args);
$Global.$tbody      = (...args) => $BuilderElement('tbody', ...args);
$Global.$td         = (...args) => $BuilderElement('td', ...args);
$Global.$template   = (...args) => $BuilderElement('template', ...args);
$Global.$text       = (...args) => $BuilderElement('text', ...args);
$Global.$textarea   = (...args) => $BuilderElement('textarea', ...args);
$Global.$tfoot      = (...args) => $BuilderElement('tfoot', ...args);
$Global.$th         = (...args) => $BuilderElement('th', ...args);
$Global.$thead      = (...args) => $BuilderElement('thead', ...args);
$Global.$time       = (...args) => $BuilderElement('time', ...args);
$Global.$title      = (...args) => $BuilderElement('title', ...args);
$Global.$tr         = (...args) => $BuilderElement('tr', ...args);
$Global.$track      = (...args) => $BuilderElement('track', ...args);
$Global.$u          = (...args) => $BuilderElement('u', ...args);
$Global.$ul         = (...args) => $BuilderElement('ul', ...args);
$Global.$var        = (...args) => $BuilderElement('var', ...args);
$Global.$video      = (...args) => $BuilderElement('video', ...args);
$Global.$wbr        = (...args) => $BuilderElement('wbr', ...args);


/**
 */
$Global.$SvgA                   = (...args) => $BuilderElement('@a', ...args);
$Global.$SvgAnimate             = (...args) => $BuilderElement('@animate', ...args);
$Global.$SvgAnimateMotion       = (...args) => $BuilderElement('@animateMotion', ...args);
$Global.$SvgAnimateTransform    = (...args) => $BuilderElement('@animateTransform', $attr('attributeName', 'transform'), $attr('attributeType', 'XML'), ...args);
$Global.$SvgCircle              = (...args) => $BuilderElement('@circle', ...args);
$Global.$SvgClipPath            = (...args) => $BuilderElement('@clipPath', ...args);
$Global.$SvgDefs                = (...args) => $BuilderElement('@defs', ...args);
$Global.$SvgDesc                = (...args) => $BuilderElement('@desc', ...args);
$Global.$SvgDiscard             = (...args) => $BuilderElement('@discard', ...args);
$Global.$SvgEllipse             = (...args) => $BuilderElement('@ellipse', ...args);
$Global.$SvgFeBlend             = (...args) => $BuilderElement('@feBlend', ...args);
$Global.$SvgFeColorMatrix       = (...args) => $BuilderElement('@feColorMatrix', ...args);
$Global.$SvgFeComponentTransfer = (...args) => $BuilderElement('@feComponentTransfer', ...args);
$Global.$SvgFeComposite         = (...args) => $BuilderElement('@feComposite', ...args);
$Global.$SvgFeConvolveMatrix    = (...args) => $BuilderElement('@feConvolveMatrix', ...args);
$Global.$SvgFeDiffuseLighting   = (...args) => $BuilderElement('@feDiffuseLighting', ...args);
$Global.$SvgFeDisplacementMap   = (...args) => $BuilderElement('@feDisplacementMap', ...args);
$Global.$SvgFeDistantLight      = (...args) => $BuilderElement('@feDistantLight', ...args);
$Global.$SvgFeDropShadow        = (...args) => $BuilderElement('@feDropShadow', ...args);
$Global.$SvgFeFlood             = (...args) => $BuilderElement('@feFloog', ...args);
$Global.$SvgFeFuncA             = (...args) => $BuilderElement('@feFuncA', ...args);
$Global.$SvgFeFuncB             = (...args) => $BuilderElement('@feFuncB', ...args);
$Global.$SvgFeFuncG             = (...args) => $BuilderElement('@feFuncG', ...args);
$Global.$SvgFeFuncR             = (...args) => $BuilderElement('@feFuncR', ...args);
$Global.$SvgFeGaussianBlur      = (...args) => $BuilderElement('@feGaussianBlur', ...args);
$Global.$SvgReImage             = (...args) => $BuilderElement('@feImage', ...args);
$Global.$SvgFeMerge             = (...args) => $BuilderElement('@feMerge', ...args);
$Global.$SvgFeMergeNode         = (...args) => $BuilderElement('@feMergeNode', ...args);
$Global.$SvgFeMorphology        = (...args) => $BuilderElement('@feMorphology', ...args);
$Global.$SvgFeOffset            = (...args) => $BuilderElement('@feOffset', ...args);
$Global.$SvgFePointLight        = (...args) => $BuilderElement('@fePointLight', ...args);
$Global.$SvgFeSpecularLighting  = (...args) => $BuilderElement('@feSpecularLighting', ...args);
$Global.$SvgFeSpotLighting      = (...args) => $BuilderElement('@feSpotLighting', ...args);
$Global.$SvgFeTile              = (...args) => $BuilderElement('@feTile', ...args);
$Global.$SvgFeTurbulence        = (...args) => $BuilderElement('@feTurbulence', ...args);
$Global.$SvgFilter              = (...args) => $BuilderElement('@filter', ...args);
$Global.$SvgForeignObject       = (...args) => $BuilderElement('@foreignObject', ...args);
$Global.$SvgG                   = (...args) => $BuilderElement('@g', ...args);
$Global.$SvgHatch               = (...args) => $BuilderElement('@hatch', ...args);
$Global.$SvgHatchpath           = (...args) => $BuilderElement('@hatchpath', ...args);
$Global.$SvgImage               = (...args) => $BuilderElement('@image', ...args);
$Global.$SvgLine                = (...args) => $BuilderElement('@line', ...args);
$Global.$SvgLinearGradient      = (...args) => $BuilderElement('@linearGradient', ...args);
$Global.$SvgMarker              = (...args) => $BuilderElement('@marker', ...args);
$Global.$SvgMesh                = (...args) => $BuilderElement('@mesh', ...args);
$Global.$SvgMeshgradient        = (...args) => $BuilderElement('@meshgradient', ...args);
$Global.$SvgMeshpatch           = (...args) => $BuilderElement('@meshpatch', ...args);
$Global.$SvgMeshrow             = (...args) => $BuilderElement('@meshrow', ...args);
$Global.$SvgMetadata            = (...args) => $BuilderElement('@metadata', ...args);
$Global.$SvgMpath               = (...args) => $BuilderElement('@mpath', ...args);
$Global.$SvgPath                = (...args) => $BuilderElement('@path', ...args);
$Global.$SvgPolygon             = (...args) => $BuilderElement('@polygon', ...args);
$Global.$SvgPolyline            = (...args) => $BuilderElement('@polyline', ...args);
$Global.$SvgRadialGradient      = (...args) => $BuilderElement('@radialGradient', ...args);
$Global.$SvgRect                = (...args) => $BuilderElement('@rect', ...args);
$Global.$SvgScript              = (...args) => $BuilderElement('@script', ...args);
$Global.$SvgSet                 = (...args) => $BuilderElement('@set', ...args);
$Global.$SvgStop                = (...args) => $BuilderElement('@stop', ...args);
$Global.$SvgStyle               = (...args) => $BuilderElement('@style', ...args);
$Global.$SvgSwitch              = (...args) => $BuilderElement('@switch', ...args);
$Global.$SvgSymbol              = (...args) => $BuilderElement('@symbol', ...args);
$Global.$SvgSvg                 = (...args) => $BuilderElement('@svg', ...args);
$Global.$SvgText                = (...args) => $BuilderElement('@text', ...args);
$Global.$SvgTextPath            = (...args) => $BuilderElement('@textPath', ...args);
$Global.$SvgTitle               = (...args) => $BuilderElement('@title', ...args);
$Global.$SvgTspan               = (...args) => $BuilderElement('@tspan', ...args);
$Global.$SvgUse                 = (...args) => $BuilderElement('@use', ...args);
$Global.$SvgView                = (...args) => $BuilderElement('@view', ...args);
