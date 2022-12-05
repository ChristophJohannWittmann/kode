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
 * An event object contains the data for a future event to be triggered and
 * a notification to be sent.  From a practical point of view, a future event
 * contains a unique identifier and some information to guide the receiver
 * of the event notification to take some action based on the event data or
 * information.  Events are created and managed exclusively by the Events
 * daemon.
*****/
class Event {
    static id = 1;
    static zeroTime = mkTime();

    constructor(message) {
        this.id = '';
        this.name = '';
        this.active = false;
        this.info = message.info ? message.info : new Object();

        let now = mkTime();
        this.time = mkTime(0);

        if (message.time) {
            this.time = message.time;
        }
        else if (message.wait) {
            this.time = mkTime(now.time() + message.wait);
        }

        if (this.time.isGE(now) && message.eventName) {
            this.active = true;
            this.name = message.eventName;
            this.id = `${this.name}#${Event.id++}`;
        }
    }
}


/*****
 * Each host has a singleton Events daemon operating on the host's primary task
 * or process.  Communication two-from the Events daemon goes according to all
 * singletons the extend Daemon, which is by the interprocess communications
 * singleton, Ipc.  Events are either set or cleared.  That's all!  If you want
 * to change event, you need to clear the existing event and then set a new
 * event.  This singleton uses a javascript object and an array sorted based on
 * the event's time in milliseconds.  The array is used for managing operatioins
 * of sequencing events, while the event map is used for finding specific event
 * objects.
*****/
singleton(class Events extends Daemon {
    constructor() {
        super();
        this.next = [];
        this.eventMap = {};
        this.eventArray = [];
        this.timeout = null;
        this.timeoutEvent = null;
    }

    find(event) {
        let index = binarySearch(this.eventArray, evt => evt.time.time(), event.time.time());

        for (; index < this.eventArray.length; index++) {
            if (this.eventArray[index].id == event.id) {
                return index;
            }
        }
    }

    async onClear(message) {
        let event = this.eventMap[message.eventId];

        if (event) {
            this.eventArray.splice(binarySearch(this.eventArray, evt => evt.time.time(), event.time.time()) - 1, 1);

            if (this.timeoutEvent === event) {
                clearTimeout(this.timeout);
                this.setTimeout();
            }
        }

        Message.reply(message, 'ok');
    }

    async onSet(message) {
        let event = new Event(message);

        if (event.active) {
            this.eventMap[event.id] = event;

            this.eventArray.splice(
                binarySearch(this.eventArray, evt => evt.time.time(), event.time.time()),
                0,
                event
            );

            if (!this.timeout) {
                this.setTimeout();
            }
            else if (this.timeoutEvent.time.isGT(event.time)) {
                clearTimeout(this.timeout);
                this.setTimeout();
            }
        }

        Message.reply(message, event);
    }

    setTimeout() {
        if (this.eventArray.length) {
            let event = this.eventArray[0];
            this.timeoutEvent = event;
            this.timeout = setTimeout(() => this.trigger(event), event.time.time() - Date.now());
        }
        else {
            this.timeout = null;
            this.timeoutEvent = null;
        }
    }

    trigger(event) {
        let message = { messageName: event.id, event: event };
        Ipc.sendHost(message);
        this.eventArray.shift();
        delete this.eventMap[event.id];

        for (let until = Date.now() + 200; this.eventArray.length && this.eventArray[0].time.time() < until; ) {
            let event = this.eventArray.shift();
            let message = { messageName: event.id, event: event };
            Ipc.sendHost(message);
            this.eventArray.shift();
            delete this.eventMap(event.id);
        }

        this.setTimeout();
    }

});
