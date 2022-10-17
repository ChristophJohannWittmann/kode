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
 * Widget class data was originally coceived to manager css settings for a
 * specific widget class.  The concept was extended and created to provide data
 * of any type that pertains to a specific widget class, not a specific widget.
*****/
register(class WidgetClassData extends NonJsonable {
    constructor(ctor) {
        super();
        this.ctor = ctor;
        this.name = ctor.name;
        this.styleName = `wid-${this.name.toLowerCase()}`;
        this.styleSelector = `.wid-${this.name.toLowerCase()}`;
        this.styleSheet = doc.getStyleSheet('webapp');
        this.style = this.styleSheet.createRule(`${this.styleSelector} {}`);
        this.styleRules = [];

        if ('initialize' in this.ctor) {
            this.ctor.initialize(this);
        }
    }

    clearStyleRule(rule) {
        for (let i = 0; i < this.styleRules.length; i++) {
            let styleRule = this.styleRules[i];

            if (Object.is(styleRule, rule)) {
                styleRule.remove();
                this.styleRules.splice(i, 1)
                break;
            }
        }
    }

    createStyleRule(ruleText) {
        let rule = this.styleSheet.createRule(ruleText);
        this.styleRules.push(rule);
        return rule;

    }
});


/*****
 * The widget class manager singleton object is a repository for all created
 * instances of WidgetClassData.  The concept being that we need to ensure each
 * Widget subclass is initialized once with certain data that pertains to that
 * class to help manage each widget and widget class as a complex dynamic part
 * of the application GUI.
*****/
singleton(class WidgetClassManager extends NonJsonable {
    constructor() {
        super();
        this.classes= {};
        this.classes['Widget'] = {};
        this.classes['Emitter'] = {};
        this.classes['NonJsonable'] = {};
    }

    fromInstance(instance) {
        let className = Reflect.getPrototypeOf(instance).constructor.name;

        if (className in this.classes) {
            return this.classes[className];
        }
        else {
            let classData;

            for (let clss of classHierarchyList(instance)) {
                if (!(clss.name in this.classes)) {
                    classData = mkWidgetClassData(clss);
                    this.classes[classData.name] = classData;
                }
            }

            return classData;
        }
    }
});