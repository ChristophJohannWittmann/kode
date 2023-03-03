/*****
 * Copyright (c) 2017-2023 Kode Programming
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
 * A DarkWidget is a base class for a stubs or thunks of widgets that are NOT
 * downloaded with the initial application.  They are downloaded on demand.
 * There are two primary uses: (a) speed up the initial application installation,
 * or (b) prevent downloading widgets to users who don't have permission for a
 * specific feature.  It's kind of complex since we need to (1) store the ctor's
 * args, (2) display a placeholder or downloading div, (3) download the full
 * source code from the server, (4) delete the thunk from the global namespace
 * and register the full source code, and (5) replace the placeholder widget
 * with the fully functional widget.
*****/
register(class DarkWidget extends Widget {
    constructor(...args) {
        super('div');
        this.args = args;
        this.ctor = Reflect.getPrototypeOf(this).constructor;
        this.className = this.ctor.name;
        this.makerName = `mk${this.className}`;
        this.chain = this.ctor[chainKey];
        this.container = this.ctor[containerKey];
    }

    async download(...args) {
        let darkWidget = await queryServer({
            messageName: 'SelfGetDarkWidget',
            libName: this.libName,
            className: this.className,
        });

        delete this.container[this.className];
        delete this.container[this.makerName];

        swap(this.container);
        eval(mkBuffer(darkWidget, 'base64').toString());
        paws();

        let parent = this.parent();

        let widget = Reflect.apply(this.container[this.makerName], window, args);
        widget.id = this.id;
        widget.selector = this.selector;
        this.replace(widget);

        if (parent instanceof WPanel) {
            parent.unwire(this);
            parent.wire(widget);
        }
    }
});
