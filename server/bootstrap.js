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
};


/*****
*****/
require('./config.js');
require('./buffer.js');
require('./cluster.js');
require('./content.js');
require('./crypto.js');
require('./daemon.js');
//require('../dbms/dbClient.js');
//require('../dbms/dbSchema.js');
//require('../dbms/dbObject.js');
//require('../dbms/dbSchemaAnalyzer.js');
require('./ipc.js');
require('./logging.js');
require('./module.js');
require('./pool.js');
require('./sentinel.js');
require('./server.js');
require('./utility.js');


/*****
*****/
async function loadAddons() {
}


/*****
*****/
async function loadModule(path) {
    let filename = PATH.basename(path);
    
    if (!filename.startsWith('.')) {
        let module = await mkModule(path);

        if (module.status == 'ok') {
            if (module.config && module.config.active) {
                try {
                    await module.load();
                }
                catch (e) {
                    log(`Module at ${module.path} failed while loading.`, e);
                }
            }
        }
        else {
            log(`Module at ${module.path} failed while making with status "${module.status}".`);
        }
    }
}


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
*****/
function startWorkers() {
    return new Promise((ok, fail) => {
        if (CLUSTER.isPrimary) {
            if (Config.workers > 0) {
                let workers;
                let started = 0;
                
                if (typeof Config.workers == 'number' && Config.workers >= 0) {
                    workers = Config.workers <= env.cpus ? Config.workers : env.cpus;
                }
                else {
                    workers = env.cpus;
                }
                
                Ipc.on('#WorkerStarted', message => {
                    started++;
                    console.log(`Worker started ${started}`);
                    
                    if (started == workers) {
                        ok();
                    }
                });
            
                for (let i = 0; i < workers; i++) {
                    CLUSTER.fork();
                }
            }
            else {
                ok();
            }
        }
        else {
            Ipc.sendPrimary({ messageName: '#WorkerStarted' });
            ok();
        }
    });
}


/*****
 * If we're running on the server using NodeJS, this is how we load and start
 * the application.  It's all right here. There's a different approach to
 * downloading and and initizing the client framework.  Please note that only
 * loads the framework.  The application object is responsible for the
 * application and other modules.
*****/
(async () => {
    await onSingletons();
    await Config.loadSystem(env.kodepath);
    await loadAddons();
 
    Config.moduleMap = {};
    Config.moduleArray = [];
 
    for (let entry of await FILES.readdir(env.modpath)) {
        let modulePath = `${env.modpath}/${entry}`;
        await loadModule(modulePath);
    }

    for (let userModule of Config.userModules) {
        await loadModule(userModule);
    }
 
    Config.sealOff();
    await onSingletons();
 
    await startWorkers();
    await startDaemons();
    await startServers();
 
    for (let module of Config.moduleArray) {
        if (module.status == 'ok') {
            await module.upgradeSchema();
            await module.load();
        }
    }
})();
