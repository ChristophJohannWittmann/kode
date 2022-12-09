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
register(class FWNetIfaceView extends Widget {
    constructor(ifaceName) {
        super('div');

        (async () => {
            let iface = await queryServer({
                messageName: 'ConfigGetNetIface',
                ifaceName: ifaceName
            });

            let acme = (await queryServer({
                messageName: 'ConfigListAcmeProviders',
            })).map(ca => ({ value: ca.provider, text: ca.name }));

            this.append(
                mkWidget('h1').set(`${txx.fwNetInterface}: "${ifaceName}"`),
                mkWObjectEditor()
                .addObj(iface, {
                    active: {
                        label: txx.fwMiscActive,
                        readonly: true,
                        type: ValueTypeBool,
                    },
                    address: {
                        label: txx.fwNetAddress,
                        readonly: false,
                        type: ValueTypeIp,
                    },
                    domain: {
                        label: txx.fwNetDomain,
                        readonly: false,
                        type: ValueTypeHost,
                    },
                    host: {
                        label: txx.fwNetHost,
                        readonly: false,
                        type: ValueTypeText,
                    },
                })
                .addObj(iface.tls, {
                    acme: {
                        label: txx.fwNetAcme,
                        readonly: false,
                        type: ValueTypeEnum,
                        values: acme,
                    },
                    publicKey: {
                        label: txx.fwNetPublicKey,
                        readonly: true,
                        type: ValueTypeText,
                    },
                    privateKey: {
                        label: txx.fwNetPrivateKey,
                        readonly: true,
                        type: ValueTypeText,
                    },
                    cert: {
                        label: txx.fwNetCert,
                        readonly: true,
                        type: ValueTypeText,
                    },
                    caCert: {
                        label: txx.fwNetCaCert,
                        readonly: true,
                        type: ValueTypeText,
                    },
                })
            );
        })();
    }
});