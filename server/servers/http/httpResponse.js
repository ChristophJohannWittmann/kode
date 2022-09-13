/*****
 * Copyright (c) 2022 Christoph Wittmann, chris.wittmann@icloud.com
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
$(class $HttpResponse {
    constructor(httpRsp, req, httpServer) {
        return new Promise(async (ok, fail) => {
            this._httpRsp = httpRsp;
            this._req = req;
            this._httpServer = httpServer;
            this._status = 200;
            this._headers = {};
            this._body = [];
            this._contentType = '';
            this._contentEncoding = '';
            await this.setLanguage();
            ok(this);
        });
    }

    appendBody(...args) {
        args.forEach(arg => {
            this._body.push(arg);
        });
    }
  
    language(code) {
        return this._language;
    }
  
    locale(code) {
        return this._locale;
    }
    
    respondJson(object) {
        this.setContentType('application/json');
        this.appendBody($toJson(object));
    }
    
    async respond403() {
        this.setStatus(403);
        this.setContentType('text/plain');
        this.appendBody('Forbidden');
    }
    
    async respond404() {
        this.setStatus(404);
        this.setContentType('text/plain');
        this.appendBody('Not Found');
    }
    
    async respond405() {
        this.setStatus(405);
        this.setContentType('text/plain');
        this.appendBody('Method not allowed.');
    }
    
    async respond500() {
        this.setStatus(500);
        this.setContentType('text/plain');
        this.appendBody('Internal Server Error');
    }
    
    async respondCode(code, text) {
        this.setStatus(code);
        this.setContentType('text/plain');
        this.appendBody(text);
    }
    
    async respondContent(path) {
        let content = await Cls$Content.get(path.substr(1));

        if (content.mime) {
            this.setContentType(content.mime.code);
            this.appendBody(content.data);
        }
        else {
            await this.respond404();
        }
    }
    
    async respondPage() {
        let sessionId = await Cls$Ipc.queryPrimary({messageName: '$CreateSession'});
        let sockets = {};
        let languages = [`'${$Config.language}'`];
        
        Cls$Server.getServers().forEach(server => {
            if (server.type() == 'webSocket' || (server.type() == 'http' && server.property('upgradable'))) {
                sockets[server.name()] = {
                    name: server.name(),
                    type: server.type(),
                    port: server.port(),
                };
            }
        });
        
        this.appendBody([
            `<!DOCTYPE html>`,
            `<html class="html">`,
            `    <head>`,
            `        <meta charset="utf-8">`,
            `        <link rel="stylesheet" href="STYLE?SESSION=${sessionId}">`,
            `        <script src="FRAMEWORK?SESSION=${sessionId}"></script>`,
            `        <script>`,
            `           let SESSION = '${sessionId}';`,
            `           let SOCKETS = ${$toJson(sockets)};`,
            `           let LANGUAGES = ${languages};`,
            `           function $client() {`,
            `               $.classPrefix  = 'Clss';`,
            `               $query('head').append($script($attr('src', 'APPLICATION')));`,
            `           }`,
            `        </script>`,
            `    </head>`,
            `    <body class="body colors" onload="$client()">`,
            `    </body>`,
            `</html>`
        ].join('\n'));
        
        this.setContentType('text/html');
    }
    
    async respondSignIn() {
        return this.respondPage();
    }

    async send() {
        if (this._contentEncoding) {
            this._headers['Content-Type'] = `${this._contentType}; ${this._contentEncoding}`;
        }
        else {
            this._headers['Content-Type'] = this._contentType;
        }

        this._httpRsp.writeHead(this._status, this._headers);
        this._httpRsp.end(this._body.map(item => item.toString()).join(''));
    }

    setContentEncoding(contentEncoding) {
        this._contentEncoding = contentEncoding;
    }

    setContentType(contentType) {
        this._contentType = contentType;
    }

    setHeader(name, value) {
        this._headers[name] = value;
    }
  
    async setLanguage() {
        let session = null;
        let acceptLanguages = this._req.acceptLanguage();
  
        if (this._req.sessionId()) {
            session = Cls$Ipc.queryPrimary({
                messageName: '$GetSession',
                sessionId: this._req.sessionId()
            });
        }
  
        for (let i = 0; i < acceptLanguages.length; i++) {
            let acceptLanguage = acceptLanguages[i].value;
  
            if (acceptLanguage == '*') {
                if (session) {
                    this._language = session.language;
                }
  
                return;
            }
            else {
                if ($Application.hasLanguage(acceptLanguage)) {
                    if (session && acceptLanguage == session.language) {
                        this._language = session.language;
                        return;
                    }
                    else {
                        this._language = acceptLanguage;
                        return;
                    }
                }
            }
        }
  
        this._language = $Config.language;
    }

    setStatus(httpStatus) {
        this._status = httpStatus;
    }
});
