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

    constructor(widget, modes, flagNames) {
        super();
        this.owner = widget;
        this.owner.on('Widget.Changed', message => this.send(message));
        this.widgets = {};
        this.namedWidgets = {};
        this.flags = {};
        this.modes = mkStringSet(...(Array.isArray(modes) ? modes : []));
        this.mode = this.modes.length() ? modes[0] : '';
        this.updatesEnabled = true;

        if (Array.isArray(flagNames)) {
            for (let flagName of flagNames) {
                this.flags[flagName] = { 
                    name: flagName,
                    on: false,
                };
            }
        }
    }

    addChild(widget, name, modes, flags) {
        if (!(widget.id in this.widgets) && name.trim() && !(name.trim() in this.namedWidgets)) {
            widget[WStateMachine.nameKey] = name.trim();
            widget.getStateMachine = () => this;

            this.widgets[widget.id] = {
                widget: widget,
                modes: mkStringSet((Array.isArray(modes) ? modes : []).filter(mode => this.modes.has(mode))),
                flags: mkStringSet((Array.isArray(flags) ? flags : []).filter(swName => swName in this.flags)),
            }

            this.namedWidgets[widget[WStateMachine.nameKey]] = this.widgets[widget.id];
            return true;
        }

        return false;
    }

    appendChild(widget, name, modes, flags) {
        if (this.addChild(widget, name, modes, flags)) {
            this.owner.append(widget);
            this.update();
        }

        return this;
    }

    clearFlag(flagName) {
        if (flagName in this.flags) {
            if (this.flags[flagName].on) {
                this.flags[flagName].on = false;
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

    getFlag(flagName) {
        if (flagName in this.flags) {
            return this.flags[flagName].on;
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

    insertAfter(widget, name, modes, flags) {
        if (this.addChild(widget, name, modes, flags)) {
            this.insertAfter(widget);
            this.update();
        }

        return this;
    }

    insertBefore(widget, name, modes, flags) {
        if (this.addChild(widget, name, modes, flags)) {
            this.insertBefore(widget);
            this.update();
        }

        return this;
    }

    prependChild(widget, name, modes, flags) {
        if (this.addChild(widget, name, modes, flags)) {
            this.owner.prepend(widget);
            this.update();
        }

        return this;
    }

    removeChild(widget) {
        if (widget.id in this.widgets) {
            delete widget.getStateMachine;
            delete this.namedWidgets[widget[WStateMachine.nameKey]];
            delete this.widgets[widget.id];
            widget.remove();
            this.update();
            return true;
        }

        return false;
    }

    setFlag(flagName) {
        if (flagName in this.flags) {
            if (!this.flags[flagName].on) {
                this.flags[flagName].on = true;
                this.update();
            }
        }

        return this;
    }

    setMode(mode) {
        if (typeof mode == 'string' && this.modes.has(mode) && mode != this.mode) {
            this.mode = mode;
            this.update();
        }

        return this;
    }

    toggleFlag(flagName) {
        if (flagName in this.flags) {
            this.flags[flagName].on = !this.flags[flagName];
            this.update();
        }

        return this;
    }

    update() {
        if (this.updatesEnabled) {
            for (let widgetInfo of Object.values(this.widgets)) {
                if (widgetInfo.modes.has(this.mode)) {
                    let reveal = true;

                    for (let flagName in this.flags) {
                        if (widgetInfo.flags.has(flagName) && !this.flags[flagName].on) {
                            reveal = false;
                            break;
                        }
                    }

                    if (reveal) {
                        widgetInfo.widget.reveal();
                        widgetInfo.widget.getRevealState = () => true;
                        continue;
                    }
                }

                widgetInfo.widget.conceal();
                widgetInfo.widget.getRevealState = () => false;
            }

            const flags = {};
            Object.values(this.flags).forEach(flag => flags[flag.name] = flag.on);


            this.send({
                messageName: 'StateMachine',
                stm: this,
                mode: this.mode,
                flags: flags,
            });
        }
    }
});
