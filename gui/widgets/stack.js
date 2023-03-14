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
register(class WStack extends Widget {
    constructor(arg) {
        super(arg);
        this.setWidgetStyle('stack');
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

    pop() {
        if (this.length()) {
            let popped = this.top();

            if (popped) {
                popped.remove();
                let top = this.top();

                if (top) {
                    top.reveal();
                    top.restore();
                }

                return popped
            }
        }

        return null;
    }

    promote(widget) {
        if (this.length() > 1) {
            if (this.contains(widget)) {
                let top = this.top();
                top.conceal();
                widget.reveal();
                widget.remove();
                this.append(widget);
                widget.restore();
                return top;
            }
        }

        return null;
    }

    push(widget) {
        if (!this.contains(widget)) {
            let top = this.top();

            if (top) {
                top.conceal();
            }

            this.append(widget.reveal());
            widget.restore();
            return top;
        }

        return null;
    }

    [Symbol.iterator]() {
        return this.children()[Symbol.iterator]();
    }

    top() {
        return this.lastElementChild();
    }
});
