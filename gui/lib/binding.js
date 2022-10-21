/*****
 * Copyright (c) 2017-2022 Christoph Wittmann, chris.wittmann@icloud.com
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
 * Think of a binding as the intersection of a widget and an active data value
 * or a widget an attribute and and active data value.  THe point is that those
 * two items are bound and their value will stay synchronized, just qunatum
 * entangled particles.  A simple mkXyzBinding() will create the binding and
 * initialize it.  One of the features of binding is that the code minimizes the
 * number of event handleers required, and when an event handler is no longer
 * required, it is shut off.
*****/
class Binding {
    static nextId = 1;
    static byWidget = {};
    static byActiveData = {};
    static silentWidget = null;

    constructor(widget, activeData, key, initialValue) {
        this.id = Binding.nextId++;
        this.widget = widget;
        this.activeData = activeData;
        this.key = key;
        this.activeDataId = ActiveData.id(this.activeData);

        if (!(this.widget.id in Binding.byWidget)) {
            let handler = message => {
                Binding.onWidgetChanged(message);
            };

            Binding.byWidget[this.widget.id] = { '#HANDLER': handler };
            this.widget.on('Widget.Changed', handler);
        }

        if (!(this.activeDataId in Binding.byActiveData)) {
            let handler = message => {
                Binding.onActiveDataChanged(message);
            };

            Binding.byActiveData[this.activeDataId] = { '#HANDLER': handler };
            ActiveData.on(this.activeData, handler);
        }

        if (initialValue !== undefined) {
            this.activeData[key] = initialValue;
        }
        else if (!ActiveData.has(this.activeData, key)) {
            this.activeData[key] = '';
        }

        Binding.byWidget[this.widget.id][this.id] = this;
        Binding.byActiveData[this.activeDataId][this.id] = this;
    }

    static onActiveDataChanged(message) {
        if (message.action == 'change') {
            let adId = ActiveData.id(message.activeData);

            for (let binding of Object.values(Binding.byActiveData[adId])) {
                if (binding instanceof Binding) {
                    if (binding.key == message.key) {
                        if (!Binding.silentWidget || binding.widget.id != Binding.silentWidget.id) {
                            binding.onActiveDataChanged();
                        }
                    }
                }
            }
        }
    }

    static onWidgetChanged(message) {
        for (let binding of Object.values(Binding.byWidget[message.widget.id])) {
            if (binding instanceof Binding) {
                if (binding instanceof AttributeBinding) {
                    if (message.type == 'attribute' && message.name == binding.attributeName) {
                        binding.onWidgetChanged(message.value);
                    }
                }
                else if (binding instanceof InputBinding) {
                    if (message.type == 'attribute' && message.name == 'value') {
                        binding.onWidgetChanged(message.value);
                    }
                }
            }
        }
    }

    unbind() {
        Widget.unbind(this.activeData, this.widget);
    }

    static unbind(activeData, widget) {
        let adId = ActiveData.id(activeData);

        if (!(adId in Binding.byActiveData)){
            return;
        }

        if (!(widget.id in Binding.byWidget)) {
            return;
        }

        for (let entry of Object.entries(Binding.byActiveData[adId])) {
            let [id, binding ] = entry;

            if (binding instanceof Binding) {
                if (binding.widget.id == widget.id) {
                    delete Binding.byActiveData[adId][id];
                    delete Binding.byWidget[binding.widget.id][id];
                }
            }
        }

        if (Object.keys(Binding.byActiveData[adId]).length == 1) {
            ActiveData.off(activeData, Binding.byActiveData[adId]['#HANDLER']);
            delete Binding.byActiveData[adId];
        }

        if (Object.keys(Binding.byWidget[widget.id]).length == 1) {
            widget.off('Widget.Changed', Binding.byWidget[widget.id]['#HANDLER']);
            delete Binding.byWidget[widget.id];
        }
    }

    static unbindActiveData(activeData) {
        let adId = ActiveData.id(activeData);

        if (!(adId in Binding.byActiveData)){
            return;
        }

        let widgets = {};

        for (let entry of Object.entries(Binding.byActiveData[adId])) {
            let [id, binding ] = entry;

            if (binding instanceof Binding) {
                widgets[binding.widget.id] = binding.widget;
                delete Binding.byActiveData[adId][id];
                delete Binding.byWidget[binding.widget.id][id];
            }
        }

        if (Object.keys(Binding.byActiveData[adId]).length == 1) {
            ActiveData.off(activeData, Binding.byActiveData[adId]['#HANDLER']);
            delete Binding.byActiveData[adId];
        }

        for (let id of Object.keys(widgets)) {
            if (Object.keys(Binding.byWidget[id]).length == 1) {
                widgets[id].off('Widget.Changed', Binding.byWidget[id]['#HANDLER']);
                delete Binding.byWidget[id];
            }
        }
    }

    static unbindWidget(widget) {
        if (!(widget.id in Binding.byWidget)){
            return;
        }

        let activeDaten = {};

        for (let entry of Object.entries(Binding.byWidget[widget.id])) {
            let [id, binding ] = entry;

            if (binding instanceof Binding) {
                let adId = ActiveData.id(binding.activeData);
                activeDaten[adId] = binding.activeData;
                delete Binding.byActiveData[adId][id];
                delete Binding.byWidget[binding.widget.id][id];
            }
        }

        if (Object.keys(Binding.byWidget[widget.id]).length == 1) {
            widget.off('Widget.Changed', Binding.byWidget[widget.id]['#HANDLER']);
            delete Binding.byWidget[widget.id];
        }

        for (let adId of Object.keys(activeDaten)) {
            if (Object.keys(Binding.byActiveData[adId]).length == 1) {
                ActiveData.off(activeDaten[adId], Binding.byActiveData[adId]['#HANDLER']);
                delete Binding.byActiveData[adId];
            }
        }
    }
}


/*****
 * An attribute binding is a binding between a specific attribute of a widget
 * and a key of an active data object.  Attribute bindings are bidirectional.
 * A change to the widget updates the activeData object, and a change in the
 * active Data will update it's widgets.  Note that atempting to bind a widget
 * to two different active Data keys will provide garbage.
*****/
register(class AttributeBinding extends Binding {
    constructor(widget, activeData, key, attributeName, initialValue) {
        super(widget, activeData, key, initialValue);
        this.attributeName = attributeName;
        this.widget.silence();
        this.widget.setAttribute(this.attributeName, this.activeData[key]);
        this.widget.resume();
        return widget;
    }

    onActiveDataChanged() {
        this.widget.silence();
        this.widget.setAttribute(this.attributeName, this.activeData[this.key]);
        this.widget.resume();
    }

    onWidgetChanged(value) {
        Binding.silentWidget = this.widget;
        this.activeData[this.key] = value;
        Binding.silentWidget = this.null;
    }
});


/*****
 * An inner Html binding is a binding between the widget's inner Html content
 * and a key of an active data object.  This is a one-way pipeline from the
 * active data object to the widget.  The pupose of such bindins is NOT for
 * supporting data input, it's for automatically updating text/html on the
 * given widget.
*****/
register(class InnerHtmlBinding extends Binding {
    constructor(widget, activeData, key, initialValue) {
        super(widget, activeData, key, initialValue);
        this.widget.silence();
        this.widget.set(this.activeData[key]);
        this.widget.resume();
        return widget;
    }

    onActiveDataChanged() {
        Binding.silentWidget = this.widget;
        this.widget.set(this.activeData[this.key]);
        Binding.silentWidget = null;
    }
});


/*****
 * An Input binding is a direct binding between the value attribute of a widget
 * and a key of an active data object.  Input bindings are bidirectional.
 * A change to the widget updates the active Data object, and a change in the
 * activeData will update it's widgets.  Note that atempting to bind a widget
 * to two different active Data keys will provide garbage.
*****/
register(class InputBinding extends Binding {
    constructor(widget, activeData, key, initialValue) {
        super(widget, activeData, key, initialValue);
        this.widget.silence();
        this.widget.setAttribute('value', this.activeData[key]);
        this.widget.resume();
        return widget;
    }

    onActiveDataChanged() {
        this.widget.silence();
        this.widget.setAttribute('value', this.activeData[this.key]);
        this.widget.resume();
    }

    onWidgetChanged(value) {
        Binding.silentWidget = this.widget;
        this.activeData[this.key] = value;
        Binding.silentWidget = this.null;
    }
});
