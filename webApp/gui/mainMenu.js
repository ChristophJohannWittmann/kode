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
*****/
register(class MainMenu extends WPopupMenu {
    constructor(grants) {
        super();

        return new Promise(async (ok, fail) => {
            this.append(
                mkWMenuItem(txx.fwMenuAccount, "Account")
                //.setAction(() => this.copyPublicKey('pem'))
                //.bind(this.editor.modifiable, 'publicKey', (mi, value) => value == '[NONE]' ? mi.disable() : mi.enable())
            );

            this.append(
                mkWMenuItem(txx.fwMenuPreferences, "Preferences")
                //.setAction(() => this.createKeyPair())
            );

            this.append(
                mkWMenuItem(txx.fwMenuPassword, "Password")
                //.setAction(() => this.createKeyPair())
            );

            if ('user' in grants) {
                this.append(
                    mkWMenuItem(txx.fwMenuUsers, "Users")
                    //.setAction(() => this.createKeyPair())
                );
            }

            if (webAppSettings.user().orgOid == 0) {
                this.append(
                    mkWMenuItem(txx.fwMenuOrgs, "Orgs")
                    .setAction(() => {
                        /*
                        if (this.orgsView) {
                            home.moveTop(this.orgsView);
                        }
                        else {
                            this.orgsView = mkOrgManager('public');
                            home.push(this.orgsView);
                        }
                        */
                        home.push(mkOrgManager('public'));
                    })
                );
            }

            if ('system' in grants) {
                this.append(
                    mkWMenuItem(txx.fwMenuSystem, "System")
                    .setAction(() => {
                        /*
                        if (this.systemView) {
                            home.moveTop(this.systemView);
                        }
                        else {
                            this.systemView = mkNetIfaceEditor('public');
                            home.push(this.systemView);
                        }
                        */
                        home.push(mkNetIfaceEditor('public'));
                    })
                );
            }

            this.append(
                mkWMenuItem(txx.fwMenuSignOut, "SignOut")
                .setAction(async () => {
                    await queryServer({ messageName: 'SelfSignOut' });
                    signOut();
                })
            );

            ok(this);
        });
    }
});