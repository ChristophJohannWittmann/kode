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
 * The StackWidget is one of the fundamental framework classes.  In concept, a
 * stack is a GUI box that manages a stack of widgets with the stack top being
 * what's current visible.  This encapsulation enables navigation through the
 * existing widgets in the stack by shuffling them around as needed by the user.
 * To be honest, another widget will be created to perform the user-elements
 * needed to navigate the stack.
*****/
register(class WStack extends WPanel {
    constructor(arg) {
        super(arg);
        this.setWidgetStyle('stack');
    }

    clear() {
        super.clear();
    }

    contains(widget) {
        return this.indexOf(widget) >= 0;
    }

    indexOf(widget) {
        let children = this.children();

        for (let i = 0; i < children.length; i++) {
            if (Object.is(children[i], widget)) {
                return i;
            }
        }

        return -1;
    }

    length() {
        return this.children().length;
    }

    pop() {
        let children = this.children();

        if (children.length) {
            let top = children[children.length - 1];
            top.remove();

            if (children.length > 1) {
                children[children.length - 2].reveal();
            }

            this.send({
                messageName: 'Widget.Changed',
                type: 'pop',
                widget: this,
                removed: top,
            });

            return top;
        }

        return null;
    }

    promote(widget) {
        for (let child of this) {
            if (child.selector == widget.selector) {
                child.remove();
                child.reveal();
                this.push(child);
                return true;
            }
        }

        return false;
    }

    push(widget) {
        let child;
        let index = 0;

        for (child of this) {
            index++;

            if (child.selector == widget.selector) {
                return false;
            }
        }

        child ? child.conceal() : false;
        this.append(widget.reveal());

        this.send({
            messageName: 'Widget.Changed',
            type: 'push',
            widget: this,
            added: widget,
            index: index,
        });

        return true;
    }

    async revert() {
    }

    [Symbol.iterator]() {
        return this.children()[Symbol.iterator]();
    }

    top() {
        let children = this.children();

        if (children.length) {
            return children[children.length - 1];
        }

        return null;
    }
});
