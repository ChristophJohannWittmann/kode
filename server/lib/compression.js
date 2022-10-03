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
 * This modoule provides an integrative approach for handling compression and
 * decompression algorithms.  Each supported algorithm has an encoding and a
 * decoding function, which is NOT implemented in this table.  This algorithm
 * map provides simplified wrappers for calling more detailed modules that import
 * or implement those algorithms.
*****/
const algorithms = {
    gzip: {
        encode: async decoded => await npmGZIP.gzip(decoded),
        expand: async encoded => await npmGZIP.ungzip(encoded),
    },
};


/*****
 * Before a function is able to employ and algirithm, it should ensure that the
 * algorithm has been implemented as part of this framework.  This ensures that
 * code will NOT attempt emptloy the use of an unsupported algorithm.
*****/
register(function isCompressionAlgorithmSupported(alg) {
    return alg in algorithms;
});


/*****
 * These functions provide a structured API for compressing or decompressing the
 * provided data.  In a more general naming convention, compression is called
 * encoding and expansion or decompression is called decoding in a manner that's
 * similar to the concept of crypto terminology.
*****/
register(async function compress(alg, decoded) {
    if (alg in algorithms) {
        return await algorithms[alg].encode(decoded);
    }
    else {
        return decoded;
    }
});

register(async function decompress(alg, encoded) {
    if (alg in algorithms) {
        return await algorithms[alg].decode(encoded);
    }
    else {
        return encoded;
    }
});

register(async function expand(alg, encoded) {
    if (alg in algorithms) {
        return await algorithms[alg].decode(encoded);
    }
    else {
        return encoded;
    }
});
