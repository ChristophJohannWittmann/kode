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
*****/
register(class SystemEndpoints extends EndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkEndpoint('DiscardTlsCertificate', 'system') ](trx) {
    }

    async [ mkEndpoint('GetAcmeCertificate', 'system') ](trx) {
    }

    async [ mkEndpoint('GetServerConfig', 'system') ](trx) {
    }

    async [ mkEndpoint('GetSystemInformation', 'system') ](trx) {
    }

    async [ mkEndpoint('GetTlsSettings', 'system') ](trx) {
    }

    async [ mkEndpoint('ResolveDnsName', 'system') ](trx) {
    }

    async [ mkEndpoint('RestartServer', 'system') ](trx) {
    }

    async [ mkEndpoint('SetServerConfig', 'system') ](trx) {
    }

    async [ mkEndpoint('SetTlsSettings', 'system') ](trx) {
    }

    async [ mkEndpoint('StartNetwowrkInterface', 'system') ](trx) {
    }

    async [ mkEndpoint('StoptNetwowrkInterface', 'system') ](trx) {
    }

    async [ mkEndpoint('ShutdownServer', 'system') ](trx) {
    }
});
