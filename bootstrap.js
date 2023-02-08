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
'use-strict';


/*****
 * Require the core framework files.  Keep in mind that the framework files are
 * the same on both the client and server.  The framework code provides very
 * general features that are both (a) utilities, and (b) functions and classes
 * that shape the way code is written and structured.
*****/
global.CLUSTER = require('cluster');
if (CLUSTER.isPrimary) console.log(`\n[ Booting Server at ${(new Date()).toISOString()} ]`);
if (CLUSTER.isPrimary) console.log(`[ Loading Framework ]`);
require('./framework/core.js');
require('./framework/activeData.js');
require('./framework/context.js');
require('./framework/languages.js');
require('./framework/message.js');
require('./framework/mime.js');
require('./framework/stringSet.js');
require('./framework/textTemplate.js');
require('./framework/time.js');
require('./framework/utility.js');


/*****
 * NodeJS module inclusions are here.  Contrary to the standard approach for
 * inclusion of node modules, we elected to centralized and globalize the
 * required modules using all caps to signify that the required modules is a
 * NodeJS builtin module.
*****/
if (CLUSTER.isPrimary) console.log(`[ Loading nodeJS Modules ]`);
global.BUFFER    = require('buffer').Buffer;
global.CHILDPROC = require('child_process');
global.CRYPTO    = require('crypto');
global.DNS       = require('dns');
global.FILES     = require('fs').promises;
global.FS        = require('fs');
global.HTTP      = require('http');
global.HTTPS     = require('https');
global.NET       = require('net');
global.OS        = require('os');
global.PATH      = require('path');
global.PROC      = require('process');
global.URL       = require('url');


if (CLUSTER.isPrimary) console.log(`[ Loading NPM Modules ]`);
/*****
 * Imported NPM Modules, which are enumerated in the package.json directory
 * for the framework.
*****/
global.npmCssMinifier       = require('clean-css');
global.npmGZIP              = require('node-gzip');
global.npmMailGun           = require('mailgun-js');
global.npmHtmlMinifier      = require('html-minifier');
global.npmJsMinifier        = require('terser');
global.npmPemJwk            = require('pem-jwk');
global.npmPG                = require('pg');


/*****
 * The server's (i.e., physical or logical host) runtime environment.  Theese
 * items are mostly used by the server-side infrastructure code, but have other
 * uses throughout the loaded modules and applciations.
*****/
if (CLUSTER.isPrimary) console.log(`[ Building "global.env" ]`);
global.env = {
    arch:           OS.arch(),
    cpus:           OS.cpus().length,
    endianness:     OS.endianness(),
    platform:       OS.platform(),
    eol:            OS.EOL,
    release:        OS.release(),
    version:        OS.version(),
    tempdir:        OS.tmpdir(),
    hostname:       OS.hostname(),
    network:        OS.networkInterfaces(),
    memory:         ({ free: OS.freemem(), total: OS.totalmem() }),
    pid:            PROC.pid,
    kodePath:       PATH.join(__dirname, '.'),
    modulePath:     PATH.join(__dirname, './modules'),
    daemonPath:     PATH.join(__dirname, './server/daemons'),
    serverPath:     PATH.join(__dirname, './server/servers'),
    tempPath:       '/tmp',
};


/*****
 * This function is called only when first bootstrapping a new server with an
 * empty user database.  Create a new user named Charlie Root, which will be used
 * for signing in to get things going.
*****/
async function seedUser(dbc) {
    logPrimary('[ Seeding Initial User: Charlie Root ]');

    let user = await mkUserObject({
        userName: 'charlie@domain.org',
        firstName: 'Charlie',
        lastName: 'Root',
        status: 'active',
        authType: 'simple',
        verified: true,
        password: true,
    }).save(dbc);

    await user.setPassword(dbc, 'password');
    await user.setGrant(dbc, { permission: 'user' });
    await user.setGrant(dbc, { permission: 'system' });

    let domain = await mkDboDomain({
        name: 'kodeprogramming.org',
        tld: 'org',
        verified: false,
        lastVerified: mkTime(0),
        error: '',
    }).save(dbc);

    let email = await mkDboEmailAddress({
        ownerType: 'DboUser',
        ownerOid: user.oid,
        domainOid: domain.oid,
        user: 'charlie',
        addr: 'charlie@kodeprogramming.org',
        verified: false,
        lastVerified: mkTime(0),
        lastDelivered: mkTime(0),
        error: '',
    }).save(dbc);

    user.emailOid = email.oid;
    await user.save(dbc);
}


/*****
 * This is the code that bootstraps the server and this is the entry point into
 * the kode application server.  The kode framework is NOT an application.  It's
 * a framework that loads in modules.  A module represents a namespace and some
 * code.  The module's code is automatically integrated into the running server
 * by responding to HTTP, websocker requests, and other server-bases requests.
 * 
 * Here's what happens in order:
 *     (1)  Load and import builtin modules
 *     (2)  Load and import user modules
 *     (3)  Start workers (primary only)
 *     (4)  Start daemons (primary only)
 *     (5)  Start servers (primary only)
 * 
 * Once this function is exited, the application will continue to execute until
 * instructed to stop with a system-wide #Stop message.
*****/
(async () => {
    /********************************************
     * Validating Configuration
     *******************************************/
    if (PATH.isAbsolute(PROC.argv[2])) {
        env.configPath = PROC.argv[2];
    }
    else {
        env.configPath = PATH.join(__dirname, '..', PROC.argv[2]);
    }

    if (CLUSTER.isPrimary) console.log(`[ Searching Configuration Path "${env.configPath}" ]`);

    require('./server/lib/utility.js');
    require('./server/lib/config.js');
    const searchResult = await Config.loadSystem();

    if (searchResult === true) {
        if (CLUSTER.isPrimary) console.log(`    (ok      ) Server configuration successfully loaded.`);
    }
    else {
        if (CLUSTER.isPrimary) console.log(`    (config  ) ${searchResult}`);
        PROC.exit(-1);
    }

    /********************************************
     * Infrastructure Code
     *******************************************/
    if (CLUSTER.isPrimary) (`[ Loading Server Infrastructure ]`);
    require('./server/lib/clientBuilder.js');
    require('./server/lib/cluster.js');
    require('./server/lib/compression.js');
    require('./server/lib/crypto.js');
    require('./server/lib/html.js');
    require('./server/lib/ipc.js');
    require('./server/lib/logging.js');
    require('./server/lib/module.js');
    require('./server/lib/multilingualText.js');
    require('./server/lib/pool.js');
    require('./server/lib/server.js');
    require('./server/lib/utility.js');
    require('./server/lib/webSocket.js');
    require('./server/lib/webx.js');

    require('./server/dbms/dbClient.js');
    require('./server/dbms/pgClient.js');
    require('./server/dbms/dbSchema.js');
    require('./server/dbms/dbDatabase.js');
    require('./server/dbms/dbSchemaAnalyzer.js');
    require('./server/dbms/dbObject.js');

    require('./webApp/webApp.js');
    require('./webApp/webAppText.js');
    require('./webApp/lib/endpoint.js');
    require('./webApp/lib/configEndpoints.js');
    require('./webApp/lib/dbmsEndpoints.js');
    require('./webApp/lib/messagingEndpoints.js');
    require('./webApp/lib/orgEndpoints.js');
    require('./webApp/lib/publicEndpoints.js');
    require('./webApp/lib/selfEndpoints.js');
    require('./webApp/lib/systemEndpoints.js');
    require('./webApp/lib/templateEndpoints.js');
    require('./webApp/lib/ticketEndpoints.js');
    require('./webApp/lib/userEndpoints.js');
    require('./webApp/lib/transaction.js');

    if (CLUSTER.isPrimary) {
        require('./server/lib/daemon.js');
        require('./server/lib/session.js');
        require('./server/daemons/dns.js');
        require('./server/daemons/events.js');
        require('./server/daemons/session.js');
        require('./server/daemons/emailSpooler.js');
    }
    else {
        require('./server/lib/resource.js');
    }

    require('./server/servers/http.js');
    await onSingletons();

    /********************************************
     * Initialize Server Boot Hash
     *******************************************/
    env.booted = (await Crypto.hash('sha256', Date.now().toString())).toString('base64');

    /********************************************
     * Load Objects
     *******************************************/
    logPrimary('[ Loading Framework Object API ]');
    require('./server/lib/schema.js');

    for (let filePath of await recurseFiles(PATH.join(env.kodePath, 'server/obj'))) {
        if (filePath.endsWith('.js')) {
            require(filePath);
        }
    }

    await onSingletons();

    /********************************************
     * Load Modules
     *******************************************/
    logPrimary('[ Loading Modules ]');

    Config.moduleMap = {};
    Config.moduleArray = [];

    async function loadModule(modulePath) {
        let module = mkModule(modulePath);
        await module.load();

        if (module.getStatus() == 'ok') {
            await module.loadConfig();

            if (module.status == 'ok') {
                await module.loadReferences();
                Config.moduleArray.push(module);
                Config.moduleMap[module.getContainer()] = module;
                logPrimary(`    ${module.getInfo()}`);
            }
        }

        if (module.getStatus() == 'fail') {
            logPrimary(`    ${module.getInfo()}`);
            logPrimary(module.getDiagnostic());
            module.erase();
        }

        return module;
    }

    await loadModule('#BUILTIN');

    for (let modulePath of Config.modules) {
        await loadModule(absolutePath(env.configPath, modulePath));
    }

    await onSingletons();
    Config.sealOff();

    /********************************************
     * Analyze and Upgrade Databases
     *******************************************/
    logPrimary('[ Preparing Databases ]');

    if (CLUSTER.isPrimary) {
        for (let db of DbDatabase) {
            let dups = db.checkDuplicates().duplicates;

            if (dups.length() == 0) {
                if (db.checkSettings()) {
                    await db.upgrade();
                }
            }
            else {
                for (let dup of dups) {
                    logPrimary(`    (duptable) Duplicate database table: "${dup}"" in database "${db.name}"`);
                }
            }
        }

        let dbc = await dbConnect();

        if ((await dbc.query(`SELECT COUNT(*) FROM _user`)).data[0].count == 0) {
            await seedUser(dbc);
        }

        await dbc.commit();
        await dbc.free();
    }

    /********************************************
     * Start Servers
     *******************************************/
    if (CLUSTER.isPrimary) {
        logPrimary('[ Starting Servers ]');

        for (let serverName in Config.servers) {
            let config = Config.servers[serverName];

            if (config.active) {
                let server;
                eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
                await server.start();
                Ipc.sendPrimary({ messageName: `#ServerReady:${serverName}` });
                Ipc.sendWorkers({ messageName: `#ServerReady:${serverName}` });
            }
        }

        clearBootMode();
        await onSingletons();

        logPrimary('[ Kode Application Server Ready ]');
        Ipc.sendPrimary({ messageName: '#ServerReady' });
        Ipc.sendWorkers({ messageName: '#ServerReady' });
        // **********************************************************************************
        // **********************************************************************************
        if (false) {
            let dbc = await dbConnect();

            if (false) {
                let msg = await mkEmailMessage(dbc, 1n);
                console.log(msg.getOtherRecipients());
            }
            else if (false) {
                let msg = await mkEmailMessage(dbc, {
                    category: 'smtpsend',
                    bulk: false,
                    reason: '/ResetPassword/DboUser/4743',
                    from: 'charlie@kodeprogramming.org',
                    subject: 'Welcome back my friends.',
                    to: [
                        'chris.wittmann@icloud.com',
                        'chris.wittmann@infosearch.online',
                    ],
                    text: 'hello email message',
                    html: `<!DOCTYPE html>
                    <html>
                        <head>
                        </head>
                        <body>
                            <h1>My Email Message</h1>
                        </body>
                    </html>
                    `
                });
                console.log(msg);
            }
            else if (false) {
                setTimeout(async () => {
                let response = await Ipc.queryPrimary({
                    messageName: '#EmailSpoolerSpool',
                    bulk: false,
                    reason: '/ResetPassword/DboUser/4743',
                    from: { addr: 'charlie@infosearchtest.com', name: 'Charlie Root' },
                    subject: 'Welcome back my friends.',
                    to: { addr: 'chris.wittmann@icloud.com', name: 'Zoolander' },
                    text: 'TEST MESSAGE!',
                });
                console.log(response);
                }, 1000);
            }
            else if (true) {
                let content =
`--abcd123\r
Content-Disposition: form-data; name="hello world"\r
\r
Here I go awain on my own.
--abcd123\r
Content-Disposition: form-data; name="another one"\r
Content-type: text/html; charset=utf-8\r
\r
Another time again.
--abcd123\r
Content-Disposition: form-data; name="diversionary"\r
\r
DIVERSIONARY!
--abcd123\r
`;

                let formData = parseMultipartFormData(content, 'abcd123');
                console.log(formData);
            }

            await dbc.rollback();
            await dbc.free();
        }
        if (false) {
            setTimeout(async () => {
                let response = await Ipc.query({
                    messageName: '#DnsResolveMx',
                    domain: 'infosearchtest.com',
                });

                console.log(response);
            }, 1000);
        }
        // **********************************************************************************
        // **********************************************************************************
    }
    else {
        const serverName = PROC.env.KODE_SERVER_NAME;

        if (serverName) {
            let config = Config.servers[serverName];

            if (config.active) {
                let server;
                eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
            }
        }

        await onSingletons();
    }
})();
