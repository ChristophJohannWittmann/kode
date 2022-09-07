/**
 */


/**
 */
$(class $HttpServer extends Cls$Server {
    constructor(config) {
        super(config);
        this._handlerId = 1;
        this._GETHandlers = [];
        Cls$HttpHandler._builtInHandlers.forEach(handler => this.setHandler(...handler));
    }
  
    checkFilters(req, filters) {
        if (filters && Array.isArray(filters)) {
            for (let i = 0; j < filters.length; i++) {
                let filter = filters[i];
  
                if (!filter(req)) {
                    return false;
                }
            }
        }
  
        return true;
    }
  
    checkPaths(req, paths) {
        if (paths && Array.isArray(paths)) {
            for (let i = 0; i < paths.length; i++) {
                let path = paths[i];
                let match = req.path().match(path);
  
                if (match) {
                    return true;
                }
            }
  
            return false;
        }
  
        return true;
    }
  
    async handleGET(req, rsp) {
        for (let i = 0; i < this._GETHandlers.length; i++) {
            let handler = this._GETHandlers[i];

            try {
                if (this.checkPaths(req, handler.criteria().paths)) {
                    if (this.checkFilters(req, handler.criteria().filters)) {
                        if (await Cls$Ipc.queryPrimary({
                            messageName: '$Authorize',
                            sessionId: req.sessionId(),
                            authorizations: handler.criteria().auths,
                        })) {
                            await handler.execute(req, rsp);
                            return;
                        }
                        else {
                            await rsp.respond403();
                            return;
                        }
                    }
                }
            }
            catch (e) {
                $log(e);
                await rsp.respond500();
                return;
            }
        }

        await rsp.respond404();
    }
  
    async handlePOST(req, rsp) {
        try {
            await req.loadMessageBody();
        }
        catch (e) {
            await rsp.respond403();
            return;
        }
  
        let message = $fromJson(req.body());

        try {
            let reply = await Cls$MessageHandler.query(message, req.sessionId());

            if (reply === 'ignored') {
                rsp.setStatus(200);
                rsp.setContentType('application/json');
                rsp.appendBody('{}');
                return;
            }
            else if (reply === 'unauthorized') {
                rsp.setStatus(403);
                rsp.setContentType('application/json');
                rsp.appendBody('{ "error": "Unauthorized" }');
                return;
            }
            else {
                rsp.setStatus(200);
                rsp.setContentType('application/json');
                rsp.appendBody($toJson(reply));
                return;
            }
        }
        catch (e) {
            $log(e);
            await rsp.respond500();
            return;
        }

        await rsp.respond404();
    }
  
    async handleRequest(httpReq, httpRsp) {
        let req = await $HttpRequest(httpReq, this);
        let rsp = await $HttpResponse(httpRsp, req, this);
  
        const handlers = {
            GET:  async () => await this.handleGET(req, rsp),
            POST: async () => await this.handlePOST(req, rsp),
        };
  
        let handler = handlers[req.method()];
  
        if (handler) {
            await handler();
            rsp.send();
        }
        else {
            await rsp.respond405();
            rsp.send();
        }
    }
  
    removeHandler(handler) {
        if (handler.method == 'GET') {
            if (handler instanceof $HttpHandler) {
                var id = handler._id;
            }
            else {
                var id = handler;
            }
  
            for (let i = 0; i < this._GETHandlers.length; i++) {
                let handler = this._GETHandlers[i];
  
                if (handler._id === id) {
                    handlers.splice(i, 1);
                    break;
                }
            }
        }
    }
  
    setHandler(criteria, handler) {
        if (criteria.method == 'GET') {
            let httpHandler = $HttpHandler(this, criteria, handler);
            httpHandler._id = this._handlerId++;
            this._GETHandlers.push(httpHandler);
            return httpHandler;
        }
    }
  
    async startPrimary() {
    }
  
    async startWorker() {
        let crypto = this.crypto();
  
        if (crypto) {
            this._nodeHttpServer = Https.createServer({
                key: crypto.pemPrivate,
                cert: crypto.pemCert,
                ca: crypto.pemCA,
            }, (req, rsp) => this.handleRequest(req, rsp));
        }
        else {
            this._nodeHttpServer = Http.createServer((req, rsp) => this.handleRequest(req, rsp));
        }
  
        this._nodeHttpServer.listen(this.port(), this.addr());
  
        this._nodeHttpServer.on('upgrade', async (req, socket, headPacket) => {
            let secureKey = req.headers['sec-websocket-key'];
            let hash = await Cls$Crypto.digest('sha1', `${secureKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`);
            let webSocket = $WebSocket(socket, req.headers['sec-websocket-extensions'], headPacket);
            
            let headers = [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: upgrade',
                `Sec-WebSocket-Accept: ${hash}`,
                '\r\n'
            ];
  
            if (webSocket.secWebSocketExtensions()) {
                headers.append(`Sec-WebSocket-Extensions: ${webSocket.secWebSocketExtensions()}`);
            }
        
            socket.write(headers.join('\r\n'));
        });
    }
});


/**
 */
$(class $HttpHandler {
    static _builtInHandlers = [
        [{
            method: 'GET',
            paths: ['^/FRAMEWORK|/APPLICATION$'],
            auths: $Set('$Session'),
        }, async (req, rsp) => {
            let content = await Cls$Content.get(req.path().substr(1));
            rsp.setContentType(content.mime);
            rsp.appendBody(content.data);
        }],
        
        [{
            method: 'GET',
            paths: ['^/STYLE$'],
            auths: $Set('$Session'),
        }, async (req, rsp) => {
            rsp.setContentType('text/css');
            rsp.appendBody($FMWKSTYLESHEET);
        }]
    ];

    constructor(httpServer, criteria, handler) {
        this._httpServer = httpServer;

        if (typeof handler == 'function') {
            this._handler = handler;
        }
        else {
            eval(['this._handler=', handler].join(''));
        }

        this._criteria = {
            method: criteria.method,
            paths: [],
            auths: criteria.auths
        };

        if ('paths' in criteria) {
            for (let i = 0; i < criteria.paths.length; i++) {
                let path = criteria.paths[i];

                if (path instanceof RegExp) {
                    this._criteria.paths.push(path);
                }
                else {
                    try {
                        let regex = new RegExp(path);
                        this._criteria.paths.push(regex);
                    }
                    catch (e) {
                        log(`Unable to compile ${path} as regular expression!`);
                    }
                }
            }
        }
    }
  
    criteria() {
        return this._criteria;
    }

    async execute(req, rsp) {
        await this._handler(req, rsp);
    }
});


/**
 */
$(class $HttpRequest {
    constructor(httpReq, httpServer) {
        return new Promise(async (ok, fail) => {
            this._httpReq = httpReq;
            this._httpServer = httpServer;
            this._httpMethod = httpReq.method;
            this._httpHeaders = httpReq.headers;
            this._body = {mime: 'text/plain', type: 'error', value: 'GET request has no body.'};
            this._params = {};
            this._message = {};
            this._sessionId = '';

            if (this._httpMethod == 'GET') {
                let iterator = this.url().searchParams.entries();

                for (let param = iterator.next(); !param.done; param = iterator.next()) {
                    this._params[param.value[0]] = param.value[1];

                    if (param.value[0] == 'SESSION') {
                        this._sessionId = param.value[1].toString().replace(/ /g, '+');
                    }
                }
            }
            
            ok(this);
        });
    }
  
    _accept(headerName) {
        let items = {};
        let value = this.header(headerName);

        if (value) {
            value.split(',').forEach(item => {
                let [ value, quality ] = item.split(';');
                
                items[value] = {
                    value: value,
                    quality: quality ? parseFloat(quality.substr(2)) : 0
                };
            });
        }

        return items;
    }

    accept() {
        return this._accept('accept');
    }

    acceptEncoding() {
        return this._accept('accept-encoding');
    }
  
    acceptLanguage() {
        return this._accept('accept-language');
    }

    body() {
        return this._body.value;
    }

    contentFormat() {
        return this._body.type;
    }

    contentType() {
        return this._body.mime;
    }

    header(name) {
        let headerName = name.toLowerCase();

        if (headerName in this._httpHeaders) {
            return this._httpHeaders[name.toLowerCase()];
        }

        return '';
    }

    headers() {
        return this._httpHeaders;
    }

    host() {
        return this.header('host');
    }
  
    language() {
        return this._language;
    }
  
    locale() {
        return this._locale;
    }

    async loadMessageBody() {
        return new Promise((ok, fail) => {
            let size = 0;
            let chunks = [];
            
            this._httpReq.on('data', data => {
                size += data.length;
                
                if (size > 100000000) {
                    this._body = {
                        mime: 'text/plain',
                        type: 'error',
                        value: 'Incoming reqest body exceeds allowable length.'
                    };
                    
                    ok();
                }
                else {
                    chunks.push(data);
                }
            });
            
            this._httpReq.on('end', () => {
                let mimeCode = this.header('content-type');
                let mime = Cls$Mime.fromMimeCode(mimeCode);
                
                if (mime.type == 'binary') {
                    this._body = {
                        mime: mime.code,
                        type: 'binary',
                        value: Buffer.concat(chunks)
                    };
                }
                else {
                    this._body = {
                        mime: mime.code,
                        type: 'text',
                        value: chunks.map(chunk => chunk.toString()).join('')
                    };
                }
                
                if (mimeCode == 'application/json') {
                    this._message = $fromJson(this._body.value);
                    this._sessionId = this._message.$sessionId;
                    delete this._message.$session;
                }
                
                ok();
            });
        });
    }

    message() {
        return this._message;
    }

    method() {
        return this._httpMethod;
    }

    param(name) {
        if (name in this._params) {
            return this._params[name];
        }
    }

    path() {
        return this.url().pathname;
    }

    protocol() {
        return this._httpServer.tls() ? 'https' : 'http';
    }

    sessionId() {
        return this._sessionId;
    }

    tls() {
        return this._httpServer.tls();
    }

    url() {
        if (this.header('host')) {
            return new URL.URL(`${this.protocol()}://${this.header('host')}${this._httpReq.url}`);
        }
        else {
            return new URL.URL(`${this.protocol()}://NOHOST${this._httpReq.url}`);
        }
    }

    userAgent() {
        return this.header('user-agent');
    }
});


/**
 */
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
