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
    constructor() {
        super('div');
    }

    async download(libName) {
        const ctor = Reflect.getPrototypeOf(this).constructor;
        const className = ctor.name;
        const container = ctor['#GetContainer']();

        let darkCode = await queryServer({
            messageName: 'SelfGetDarkWidget',
            libName: libName,
            className: className,
        });

        delete container[className];
        delete container[`mk${className}`];

        swap(container);
        eval(mkBuffer(darkCode, 'base64').toString());
        paws();
    }
});
