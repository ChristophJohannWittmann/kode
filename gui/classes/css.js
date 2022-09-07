/**
 */


/**
 */
 $(class $RuleBase {
    constructor(nativeItem) {
        this._nativeItem = nativeItem;
    }

    cssText() {
        return this._nativeItem.cssText;
    }

    index() {
        let i = -1;
        let parent = this.parent();
        let rules = this.parent()._nativeItem.cssRules;

        if (rules) {
            for (i = 0; i < rules.length; i++) {
                if (this._nativeItem === rules.item(i)) {
                    break;
                }
            }
        }

        return i;
    }

    insertRuleAfter(rule) {
        let thisParent = this.parent();

        if (thisParent) {
            let cssText;

            if (rule instanceof $RuleBase) {
                let thatParent = rule.parent();
                thatParent._nativeItem.deleteRule(rule.index());
                cssText = rule.cssText();
            }
            else {
                cssText = rule;
            }

            thisParent._nativeItem.insertRule(this.index() + 1);
        }

        return this;
    }

    insertRuleBefore(rule) {
        let thisParent = this.parent();

        if (thisParent) {
            let cssText;

            if (rule instanceof $RuleBase) {
                let thatParent = rule.parent();
                thatParent._nativeItem.deleteRule(rule.index());
                cssText = rule.cssText();
            }
            else {
                cssText = rule;
            }

            thisParent._nativeItem.insertRule(this.index());
        }

        return this;
    }

    isGroupingRule() {
        return false;
    }

    isMediaRule() {
        return false;
    }

    isSupportsRule() {
        return false;
    }

    isStyleRule() {
        return false;
    }

    parent() {
        if (this._nativeItem.parentRule) {
            return this.parentRule();
        }
        else if (this._nativeItem.parentStyleSheet) {
            return this.parentStyleSheet();
        }

        return null;
    }

    parentRule() {
        return $RuleBase.wrap(this._nativeItem.parentRule);
    }

    parentStyleSheet() {
        return $RuleBase.wrap(this._nativeItem.parentStyleSheet);
    }

    removeRule() {
        let index = this.index();

        if (index) {
            let parent = this.parent();
            parent._nativeItem.deleteRule(index);
        }

        return this;
    }

    async replaceRule(rule) {
        let parent = this.parent();

        if (parent) {
            let index = this.index();
            let ruleText = typeof rule == 'string' ? rule : rule.cssText();
            parent._nativeItem.deleteRule(index);
            parent._nativeItem.insertRule(ruleText, index);
            return $RuleBase.wrap(this._nativeItem);
        }
    }

    static wrap(arg) {
        if (arg instanceof CSSMediaRule) {
            return $MediaRule(arg);
        }
        else if (arg instanceof CSSSupportsRule) {
            return $SupportsRule(arg);
        }
        else if (arg instanceof CSSStyleRule) {
            return $StyleRule(arg);
        }
        else if (arg instanceof Cls$MediaRule) {
            return arg;
        }
        else if (arg instanceof Cls$SupportsRule) {
            return arg;
        }
        else if (arg instanceof Cls$StyleRule) {
            return arg;
        }
    }
 });


/**
 */
$(class $StyleDeclaration {
    constructor(styleRule) {
        this._nativeDecl = styleRule._nativeItem.style;
    }

    clear(name) {
        if (name) {
            this._nativeDecl.removeProperty(name);
        }
        else {
            this.propertyNames().forEach(propertyName => {
                this._nativeDecl.removeProperty(propertyName);
            });
        }

        return this;
    }

    cssFloat() {
        return this._nativeDecl.cssFloat;
    }

    cssText() {
        return this._nativeDecl.cssText;
    }

    has(name) {
        for (let i = 0; i < this._nativeDecl.length; i++) {
            if (this._nativeDecl.item(i) == name) {
                return true;
            }
        }

        return false;
    }

    length() {
        return this._nativeDecl.length;
    }

    parentRule() {
        return Cls$RuleBase.wrap(this._nativeDecl.parentRule);
    }

    properties() {
        let properties = [];

        for (let i = 0; i < this._nativeDecl.length; i++) {
            let name = this._nativeDecl.item(i);

            properties.push({
                name: name,
                value: this._nativeDecl.getPropertyValue(name),
                priority: this._nativeDecl.getPropertyPriority(name)
            });
        }

        return properties;
    }

    propertyNames() {
        let names = [];

        for (let i = 0; i < this._nativeDecl.length; i++) {
            names.push(this._nativeDecl.item(i));
        }

        return names;
    }

    set(name, value, priority) {
        this._nativeDecl.setProperty(name, value, priority ? priority : '');
        return this;
    }

    value(name) {
        return this._nativeDecl.getPropertyValue(name);
    }
});


/**
 */
$(class $StyleRule extends Cls$RuleBase {
    constructor(nativeItem) {
        super(nativeItem);
        this._decl = new Cls$StyleDeclaration(this);
    }

    cssText() {
        return `${this.selector()} { ${this._decl.cssText()} }`;
    }

    decl() {
        return this._decl;
    }

    isStyleRule() {
        return true;
    }

    selector() {
        return this._nativeItem.selectorText;
    }
});


/**
 */
$(class $GroupingRule extends Cls$RuleBase {
    constructor(nativeItem) {
        super(nativeItem);
    }

    appendRule(rule) {
        return this;
    }

    conditionText() {
        return this._nativeRule.conditionText;
    }

    createRule(ruleText, index) {
        let n = index === undefined ? this._nativeItem.rules.length : index;
        let rule = this._nativeItem.insertRule(ruleText, n);
        return Cls$RuleBase.wrap(rule);
    }

    isGroupingRule() {
        return true;
    }

    length() {
        return this._nativeItem.cssRules.length;
    }

    listRules() {
        let rules = [];

        for (let i = 0; i < this._nativeItem.cssRules.length; i++) {
            rules.push(Cls$RuleBase.wrap(this._nativeItem.cssRules.item(i)));
        }

        return rules;
    }

    prependRule(rule) {
        return this;
    }
});


/**
 */
$(class $MediaRule extends Cls$GroupingRule {
    constructor(nativeItem) {
        super(nativeItem);
    }

    isMediaRule() {
        return true;
    }
});


/**
 */
$(class $SupportsRule extends Cls$GroupingRule {
    constructor(nativeItem) {
        super(nativeItem);
    }

    isSupportsRule() {
        return true;
    }
});


/**
 */
$(class $StyleSheet {
    constructor(nativeItem) {
        this._nativeItem = nativeItem;
        this._styleElement = this.ownerElement();
    }

    appendRule(rule) {
        let n = this._nativeItem.cssRules.length;

        if (rule instanceof Cls$RuleBase) {
            this._nativeItem.insertRule(rule.cssText(), n);
            return Cls$RuleBase.wrap(this._nativeItem.rules.item(n));
        }
        else if (typeof rule == 'string') {
            this._nativeItem.insertRule(rule, n);
            return Cls$RuleBase.wrap(this._nativeItem.rules.item(n));
        }
    }

    appendMedium(medium) {
        this._nativeItem.appendMedium(medium);
        return this;
    }

    createRule(ruleText, index) {
        let n = index === undefined ? this._nativeItem.rules.length : index;
        let rule = this._nativeItem.insertRule(ruleText, n);
        return Cls$RuleBase.wrap(rule);
    }

    disable() {
        this._nativeItem.disabled = true;
        return this;
    }

    enable() {
        this._nativeItem.disabled = false;
        return this;
    }

    enabled() {
        return !this._nativeItem.disabled;
    }

    href() {
        return this._nativeItem.href;
    }

    insertStyleSheetAfter(styleSheet) {
        let owner0 = this.ownerElement();
        let owner1 = styleSheet.ownerElement();

        if (owner0 && owner1 && owner0.parent().tagName() == 'head') {
            owner0.insertBefore(owner1);
        }

        return this;
    }

    insertStyleSheetBefore(styleSheet) {
        let owner0 = this.ownerElement();
        let owner1 = styleSheet.ownerElement();

        if (owner0 && owner1 && owner1.parent().tagName() == 'head') {
            owner1.insertBefore(owner0);
        }

        return this;
    }

    length() {
        return this._nativeItem.rules.length;
    }

    listRules() {
        let rules = [];

        for (let i = 0; i < this._nativeItem.cssRules.length; i++) {
            rules.push(Cls$RuleBase.wrap(this._nativeItem.cssRules.item(i)));
        }

        return rules;
    }

    media(value) {
        if (value) {
            if (typeof value == 'string') {
                this._nativeItem.media.mediaText = value;
            }

            return this;
        }
        else {
            let mediaArray = [];

            for (let i = 0; i < this._nativeItem.media.length; i++) {
                mediaArray.push(this._nativeItem.media.item(i));
            }

            return mediaArray;
        }
    }

    ownerElement() {
        if (this._nativeItem.ownerNode) {
            return $DocElement(this._nativeItem.ownerNode);
        }

        return null;
    }

    parentStyleSheet() {
        if (this._nativeItem.parentStyleSheet) {
            return new $StyleSheet(this._nativeItem.parentStyleSheet);
        }

        return null;
    }

    prependRule(rule) {
        let n = 0;

        if (rule instanceof Cls$RuleBase) {
            this._nativeItem.insertRule(rule.cssText(), n);
            return Cls$RuleBase.wrap(this._nativeItem.rules.item(n));
        }
        else if (typeof rule == 'string') {
            this._nativeItem.insertRule(rule, n);
            return Cls$RuleBase.wrap(this._nativeItem.rules.item(n));
        }
    }

    removeMedium(medium) {
        this._nativeItem.deleteMedium(medium);
        return this;
    }

    removeStyleSheet() {
        if (this.ownerElement()) {
            $DocElement(this._nativeItem.ownerNode).remove();
        }

        return this;
    }

    title() {
        return this._nativeItem.title;
    }

    type() {
        return this._nativeItem.type;
    }
});


/**
 */
$(class $Css {
    static appendStyleSheet(styleSheet) {
        styleSheet.remove();
        $query('head').append(styleSheet._styleElement);
    }
  
    static _createDummyStyleSheet() {
        let dummyStyleSheet = Cls$Css.createStyleSheet(0);
        dummyStyleSheet.enabled(false);
        dummyStyleSheet.appendRule('.dogbert {}');
        dummyStyleSheet.removeStyleSheet();
        return dummyStyleSheet;
    }
  
    static createStyleSheet(index) {
        let n;
        let styleSheets = document.styleSheets;
        let styleElement = $DocElement('style');
  
        if (index <= 0) {
            n = 0;
            $query('head').prepend(styleElement);
        }
        else if (index > 0 && index < styleSheets.length) {
            n = index;
            $DocNode(styleSheets).insertBefore(styleElement);
        }
        else {
            n = styleSheets.length;
            $query('head').append(styleElement);
        }
  
        return $StyleSheet(document.styleSheets[n]);
    }
  
    static length() {
        return document.styleSheets.length;
    }
  
    static listStyleSheets() {
        let cssStyleSheets = [];
  
        for (let i = 0; i < document.styleSheets.length; i++) {
            cssStyleSheets.push($StyleSheet(document.styleSheets.item(i)));
        }
  
        return cssStyleSheets;
    }

    static prependStyleSheet() {
        styleSheet.remove();
        $query('head').append(styleSheet._styleElement);
    }
  
    static propertyList() {
        let dummyStyleSheet = $Css._createDummyStyleSheet();
        let declaration = dummyStyleSheet.listRules()[0]._nativeItem.style;
        return Object.getOwnPropertyNames(declaration);
    }
  
    static propertySet() {
        let dummyStyleSheet = $Css._createDummyStyleSheet();
        let declaration = dummyStyleSheet.listRules()[0]._nativeItem.style;
        return $Set(Object.getOwnPropertyNames(declaration));
    }
});
