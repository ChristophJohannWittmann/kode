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
register(class HttpResponse {
    static statusCodes = {
        100: { text: 'Continue' },
        101: { text: 'Switching Protocols' },
        102: { text: 'WebDav Processing' },
        103: { text: 'Early Hints' },
        200: { text: 'OK' },
        201: { text: 'Created' },
        202: { text: 'Accepted' },
        203: { text: 'Non-Authoritative Information' },
        204: { text: 'No Content' },
        205: { text: 'Reset Content' },
        206: { text: 'PartialContent' },
        207: { text: 'WebDav Multi-Status' },
        208: { text: 'WebDav Already Reported' },
        226: { text: 'WebDav IM Used' },
        300: { text: 'Multiple Choices' },
        301: { text: 'Moved Permanently' },
        302: { text: 'Found' },
        303: { text: 'See Other' },
        304: { text: 'Not Modified' },
        305: { text: 'Use Proxy' },
        306: { text: 'unused' },
        307: { text: 'Temporary Redirect' },
        308: { text: 'Permanent Redirect' },
        400: { text: 'Bad Request' },
        401: { text: 'Unauthorized' },
        402: { text: 'Payment Required' },
        403: { text: 'Forbidden' },
        404: { text: 'Not Found' },
        405: { text: 'Method Not Allowed' },
        406: { text: 'Not Acceptable' },
        407: { text: 'Proxy Authentiation Required' },
        408: { text: 'Request Timeout' },
        409: { text: 'Conflict' },
        410: { text: 'Gone' },
        411: { text: 'Length Required' },
        412: { text: 'Precondition Failed' },
        413: { text: 'Payload Too Large' },
        414: { text: 'URI Too Long' },
        415: { text: 'Unsupported Media Type' },
        416: { text: 'Range Not Satisfiable' },
        417: { text: 'Expectation Failed' },
        418: { text: 'I\'m a teapot' },
        421: { text: 'Misdirected Request' },
        422: { text: 'Unprocessable Entity' },
        423: { text: 'Locked' },
        424: { text: 'Failed Dependency' },
        425: { text: 'Too Early' },
        426: { text: 'Upgrade Required' },
        428: { text: 'Precondition Required' },
        429: { text: 'Too Many Requests' },
        431: { text: 'Request Header Fields Too Large' },
        451: { text: 'Unavailable For Legal Reasons' },
        500: { text: 'Internal Server Error' },
        501: { text: 'Not Implemented' },
        502: { text: 'Bad Gateway' },
        503: { text: 'Service Unavailable' },
        504: { text: 'Gateway Timeout' },
        505: { text: 'HTTP Version Not Supported' },
        506: { text: 'Variant Also Negotiates' },
        507: { text: 'Insuficient Storage' },
        508: { text: 'Loop Detected' },
        510: { text: 'Not Extended' },
        511: { text: 'Network Authentiation Failed' },
    };

    constructor(httpServer, httpRsp) {
        return new Promise(async (ok, fail) => {
            this.httpServer = httpServer;
            this.httpRsp = httpRsp;
            this.statusValue = 200;
            this.statusMessage = HttpResponse.statusCodes[200];
            this.mimeValue = Mime.fromMimeCode('text/plain');
            this.encodingValue = mkEncoding('UTF-8');
            this.languageValue = mkLanguage();
            this.httpHeaders = {};
            this.contentValue = [''];
            ok(this);
        });
    }

    appendContent(...args) {
        for (let arg of args) {
            this.contentValue.push(arg);
        }
    }

    clearContent() {
        this.contentValue = [];
    }

    clearHeader(headerName) {
        delete this.httpHeaders[headerName.toLowerCase()];
    }

    encoding(encoding) {
        if (typeof encoding == 'undefined') {
            return this.encodingValue;
        }
        else if (typeof encoding == 'string') {
            this.encodingValue = mkEncoding(encoding);
        }
        else if (encoding instanceof Encoding) {
            this.encodingValue = encoding;
        }
    }

    async end() {
        this.setHeader('Content-Language', this.languageValue.code());

        if (this.mimeValue.type == 'string') {
            this.setHeader('Content-Type', this.mimeValue.code);
            this.setHeader('Content-Encoding', this.encodingValue.code());
        }
        else {
            console.log('TODO -- binary data!')
        }

        let headerMap = {};
        Object.values(this.httpHeaders).forEach(header => headerMap[header.name] = header.value);
        this.httpRsp.writeHead(this.statusValue, headerMap);


        if (this.mimeValue.type == 'string') {
            this.httpRsp.end(this.contentValue.join(''));
        }
        else {
            console.log('TODO -- binary data!')
        }
    }

    language(language) {
        if (typeof language == 'undefined') {
            return this.languageValue;
        }
        else if (typeof language == 'string') {
            this.languageValue = mkLanguage(language);
        }
        else if (language instanceof Language) {
            this.languageValue = language;
        }
    }

    mime(mime) {
        if (typeof mime == 'undefined') {
            return this.mimeValue;
        }
        else if (typeof mime == 'string') {
            this.mimeValue = Mime.fromMimeCode(mime);
        }
        else if (mime instanceof Mime) {
            this.mimeValue = mime;
        }
    }

    setContent(...args) {
        this.contentValue = args;
    }

    setHeader(headerName, value) {
        let key = headerName.toLowerCase();
        this.httpHeaders[key] = { name: headerName, value: value.toString() };
    }

    status(status) {
        if (typeof status == 'undefined') {
            return this.statusValue;
        }
        else if (typeof status == 'number') {
            this.status = status;
        }
    }
});
