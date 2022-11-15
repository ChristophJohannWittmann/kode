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
register(class SystemEndpoints extends WebAppEndpointContainer {
    constructor(webapp) {
        super(webapp);
    }

    async [ mkWebAppEndpoint('DiscardTlsCertificate', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('GetAcmeCertificate', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('GetServerConfig', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('GetSystemInformation', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('GetTlsSettings', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('ResolveDnsName', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('RestartServer', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('SetServerConfig', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('SetTlsSettings', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('StartNetwowrkInterface', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('StoptNetwowrkInterface', 'system') ](req) {
    }

    async [ mkWebAppEndpoint('ShutdownServer', 'system') ](req) {
    }
});
