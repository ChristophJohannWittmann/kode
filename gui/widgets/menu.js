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
        doc.on('dom.click', message => {
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

        doc.on('dom.keyup', message => {
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
            if (!(widget.getId() in this.widgets)) {
                let widgetEntry = { widget: widget, messages: mkStringSet() };
                this.widgets[widget.getId()] = widgetEntry;

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
        if (WPopupMenu.showing.getId() == this.getId()) {
            this.setStyle('display', 'none')
            delete this.anchor;
            WPopupMenu.showing = null;
        }

        return this;
    }

    detach(widget) {
        if (widget.getId() in this.widgets) {
            if (WPopupMenu.showing && WPopupMenu.showing.getId() == this.getId()) {
                this.close();
            }

            let widgetEntry = this.widgets[widget.getId()];
            delete this.widgets[widget.getId()];

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
        let rect = this.getOffset();

        if (rect.width > win.innerWidth()) {
            finalX = 0;
        }
        else if (x + rect.width > win.innerWidth()) {
            finalX -= (x + rect.width - win.innerWidth());
        }

        if (rect.height > win.innerHeight()) {
            finalY = 0;
        }
        else if (y + rect.height > win.innerHeight()) {
            finalY -= (y + rect.height - win.innerHeight());
        }

        return [ finalX, finalY ];
    }
});


/*****
 * It's what you expect!  It's a horizontal line drawn that separates one section
 * of the menu from others.  There are two styles: regular and lite.  The lite
 * separate is less distinct can be used to separate subsections, while regular
 * separators should be used for marking or separating a distinction between main
 * or primary sections of the menu.
*****/
register(class WMenuSeparator extends Widget {
    constructor(lite, tag) {
        super('hr');
        this.tag = tag ? tag : this.getId();
        lite ? this.setLite() : this.setRegular();
    }

    setLite() {
        this.setWidgetStyle('menu-separator-lite');
        return this;
    }

    setRegular() {
        this.setWidgetStyle('menu-separator');
        return this;
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
        this.append(mkDocText(text));
        this.permanent = false;
        tag ? this.setAttribute('menu-item-tag', tag) : this.setAttribute('menu-item-tag', this.getId());
        this.clearAction();
        this.enable();

        this.on('dom.click', message => this.onSelect(message));
        this.on('dom.mouseenter', message => this.onEnter(message));
        this.on('dom.mouseleave', message => this.onLeave(message));
    }

    clearAction() {
        this.action = null;
        return this;        
    }

    clearIcon() {
        return this;
    }

    clearOpen() {
        return this;
    }

    clearPermanent() {
        this.permanent = false;
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

    getMenu() {
        return this.parent();
    }

    getPermanent() {
        return this.permanent;
    }

    onEnter(message) {
        if (this.action instanceof WPopupMenu) {
            //let ev = message.event.rawEvent();
            //this.action.open(this, ev.x, ev.y);
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

            if (this.action instanceof MenuAction) {
                setTimeout(() => this.action.onClick(this, message), 10);
            }
        }
    }

    setIcon(icon) {
        return this;
    }

    setOpen() {
        return this;
    }

    setPermanent() {
        this.permanent = true;
        return this;
    }

    setAction(action) {
        this.action = action;
        return this;
    }
});
