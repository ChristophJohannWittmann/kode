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
 * The main application menu is created with this framework class.  When the main
 * menu is constructed, it's placed in the global container as "mainMenu".  Each
 * application will need to determine whether a main menu is required and how to
 * manage what's on it.  In general, this core framework menu provides features
 * to support all of the webapp's built in features.
*****/
register(class MainMenu extends WPopupMenu {
    constructor(grants) {
        super();
        global.mainMenu = this;

        return new Promise(async (ok, fail) => {
            if (webAppSettings.user().orgOid == 0) {
                this.append(
                    mkWMenuItem(txx.fwMenuOrgs, "Orgs")
                    .setAction(mkSingletonViewMenuAction(home, mkOrgManager))
                );
            }

            this.append(
                mkWMenuItem(txx.fwMenuPassword, "Password")
                    .setAction(mkSingletonViewMenuAction(home, mkPasswordManager))
            );

            this.append(
                mkWMenuItem(txx.fwMenuPreferences, "Preferences")
                    .setAction(mkSingletonViewMenuAction(home, mkPreferencesManager))
            );

            if ('system' in grants) {
                this.append(
                    mkWMenuItem(txx.fwMenuSystem, "System")
                    .setAction(mkSingletonViewMenuAction(home, mkSystemManager))
                );
            }

            if ('user' in grants) {
                this.append(
                    mkWMenuItem(txx.fwMenuUsers, "Users")
                    .setAction(mkSingletonViewMenuAction(home, mkUserManager))
                );
            }

            this.append(
                mkWMenuSeparator(true)
            );

            this.append(
                mkWMenuItem(txx.fwMenuSignOut, "SignOut")
                .setAction(
                    mkFunctionMenuAction(async (menuItem, message) => {
                        await queryServer({ messageName: 'SelfSignOut' });
                        signOut();
                    })
                )
            );

            ok(this);
        });
    }
});