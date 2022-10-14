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
 * A dynamic wrapper for a single DOM stylesheet object.  Like all other wrappers,
 * when a value is returned, such as a rules list, the return value is also a
 * wrapper object.  Our mission here is to allow application developers to cleanly
 * analyze and modify stylesheets from within application code.
*****/
register(class StyleSheet {
    constructor(cssStyleSheet) {
        this.cssObject = cssStyleSheet;
    }

    createRule(cssText, index) {
        let ruleList = mkCssRuleList(this, this.cssObject.cssRules);
        let ruleIndex = this.cssObject.insertRule(cssText, index);
        let cssRule = this.cssObject.cssRules.item(ruleIndex);
        let ctor = Reflect.getPrototypeOf(cssRule).constructor;
        return CssMakers.get(ctor)(this, cssRule);
    }

    enabled() {
        return !this.cssObject.disable;
    }

    href() {
        return this.cssObject.href;
    }

    language() {
        return this.cssObject.type();
    }

    media() {
        return this.cssObject.media;
    }

    ownerNode() {
        return this.cssObject.ownerNode;
    }

    parentStyleSheet() {
        return mkStyleSheet(this.cssObject.parentStyleSheet);
    }

    rule(index) {
        return mkCssRuleList(this, this.cssObject.cssRules).item(index);
    }

    rules() {
        return mkCssRuleList(this, this.cssObject.cssRules);
    }

    [Symbol.iterator]() {
        return mkCssRuleList(this, this.cssObject.cssRules)[Symbol.iterator]();
    }

    title() {
        return this.cssObject.title;
    }
});


/*****
 * A rule list contains a list of style rules of various types.  Some rules are
 * singular while other rules may be groupiing rules that contain their own rule
 * list in a recursive fashion.  Note that we also have the means here to 
*****/
register(class CssRuleList {
    constructor(cssOwner, cssRuleList) {
        this.cssOwner = cssOwner;
        this.cssRuleList = cssRuleList;
    }

    item(index) {
        let cssRule = this.cssRuleList.item(index);
        let ctor = Reflect.getPrototypeOf(cssRule).constructor;
        return CssMakers.get(ctor)(this, cssRule);
    }

    length() {
        return this.cssRuleList.length;
    }

    [Symbol.iterator]() {
        let rulesArray = [];

        for (let cssRule of this.cssRuleList) {
            let ctor = Reflect.getPrototypeOf(cssRule).constructor;
            let rule = CssMakers.get(ctor)(this, cssRule);
            rulesArray.push(rule);
        }

        return rulesArray[Symbol.iterator]();
    }
});


/*****
 * The fundamental interface is the base class for all of the CSS rule classes,
 * and provides common features that are applicable to all of derived or CSS
 * style subclasses.  
*****/
register(class CssRule {
    constructor(cssOwner, cssRule) {
        this.cssOwner = cssOwner;
        this.cssRule = cssRule;
    }

    index() {
        for (let i = 0; i < this.cssOwner.cssObject.length; i++) {
            if (Object.is(this.cssRule, this.cssOwner.cssObject.item(i))) {
                return i;
            }
        }
    }

    parent() {
        this.cssRule.parentRule;
    }

    remove() {
        this.cssOwner.cssObject.deleteRule(this.index());
    }

    ruleList() {
        return this.ruleList;
    }

    styleSheet() {
        return this.ruleList.styleSheet;
    }

    text() {
        return this.cssRule.cssText;
    }
});


/*****
 * A grouping rule is a CSS rule that behaves in a manner similar to the style
 * sheet itself.  It has its own rules list and has been made to be iterable to
 * make scanning and searching rules simple then it would be otherwise.  Rules
 * may also be accessed by index but the catch with that is you need to know the
 * index, which requires a sweep through the group's rules to ascertain what that
 * index is.
*****/
register(class CssGroupingRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
        this.cssObject = this.cssOwner;
    }

    rule(index) {
        return mkCssRuleList(this, this.cssRule.cssRules).item(index);
    }

    rules() {
        return mkCssRuleList(this, this.cssRule.cssRules);
    }

    [Symbol.iterator]() {
        return mkCssRuleList(this, this.cssRule.cssRules)[Symbol.iterator]();
    }
});


/*****
 * A condition rule is one that uses specific rules to determine whether rules
 * contained within the condition rule should be active.  Notice that condition
 * rule extends grouping rule.  There are no rule classes that are a condition
 * rule without being a grouping rule.
*****/
register(class CssConditionRule extends CssGroupingRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});


/*****
 * These are the specific CSS rules instances that are created by the browser.
 * They have one of either two differing base rules, either CssRule or the
 * more interestng CssConditionRule.  Rules derived from CssConditionRule are
 * also CssGroupingRules and consequently are CSS rule containers.
*****/
register(class CssCounterStyleRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssFontFaceRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssImportRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssKeyframeRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssKeyframesRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssMediaRule extends CssConditionRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssNamespaceRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssPageRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }
});

register(class CssStyleRule extends CssRule {
    constructor(cssOwner, cssRule) {
        super(cssOwner, cssRule);
    }

    style() {
        return this.cssRule.style;
    }
});

register(class CssSupportsRule extends CssConditionRule {
    constructor(ruleList, cssRule) {
        super(cssOwner, cssRule);
    }
});


/*****
 * This weak map is used for finding maker function, e.g., mkMediaRul(), based on
 * a given DOM CSS class type.  This is the complete enumeration of all CSS rule
 * types supported by the DOM specification and by this software.
*****/
const CssMakers = new WeakMap();
CssMakers.set(CSSCounterStyleRule, mkCssCounterStyleRule);
CssMakers.set(CSSFontFaceRule, mkCssFontFaceRule);
CssMakers.set(CSSImportRule, mkCssImportRule);
CssMakers.set(CSSKeyframeRule, mkCssKeyframeRule);
CssMakers.set(CSSKeyframesRule, mkCssKeyframesRule);
CssMakers.set(CSSMediaRule, mkCssMediaRule);
CssMakers.set(CSSNamespaceRule, mkCssNamespaceRule);
CssMakers.set(CSSPageRule, mkCssPageRule);
CssMakers.set(CSSStyleRule, mkCssStyleRule);
CssMakers.set(CSSSupportsRule, mkCssSupportsRule);
