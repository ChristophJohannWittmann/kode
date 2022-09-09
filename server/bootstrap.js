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
'use-strict';


/*****
 * Require the core framework files.  Keep in mind that the framework files are
 * the same on both the client and server.  The framework code provides very
 * general features that are both (a) utilities, and (b) functions and classes
 * that shape the way code is written and structured.
*****/
require('../framework/core.js');
require('../framework/activeData.js');
require('../framework/message.js');
require('../framework/mime.js');
require('../framework/set.js');
require('../framework/time.js');
require('../framework/calendars/gregorian.js');
require('../framework/utility.js');


/*****
 * NodeJS module inclusions are here.  Contrary to the standard approach for
 * inclusion of node modules, we elected to centralized and globalize the
 * required modules using all caps to signify that the required modules is a
 * NodeJS builtin module.
*****/
global.BUFFER    = require('buffer').Buffer,
global.CHILDPROC = require('child_process'),
global.CLUSTER   = require('cluster'),
global.CRYPTO    = require('crypto'),
global.FILES     = require('fs').promises,
global.FS        = require('fs'),
global.HTTP      = require('http'),
global.HTTPS     = require('https'),
global.NET       = require('net'),
global.OS        = require('os'),
global.PATH      = require('path'),
global.PROC      = require('process'),
global.URL       = require('url'),


/*****
 * The server's (i.e., physical or logical host) runtime environment.  Theese
 * items are mostly used by the server-side infrastructure code, but have other
 * uses throughout the loaded modules and applciations.
*****/
global.env = {
    arch:       OS.arch(),
    cpus:       OS.cpus().length,
    endianness: OS.endianness(),
    platform:   OS.platform(),
    eol:        OS.EOL,
    release:    OS.release(),
    version:    OS.version(),
    tempdir:    OS.tmpdir(),
    hostname:   OS.hostname(),
    network:    OS.networkInterfaces(),
    memory:     ({ free: OS.freemem(), total: OS.totalmem() }),
    kodepath:   PATH.join(__dirname, '..'),
    modpath:    PATH.join(__dirname, '../modules'),
    addonpath:  PATH.join(__dirname, '../addons'),
};


/*****
 * Include the code in the /server project directory.  Like other kode code,
 * each nodejs module will place the appropriate names into the global namespace.
*****/
require('./config.js');
require('./buffer.js');
require('./cluster.js');
require('./content.js');
require('./crypto.js');
require('./daemon.js');
require('./ipc.js');
require('./logging.js');
require('./pool.js');
require('./sentinel.js');
require('./server.js');
require('./utility.js');
require('./addon.js');
require('./module.js');


/*****
*****/
async function startDaemons() {
    if (CLUSTER.isPrimary) {
    }
}


/*****
*****/
async function startServers() {
    if (CLUSTER.isPrimary) {
    }
}


/*****
 * Start the server workers as specified in the server's config.json file.  If
 * a valid numeric value is provided on the configuration file, start that worker
 * count.  If that setting is missing or somehow invalid, just start as many
 * workers as we have.  The beauty of this code is that the primary will await
 * the promise to be fulfilled until all of the workers are ready and signalled
 * the primary that they are ready.
*****/
function startWorkers() {
    return new Promise((ok, fail) => {
        if (CLUSTER.isPrimary) {
            let workers;
            let started = 0;
            
            if (typeof Config.workers == 'number' && Config.workers > 0 && Config.workers <= env.cpus) {
                workers = Config.workers <= env.cpus ? Config.workers : env.cpus;
            }
            else {
                workers = env.cpus;
            }
            
            Ipc.on('#WorkerStarted', message => {
                started++;
                
                if (started == workers) {
                    if (started > 1) {
                        log(`[ ${started} Workers Started ]`);
                    }
                    else {
                        log('[ Worker Started ]');
                    }

                    ok();
                }
            });
        
            for (let i = 0; i < workers; i++) {
                CLUSTER.fork();
            }
        }
        else {
            Ipc.sendPrimary({ messageName: '#WorkerStarted' });
            ok();
        }
    });
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
    logPrimary(`\n[ Booting Server at ${(new Date()).toISOString()} ]`);
    await onSingletons();
    await Config.loadSystem(env.kodepath);

    logPrimary('[ Loading Addons ]');
    Config.addonMap = {};
    Config.addonArray = [];
 
    for (let entry of await FILES.readdir(env.addonpath)) {
        if (!entry.startsWith('.') && !entry.startsWith('apiV')) {
            let addonPath = `${env.addonpath}/${entry}`;
            let addon = mkAddon(addonPath);
            await addon.load();
            logPrimary(`    ${addon.info()}`);
        }
    }
 
    logPrimary('[ Loading Modules ]');
    Config.moduleMap = {};
    Config.moduleArray = [];
    Config.moduleUrlMap = {};
 
    for (let entry of await FILES.readdir(env.modpath)) {
        if (!entry.startsWith('.')) {
            let modulePath = `${env.modpath}/${entry}`;
            let module = mkModule(modulePath);
            await module.load();
            logPrimary(`    ${module.info()}`);
        }
    }

    for (let entry of Config.userModules) {
        if (!entry.startsWith('.')) {
            let modulePath = `${env.modpath}/${entry}`;
            let module = mkModule(modulePath);
            await module.load();
            logPrimary(`    ${module.info()}`);
        }
    }
 
    Config.sealOff();
    await onSingletons();
    await startWorkers();
    await startDaemons();
    await startServers();
    logPrimary('[ Kode Application Server Ready ]\n');
})();
