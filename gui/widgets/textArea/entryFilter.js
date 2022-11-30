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
 * TextArea handlers are singleton objects whose job is to add type specific
 * editing features to a plain old WTextArea widget.  These handlers are not trivial
 * and can required significant programming efforts.  The core functionality for
 * building a value-added editor is to create a singleton instance subclassing
 * TextAreaHandler with features that can enhance or automate the editing feature
 * set.  We want the final text editing instances to be singletons to increase
 * WTextArea construction performance.
*****/
register(class EntryFilter {
    constructor() {
        this.handlers = {};
    }

    handle(event, widget) {
        let key = [
            event.type == 'keydown' ? 'd' : 'u',
            event.altKey ? 'S' : 'U',
            event.ctrlKey ? 'S' : 'U',
            event.metaKey ? 'S' : 'U',
            event.shiftKey ? 'S' : 'U',
            event.key

        ].join('');

        let handler = this.handlers[key];

        if (handler) {
            Reflect.apply(handler, this, [{
                    event: event,
                    widget: widget,
                }]
            );

            switch (widget.bindingType) {
                case 'innerHtml':
                    widget.valueChanged(widget.get());
                    break;

                case 'value':
                    widget.valueChanged(widget.getValue());
                    break;
            }

            event.preventDefault();
        }
    }

    registerFilterPoint(filterPoint) {
        let [ down, prefix, keyName ] = filterPoint;
        const prefixes = [down ? 'd' : 'u'];
        const method = this[`on${keyName}${down ? 'Down' : 'Up'}`];

        for (let i = 0; i < 4; i++) {
            let char = prefix[i];

            if (char == '*') {
                let length = prefixes.length;

                for (let j = 0; j < length; j++) {
                    prefixes.push(`${prefixes[j]}U`);
                    prefixes[j] = `${prefixes[j]}S`;
                }
            }
            else if (char == 't') {
                for (let j = 0; j < prefixes.length; j++) {
                    prefixes[j] = `${prefixes[j]}S`;
                }
            }
            else if (char == 'f') {
                for (let j = 0; j < prefixes.length; j++) {
                    prefixes[j] = `${prefixes[j]}N`;
                }
            }
        }

        for (let prefix of prefixes) {
            this.handlers[`${prefix}${keyName}`] = method;
        }
    }
});