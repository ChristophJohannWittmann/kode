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
require('../framework/core.js');
require('../framework/activeData.js');
require('../framework/language.js');
require('../framework/message.js');
require('../framework/mime.js');
require('../framework/set.js');
require('../framework/textTemplate.js');
require('../framework/time.js');
require('../framework/calendars/gregorian.js');
require('../framework/utility.js');


/*****
 * NodeJS module inclusions are here.  Contrary to the standard approach for
 * inclusion of node modules, we elected to centralized and globalize the
 * required modules using all caps to signify that the required modules is a
 * NodeJS builtin module.
*****/
global.BUFFER    = require('buffer').Buffer;
global.CHILDPROC = require('child_process');
global.CLUSTER   = require('cluster');
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
 * In order to properly analyze a DBMS schema, we need to wait until we have
 * all of the modules registered so we know what tables are associated with
 * what DBMS connections. (1) Iterate through the loaded modules and generate
 * the configMap.  The configMap shows all expected schemas (tables) on each
 * defined DBMS connection.  (2) Perform a deep DBMS analysis on each of the
 * defined DBMS connections to determine differences between the design and
 * the actual schemas.  The startup behavior is to executed upgrade diffs only.
 * Downgrads can be left waiting for manual DBMS maintenance.
*****/
async function prepareDbms() {
    let configMap = {};

    for (let schemaName in Config.schemas) {
        let configName = Config.schemas[schemaName];

        if (configName in configMap) {
            configMap[configName].set(schemaName);
        }
        else {
            configMap[configName] = mkSet(schemaName);
        }
    }

    for (let configName in configMap) {
        let settings = Config.databases[configName];
        let tableMap = {};

        for (let schemaName of configMap[configName].array()) {
            let schema = DbSchema.schemas[schemaName];

            for (let tableDef of schema.tableArray) {
                if (tableDef.name in tableMap) {
                    throw new Error(`Duplicate table name DBMS: "${configName}" TABLE: "${tableDef.name}"`);
                }

                tableMap[tableDef.name] = tableDef;
            }
        }

        for (let diff of (await mkDbSchemaAnalyzer(configName, tableMap)).diffs) {
            logPrimary(`    ${diff.toString()}`);

            if (diff.isUpgrade) {
                await diff.upgrade();
            }
        }
    }
}


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
    require('./config.js');
    require('./lib/utility.js');
    require('./lib/logging.js');
    await Config.loadSystem(env.kodePath);
    logPrimary(`\n[ Booting Server at ${(new Date()).toISOString()} ]`);

    require('./lib/addon.js');
    require('./lib/auth.js');
    require('./lib/binary.js');
    require('./lib/cluster.js');
    require('./lib/compression.js');
    require('./lib/crypto.js');
    require('./lib/html.js');
    require('./lib/ipc.js');
    require('./lib/module.js');
    require('./lib/pool.js');
    require('./lib/server.js');
    require('./lib/utility.js');
    require('./lib/resource.js');
    require('./lib/webExtension.js');
    require('./lib/webSocket.js');

    require('./dbms/dbClient.js');
    require('./dbms/pgClient.js');
    require('./dbms/dbSchema.js');
    require('./dbms/dbSchemaAnalyzer.js');
    require('./dbms/dbObject.js');

    require('./webExtensions/clientFramework.js');
    require('./webExtensions/webApp.js');

    if (CLUSTER.isPrimary) {
        require('./lib/daemon.js');
        require('./daemons/events.js');
        require('./daemons/sentinel.js');
    }

    require('./servers/http.js');
 
    await onSingletons();
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
    require('./dbms/dbSchemas.js');
    namespace();
 
    logPrimary('[ Loading Modules ]');
    Config.moduleMap = {};
    Config.moduleArray = [];
 
    for (let entry of await FILES.readdir(env.modulePath)) {
        if (!entry.startsWith('.')) {
            let modulePath = PATH.join(env.modulePath, entry);
            let module = mkModule(modulePath);
            await module.load();
            logPrimary(`    ${module.info()}`);
        }
    }

    await onSingletons(); 

    for (let modulePath of Config.modules) {
        let module = mkModule(modulePath);
        await module.load();
        logPrimary(`    ${module.info()}`);
    }

    await onSingletons();
    Config.sealOff();

    if (CLUSTER.isPrimary) {
        logPrimary('[ Preparing DBMS API ]');
        await prepareDbms();
    }

    if (CLUSTER.isPrimary) {
        logPrimary('[ Starting Servers ]');

        for (let serverName in Config.servers) {
            let server;
            let config = Config.servers[serverName];
            eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
            await server.start();
        }

        logPrimary('[ Kode Application Server Ready ]\n');
    }
    else {
        const serverName = PROC.env.KODE_SERVER_NAME;

        if (serverName) {
            let server;
            let config = Config.servers[serverName];
            eval(`server = mk${config.type}(${toJson(config)}, '${serverName}');`);
        }
    }

    await onSingletons();
})();
