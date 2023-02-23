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
 * MenuAction objects are what's used to turn a menu-click into an action per
 * the user's request.  The MenuAction class is mostly a cognitive framework
 * for structuring MenuActions without have any real functionality.  You need
 * to subclass MenuAction to make things happend.  The primary event built into
 * the MenuAction is the click event.  That's when things happen and where we
 * make the user-requested action happen.
*****/
register(class MenuAction {
    constructor() {
        this.menuItem = null;
    }

    async onClick(menuItem, message) {
        this.menuItem = menuItem;
    }
});


/*****
 * A function action is just what it sounds like.  It's a function provided
 * to the constructor, which is called when the menu item is clicked.  menuItem
 * and the originating message are passed along as parameters to the caller
 * provided function.
*****/
register(class FunctionMenuAction extends MenuAction {
    constructor(func) {
        super();
        this.func = func;
    }

    async onClick(menuItem, message) {
        await super.onClick(menuItem, message);
        this.func(menuItem, message);
    }
});


/*****
 * A single view action combines a view with a menu to coordinate pushing and
 * popping a stack of panels on a view.  The concept is that the panel can be
 * opened once, when the menuItem is clicked.  When there is an instance of the
 * panel, clciking the menuItem causes the singleton panel to be promoted to
 * the top of the view stack.  When the panel is closed, it's instance if freed.
*****/
register(class SingletonViewMenuAction extends MenuAction {
    constructor(view, maker, ...args) {
        super();
        this.view = view;
        this.maker = maker;
        this.args = args;
        this.widget = null;
        this.view.on('View.Pop', message => this.onPop(message));
    }

    async onClick(menuItem, message) {
        await super.onClick(menuItem, message);

        if (this.widget) {
            this.view.promote(this.widget);
        }
        else {
            this.widget = this.maker(this.args);
            this.view.push(this.widget);
            this.menuItem.setOpen();
        }
    }

    async onPop(message) {
        if (this.widget && Widget.is(this.widget, message.panel)) {
            this.widget = null;
            this.menuItem.clearOpen();
        }
    }
});


/*****
 * Similar in nature to the singleton action, this version allows only a single
 * instanceo of a panel on a view.  The big difference is that menuItem itself
 * is disabled as long as the panel is still on the stack.  Hence, this version
 * provides no mechanism for moving an existing panel to the surface of a view.
 * This may be useful where there's a dependency between a panel and something
 * else higher up on the stack.
*****/
register(class ToggleViewMenuAction extends MenuAction {
    constructor(view, maker, ...args) {
        super();
        this.view = view;
        this.maker = maker;
        this.args = args;
        this.widget = null;
        this.menuItem = null;
        this.view.on('View.Pop', message => this.onPop(message));
    }

    async onClick(menuItem, message) {
        await super.onClick(menuItem, message);

        if (!this.widget) {
            this.widget = this.maker(this.args);
            this.view.push(this.widget);
            this.menuItem.disable();
        }
    }

    async onPop(message) {
        if (this.widget && Widget.is(this.widget, message.popped)) {
            this.widget = null;
            this.menuItem ? this.menuItem.enable() : false;
        }
    }
});
