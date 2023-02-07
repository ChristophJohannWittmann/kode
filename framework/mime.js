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
 * An active library of MIME types.  This registered class provides a libary for
 * forward and reverse mapping of MIME type data between file extension and mime
 * code names.  The code name is something like text/html.  Some of them, like
 * .xlsx for instance, have disguistingly long MIME type codes.
*****/
register(class Mime {
    static byMimeCode = {};
    static byExtension = {};
  
    static _ = (() => {
        [
            {code: 'audio/aac',                                                                             type: 'binary', exts: {aac:0}},
            {code: 'application/x-abiword',                                                                 type: 'binary', exts: {abw:0}},
            {code: 'application/x-freearc',                                                                 type: 'binary', exts: {arc:0}},
            {code: 'video/x-msvideo',                                                                       type: 'binary', exts: {avi:0}},
            {code: 'application/vnd.amazon.ebook',                                                          type: 'binary', exts: {azw:0}},
            {code: 'application/octet-stream',                                                              type: 'binary', exts: {bin:0}},
            {code: 'image/bmp',                                                                             type: 'binary', exts: {bmp:0}},
            {code: 'application/x-bzip',                                                                    type: 'binary', exts: {bz:0}},
            {code: 'application/x-bzip2',                                                                   type: 'binary', exts: {bz2:0}},
            {code: 'audio/x-cdf',                                                                           type: 'binary', exts: {cda:0}},
            {code: 'application/x-csh',                                                                     type: 'string', exts: {csh:0}},
            {code: 'text/css',                                                                              type: 'string', exts: {css:0}},
            {code: 'text/csv',                                                                              type: 'string', exts: {csv:0}},
            {code: 'application/msword',                                                                    type: 'binary', exts: {doc:0}},
            {code: 'application/application/vnd.openxmlformats-officedocument.wordprocessingml.document',   type: 'binary', exts: {docx:0}},
            {code: 'application/vnd.ms-fontobject',                                                         type: 'binary', exts: {eot:0}},
            {code: 'application/epub+zip',                                                                  type: 'binary', exts: {epub:0}},
            {code: 'application/gzip',                                                                      type: 'binary', exts: {gz:0}},
            {code: 'image/gif',                                                                             type: 'binary', exts: {gif:0}},
            {code: 'text/html',                                                                             type: 'string', exts: {htm:0, html:0}},
            {code: 'image/vnd.microsoft.icon',                                                              type: 'binary', exts: {ico:0}},
            {code: 'text/calendar',                                                                         type: 'string', exts: {ics:0}},
            {code: 'application/java-archive',                                                              type: 'binary', exts: {jar:0}},
            {code: 'image/jpeg',                                                                            type: 'binary', exts: {jpg:0, jpeg:0}},
            {code: 'text/javascript',                                                                       type: 'string', exts: {js:0}},
            {code: 'application/json',                                                                      type: 'string', exts: {json:0}},
            {code: 'application/ld+json',                                                                   type: 'string', exts: {jsonld:0}},
            {code: 'audio/midi',                                                                            type: 'binary', exts: {mid:0, midi:0}},
            {code: 'text/javascript',                                                                       type: 'string', exts: {mjs:0}},
            {code: 'audio/mpeg',                                                                            type: 'binary', exts: {mp3:0}},
            {code: 'video/mp4',                                                                             type: 'binary', exts: {mp4:0}},
            {code: 'video/mpeg',                                                                            type: 'binary', exts: {mpeg:0}},
            {code: 'application/vnd.apple.installer+xml',                                                   type: 'binary', exts: {mpkg:0}},
            {code: 'application/vnd.oasis.opendocument.presentation',                                       type: 'binary', exts: {odp:0}},
            {code: 'application/vnd.oasis.opendocument.spreadsheet',                                        type: 'binary', exts: {ods:0}},
            {code: 'application/vnd.oasis.opendocument.text',                                               type: 'binary', exts: {odt:0}},
            {code: 'audio/ogg',                                                                             type: 'binary', exts: {oga:0}},
            {code: 'video/ogg',                                                                             type: 'binary', exts: {ogv:0}},
            {code: 'application/ogg',                                                                       type: 'binary', exts: {ogx:0}},
            {code: 'audio/opus',                                                                            type: 'binary', exts: {opus:0}},
            {code: 'font/ots',                                                                              type: 'binary', exts: {otf:0}},
            {code: 'application/pdf',                                                                       type: 'binary', exts: {pdf:0}},
            {code: 'image/png',                                                                             type: 'binary', exts: {png:0}},
            {code: 'application/x-httpd-php',                                                               type: 'string', exts: {php:0}},
            {code: 'application/vnd.ms-powerpoint',                                                         type: 'binary', exts: {ppt:0}},
            {code: 'application/application/vnd.openxmlformats-officedocument.presentationml.presentation', type: 'binary', exts: {pptx:0}},
            {code: 'application/vnd.rar',                                                                   type: 'binary', exts: {rar:0}},
            {code: 'application/rtf',                                                                       type: 'binary', exts: {rtf:0}},
            {code: 'application/x-sh',                                                                      type: 'string', exts: {sh:0}},
            {code: 'image/svg+xml',                                                                         type: 'string', exts: {svg:0}},
            {code: 'application/x-shockwave-flash',                                                         type: 'binary', exts: {swf:0}},
            {code: 'application/x-tar',                                                                     type: 'binary', exts: {tar:0}},
            {code: 'image/tiff',                                                                            type: 'binary', exts: {tff:0, tiff:0}},
            {code: 'video/mp2t',                                                                            type: 'binary', exts: {ts:0}},
            {code: 'font/ttf',                                                                              type: 'binary', exts: {ttf:0}},
            {code: 'text/plain',                                                                            type: 'string', exts: {txt:0}},
            {code: 'application/vnd.visio',                                                                 type: 'binary', exts: {vsd:0}},
            {code: 'audio/wave',                                                                            type: 'binary', exts: {wav:0}},
            {code: 'audio/webm',                                                                            type: 'binary', exts: {weba:0}},
            {code: 'video/webm',                                                                            type: 'binary', exts: {webm:0}},
            {code: 'image/webp',                                                                            type: 'binary', exts: {webp:0}},
            {code: 'font/woff',                                                                             type: 'binary', exts: {woff:0}},
            {code: 'font/woff2',                                                                            type: 'binary', exts: {woff2:0}},
            {code: 'application/xhtml+xml',                                                                 type: 'string', exts: {xhtml:0}},
            {code: 'application/vnd.ms-excel',                                                              type: 'binary', exts: {xls:0}},
            {code: 'application/application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         type: 'binary', exts: {xlsx:0}},
            {code: 'application/xml',                                                                       type: 'string', exts: {xml:0}},
            {code: 'application/vnd.mozilla.xul+xml',                                                       type: 'string', exts: {xul:0}},
            {code: 'application/zip',                                                                       type: 'binary', exts: {zip:0}},
            {code: 'video/3gpp',                                                                            type: 'binary', exts: {'3gp':0}},
            {code: 'video/3gpp2',                                                                           type: 'binary', exts: {'3g2':0}},
            {code: 'application/x-7z-compressed',                                                           type: 'binary', exts: {'7z':0}},
            {code: 'multipart/form-data',                                                                   type: 'binary', exts: {}},
            {code: 'unknown/unknown',                                                                       type: 'binary', exts: {}},
        ].forEach(mimeType => {
            Mime.byMimeCode[mimeType.code] = mimeType;
            
            Object.keys(mimeType.exts).forEach(ext => {
                Mime.byExtension[ext] = mimeType;
                Mime.byExtension[`.${ext}`] = mimeType;
            });
        });
    })();

    constructor(text) {
        let entry;
        this.props = {};

        if (text in Mime.byMimeCode) {
            entry = Mime.byMimeCode[text];
        }
        else if (text in Mime.byExtension) {
            entry = Mime.byExtension[text];
        }
        else if (`.${text}` in Mime.byExtension) {
            entry = Mime.byExtension[text];
        }
        else {
            try {
                if (text.indexOf(';') > 0) {
                    let parts = text.split(';').map(part => part.trim());

                    if (parts[0] in Mime.byMimeCode) {
                        entry = Mime.byMimeCode[parts[0]];

                        for (let i = 1; i < parts.length; i++) {
                            let part = parts[i];

                            if (part.indexOf('=') > 0) {
                                let [ property, value ] = part.split('=');
                                this.props[property.trim()] = value.trim();
                            }
                        }
                    }
                }
                else {
                    entry = Mime.byMimeCode['unknown/unknown'];
                }
            }
            catch(e) {
                entry = Mime.byMimeCode['unknown/unknown'];
            }
        }

        this.code = entry.code;
        this.type = entry.type;
    }
});
