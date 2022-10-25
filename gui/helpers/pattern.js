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


/*****
 * A pattern is very useful to employ in place of validation.  A pattern
 * constrains the input to a limited value pattern as expressed with regular
 * expression syntax.  The pattern is much better than a post-entry check of
 * the enter value because we don't really need to flag a field with a
 * message.  The builtin browser GUI just shows us that something's not right.
*****/
register(class PatternHelper extends Helper {
    constructor(widget) {
        super(widget);
    }

    helperClearPattern() {
        this.clearAttribute('pattern');
    }

    helperGetPattern() {
        return this.getAttribute('pattern');
    }

    helperSetPattern(pattern) {
        if (typeof pattern == 'string') {
        }
        else if (pattern instanceof RegExp) {
        }
    }
});
