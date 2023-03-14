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
 * The dialogs is the web app implementation of the standard model dialog box.
 * It's simple to construct and use with the intent of providing information to
 * the user as simple plain text.  It's implemented as a two-overlay widget.
 * The outer widget is a shield and covers the entire document body.  Overlaid
 * on the shield is the dialog content, which is split into two rows: (a) text
 * notification and (b) ok/cancel buttons.
*****/
register(class WDialog extends WOverlay {
    static minWidth = 300;
    static minHeight = 200;

    constructor(opts) {
        super({
            tagName: 'span',
            position: 'center',
            minWidth: WDialog.minWidth,
            minHeight: WDialog.minHeight,
        });

        this.setWidgetStyle('dialog-content');
        doc.on('dom.keydown', message => message.event.key == 'Escape' ? this.hide() : false);
        body.pushStyle({ filter: 'blur(6px)' });

        let overlayOpts = new Object();
        typeof opts.autoHide == 'number' ? overlayOpts.autoHide = opts.autoHide : false;

        this.shield = mkWOverlay(overlayOpts);
        this.shield.setWidgetStyle('dialog-shield');
        this.shield.setClassNames('alt-colors');
        this.shield.show(html);

        super.show(this.shield);
        this.append(opts.content);

        if (typeof opts.autoHide == 'number') {
            this.timeout = setTimeout(() => this.hide(), opts.autoHide);
        }

        this.promise = new Promise((ok, fail) => {
            this.hide = value => {
                this.timeout ? clearTimeout(this.timeout) : false;
                delete this.timeout;
                body.popStyle();
                this.shield.hide();
                ok(value);
            }
        });
    }

    show() {
    }
});


/*****
 * The alert dialog, like the window.alert() function, provides a notification
 * to the user, which is normally closed when the user clicks the provided OK
 * button.  Here's an example of the usage:  await mkWAlertDialog('some-text');
*****/
register(class WAlertDialog extends WDialog {
    constructor(opts) {
        const body = (opts.content = mkWTable('dialog-table')).getBody();

        body.mkRowAppend()
        .mkCellAppend(typeof opts.text == 'string' ? opts.text : '[EMPTY]')
        .getLastCell().setStyle('text-align', 'left');

        body.mkRowAppend()
        .mkCellAppend(
            mkIButton()
            .setValue(txx.fwMiscOk)
            .on('dom.click', message => this.hide())
        );

        super(opts);
        return this.promise;
    }
});


/*****
 * The confirm dialog, like the window.confirm() function, provides notification
 * to the user, who then clicks either "OK" or "Cancel" to either complete the
 * requested operation or to cancel it.  This is the sanity check dialog box.
 * Standard usage is with a branch:
 * 
 *      if (await mkWConfirmDialog('are-you-sure')) {
 *          // do it!
 *      }
 *      else {
 *          // don't do it!
 *      }
*****/
register(class WConfirmDialog extends WDialog {
    constructor(opts) {
        const body = (opts.content = mkWTable('dialog-table')).getBody();

        body.mkRowAppend()
        .mkCellAppend(typeof opts.text == 'string' ? opts.text : '[EMPTY]')
        .getLastCell().setAttribute('colspan', 2)
        .setStyle('text-align', 'left');

        body.mkRowAppend()
        .mkCellAppend(
            mkIButton()
            .setValue(txx.fwMiscOk)
            .on('dom.click', message => this.hide(true))
        )
        .mkCellAppend(
            mkIButton()
            .setValue(txx.fwMiscCancel)
            .on('dom.click', message => this.hide(false))
        );

        super(opts);
        return this.promise;
    }
});
