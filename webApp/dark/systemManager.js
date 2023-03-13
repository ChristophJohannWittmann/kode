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


(() => {
    /*****
    *****/
    register(class SystemManager extends WEditor {
        constructor() {
            super();

            this.setRefreshers(
                'ConfigCertifyIface',
                'ConfigClearCrypto',
                'ConfigCreateKeyPair',
                'ConfigUpdateNetIface',
            );

            this.refresh();
        }

        async refresh() {
            this.iface = new NetIfaceEditor('public');
            await this.iface.refresh();
            this.clear();
            this.append(this.iface);
            this.listen();
            super.refresh();
        }

        async save() {
            this.iface.save();
        }
    });


    /*****
     * An editor that's used for editing a network interface.  This panel is able
     * to edit all aspects of a single network interface, whose data is stored in
     * the server configuration file, kode.json.  All aspects of the network
     * interface may modified with this panel.  System admin beware, if you
     * deactivate the network interface you're currently using, the server will
     * reboot without it being available.
    *****/
    class NetIfaceEditor extends WEditor {
        constructor(ifaceName) {
            super();
            this.ifaceName = ifaceName;
        }

        async certify() {
            await queryServer({
                messageName: 'ConfigCertifyIface',
                ifaceName: this.ifaceName,
            });
            
            return this;
        }

        async copyPublicKey(format) {
            let key = await queryServer({
                messageName: 'ConfigCopyPublicKey',
                ifaceName: this.ifaceName,
                format: format,
            });

            doc.copy(key);
            return this;
        }

        async createKeyPair() {
            await queryServer({
                messageName: 'ConfigCreateKeyPair',
                ifaceName: this.ifaceName,
            });

            return this;
        }

        async refresh() {
            this.append(
                mkWidget('h3')
                .setInnerHtml(`${txx.fwNetInterface} "${this.ifaceName}"`)
            );

            this.editor = mkWObjectEditor();

            this.iface = await queryServer({
                messageName: 'ConfigGetNetIface',
                ifaceName: this.ifaceName
            });

            this.acme = (await queryServer({
                messageName: 'ConfigListAcmeProviders',
            })).map(ca => ({ value: ca.provider, text: ca.name }));

            let keyMenu = mkWPopupMenu()
            .append(
                mkWMenuItem(txx.fwNetCreateKeyPair, 'CreateKeys')
                .setAction(() => this.createKeyPair())
            );

            let publicKeyMenu = mkWPopupMenu()
            .append(
                mkWMenuItem(txx.fwNetCopyKeyPem, 'Certify')
                .setAction(() => this.copyPublicKey('pem'))
                .bind(this.editor.getActiveData(), 'publicKey', (mi, value) => value == '[NONE]' ? mi.disable() : mi.enable())
            )
            .append(
                mkWMenuItem(txx.fwNetCreateKeyPair, 'CreateKeys')
                .setAction(() => this.createKeyPair())
            );

            let certMenu = mkWPopupMenu()
            .append(
                mkWMenuItem(txx.fwNetCertify, 'Certify')
                .setAction(() => this.certify())
                .bind(this.editor.getActiveData(), 'privateKey', (mi, value) => value == '[NONE]' ? mi.disable() : mi.enable())
            );

            this.editor.addObj(this.iface, {
                address: {
                    label: txx.fwNetAddress,
                    readonly: false,
                    type: ScalarIp,
                    focus: true,
                },
                domain: {
                    label: txx.fwNetDomain,
                    readonly: false,
                    type: ScalarHost,
                },
                host: {
                    label: txx.fwNetHost,
                    readonly: false,
                    type: ScalarHost,
                },
                acme: {
                    label: txx.fwNetAcme,
                    readonly: false,
                    type: ScalarEnum,
                    choices: this.acme,
                },
                privateKey: {
                    label: txx.fwNetPrivateKey,
                    readonly: true,
                    type: ScalarText,
                    menu: keyMenu,
                },
                publicKey: {
                    label: txx.fwNetPublicKey,
                    readonly: true,
                    type: ScalarText,
                    menu: publicKeyMenu,
                },
                cert: {
                    label: txx.fwNetCert,
                    readonly: true,
                    type: ScalarText,
                    menu: certMenu,
                },
                certExpires: {
                    label: txx.fwNetCertExpires,
                    readonly: true,
                    type: ScalarText,
                    menu: certMenu,
                },
            });

            this.append(this.editor);            
        }

        async save() {
            let message = {
                messageName: 'ConfigUpdateNetIface',
                ifaceName: this.ifaceName,
            };

            Object.assign(message, this.editor.getValues());
            await queryServer(message);
            return this;
        }
    }
})();