/*****
 * Copyright (c) 2017-2023 Kode Programming
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
 * A diagnostic tool that's primarily to be used for development and testing
 * purposes.  This Webx returns and HTML page reflecting the HTTP request data.
 * Essentially, the response value is a table showin lots of data from the HTTP
 * request object.
*****/
register(class ReflectRequest extends Webx {
    constructor(thunk, reference) {
        super(thunk, reference);
    }

    async buildHtml(req) {
        let table;

        let doc = htmlDocument(
            htmlElement(
                'head',
            ),
            htmlElement(
                'body',
                (table = htmlElement(
                    'table',
                    htmlElement('tbody',
                        htmlElement(
                            'tr',
                            htmlElement('td', htmlText('Host')),
                            htmlElement('td', htmlText(req.header('host')))
                        ),
                        htmlElement(
                            'tr',
                            htmlElement('td', htmlText('Method')),
                            htmlElement('td', htmlText(req.method()))
                        ),
                        htmlElement(
                            'tr',
                            htmlElement('td', htmlText('Path')),
                            htmlElement('td', htmlText(req.pathname()))
                        ),
                        htmlElement(
                            'tr',
                            htmlElement('td', htmlText('HEADERS')),
                            htmlElement('td', htmlText('*************************************************************'))
                        ),
                    )
                ))
            )
        );

        for (let header of Object.entries(req.headers())) {
            table.append(
                htmlElement(
                    'tr',
                    htmlElement('td', htmlText(header[0])),
                    htmlElement('td', htmlText(header[1]))
                )
            );
        }

        if (req.hasParameters()) {
            table.append(
                htmlElement(
                    'tr',
                    htmlElement('td', htmlText('PARAMETERS')),
                    htmlElement('td', htmlText('*************************************************************'))
                )
            );

            for (let parameter of Object.entries(req.parameters())) {
                table.append(
                    htmlElement(
                        'tr',
                        htmlElement('td', htmlText(parameter[0])),
                        htmlElement('td', htmlText(parameter[1]))
                    )
                );
            }
        }

        return doc.toVisual();
    }

    async handleGET(req, rsp) {
        rsp.end(200, 'text/html', await this.buildHtml(req));
    }

    async handlePost(req, rsp) {
        rsp.end(200, 'text/html', await this.buildHtml(req));
    }
});
