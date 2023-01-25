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
 * A WebAppTransaction is an extension of Messaage and managages the overhead
 * associated with processing a web application transaction.  It keeps a tidy
 * list of opened database connections and encourages reuse of already opened
 * connections.  You need to pass in force in order to force the transaction
 * to start a new duplicate DBMS connection.  If force is undefined or false,
 * existing DBMS connections are returned despite the method name, connect().
*****/
register(class WebAppTransaction extends Message {
    constructor(message) {
        super();
        this['#connectionMap'] = {};
        this['#connectionArray'] = [];

        if (!('context' in message)) {
            message.context = {};
        }
    }

    static async assign(trx, message) {
        let prototype = Reflect.getPrototypeOf(trx);

        for (let key of Object.keys(message)) {
            if (key in prototype) {
                 log(`Client Message Key: "${key}" reserved for internal server use.\n${toJson(message, true)}`);
                 return false;
            }

            trx[key] = message[key];
        }
        
        trx.endpoint = EndpointContainer.endpoints[message.messageName];
        return true;
    }

    async commit() {
        for (let connection of this['#connectionArray']) {
            await connection.commit();
            await connection.free();
        }
    }

    async connect(dbName, force) {
        let connection;

        if (dbName === true) {
            force = true;
            dbName = undefined;
        }

        if (dbName in this['#connectionMap']) {
            if (force) {
                connection = await dbConnect(dbName);
                await connection.startTransaction();
                this['#connectionArray'].push(connection);                
            }
            else {
                connection = this['#connectionMap'][dbName];
            }
        }
        else {
            connection = await dbConnect(dbName);
            await connection.startTransaction();
            this['#connectionMap'][dbName] = connection;
            this['#connectionArray'].push(connection);
        }

        return connection;
    }

    incomingRequestData() {
        let msg = {};

        for (let key of Object.keys(this)) {
            if (!key.startsWith('#') && key != 'password') {
                msg[key] = this[key];
            }
        }

        return msg;
    }

    reply(value) {
        Message.reply(this, value);
    }

    async rollback() {
        for (let connection of this['#connectionArray']) {
            await connection.rollback();
            await connection.free();
        }
    }
});
