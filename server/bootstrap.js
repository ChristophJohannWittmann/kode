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
require('../framework/core.js');
require('../framework/activeData.js');
require('../framework/language.js');
require('../framework/message.js');
require('../framework/mime.js');
require('../framework/stringSet.js');
require('../framework/textTemplate.js');
require('../framework/time.js');
require('../framework/utility.js');
require('../framework/calendars/gregorian.js');
require('./lib/binary.js');


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
global.npmPG        = require('pg');
global.npmGZIP      = require('node-gzip');


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
    kodePath:       PATH.join(__dirname, '..'),
    addonPath:      PATH.join(__dirname, './addons'),
    nodeModulePath: PATH.join(__dirname, '../node_modules'),
    modulePath:     PATH.join(__dirname, '../modules'),
    daemonPath:     PATH.join(__dirname, './daemons'),
    serverPath:     PATH.join(__dirname, './servers'),
};


/*****
 * This is the code that bootstraps the server and this is the entry point into
 * the kode application server.  The kode framework is NOT an application.  It's
 * a framework that loads in modules.  A module represents a namespace and some
 * code.  The module's code is automatically integrated into the running server
 * by responding to HTTP, websocker requests, and other server-bases requests.
 * 
 * Here's what happens in order:
 *     (1)  Load and import addons, build if necessary
 *     (2)  Load and import builtin modules
 *     (3)  Load and import user modules
 *     (4)  Start workers (primary only)
 *     (5)  Start daemons (primary only)
 *     (6)  Start servers (primary only)
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

    require('./lib/utility.js');
    require('./lib/config.js');
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
    require('./lib/addon.js');
    require('./lib/auth.js');
    require('./lib/cluster.js');
    require('./lib/compression.js');
    require('./lib/crypto.js');
    require('./lib/html.js');
    require('./lib/ipc.js');
    require('./lib/logging.js');
    require('./lib/module.js');
    require('./lib/moduleConfig.js');
    require('./lib/pool.js');
    require('./lib/server.js');
    require('./lib/utility.js');
    require('./lib/resource.js');
    require('./lib/webExtension.js');
    require('./lib/webSocket.js');

    require('./dbms/dbClient.js');
    require('./dbms/pgClient.js');
    require('./dbms/dbSchema.js');
    require('./dbms/dbDatabase.js');
    require('./dbms/dbSchemaAnalyzer.js');
    require('./dbms/dbObject.js');

    require('./webExtensions/clientFramework.js');
    require('./webExtensions/clientLibraryBuilder.js');
    require('./webExtensions/webApp.js');
    require('./webExtensions/webAppEndpoints.js');

    if (CLUSTER.isPrimary) {
        require('./lib/daemon.js');
        require('./daemons/events.js');
        require('./daemons/sentinel.js');
    }

    require('./servers/http.js');

    await onSingletons();

    /********************************************
     * Load Addons
     *******************************************/
    logPrimary('[ Loading Addons ]');
    Config.addonMap = {};
    Config.addonArray = [];

    for (let entry of await FILES.readdir(env.addonPath)) {
        if (!entry.startsWith('.') && !entry.startsWith('apiV')) {
            let addonPath = PATH.join(env.addonPath, entry);
            let addon = mkAddon(addonPath);
            await addon.load();
            logPrimary(`    ${addon.info()}`);
        }
    }

    await onSingletons();

    /********************************************
     * Load Modules
     *******************************************/
    logPrimary('[ Loading Modules ]');
    require('./dbms/frameworkSchema.js');

    Config.moduleMap = {};
    Config.moduleArray = [];

    async function loadModule(modulePath) {
        let module = mkModule(modulePath);
        logPrimary(`    ${module.getInfo()}`);
        await module.load();

        if (module.getStatus() == 'ok') {
            await module.loadConfig();

            if (module.status == 'ok') {
                await module.loadReferences();
                Config.moduleArray.push(module);
                Config.moduleMap[module.getContainer()] = module;
            }
        }

        if (module.getStatus() == 'fail') {
            logPrimary(module.getDiagnostic());
            module.erase();
        }

        return module;
    }
 
    for (let entry of await FILES.readdir(env.modulePath)) {
        if (!entry.startsWith('.')) {
            await loadModule(PATH.join(env.modulePath, entry));
        }
    }

    await onSingletons();

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
            }
        }

        clearBootMode();
        logPrimary('[ Kode Application Server Ready ]');
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
    }

    await onSingletons();
})();
