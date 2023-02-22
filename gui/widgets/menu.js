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
 * The popup menu is the core of our menuing features.  A popup menu is a div
 * that containing one or more WMenuItems.  As described below, a WMenuItem can
 * contain either an action or a WPopupMenu.  Hence, menus are cascading.  The
 * attach() method attaches the menu to while detach() removes the menu from
 * the widget and deactivates it for that widget.  Note that a menu is considered
 * to be a global resource.  Hence, only one menu at a time can be in an open
 * state.
*****/
register(class WPopupMenu extends Widget {
    static showing = null;

    static init = (() => {
        doc.on('html.click', message => {
            if (WPopupMenu.showing) {
                let id = mkHtmlElement(message.event.rawEvent().target).getAttribute('id');

                if (id != WPopupMenu.showing.getAttribute('id')) {
                    for (let child of WPopupMenu.showing) {
                        if (child.getAttribute('id') == id) {
                            return;
                        }
                    }

                    WPopupMenu.showing.close();
                }
            }
        });

        doc.on('html.keyup', message => {
            if (WPopupMenu.showing) {
                if (message.event.rawEvent().code == 'Escape') {
                    WPopupMenu.showing.close();
                }
            }
        });

        return null;
    });

    constructor() {
        super('div');
        this.widgets = {};
        this.setWidgetStyle('popup-menu');

        this.setStyle({
            display: 'none',
            position: 'absolute',
            zIndex: '99',
        });

        if (typeof WPopupMenu.init == 'function') {
            WPopupMenu.init();
            WPopupMenu.init = false;
        }
    }

    attach(widget, ...messageNames) {
        if (widget instanceof Widget) {
            if (!(widget.id in this.widgets)) {
                let widgetEntry = { widget: widget, messages: mkStringSet() };
                this.widgets[widget.id] = widgetEntry;

                widgetEntry.handler = message => {
                    let ev = message.event.rawEvent();
                    this.open(widget, ev.x, ev.y);
                };

                for (let messageName of messageNames) {
                    widgetEntry.messages.set(messageName);
                    widget.on(messageName, widgetEntry.handler);
                }
            }
        }

        return this;
    }

    close() {
        if (WPopupMenu.showing.id == this.id) {
            this.setStyle('display', 'none')
            delete this.anchor;
            WPopupMenu.showing = null;
        }

        return this;
    }

    detach(widget) {
        if (widget.id in this.widgets) {
            if (WPopupMenu.showing && WPopupMenu.showing.id == this.id) {
                this.close();
            }

            let widgetEntry = this.widgets[widget.id];
            delete this.widgets[widget.id];

            for (let messageName of widgetEntry.messages) {
                widget.off(messageName, widgetEntry.handler);
            }
        }

        return this;
    }

    getItem(tag) {
        return this.queryOne(`[menu-item-tag=${tag}]`);
    }

    open(widget, x, y) {
        if (widget instanceof WMenuItem) {
        }
        else {
            if (WPopupMenu.showing) {
                this.close();
            }

            this.anchor = widget;
            WPopupMenu.showing = this;

            this.setStyle('display', '');
            body.append(this);
            [x, y] = this.position(x, y);
            this.setStyle('top', `${y}px`);
            this.setStyle('left', `${x}px`);
        }

        return this;
    }

    position(x, y) {
        let finalX = x;
        let finalY = y;
        let size = this.size();

        if (size.width > win.innerWidth()) {
            finalX = 0;
        }
        else if (x + size.width > win.innerWidth()) {
            finalX -= (x + size.width - win.innerWidth());
        }

        if (size.height > win.innerHeight()) {
            finalY = 0;
        }
        else if (y + size.height > win.innerHeight()) {
            finalY -= (y + size.height - win.innerHeight());
        }

        return [ finalX, finalY ];
    }
});


/*****
 * A menu item represents a choice on a popup menu.  A menu item has values to
 * display and an action item.  The action item can be either a function, which
 * is called with a single argument, the message, or 
*****/
register(class WMenuItem extends Widget {
    constructor(text, tag) {
        super('div');
        this.append(text);
        tag ? this.setAttribute('menu-item-tag', tag) : this.setAttribute('menu-item-tag', text);
        this.clearAction();
        this.enable();

        this.on('html.click', message => this.onSelect(message));
        this.on('html.mouseenter', message => this.onEnter(message));
        this.on('html.mouseleave', message => this.onLeave(message));
    }

    clearAction() {
        this.action = async message => {};
        return this;        
    }

    disable() {
        super.disable();
        this.setWidgetStyle('popup-menu-item-disabled');
        return this;
    }

    enable() {
        super.enable();
        this.setWidgetStyle('popup-menu-item');
        return this;
    }

    onEnter(message) {
        if (this.action instanceof WPopupMenu) {
            let ev = message.event.rawEvent();
            this.action.open(this, ev.x, ev.y);
        }
    }

    onLeave(message) {
        if (this.action instanceof WPopupMenu) {
            // TODO -- 
            //console.log('TBD...  CLOSE sub popup');
        }
    }

    onSelect(message) {
        if (!this.hasAttribute('disabled')) {
            this.parent().close();

            if (typeof this.action == 'function') {
                setTimeout(() => this.action(message), 10);
            }
        }
    }

    setAction(func) {
        this.action = func;
        return this;
    }
});
