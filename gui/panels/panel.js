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
 * Panel is the base class for "complex" widgets, which represent a substantial
 * part or all of a visual feature.  The panel works with the application object
 * to provide the implicet navigation for pushing and popping views on a stack.
 * The heading is a strip at the top of the page containing implicit navigation
 * controls and a logo or title or some other such branding or informational
 * data.  The heading can either be shown or hidden.
*****/
register(class WPanel extends Widget {
    constructor() {
        super();
        super.setWidgetStyle('panel');

        super.append(
            mkWDiv()
            .setWidgetStyle('panel-heading-hidden')
            .append(
                mkWSpan().setWidgetStyle('panel-display'),
                mkWSpan().setWidgetStyle('panel-control'),
            ),

            mkWDiv()
            .setWidgetStyle('panel-content')
        );

        this.ctls = {};
        this.stack = null;
        this.stackHandler = null;

        this.heading = super.childAt(0);
        this.display = this.heading.childAt(0);
        this.control = this.heading.childAt(1);
        this.content = super.childAt(1);
    }

    append(...args) {
        this.content.append(...args);
        return this;
    }

    appendCtl(name, ctl) {        
        if (!(name in this.ctls)) {
            this.ctls[name] = ctl;
            this.control.append(ctl);
        }

        return this;
    }

    appendStack(stack) {
        this.content.append(stack);
        this.wireStack(stack);
        return this;
    }

    childAt(index) {
        this.content.childAt(index);
        return null;
    }

    children() {
        return this.content.children();
    }

    clear() {
        this.content.clear();
        return this;
    }

    clearDisplay() {
        this.display.clear();
        return this;
    }

    get() {
        return this.content.get();
    }

    hideHeading() {
        this.heading.setWidgetStyle('panel-heading-hidden');
        return this;
    }

    onStackChanged(message) {
        if (this.stack.length() > 1) {
            if (!('BACK' in this.ctls)) {
                this.prependCtl('BACK', mkWHotSpot()
                    .set('Back')
                    .on('html.click', message => {
                        this.stack.pop();
                    })
                );
            }
        }
        else if (this.stack.length() <= 1) {
            if ('BACK' in this.ctls) {
                this.removeCtl('BACK');
            }
        }
    }

    prepend(...args) {
        this.content.prepend(...args);
        return this;
    }

    prependCtl(name, ctl) {  
        if (!(name in this.ctls)) {
            this.ctls[name] = ctl;
            this.control.prepend(ctl);
        }

        return this;
    }

    removeCtl(name) {
        if (name in this.ctls) {
            this.ctls[name].remove();
            delete this.ctls[name];
        }

        return this;
    }

    searchStack(stack) {
        for (let htmlElement of this.htmlElement.enum()) {
            if (htmlElement.getAttribute('widget-class') == 'WStack') {
                if (stack) {
                    if (htmlElement.getAttribute('id') == stack.getAttribute('id')) {
                        this.wireStack(htmlElement.widget());
                        return this;
                    }
                }
                else {
                    this.wireStack(htmlElement.widget());
                    return this;
                }
            }
        }

        this.stack = null;
        return this;
    }

    set(innerHtml) {
        this.content.set(innerHtml);
        return this;
    }

    setDisplay(arg) {
        this.display.clear();

        if (typeof arg == 'string') {
            this.display.set(arg);
        }
        else {
            this.display.append(arg);
        }

        return this;
    }

    showHeading() {
        this.heading.setWidgetStyle('panel-heading');
        return this;
    }
        

    [Symbol.iterator]() {
        return this.content[Symbol.iterator]();
    }

    unwireStack() {
        if (this.stack && this.stackHandler) {
            this.stack.off('StackWidget.Changed', this.stackHandler);
            this.stack = null;
            this.stackHandler = null;
        }
    }

    wireStack(stack) {
        if (!this.stack && !this.stackHandler) {
            this.stack = stack;
            this.stack.setAttribute('panel-ctl', 'STACK');
            this.stackHandler = message => this.onStackChanged(message);
            this.stack.on('StackWidget.Changed', this.stackHandler);
        }
    }
});
