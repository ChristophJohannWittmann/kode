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
*****/
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
require('./server/lib/utility.js');


/*****
 * NodeJS module inclusions are here.  Contrary to the standard approach for
 * inclusion of node modules, we elected to centralized and globalize the
 * required modules using all caps to signify that the required modules is a
 * NodeJS builtin module.
*****/
global.CHILDPROC = require('child_process');
global.PATH      = require('path');
global.FILES     = require('fs').promises;
global.FS        = require('fs');
global.PROC      = require('process');


/*****
 * This generates the code for the kode.service file Linux based on systemd
 * services.  Kode is configured to start automatically with the system and
 * will restart after 5 seconds of crashing.
*****/
function createSystemdServiceCode(sudoPath, nodePath, kodePath, confPath) {
return `
[Unit]
Description=kodeJS

[Service]
Type=simple
User=ec2-user
Restart=always
RestartSec=5
ExecStart=${sudoPath} ${nodePath} ${kodePath} ${confPath}

[Install]
WantedBy=multi-user.target
`;
};


/*****
 * We need three arguments to insstall the kode service or daemon, what
 * ever the target sysstem is.  Please note that /path/to/sudo is not
 * part of this since that's an outer or containing command.
*****/
if (PROC.argv.length != 3) {
    console.log('ERROR: Incorrect number of switches provided');
    console.log('USAGE: node /path/to/install.js /path/to/config');
    PROC.exit(-1);
}


/*****
 * This is where installation takes place.  The first step is to detect
 * the application platform, which then specifies how we're going to install
 * the kode application on that platform as an autostart / authrestart server
 * app.  Here's a sample command line:
 * 
 *      sudo node ./kodeJS/install.js /home/ec2-user/kode.json
 * 
*****/
const systemd = '/etc/systemd/system';

(async () => {
    if (FS.existsSync(systemd)) {
        console.log('Installing/replacing Linux systemd service.');

        const sudoPath = `/usr/bin/sudo`;
        const nodePath = PROC.argv[0];
        const kodePath = PATH.join(__dirname, 'bootstrap.js');
        const confPath = PROC.argv[2];

        const servicePath = systemd;
        const serviceFile = PATH.join(servicePath, 'kode.service');
        const serviceCode = createSystemdServiceCode(sudoPath, nodePath, kodePath, confPath);

        await FILES.writeFile(serviceFile, serviceCode);
        await execShell(`${sudoPath} systemctl daemon-reload`);
        console.log('ok');
    }
})();