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


{
    /*****
     * Some definitions required for handling Gregorian calendar computations.
     * We're using synbols as keys to enforce code logic rather than enabling
     * developers to mess with the infrastructure.
    *****/
    const mon = {symbol: Symbol('mon'), index: 1, weekend: false};
    const tue = {symbol: Symbol('tue'), index: 2, weekend: false};
    const wed = {symbol: Symbol('wed'), index: 3, weekend: false};
    const thu = {symbol: Symbol('thu'), index: 4, weekend: false};
    const fri = {symbol: Symbol('fri'), index: 5, weekend: false};
    const sat = {symbol: Symbol('sat'), index: 6, weekend: true };
    const sun = {symbol: Symbol('sun'), index: 0, weekend: true };
    const dowArray = [ sun, mon, tue, wed, thu, fri, sat ];
  
    const dowMap = (() => {
        let map = {};
        dowArray.forEach(dow => map[dow.symbol] = dow);
        return map;
    })();


    /*****
     * On the client side, we have organized for an array of different calendars
     * which are based on the local time zone.  On the server side, we're only
     * implementing the Gregorian calendar and only with all computations in
     * UTC.  We really shouldn't have any calendar on server but we still need
     * to be able to schedule items and compute intervals and dates for system
     * maintence and operations purposes.  Gregorian is the calendar that's used
     * for such purposes.
    *****/
    register(class Gregorian {
        constructor(time) {
            this.weekStart = mon;
            this.time = time ? time : mkTime();
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
            this.time.jsDate.jsDate.setUTCMilliseconds(this.time.jsDate.jsDate.getUTCMilliseconds() + milliseconds);
            return this;
        }

        addSeconds(seconds) {
            this.time.jsDate.setUTCSeconds(this.time.jsDate.getUTCSeconds() + seconds);
            return this;
        }

        addMinutes(minutes) {
            this.time.jsDate.setUTCMinutes(this.time.jsDate.getUTCMinutes() + minutes);
            return this;
        }

        addHours(hours) {
            this.time.jsDate.setUTCHours(this.time.jsDate.getUTCHours() + hours);
            return this;
        }

        addDays(days) {
            this.time.jsDate.setUTCDate(this.time.jsDate.getUTCDate() + days);
            return this;
        }

        addWeeks(weeks) {
            this.time.jsDate.setUTCDate(this.time.jsDate.getUTCDate() + 7*weeks);
            return this;
        }

        addMonths(months) {
            this.time.jsDate.setUTCMonth(this.time.jsDate.getUTCMonth() + months);
            return this;
        }

        addQuarters(quarters) {
            this.time.jsDate.setUTCMonth(this.time.jsDate.getUTCMonth() + 3*quarters);
            return this;
        }

        addYears(years) {
            this.time.jsDate.setUTCFullYear(this.time.jsDate.getUTCFullYear() + years);
            return this;
        }
      
        millisecond(millisecond) {
            if (millisecond === undefined) {
                return this.time.jsDate.getUTCMilliseconds();
            }
            else {
                this.time.jsDate.setUTCMilliseconds(millisecond);
                return this;
            }
        }
      
        second(second) {
            if (second === undefined) {
                return this.time.jsDate.getUTCSeconds();
            }
            else {
                this.time.jsDate.setUTCSeconds(second);
                return this;
            }
        }

        secondBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours(),
                this.time.jsDate.getUTCMinutes(),
                this.time.jsDate.getUTCSeconds(),
                0
            );
        }

        secondEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours(),
                this.time.jsDate.getUTCMinutes(),
                this.time.jsDate.getUTCSeconds() + 1,
                0
            );
        }
      
        minute(minute) {
            if (minute === undefined) {
                return this.time.jsDate.getUTCMinutes();
            }
            else {
                this.time.jsDate.setUTCMinutes(minute);
                return this;
            }
        }

        minuteBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours(),
                this.time.jsDate.getUTCMinutes(),
                0,
                0
            );
        }

        minuteEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours(),
                this.time.jsDate.getUTCMinutes() + 1,
                0,
                0
            );
        }
      
        hour(hour) {
            if (hour === undefined) {
                return this.time.jsDate.getUTCHours();
            }
            else {
                this.time.jsDate.setUTCHours(hour);
                return this;
            }
        }
      
        hourBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours(),
                0,
                0,
                0
            );
        }
      
        hourEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                this.time.jsDate.getUTCHours() + 1,
                0,
                0,
                0
            );
        }
      
        day(day) {
            if (day === undefined) {
                return this.time.jsDate.getUTCDate();
            }
            else {
                this.time.jsDate.setUTCDate(day);
                return this;
            }
        }

        dayBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate(),
                0,
                0,
                0,
                0
            );
        }

        dayEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate() + 1,
                0,
                0,
                0,
                0
            );
        }
      
        dayOfWeek() {
            let sundayBasedDow = dowArray[this.time.jsDate.getUTCDay()];
      
            if (sundayBasedDow.index >= this.weekStart.index) {
                return dowArray[sundayBasedDow.index - this.weekStart.index];
            }
            else {
                return dowArray[7 + sundayBasedDow.index - this.weekStart.index];
            }
        }
      
        weekBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                this.time.jsDate.getUTCDate() - this.dayOfWeek().index,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }
      
        weekEnds() {
            let weekBegin = this.weekBegins();
      
            return new GregorianUtc(
                weekBegin.date.getUTCFullYear(),
                weekBegin.date.getUTCMonth(),
                weekBegin.date.getUTCDate() + 7,
                0,
                0,
                0,
                0,
                this.weekStart
            );
      
        }
      
        weekOfYear(weekOfYear) {
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
                    this.weekStart
                );
      
                for (var week = 0; weekBegins.isLT(thisWeekBegins); week++) {
                    weekBegins.addWeeks(1);
                }
      
                return week;
            }
            else {
                for (let i = 0; i < weekOfYear; i++) {
                    this.time.jsDate.setUTCDate(this.time.jsDate.getUTCDate() + 7);
                }
      
                return this;
            }
        }

        weekStart(dow) {
            if (dow && 'symbol' in dow && dow.symbol in dowMap) {
                this.weekStart = dow;
                return this;
            }
            else {
                return this.weekStart;
            }
        }
      
        month(month) {
            if (month === undefined) {
                return this.time.jsDate.getUTCMilliseconds();
            }
            else {
                this.time.jsDate.setUTCMonth(month);
                return this;
            }
        }

        monthBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth(),
                1,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }

        monthEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.time.jsDate.getUTCMonth() + 1,
                1,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }

        quarterBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                this.quarterOfYear() * 3,
                1,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }

        quarterEnds() {
            let quarterBegins = this.quarterBegins();
      
            return new GregorianUtc(
                quarterBegins.date.getUTCFullYear(),
                quarterBegins.date.getUTCMonth() + 3,
                quarterBegins.date.getUTCDate(),
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }
      
        quarterOfYear(quarterOfYear) {
            if (quarterOfYear === undefined) {
                return Math.floor(this.time.jsDate.getUTCMonth() / 3);
            }
            else {
                this.time.jsDate = new Date(Date.UTC(
                    this.time.jsDate.getUTCFullYear(),
                    quarterOfYear * 3,
                    this.time.jsDate.getUTCDate(),
                    this.time.jsDate.getUTCHours(),
                    this.time.jsDate.getUTCMinutes(),
                    this.time.jsDate.getUTCSeconds(),
                    this.time.jsDate.getUTCMilliseconds(),
                    ths.weekStart
                ));
      
                return this;
            }
        }
      
        year(fullYear) {
            if (fullYear === undefined) {
                return this.time.jsDate.getUTCFullYear();
            }
            else {
                this.time.jsDate(Date.UTC(
                    fullYear,
                    this.time.jsDate.getUTCMonth(),
                    this.time.jsDate.getUTCDate(),
                    this.time.jsDate.getUTCHours(),
                    this.time.jsDate.getUTCMinutes(),
                    this.time.jsDate.getUTCSeconds(),
                    this.time.jsDate.getUTCMilliseconds(),
                    this.weekStart
                ));
      
                return this;
            }
        }

        yearBegins() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear(),
                0,
                1,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }

        yearEnds() {
            return new GregorianUtc(
                this.time.jsDate.getUTCFullYear() + 1,
                0,
                1,
                0,
                0,
                0,
                0,
                this.weekStart
            );
        }
    });
}

