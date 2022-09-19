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
*****/
register(class HtmlDocumentBuilder(symbols) {
    constructor() {
        this.dict = {
            session: '${session}',
            sockets: '${sockets}',
        };

        this.stylesheets = [];
    }

    render() {
    }

    stylesheet(css) {
    }

    symbol(symbol, value) {
        if (typeof value == 'undefined') {
            return this.dict[symbol];
        }
        else {
            this.dict[symbol] = value.toString();
        }
    }

    symbols() {
        return Object.keys(this.symbols);
    }

    renderTemplate() {
return `<!DOCTYPE html>
<html class="html">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="STYLE?SESSION=${sessionId}">
        <script src="FRAMEWORK?SESSION=${sessionId}"></script>
        <script>
           let SESSION = '${this.dict.SESSION}';
           let SOCKETS = ${$toJson(sockets)};
           function $client() {
               $.classPrefix  = 'Clss';
               $query('head').append($script($attr('src', 'APPLICATION')));
           }
    </script>
    </head>
    <body class="body colors" onload="$client()">
    </body>
</html>
`;
}
});