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

    constructor() {
        super('div');
        this.widgets = {};
        this.showing = null;
        this.setWidgetStyle('popup-menu');

        this.setStyle({
            display: 'none',
            position: 'absolute',
            zIndex: '99',
        });

        doc.on('html.click', message => {
            if (this.showing) {
                let id = mkHtmlElement(message.event.rawEvent().target).getAttribute('id');

                if (id != this.getAttribute('id')) {
                    for (let child of this) {
                        if (child.getAttribute('id') == id) {
                            return;
                        }
                    }

                    this.close();
                }
            }
        });

        doc.on('html.keyup', message => {
            if (this.showing) {
                if (message.event.rawEvent().code == 'Escape') {
                    this.close();
                }
            }
        });
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
        if (this.parent() && this.showing) {
            this.setStyle('display', 'none')
            this.showing = null;
        }

        return this;
    }

    detach(widget) {
        if (widget.id in this.widgets) {
            if (this.parent()) {
                if (this.showing) {
                }
            }
        }

        return this;
    }

    open(widget, x, y) {
        if (widget instanceof WMenuItem) {
        }
        else {
            if (this.showing) {
                this.close();
            }

            this.showing = widget;
            body.append(this);

            this.setStyle('display', '');
            this.setStyle('top', `${y}px`);
            this.setStyle('left', `${x}px`);
        }

        return this;
    }
});


/*****
*****/
register(class WMenuItem extends Widget {
    constructor(text) {
        super('div');
        this.append(text);
        this.clearAction();
        this.enable()

        this.on('html.click', message => this.select(message));
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

    select(message) {
        if (!this.hasAttribute('disabled')) {
            this.parent().close();

            if (typeof this.action == 'function') {
                setTimeout(() => this.action(message), 10);
            }
            else if (this.action instanceof WPopupMenu) {
                console.log('TBD...  open sub-popup-menu.');
            }
        }
    }

    setAction(func) {
        this.action = func;
        return this;
    }
});
