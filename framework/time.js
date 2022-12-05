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
 * This Date class supercededs the standard js Date class for two reasons:
 * (a) we can force dates to supercede the new operator and use the framework
 * standard constructor call, mkDate(), and (b) the framewokr Date class is
 * maintaned as a date when converted to JSON and back again.  Plain old JSON
 * converts a date to a string and restores the string, NOT the data object.
*****/
register(class Time {
    static Utc = global.Date.UTC;
    static utcRegex = /((?:mon|tue|wed|thu|fri|sat|sun)\, [0-9]{2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec) [0-9]{4}) (.+)/i;

    constructor(arg) {
        if (typeof arg == 'object') {
            if (arg instanceof Date) {
                this.jsDate = arg;
            }
            else if (arg instanceof Time) {
                this.jsDate = arg.jsDate;
            }
        }
        else if (typeof arg == 'number' || typeof arg == 'bigint') {
            this.jsDate = new Date(arg);
        }
        else if (arg === 'max') {
            this.jsDate = new Date(8640000000000000);
        }
        else if (arg === 'min') {
            this.jsDate = new Date(-8640000000000000);
        }
        else {
            this.jsDate = new Date(Date.now());
        }
    }

    gregorian() {
        return mkGregorian(this);
    }
 
    isEQ(arg) {
        if (arg instanceof Date) {
            return this.jsDate.valueOf() == arg.valueOf();
        }
        else if (arg instanceof Time) {
            return this.jsDate.valueOf() == arg.jsDate.valueOf();
        }
    }

    isGE(arg) {
        if (arg instanceof Date) {
            return this.jsDate.valueOf() >= arg.valueOf();
        }
        else if (arg instanceof Time) {
            return this.jsDate.valueOf() >= arg.jsDate.valueOf();
        }
    }

    isGT(arg) {
        if (arg instanceof Date) {
            return this.jsDate.valueOf() > date.valueOf();
        }
        else if (arg instanceof Time) {
            return this.jsDate.valueOf() > arg.jsDate.valueOf();
        }
    }

    isLE(arg) {
        if (arg instanceof Date) {
            return this.jsDate.valueOf() <= arg.valueOf();
        }
        else if (arg instanceof Time) {
            return this.jsDate.valueOf() <= arg.jsDate.valueOf();
        }
    }

    isLT(arg) {
        if (arg instanceof Date) {
            return this.jsDate.valueOf() < arg.valueOf();
        }
        else if (arg instanceof Time) {
            return this.jsDate.valueOf() < arg.jsDate.valueOf();
        }
    }
  
    time(unixTimeStamp) {
        if (unixTimeStamp !== undefined) {
            this.jsDate = new Date(unixTimeStamp);
            return this;
        }
        else {
            return this.jsDate.valueOf();
        }
    }

    isoStr() {
        return this.jsDate.toISOString();
    }

    isoDateStr() {
        return this.jsDate.toISOString().split('T')[0];
    }

    isoTimeStr() {
        return this.jsDate.toISOString().split('T')[1];
    }
  
    utcStr() {
        return this.jsDate.toUTCString();
    }
  
    utcDateStr() {
        let match = this.jsDate.toUTCString().match(Date.utcRegex);
        return match[1];
    }
  
    utcTimeStr() {
        let match = this.jsDate.toUTCString().match(Date.utcRegex);
        return match[2];
    }
});
