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
 * The widget class that encapsulates the features and functions associated with
 * an HTML select element.  The API supports groups and options and hopefully
 * simpflifies things well behond the standard MDN API.  Options and groups may
 * be analyzed and modified dynamically.  Perhaps the most important feature is
 * that the WSelect class implements the value-interface, which is needed for
 * binding a select element to an ActiveData instance.
*****/
register(class WSelect extends WEditable {
    constructor() {
        super('select');
        this.setWidgetStyle('select');

        this.on('dom.input', message => {
            this.valueChanged(message.event.target.value);
        });
    }

    addGroup(label) {
    }

    addOption(value, text) {
    }

    clear() {
        for (let option of this.node.options) {
            option.selected = false;
        }

        return this;
    }

    getGroup(label) {
        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'optgroup' && child.getAttribute('label') == label) {
                    return child.widget();
                }
            }
        }

        return null;
    }

    getGroupArray() {
        let array = [];

        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'optgroup') {
                    array.push(child.widget());
                }
            }
        }

        return array;
    }

    getGroupMap() {
        let map = {};

        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'optgroup') {
                    map[child.getAttribute('label')] = child.widget();
                }
            }
        }

        return map;
    }

    getOption(value) {
        for (let option of this.node.options) {
            let htmlElement = mkHtmlElement(option);

            if (htmlElement.getAttribute('value') == value) {
                return htmlElement.widget();
            }
        }

        return null;
    }

    getOptionMap() {
        let map = {};

        for (let option of this.node.options) {
            map[option.getAttribute('value')] = mkHtmlElement(option).widget();
        }

        return map;
    }

    getOptionArray() {
        let array = [];

        for (let option of this.node.options) {
            array.push(mkHtmlElement(option).widget());
        }

        return array;
    }

    getSelectedMap() {
        let map = [];

        for (let option of this.node.selectedOptions) {
            map[option.getAttribute('value')] = mkHtmlElement(option).widget();
        }

        return map;
    }

    getSelectedArray() {
        let array = [];

        for (let option of this.node.selectedOptions) {
            array.push(mkHtmlElement(option).widget());
        }

        return array;
    }

    hasGroup(label) {
        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                let htmlElement = mkHtmlElement(child);

                if (htmlElement.tagName() == 'optgroup') {
                    if (htmlElement.getAttribute('label') == label) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    hasOption(value) {
        for (let option of this.node.options) {
            let htmlElement = mkHtmlElement(option);

            if (htmlElement.getAttribute('value') == value) {
                return true;
            }
        }

        return false;
    }

    isValid() {
        return true;
    }

    removeGroup(label) {
    }

    removeOption(value) {
    }

    setOptions(options) {
        this.clear();
        let values = mkStringSet();
        let labels = mkStringSet();

        for (let option of options) {
            if (typeof option == 'object' && 'value' in option) {
                if (!values.has(option.value)) {
                    let widget = mkWOption(option.value, option.text, this, null);
                    this.append(widget);
                }
            }
            else if (typeof option == 'object' && 'label' in option) {
                if (!labels.has(option.label)) {
                    let optionGroup = mkWOptGroup();
                    optionGroup.setAttribute('label', option.label);

                    for (let child of option.options) {
                        if (typeof child == 'object' && 'value' in child) {
                            if (!values.has(child.value)) {
                                let widget = mkWOption(child.value, child.text, this, optionGroup);
                                optionGroup.append(widget);
                            }
                        }
                    }

                    this.append(optionGroup);
                }
            }
        }

        return this;
    }

    subclassGetValue() {
        if (this.hasAttribute('multiple')) {
            let array = [];

            for (let option of this.node.selectedOptions) {
                array.push(option.getAttribute('value'));
            }

            return array;
        }
        else if (this.node.selectedOptions.length) {
            return this.node.selectedOptions[0].getAttribute('value');
        }
        else {
            return '';
        }
    }

    subclassSetValue(value, key) {
        this.silence();

        if (typeof value == 'object') {
            if (!this.hasAttribute('multiple')) {
                this.setAttribute('multiple');
            }
        }
        else if (this.hasAttribute('multiple')) {
            this.clearAttribute('multiple');
        }

        let valueSet = mkStringSet(value);

        for (let option of this.node.options) {
            if (valueSet.has(option.getAttribute('value'))) {
                option.selected = true;
            }
            else {
                option.selected = false;
            }
        }

        this.resume();
        return this;
    }

    [Symbol.iterator]() {
        return this.getOptionArray()[Symbol.iterator]();
    }
});


/*****
 * The widget class that encapsulates the features and functions associated with
 * an HTML optgroup element.  The basic functionality is the programming context,
 * in which the HTML optgroup element exists.  The next phase of features provide
 * live-editing features, such as removing an option or modifying the option text.
*****/
register(class WOptGroup extends Widget {
    constructor() {
        super('optgroup');
        this.setWidgetStyle('optgroup');
    }

    add(value, text) {
    }

    getOption(value) {
        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'option' && child.getAttribute('value') == value) {
                    return child.widget();
                }
            }
        }

        return null;
    }

    getOptionArray() {
        let array = [];

        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'option') {
                    array.push(child.widget());
                }
            }
        }

        return array;
    }

    getOptionMap() {
        let map = {};

        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'option') {
                    map[child.getAttribute('label')] = child.widget();
                }
            }
        }

        return map;
    }

    hasOption(value) {
        for (let child of this.children()) {
            if (child instanceof HtmlElement) {
                if (child.tagName() == 'option' && child.getAttribute('value') == value) {
                    return true;
                }
            }
        }

        return false;
    }

    remove() {
    }

    setLabel(label) {
    }
});


/*****
 * The widget class that encapsulates the features and functions associated with
 * an HTML option element.  The basic functionality is the programming context,
 * in which the HTML option element exists.  The next phase of features provide
 * live-editing features, such as removing an option or modifying the option text.
*****/
register(class WOption extends Widget {
    constructor(value, text, selectWidget, groupWidget) {
        super('option');
        this.setAttribute('value', value);
        this.setWidgetStyle('option');
        this.setInnerHtml(text);
        this.selectWidget = selectWidget;
        this.groupWidget = groupWidget;
    }

    deselect() {
        this.node.selected = false;
        return this;
    }

    disable() {
        this.node.selected = false;
        this.setAttribute('disabled');
        return this;
    }

    enable() {
        this.clearAttribute('disabled');
        return this;
    }

    getText() {
        return this.get();
    }

    getValue() {
        return this.getAttribute('value');
    }

    isDisabled() {
        return this.hasAttribute('disabled');
    }

    isSelected() {
        return this.node.selected;
    }

    remove() {
    }

    select() {
        this.node.selected = true;
        return this;
    }

    setText(text) {
        this.setInnerHtml(text);
        return this;
    }

    toggle() {
        this.node.selected = !this.node.selected;
        return this;
    }
});