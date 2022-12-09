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

    constructor(widget, activeData, key) {
        this.id = Binding.nextId++;
        this.widget = widget;

        if (ActiveData.isActiveData(activeData[key])) {
            this.activeData = activeData[key];
            this.key = '';
            this.activeDataId = ActiveData.id(this.activeData);
        }
        else {
            this.activeData = activeData;
            this.key = key;
            this.activeDataId = ActiveData.id(this.activeData);
        }

        if (!(this.widget.id in Binding.byWidget)) {
            Binding.byWidget[this.widget.id] = {};
            this.widget.on('Widget.Changed', Binding.onWidgetChanged);
        }

        if (!(this.activeDataId in Binding.byActiveData)) {
            Binding.byActiveData[this.activeDataId] = {};
            ActiveData.on(this.activeData, Binding.onActiveDataChanged);
        }

        if (!ActiveData.has(this.activeData, key)) {
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
                    if (!binding.key || binding.key == message.key) {
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
            if (binding instanceof AttributeBinding) {
                if (message.type == 'attribute' && message.name == binding.attributeName) {
                    binding.onWidgetChanged(message.value);
                }
            }
            else if (binding instanceof InnerHtmlBinding) {
                if (message.type == 'innerHTML') {
                    binding.onWidgetChanged(message.widget.get());
                }
            }
            else if (binding instanceof ValueBinding) {
                if (message.type == 'value') {
                    binding.onWidgetChanged(message.value);
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

        if (!Object.keys(Binding.byActiveData[adId])) {
            ActiveData.off(activeData, Binding.onActiveDataChanged);
            delete Binding.byActiveData[adId];
        }

        if (!Object.keys(Binding.byWidget[widget.id])) {
            widget.off('Widget.Changed', Binding.onWidgetChanged);
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

        if (!Object.keys(Binding.byActiveData[adId]).length) {
            ActiveData.off(activeData, Binding.onActiveDataChanged);
            delete Binding.byActiveData[adId];
        }

        for (let id of Object.keys(widgets)) {
            if (!Object.keys(Binding.byWidget[id]).length) {
                widgets[id].off('Widget.Changed', Binding.onWidgetChanged);
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

        if (!Object.keys(Binding.byWidget[widget.id]).length) {
            widget.off('Widget.Changed', Binding.onActiveDataChanged);
            delete Binding.byWidget[widget.id];
        }

        for (let adId of Object.keys(activeDaten)) {
            if (!Object.keys(Binding.byActiveData[adId]).length) {
                ActiveData.off(activeDaten[adId], Binding.onWidgetChanged);
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
    constructor(widget, activeData, key, attributeName) {
        super(widget, activeData, key);
        this.attributeName = attributeName;
        this.widget.silence();
        this.widget.setAttribute(this.attributeName, this.activeData[key]);
        this.widget.resume();
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
 * An InnerHtml binding is a direct binding between the inner HTML of a widget
 * and a key of an active data object.  Inner HTML bindings are bidirectional.
 * A change to the widget updates the active Data object, and a change in the
 * activeData will update it's widgets.  This is primarily usee to display
 * active data values on a view and for building virtual user-input types not
 * based on standard HTML date-entry elements such as input and select.
*****/
register(class InnerHtmlBinding extends Binding {
    constructor(widget, activeData, key) {
        super(widget, activeData, key);
        this.widget.silence();
        this.widget.set(this.activeData[key]);
        this.widget.resume();
    }

    onActiveDataChanged() {
        Binding.silentWidget = this.widget;
        this.widget.set(this.activeData[this.key]);
        Binding.silentWidget = null;
    }

    onWidgetChanged(value) {
        Binding.silentWidget = this.widget;
        this.activeData[this.key] = value;
        Binding.silentWidget = this.null;
    }
});


/*****
 * A map binding is a very useful type of binding.  The active data key is used
 * as a lookup into a jabascript object, whose value must be a preconstructed
 * widget.  So the active data key value is used to find the appropriate widget
 * and set the bound widget's childen equal to the widget founding using the
 * active data key value.  If an unmapped key value is provided, the bound
 * widget's children will be cleared.
*****/
register(class MapBinding extends Binding {
    constructor(widget, activeData, key, mapping) {
        super(widget, activeData, key);
        this.mapping = mapping;
        this.onActiveDataChanged();
    }

    onActiveDataChanged() {
        let mapKey = this.activeData[this.key];

        if (mapKey in this.mapping) {
            this.widget.clear();
            this.widget.append(this.mapping[mapKey]);
        }
        else {
            this.widget.clear();
        }
    }

    onWidgetChanged(value) {
    }
});


/*****
 * A value binding is a direct binding between the value attribute of a widget
 * and a key of an active data object.  Value bindings are bidirectional.
 * A change to the widget updates the active Data object, and a change in the
 * activeData will update it's widgets.  Note that atempting to bind a widget
 * to two different active Data keys will provide garbage.
*****/
register(class ValueBinding extends Binding {
    constructor(widget, activeData, key) {
        super(widget, activeData, key);
        this.widget.silence();

        if (this.key) {
            this.widget.setValue(this.activeData[this.key]);
        }
        else {
            this.widget.setValue(ActiveData.value(this.activeData));
        }

        this.widget.resume();
    }

    onActiveDataChanged() {
        this.widget.silence();

        if (this.key) {
            this.widget.setValue(this.activeData[this.key]);
        }
        else {
            this.widget.setValue(ActiveData.value(this.activeData));
        }

        this.widget.resume();
    }

    onWidgetChanged(value) {
        Binding.silentWidget = this.widget;
        this.activeData[this.key] = value;
        Binding.silentWidget = this.null;
    }
});
