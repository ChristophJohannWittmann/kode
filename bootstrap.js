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
    daemonPath:     PATH.join(__dirname, './server/daemons'),
    serverPath:     PATH.join(__dirname, './server/servers'),
    tempPath:       '/tmp',
    loaded:         false,
};


/*****
 * When a server is first started, we need to initialize how it will operate
 * with regards to multi organization mode.  In the kode configuration file,
 * we need to have a setting called "orgs", which is a boolean.  True indicates
 * that users will belong to organizations, whiel false indicates that the
 * server will deactive the concept of user organizations.  This code deletes
 * the setting from the configuration JSON file once the server has been
 * initialized.
*****/
async function loadOrgPreference(dbc) {
    let preference = await selectOneDboPreference(dbc, `_name='Orgs'`);

    if (!preference) {
        preference = mkDboPreference({
            name: 'Orgs',
            value: {}
        });

        await preference.save(dbc);
    }

    if (typeof preference.value.active == 'boolean') {
        env.orgs = preference.value.active;
    }
    else if (typeof Config.orgs == 'boolean') {
        env.orgs = Config.orgs;
        preference.value.active = env.orgs;
        await preference.save(dbc);
    }
    else {
        throw new Error(`Expecting single-use boolean value called "orgs" in "${env.configPath}"!`);
    }

    if ('orgs' in Config) {
        let config = await loadConfigFile();
        delete config.orgs;
        await config.save();
    }

    logPrimary(`    Server is operating in "${env.orgs ? 'Org' : 'non-Org'}" mode.`);
}


/*****
 * This function is called only when first bootstrapping a new server with an
 * empty user database.  Create a new user named Charlie Root, which will be used
 * for signing in to get things going.
*****/
async function seedUser(dbc) {
    logPrimary('[ Seeding Initial User: Charlie Root ]');

    let user = await mkUserObject({
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

    if (env.orgs) {
        await user.setGrant(dbc, { permission: 'org' });
    }

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

    if (CLUSTER.isPrimary) {
        console.log(`[ Searching Configuration Path "${env.configPath}" ]`);
    }

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

    Config.sealOff();

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
    require('./server/lib/multilingualText.js');
    require('./server/lib/darkKode.js');
    require('./server/lib/pool.js');
    require('./server/lib/server.js');
    require('./server/lib/thunk.js');
    require('./server/lib/utility.js');
    require('./server/lib/webSocket.js');
    require('./server/lib/webxStyles.js');
    require('./server/lib/webx.js');

    require('./server/dbms/dbClient.js');
    require('./server/dbms/pgClient.js');
    require('./server/dbms/dbSchema.js');
    require('./server/dbms/dbDatabase.js');
    require('./server/dbms/dbSchemaAnalyzer.js');
    require('./server/dbms/dbObject.js');

    require('./webApp/webApp.js');
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
        require('./server/daemons/webLibrary.js');
    }
    else {
        require('./server/lib/webLibrary.js');
    }

    require('./server/servers/http.js');
    await onSingletons();

    /********************************************
     * Initialize Server Boot Hash
     *******************************************/
    if (CLUSTER.isPrimary) {
        env.booted = (await Crypto.hash('sha256', Date.now().toString())).toString('base64');
        Ipc.on('##BOOTED', message => Message.reply(message, env.booted));
    }
    else {
        env.booted = await Ipc.queryPrimary({ messageName: '##BOOTED' });
    }

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

    for (let rawModulePath of Config.modules) {
        let thunk;
        let modulePath = absolutePath(PATH.parse(env.configPath).dir, rawModulePath);

        if (await pathExists(modulePath)) {
            let stats = await FILES.stat(modulePath);

            if (stats.isDirectory()) {
                let thunkPath = PATH.join(modulePath, 'thunk.js');

                if (await pathExists(thunkPath)) {
                    stats = await FILES.stat(thunkPath);

                    if (stats.isFile() && thunkPath.endsWith('.js')) {
                        thunk = await require(thunkPath)(modulePath);
                        await thunk.loadSchemas();
                    }
                    else {
                        console.log(`Error: Thunk at "${thunkPath} is not a regular javascript file."`);
                        continue;
                    }
                }
                else {
                    console.log(`Error: Path to thunk "${thunkPath} not found."`);
                    continue;
                }
            }
            else {
                console.log(`Error: Module Path "${modulePath} is not a directory."`);
                continue;
            }
        }
        else {
            console.log(`Error: Module Path "${modulePath} not found."`);
            continue;
        }
    }

    await onSingletons();

    /********************************************
     * Analyze and Upgrade Databases
     *******************************************/
    logPrimary('[ Preparing Databases ]');

    for (let dbName in Config.databases) {
        let dbSettings = Config.databases[dbName];
        let dbDatabase = mkDbDatabase(dbName, dbSettings);
    }

    if (CLUSTER.isPrimary) {
        for (dbDatabase of DbDatabase) {
            await dbDatabase.upgrade();
        }
    }

    /********************************************
     * Loading Server Preferences
     *******************************************/
     if (CLUSTER.isPrimary) {
        let dbc = await dbConnect();

        logPrimary('[ Configuring Preferences ]');
        await loadOrgPreference(dbc);

        if ((await selectDboUser(dbc)).length == 0) {
            logPrimary('[ Adding user charlie@kodeprogramming.org ]');
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
                console.log(`    (${serverName}) starting`);
                let server;
                eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
                await server.start();
                console.log(`    (${serverName}) ready`);
            }
        }

        clearBootMode();
        await onSingletons();

        logPrimary('[ Kode Application Host Ready ]');
        Ipc.sendPrimary({ messageName: '#ApplicationHostReady' });
        Ipc.sendWorkers({ messageName: '#ApplicationHostReady' });
    }
    else {
        const serverName = PROC.env.KODE_SERVER_NAME;

        if (serverName) {
            let config = Config.servers[serverName];

            if (config.active) {
                let server;
                eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
            }

            if (serverName == 'http') {
                await Webx.initialize();
                await WebApp.initialize();

                for (let thunk of Thunk.thunks) {
                    await thunk.loadServer();
                    await thunk.loadClient();
                    await thunk.loadDark();
                    await thunk.loadWebResources();
                    await thunk.loadWebExtensions();
                }
            }
        }

        if (CLUSTER.worker.id == 1 && Config.debug) {
            Ipc.on('#ApplicationHostReady', message => developmentHook());
        }

        await onSingletons();
    }
})();


/*****
 * The startup hook function is here development and test.  Sometimes, it's easy
 * to try out a new class or feature rigth after the server has started and has
 * been fully loaded and initialized.  That's the purpose of this function. It's
 * easiest to simply place a return as the first line of code to ensure that this
 * hook is disabled.
*****/
async function developmentHook() {
    let dbc = await dbConnect();

    /*
    let user = await Users.get(dbc, 1n);
    await user.setGrant(dbc, { permission: 'template' });
    */

    /*
    let link = await mkLink(dbc, {
        reason: 'test',
        limit: 4,
        expires: mkTime(2023, 2, 28),
        action: {
            type: 'redirect',
            url: 'http://google.com',
        }
    });
    console.log(link);
    */

    /*
    setTimeout(async () => {
        let dbc = await dbConnect();

        let response = await Ipc.queryPrimary({
            messageName: '#EmailSpoolerSpool',
            bulk: false,
            reason: 'ResetPassword',
            reasonType: 'DboUser',
            reasonOid: 4743n,
            from: { addr: 'charlie@infosearchtest.com', name: 'Charlie Root' },
            subject: 'Welcome back my friends.',
            to: { addr: 'chris.wittmann@icloud.com', name: 'Christoph Wittmann' },
            text: 'TEST MESSAGE!',
        });

        await dbc.commit();
        await dbc.free();

        console.log(response);
    }, 1000);
    */

    /*
    let url = '/test/url/dog';
    let hook = mkWebBlob(url, 'text/plain', 'Hello Value');
    await hook.register(true);

    setTimeout(async () => {
        console.log(`awaiting ${url}`);
        await Ipc.queryPrimary({ messageName: '#WebLibraryWait', url: url });
        console.log('ACCEPTED');
        hook.deregister();
    }, 100);
    */

    await dbc.commit();
    await dbc.free();
}
