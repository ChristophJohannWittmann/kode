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


if (CLUSTER.isPrimary) {
    /*****
     * In the primary process, in addition to intra-process communications, the
     * task is able to send a message to (a) a specific worker, or (b) as a
     * broadcast message to all of the workers.  The primary process is also
     * able to query (a) a specific worker, or (b) query all workers at once.
    *****/
    singleton(class Ipc extends Emitter {
        constructor() {
            super();
        }

        async queryWorker(worker, message) {
            if (typeof worker == 'number') {
                worker = CLUSTER.workers[worker];
            }
            
            let trap = mkTrap();
            Trap.setExpected(trap.id, 1);
            message['#Worker'] = worker.id;
            message['#Trap'] = trap.id;
            message['#IpcQuery'] = true;
            worker.send(toJson(message));
            return trap.promise;
        }

        async queryWorkers(message) {
            let trap = mkTrap();
            Trap.setExpected(trap.id, Object.entries(CLUSTER.workers).length);
            
            for (let workerId in CLUSTER.workers) {
                let worker = CLUSTER.workers[workerId];
                message['#Worker'] = worker.id;
                message['#Trap'] = trap.id;
                message['#IpcQuery'] = true;
                worker.send(toJson(message));
            }
            
            return trap.promise;
        }

        sendWorker(worker, message) {
            if (typeof worker == 'number') {
                worker = CLUSTER.workers[worker];
            }

            worker.send(toJson(message));
        }

        sendWorkers(message) {
            for (const id in CLUSTER.workers) {
                let worker = CLUSTER.workers[id];
                worker.send(toJson(message));
            }
        }
    });
    
    
    /*****
     * Handle incoming messages.  There are three important cases to handle:
     * (1) a reply from a query, (2) a query, or (3) the remaing case which is
     * a simple, one-way message.  The main difference for this handle on the
     * primary vs a worker, is that the remote endpoint is reachable with
     * differently named methods.
    *****/
    CLUSTER.on('message', async (worker, json) => {
        let message = fromJson(json);
        
        if ('#IpcReply' in message) {
            delete message['#IpcReply'];
            Trap.pushReply(message['#Trap'], message.reply);
        }
        else if ('#IpcQuery' in message) {
            message.reply = await Ipc.query(message);
            message['#IpcReply'] = true;
            delete message['#IpcQuery'];
            Ipc.sendWorker(message['#Worker'], message);
        }
        else {
            Ipc.send(message);
        }
    });
}
else {
    /*****
     * Each worker has the feature set to send a message to the primary process,
     * and to query the primary process for a response.  Note that IPC messages
     * are untyped, unlike the intra-process message class Message.
    *****/
    singleton(class Ipc extends Emitter {
        constructor() {
            super();
        }

        async queryPrimary(message) {
            let trap = mkTrap();
            Trap.setExpected(trap.id, 1);
            message['#Worker'] = CLUSTER.worker.id;
            message['#Trap'] = trap.id;
            message['#IpcQuery'] = true;
            PROC.send(toJson(message));
            return trap.promise;
        }

        sendPrimary(message) {
            message['#Worker'] = CLUSTER.worker.id;
            return PROC.send(toJson(message));
        }
    });
    
    
    /*****
     * Handle incoming messages.  There are three important cases to handle:
     * (1) a reply from a query, (2) a query, or (3) the remaing case which is
     * a simple, one-way message.  The main difference for this handle on the
     * primary vs a worker, is that the remote endpoint is reachable with
     * differently named methods.
    *****/
    CLUSTER.worker.on('message', async jsonMessage => {
        let message = fromJson(jsonMessage);
        
        if ('#IpcReply' in message) {
            delete message['#Worker'];
            delete message['#IpcReply'];
            Trap.pushReply(message['#Trap'], message.reply);
        }
        else if ('#IpcQuery' in message) {
            message.reply = await Ipc.query(message);
            message['#IpcReply'] = true;
            delete message['#IpcQuery'];
            Ipc.sendPrimary(message);
        }
        else {
            Ipc.send(message);
        }
    });
}
