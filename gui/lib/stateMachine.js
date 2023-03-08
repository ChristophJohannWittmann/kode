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
 * In the MVC GUI model, the state Machine is the controller for a single widget
 * with multiple children.  The overall machine has a state and optionally a set
 * of flags.  Children are added to the machine (and the owner or owning widget).
 * Once the machine is initialized, the owning widget will update dynamically
 * based on changes to the mode, i.e., state, or changes to the flags.
*****/
register(class WStateMachine extends Emitter {
    static nameKey = Symbol('Name');

    constructor(widget, modes, switchNames) {
        super();
        this.widgets = {};
        this.namedWidgets = {};
        this.switches = {};
        this.mode = '';
        this.modes = {};
        this.autofocus = {};
        this.updatesEnabled = true;

        if (Array.isArray(modes)) {
            modes.forEach(mode => {
                this.modes[mode.trim()] = {};
            });
        }

        this.owner = widget;
        this.ownerRefresh = null;
        this.owner.on('Widget.Changed', message => this.send(message));

        if (typeof this.owner.refresh == 'function') {
            this.ownerRefresh = this.owner.refresh;
        }

        this.owner.refresh = () => this.refresh();

        if (Array.isArray(switchNames)) {
            for (let switchName of switchNames) {
                this.switches[switchName] = { 
                    name: switchName,
                    on: false,
                };
            }
        }
    }

    addChild(widget, name, modes, switches) {
        if (!(widget.getId() in this.widgets) && name.trim() && !(name.trim() in this.namedWidgets)) {
            widget[WStateMachine.nameKey] = name.trim();
            widget.getOwner = () => this.owner;
            widget.getStateMachine = () => this;

            this.widgets[widget.getId()] = {
                widget: widget,
                modes: mkStringSet((Array.isArray(modes) ? modes : []).filter(mode => (mode in this.modes))),
                switches: mkStringSet((Array.isArray(switches) ? switches : []).filter(swName => swName in this.switches)),
            }

            this.namedWidgets[widget[WStateMachine.nameKey]] = this.widgets[widget.getId()];
            return true;
        }

        return false;
    }

    appendChild(widget, name, modes, switches) {
        if (this.addChild(widget, name, modes, switches)) {
            this.owner.append(widget);
            this.update();
        }

        return this;
    }

    clearswitches(switchName) {
        if (switchName in this.switches) {
            if (this.switches[switchName].on) {
                this.switches[switchName].on = false;
                this.update();
            }
        }

        return this;
    }

    disableUpdates() {
        this.updatesEnabled = false;
        return this;
    }

    enableUpdates() {
        if (!this.updatesEnabled) {
            this.updatesEnabled = true;
            this.update();
        }

        return this;
    }

    getFlag(switchName) {
        if (switchName in this.switches) {
            return this.switches[switchName].on;
        }

        return false;
    }

    getMode() {
        return this.mode;
    }

    getWidget(name) {
        if (name in this.namedWidgets) {
            return this.namedWidgets[name].widget;
        }
    }

    insertAfter(widget, name, modes, switches) {
        if (this.addChild(widget, name, modes, switches)) {
            this.insertAfter(widget);
            this.update();
        }

        return this;
    }

    insertBefore(widget, name, modes, switches) {
        if (this.addChild(widget, name, modes, switches)) {
            this.insertBefore(widget);
            this.update();
        }

        return this;
    }

    prependChild(widget, name, modes, switches) {
        if (this.addChild(widget, name, modes, switches)) {
            this.owner.prepend(widget);
            this.update();
        }

        return this;
    }

    refresh() {
        for (let child of this.owner) {
            if (typeof child.refresh == 'function') {
                if (child instanceof Widget) {
                    Reflect.apply(child.refresh, child, []);
                }
            }
        }

        this.ownerRefresh ? Reflect.apply(this.ownerRefresh, this.owner, []) : false;
    }

    removeChild(widget) {
        if (widget.getId() in this.widgets) {
            delete widget.getOwner;
            delete widget.getStateMachine;
            delete this.namedWidgets[widget[WStateMachine.nameKey]];
            delete this.widgets[widget.getId()];
            widget.remove();
            this.update();
            return true;
        }

        return false;
    }

    setFlag(switchName) {
        if (switchName in this.switches) {
            if (!this.switches[switchName].on) {
                this.switches[switchName].on = true;
                this.update();
            }
        }

        return this;
    }

    setMode(mode) {
        if (typeof mode == 'string' && (mode in this.modes) && mode != this.mode) {
            this.mode = mode;
            this.update();
        }

        return this;
    }

    toggleFlag(switchName) {
        if (switchName in this.switches) {
            this.switches[switchName].on = !this.switches[switchName];
            this.update();
        }

        return this;
    }

    update() {
        if (this.updatesEnabled) {
            let autofocus;

            for (let widgetInfo of Object.values(this.widgets)) {
                if (widgetInfo.modes.has(this.mode)) {
                    let reveal = true;

                    for (let switchName in this.switches) {
                        if (widgetInfo.switches.has(switchName) && !this.switches[switchName].on) {
                            reveal = false;
                            break;
                        }
                    }

                    if (reveal) {
                        widgetInfo.widget.reveal();
                        widgetInfo.widget.getRevealState = () => true;
                        autofocus = autofocus ? autofocus : widgetInfo.widget.getAutofocus();
                        continue;
                    }
                }

                widgetInfo.widget.conceal();
                widgetInfo.widget.getRevealState = () => false;
            }

            const switches = {};
            Object.values(this.switches).forEach(Switch => switches[Switch.name] = Switch.on);

            if (autofocus) {
                setTimeout(() => autofocus.focus(), 10);
            }

            this.send({
                messageName: 'StateMachine',
                stm: this,
                mode: this.mode,
                switches: switches,
            });
        }
    }
});
