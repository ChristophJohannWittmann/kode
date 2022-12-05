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


/*****
 * Bool mode is set during startup to change the logging behavior while booting.
 * While booting, all logged messages are redirected to the log file because
 * we don't know if the system will be prepared and able to log a message to
 * the DBMS.  The bootstrapper will call clearBootMode() to enable DBMS logging
 * once the server has been booted.
*****/
let bootMode = true;

register(function clearBootMode() {
    bootMode = false;
});


/*****
 * Log entries are created by concatenating one or more passed argument into
 * a single string, which is then readily recorded as per the configuration
 * settings or even emailed or messaged to a sys user.  The point is that we
 * want to generate a block of text that contains all pertinant text in a
 * single text block.
*****/
function createLogEntry(...args) {
    let logEntry = [];

    for (let arg of args) {
        if (arg instanceof Error) {
            logEntry.push(arg.message);
            logEntry.push(arg.stack);
        }
        else if (typeof arg == 'string') {
            logEntry.push(arg);
        }
        else {
            logEntry.push(arg.toString());
        }
    }

    return logEntry.join('\n');
}


/*****
 * The primary system logging function, which uses the configuration to
 * determine to where to log the message and whether sys users get anotification.
 * During bootMode, all messages are logged to the console.  Moreover, if there
 * is an error encountered while logging, the error is caught and routed to the
 * system log file, which is stdout.
*****/
register(async function log(...args) {
    let logEntry;

    try {
        let logEntry = createLogEntry(...args);

        if (bootMode || Config.logging == 'console') {
            console.log(logEntry);
        }
        else if (Config.logging == 'dbms' || Config.logging == 'notify') {
            let dbc = await dbConnect();
            await mkDboSystemLog({ message: logEntry }).save(dbc);
            await dbc.commit();
            await dbc.free();
        }

        if (Config.logging == 'notify') {
            await notifySysUsers(logEntry);
        }
    }
    catch (e) {
        if (logEntry) {
            console.log(LogEntry);
        }

        console.log('********** Logging Error **********');
        console.log(e.stack);
    }
});


/*****
*****/
register(async function notifySysUsers(logEntry) {
    console.log('TODO -- logging.js function notifySysUsers() implement sys user notificaiton!');
});


/*****
 * A wrapper function that generates a log entry, with provisio, logging occurs
 * only if the execution context is the server's primary process.  If we're in
 * a worker, just ignore the logging request.  The primary purpose for this is
 * to ignore duplicate logging requests during the server bootstrap process.
*****/
register(async function logPrimary(...args) {
    if (CLUSTER.isPrimary) {
        await log(...args);
    }
});
