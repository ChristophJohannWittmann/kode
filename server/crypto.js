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


register(class Crypto {
    /*****
     * There are two crypto utilities for generating message digests: (1) saled
     * and (2) unsalted.  Both utility functions accept an algorithm name as
     * a string and will generate a hash for the specified value.  Note that the
     * algorithm name is one of the nodeJS algorithms built into Crypto.Hash
     * supported algorithms.  When shaking salt, a random numeric string is
     * generated and returned to the caller.
    *****/
    static digestSalted(algorithmName, value) {
        return new Promise((ok, fail) => {
            let hash = CRYPTO.createHash(algorithmName);
            let salt = Crypto.random(0, 1000000000000).toString();

            hash.on('readable', () => {
                let hashValue = hash.read();
                ok({ hash: hashValue.toString('base64'), salt: salt });
            });

            hash.write(value);
            hash.write(salt);
            hash.end();
        });
    }
    
    
    /*****
     * There are two crypto utilities for generating message digests: (1) saled
     * and (2) unsalted.  Both utility functions accept an algorithm name as
     * a string and will generate a hash for the specified value.  Note that the
     * algorithm name is one of the nodeJS algorithms built into Crypto.Hash
     * supported algorithms.  When shaking salt, a random numeric string is
     * generated and returned to the caller.
    *****/
    static digestUnsalted(algorithmName, value) {
        return new Promise((ok, fail) => {
            let hash = CRYPTO.createHash(algorithmName);

            hash.on('readable', () => {
                let hashValue = hash.read();
                ok(hashValue.toString('base64'));
            });

            hash.write(value);
            hash.end();
        });
    }
  
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
});
