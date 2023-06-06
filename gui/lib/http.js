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
 * Wrapper object for the client-side XMLHTTPRequest response-related feature
 * subset.  Conceptually, the HTTP class executes the request and returns this
 * object that encapsulates the API object as if it were an independent respoonse
 * object.  An instance of HttpResponse is passed to the caller after awaiting
 * the HTTP request result.
*****/
class HttpResponse {
    constructor(xmlHttpRequest) {
        this.req = xmlHttpRequest;
    }

    getHeader(headerName) {
        return this.req.getResponseHeader(headerName);
    }

    getHeaders() {
        return this.req.getAllResponseHeaders();
    }

    getMessage() {
        if (this.isMessage()) {
            return fromJson(this.req.responseText);
        }
    }

    getReadyState() {
        switch (this.req.readyState) {
            case 0:
                return Http.Unsent;

            case 1:
                return Http.Opened;

            case 2:
                return Http.HeadersReceived;

            case 3:
                return Http.Loading;

            case 4:
                return Http.Done;
        }
    }

    getResponseData() {
        return this.req.response;
    }

    getResponseText() {
        return this.req.responseText;
    }

    getResponseType() {
        return this.req.responseType;
    }

    getStatus() {
        return {
            code: this.req.status,
            text: this.req.statusText,
        };
    }

    getUrl() {
        return this.req.responseURL;
    }

    isDone() {
        return this.req.readyState == Http.Done;
    }

    isMessage() {
        let contentType = this.req.getResponseHeader('content-type');

        if (typeof contentType == 'string') {
            return contentType.startsWith('application/json');
        }

        return false;
    }

    isOk() {
        if (this.req.readyState == Http.Done) {
            if (this.req.status >= 100 && this.req.status < 400) {
                return true;
            }
        }

        return false;
    }
}


/*****
 * The framework wrapper for the XMLHTTPRequest provides loads of functionality
 * for simplifying the entire GET and POST cycles.  Firstly, all requests are
 * wrapped in a promise/promise-trap layer to make the function calls operate in
 * an asynchronous manner.  This results in simplified syntax and better code.
 * Moreover, progress messages are emitted for larger downloads, which may also
 * be easily cancelled.
*****/
register(class Http extends Emitter {
    static Done            = XMLHttpRequest.DONE;
    static HeadersReceived = XMLHttpRequest.HEADERS_RECEIVED;
    static Loading         = XMLHttpRequest.LOADING;
    static Opened          = XMLHttpRequest.OPENED;
    static Unsent          = XMLHttpRequest.UNSENT;

    constructor(timeoutMillis) {
        super();
        this.req = new XMLHttpRequest();
        this.setTimeout(timeoutMillis);
        this.trap = mkTrap();
        Trap.setExpected(this.trap.id, 1);
        this.headers = {};
    }

    cancel() {
        if (this.req.readyState != Http.Done) {
            Trap.cancel(this.trap.id);
            this.req.abort();
        }

        return this;
    }

    get(url) {
        this.request('GET', url);
        return this.trap.promise;
    }

    getTimeout() {
        return this.req.timeout;
    }

    post(url, mime, body) {
        this.request('POST', url, mime.code, body);
        return this.trap.promise;
    }

    queryServer(message) {
        message = message instanceof Message ? message : mkMessage(message);
        message['#Session'] = webAppSettings.session();
        message['#Trap'] = this.trap.id;
        this.request('POST', webAppSettings.url(), 'application/json', toJson(message));
        return this.trap.promise;
    }

    request(method, url, mime, body) {
        this.req.onabort = event => {
            Trap.pushReply(this.trap, new HttpResponse(this.req));
        };

        this.req.onerror = event => {
            Trap.pushReply(this.trap, new HttpResponse(this.req));
        };

        this.req.onprogress = event => {
            this.send({
                messageName: 'Progress',
                determinate: event.lengthComputable,
                loaded: event.loaded,
                total: event.total,
            });
        };

        this.req.onreadystatechange = event => {
            if (this.req.readyState == Http.Done) {
                let rsp = new HttpResponse(this.req);
                let status = rsp.getStatus();

                if (rsp.isMessage()) {
                    let message = rsp.getMessage();
                    let pending = '#Pending' in message ? message['#Pending'] : [];
                    delete message['#Pending'];
                    Trap.pushReply(this.trap.id, message.response);

                    for (let pendingMessage of pending) {
                        global.send(pendingMessage);
                    }
                }
                else {
                    Trap.pushReply(this.trap.id, rsp);
                }
            }
        };

        this.req.ontimeout = event => {
            Trap.pushReply(this.trap, new HttpResponse(this.req));
        };
  
        this.req.open(method, url, true);
        Object.entries(this.headers).forEach(entry => this.req.setRequestHeader(entry[0], entry[1]));

        if (method == 'GET') {
            this.req.send();
        }
        else if (method == 'POST') {
            this.req.setRequestHeader('content-type', mime);
            this.req.send(body);
        }
    }

    setHeader(header, value) {
        this.headers[header] = value;
        return this;
    }

    setTimeout(timeoutMillis) {
        this.req.timeout = timeoutMillis ? timeoutMillis : 15000;
        return this;
    }
});
