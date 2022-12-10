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

    static mon = {symbol: Symbol('mon'), index: 1, weekend: false};
    static tue = {symbol: Symbol('tue'), index: 2, weekend: false};
    static wed = {symbol: Symbol('wed'), index: 3, weekend: false};
    static thu = {symbol: Symbol('thu'), index: 4, weekend: false};
    static fri = {symbol: Symbol('fri'), index: 5, weekend: false};
    static sat = {symbol: Symbol('sat'), index: 6, weekend: true };
    static sun = {symbol: Symbol('sun'), index: 0, weekend: true };
    static dowArray = [ Time.sun, Time.mon, Time.tue, Time.wed, Time.thu, Time.fri, Time.sat ];
  
    static dowMap = (() => {
        let map = {};
        Time.dowArray.forEach(dow => map[dow.symbol] = dow);
        return map;
    })();

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

    add(...args) {
        const units = [
            this.addYears,
            this.addMonths,
            this.addDays,
            this.addHours,
            this.addMinutes,
            this.addSeconds,
            this.addMilliseconds,
        ];

        for (let i = 0; i < args.length; i++) {
            Reflect.apply(units[i], this, [args[i]]);
        }

        return this;
    }

    addMilliseconds(milliseconds) {
        this.jsDate.jsDate.setUTCMilliseconds(this.jsDate.jsDate.getUTCMilliseconds() + milliseconds);
        return this;
    }

    addSeconds(seconds) {
        this.jsDate.setUTCSeconds(this.jsDate.getUTCSeconds() + seconds);
        return this;
    }

    addMinutes(minutes) {
        this.jsDate.setUTCMinutes(this.jsDate.getUTCMinutes() + minutes);
        return this;
    }

    addHours(hours) {
        this.jsDate.setUTCHours(this.jsDate.getUTCHours() + hours);
        return this;
    }

    addDays(days) {
        this.jsDate.setUTCDate(this.jsDate.getUTCDate() + days);
        return this;
    }

    addWeeks(weeks) {
        this.jsDate.setUTCDate(this.jsDate.getUTCDate() + 7*weeks);
        return this;
    }

    addMonths(months) {
        this.jsDate.setUTCMonth(this.jsDate.getUTCMonth() + months);
        return this;
    }

    addQuarters(quarters) {
        this.jsDate.setUTCMonth(this.jsDate.getUTCMonth() + 3*quarters);
        return this;
    }

    addYears(years) {
        this.jsDate.setUTCFullYear(this.jsDate.getUTCFullYear() + years);
        return this;
    }
  
    day(day) {
        if (day === undefined) {
            return this.jsDate.getUTCDate();
        }
        else {
            this.jsDate.setUTCDate(day);
            return this;
        }
    }

    dayBegins() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            0,
            0,
            0,
            0
        );
    }

    dayEnds() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate() + 1,
            0,
            0,
            0,
            0
        );
    }
  
    dayOfWeek(weekStart) {
        let sundayBasedDow = dowArray[this.jsDate.getUTCDay()];
  
        if (sundayBasedDow.index >= weekStart.index) {
            return dowArray[sundayBasedDow.index - weekStart.index];
        }
        else {
            return dowArray[7 + sundayBasedDow.index - weekStart.index];
        }
    }
  
    hour(hour) {
        if (hour === undefined) {
            return this.jsDate.getUTCHours();
        }
        else {
            this.jsDate.setUTCHours(hour);
            return this;
        }
    }
  
    hourBegins() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours(),
            0,
            0,
            0
        );
    }
  
    hourEnds() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours() + 1,
            0,
            0,
            0
        );
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

    isoDateStr() {
        return this.jsDate.toISOString().split('T')[0];
    }

    isoStr() {
        return this.jsDate.toISOString();
    }

    isoTimeStr() {
        return this.jsDate.toISOString().split('T')[1];
    }

    jsDateStr() {
        return this.jsDate.toISOString().substr(0, 10);
    }

    jsDateTimeStr() {
        return this.jsDate.toISOString().substr(0, 16);
    }

    jsTimeStr() {
        return this.jsDate.toISOString().substr(11, 5);
    }
      
    millisecond(millisecond) {
        if (millisecond === undefined) {
            return this.jsDate.getUTCMilliseconds();
        }
        else {
            this.jsDate.setUTCMilliseconds(millisecond);
            return this;
        }
    }
  
    minute(minute) {
        if (minute === undefined) {
            return this.jsDate.getUTCMinutes();
        }
        else {
            this.jsDate.setUTCMinutes(minute);
            return this;
        }
    }

    minuteBegins() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours(),
            this.jsDate.getUTCMinutes(),
            0,
            0
        );
    }

    minuteEnds() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours(),
            this.jsDate.getUTCMinutes() + 1,
            0,
            0
        );
    }
      
    month(month) {
        if (month === undefined) {
            return this.jsDate.getUTCMilliseconds();
        }
        else {
            this.jsDate.setUTCMonth(month);
            return this;
        }
    }

    monthBegins(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            1,
            0,
            0,
            0,
            0,
            weekStart
        );
    }

    monthEnds(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth() + 1,
            1,
            0,
            0,
            0,
            0,
            weekStart
        );
    }

    quarterBegins(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.quarterOfYear() * 3,
            1,
            0,
            0,
            0,
            0,
            weekStart
        );
    }

    quarterEnds(weekStart) {
        let quarterBegins = this.quarterBegins();
  
        return new GregorianUtc(
            quarterBegins.date.getUTCFullYear(),
            quarterBegins.date.getUTCMonth() + 3,
            quarterBegins.date.getUTCDate(),
            0,
            0,
            0,
            0,
            weekStart
        );
    }
  
    quarterOfYear(quarterOfYear, weekStart) {
        if (quarterOfYear === undefined) {
            return Math.floor(this.jsDate.getUTCMonth() / 3);
        }
        else {
            this.jsDate = new Date(Date.UTC(
                this.jsDate.getUTCFullYear(),
                quarterOfYear * 3,
                this.jsDate.getUTCDate(),
                this.jsDate.getUTCHours(),
                this.jsDate.getUTCMinutes(),
                this.jsDate.getUTCSeconds(),
                this.jsDate.getUTCMilliseconds(),
                ths.weekStart
            ));
  
            return this;
        }
    }
  
    second(second) {
        if (second === undefined) {
            return this.jsDate.getUTCSeconds();
        }
        else {
            this.jsDate.setUTCSeconds(second);
            return this;
        }
    }

    secondBegins() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours(),
            this.jsDate.getUTCMinutes(),
            this.jsDate.getUTCSeconds(),
            0
        );
    }

    secondEnds() {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate(),
            this.jsDate.getUTCHours(),
            this.jsDate.getUTCMinutes(),
            this.jsDate.getUTCSeconds() + 1,
            0
        );
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
  
    utcDateStr() {
        let match = this.jsDate.toUTCString().match(Date.utcRegex);
        return match[1];
    }
  
    utcStr() {
        return this.jsDate.toUTCString();
    }
  
    utcTimeStr() {
        let match = this.jsDate.toUTCString().match(Date.utcRegex);
        return match[2];
    }
      
    weekBegins(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            this.jsDate.getUTCMonth(),
            this.jsDate.getUTCDate() - this.dayOfWeek().index,
            0,
            0,
            0,
            0,
            weekStart
        );
    }
  
    weekEnds(weekStart) {
        let weekBegin = this.weekBegins();
  
        return new GregorianUtc(
            weekBegin.date.getUTCFullYear(),
            weekBegin.date.getUTCMonth(),
            weekBegin.date.getUTCDate() + 7,
            0,
            0,
            0,
            0,
            weekStart
        );
  
    }
  
    weekOfYear(weekOfYear, weekStart) {
        let thisWeekBegins = this.weekBegins();
        let thisYearBegins = new GregorianUtc(thisWeekBegins.year(), 0, 1);
  
        if (weekOfYear === undefined) {
            let weekBegins = new GregorianUtc(
                thisYearBegins.date.getUTCFullYear(),
                thisYearBegins.date.getUTCMonth(),
                thisYearBegins.date.getUTCDate() + 7 - thisYearBegins.dayOfWeek().index,
                0,
                0,
                0,
                0,
                weekStart
            );
  
            for (var week = 0; weekBegins.isLT(thisWeekBegins); week++) {
                weekBegins.addWeeks(1);
            }
  
            return week;
        }
        else {
            for (let i = 0; i < weekOfYear; i++) {
                this.jsDate.setUTCDate(this.jsDate.getUTCDate() + 7);
            }
  
            return this;
        }
    }
      
    year(fullYear, weekStart) {
        if (fullYear === undefined) {
            return this.jsDate.getUTCFullYear();
        }
        else {
            this.jsDate(Date.UTC(
                fullYear,
                this.jsDate.getUTCMonth(),
                this.jsDate.getUTCDate(),
                this.jsDate.getUTCHours(),
                this.jsDate.getUTCMinutes(),
                this.jsDate.getUTCSeconds(),
                this.jsDate.getUTCMilliseconds(),
                weekStart
            ));
  
            return this;
        }
    }

    yearBegins(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear(),
            0,
            1,
            0,
            0,
            0,
            0,
            weekStart
        );
    }

    yearEnds(weekStart) {
        return new GregorianUtc(
            this.jsDate.getUTCFullYear() + 1,
            0,
            1,
            0,
            0,
            0,
            0,
            weekStart
        );
    }
});
