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
 * needed 
*****/
register(class WStack extends Widget {
    constructor() {
        super('div');
        this.stack = [];
        this.setAttribute('widget-style', 'stack');
    }

    clear() {
        super.clear();
        this.stack = [];
    }

    contains(widget) {
        return this.indexOf(widget) >= 0;
    }

    indexOf(widget) {
        for (let i = 0; i < this.stack.length; i++) {
            if (Object.is(this.stack[i], widget)) {
                return i;
            }
        }

        return -1;
    }

    insertAt(index, widget) {
        if (index >= 0 && !this.contains(widget)) {
            if (index < this.stack.length) {
                this.stack.splice(index, 0, widget);
            }
            else {
                this.stack.push(widget);
            }

            this.send({
                messageName: 'StackWidget.Changed',
                type: 'insert',
                widget: this,
                index: index,
                inserted: widget,
            });
        }

        return widget;
    }

    length() {
        return this.stack.length;
    }

    move(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.stack.length) {
            return;
        }

        if (toIndex < 0 || toIndex >= this.stack.length) {
            return;
        }

        if (fromIndex < toIndex) {
            let widget = this.stack[fromIndex];
            this.stack.splice(fromIndex, 1);
            this.stack.splice(toIndex+1, 0, widget);

            this.send({
                messageName: 'StackWidget.Changed',
                type: 'move',
                widget: this,
                fromIndex: fromIndex,
                toIndex: toIndex,
            });

            return widget;
        }
        else if (fromIndex > toIndex) {
            let widget = this.stack[fromIndex];
            this.stack.splice(fromIndex, 1);
            this.stack.splice(toIndex-1, 0, widget);

            this.send({
                messageName: 'StackWidget.Changed',
                type: 'move',
                widget: this,
                fromIndex: fromIndex,
                toIndex: toIndex,
            });

            return widget;
        }
    }

    moveBottom(fromIndex) {
        if (fromIndex >= 0 && fromIndex < this.stack.length) {
            if (fromIndex > 0) {
                let widget = this.stack[fromIndex];
                this.stack.splice(fromIndex, 1);
                this.stack.unshift(widget);

                this.send({
                    messageName: 'StackWidget.Changed',
                    type: 'move',
                    widget: this,
                    fromIndex: fromIndex,
                    toIndex: 0,
                });

                return widget;
            }
        }
    }

    moveDown(fromIndex) {
        if (fromIndex >= 0 && fromIndex < this.stack.length) {
            if (fromIndex > 0) {
                let widget = this.stack[fromIndex];
                this.stack.splice(fromIndex, 1);
                this.stack.splice(fromIndex-1, 0, widget);

                this.send({
                    messageName: 'StackWidget.Changed',
                    type: 'move',
                    widget: this,
                    fromIndex: fromIndex,
                    toIndex: fromIndex-1,
                });

                return widget;
            }
        }
    }

    moveTop(fromIndex) {
        if (fromIndex >= 0 && fromIndex < this.stack.length) {
            if (fromIndex < this.stack.length - 1) {
                let widget = this.stack[fromIndex];
                this.stack.splice(fromIndex, 1);
                this.stack.push(widget);

                this.send({
                    messageName: 'StackWidget.Changed',
                    type: 'move',
                    widget: this,
                    fromIndex: fromIndex,
                    toIndex: this.stack.length-1,
                });

                return widget;
            }
        }
    }

    moveUp(fromIndex) {
        if (fromIndex >= 0 && fromIndex < this.stack.length) {
            if (fromIndex < this.stack.length - 1) {
                let widget = this.stack[fromIndex];
                this.stack.splice(fromIndex, 1);
                this.stack.splice(fromIndex+1, 0, widget);

                this.send({
                    messageName: 'StackWidget.Changed',
                    type: 'move',
                    widget: this,
                    fromIndex: fromIndex,
                    toIndex: fromIndex+1,
                });

                return widget;
            }
        }
    }

    pop() {
        if (this.stack.length) {
            let top = this.top();
            this.stack.pop();

            if (this.stack.length) {
                top.replace(this.top());
            }
            else {
                top.remove();
            }

            this.send({
                messageName: 'StackWidget.Changed',
                type: 'remove',
                widget: this,
                removed: top,
            });

            return top;
        }
    }

    popBottom() {
        let shifted = null;

        if (stack.length == 1) {
            shifted = this.stack.shift();
            let top = this.top();
            shifted.replace(top);
        }
        else if (stack.length > 1) {
            shifted = this.stack.shift();   
        }

        this.send({
            messageName: 'StackWidget.Changed',
            type: 'remove',
            widget: this,
            removed: shifted,
        });

        return shifted;
    }

    push(widget) {
        let top = this.top();
        this.stack.push(widget);

        if (top) {
            top.replace(widget);
        }
        else {
            this.append(widget);
        }

        this.send({
            messageName: 'StackWidget.Changed',
            type: 'add',
            widget: this,
            added: widget,
            index: this.stack.length-1,
        });

        return widget;
    }

    pushBottom(widget) {
        this.stack.unshift(widget);

        this.send({
            messageName: 'StackWidget.Changed',
            type: 'add',
            widget: this,
            added: widget,
            index: 0,
        });

        if (this.stack.length == 1) {
            this.append(widget);
        }
    }

    removeAt(index) {
        if (index >= 0 && index < this.stack.length) {
            let widget = this.stack[index];
            this.stack.splice(index, 1);

            this.send({
                messageName: 'StackWidget.Changed',
                type: 'remove',
                widget: this,
                removed: widget,
            });

            return widget;
        }

        return null;
    }

    [Symbol.iterator]() {
        return this.stack[Symbol.iterator]();
    }

    top() {
        if (this.stack.length) {
            return this.stack[this.stack.length - 1];
        }

        return null;
    }
});
