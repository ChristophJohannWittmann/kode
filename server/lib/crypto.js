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


register(class Crypto {
    /*****
     * Generates an RSA public key pair with a legth of 4096 bits.  The returned
     * value is an object containing both the public and private keys in PEM
     * format.  This is exactly what's used by the framework for TSL crypto and
     * for TLS certificates.
    *****/
    static decodeBase64Url(base64url) {
        return npmBase64Url.decode(base64url);
    }

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

                if (hashValue) {
                    ok({ hash: hashValue.toString('base64'), salt: salt });
                }
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

                if (hashValue) {
                    ok(hashValue.toString('base64'));
                }
            });

            hash.write(value);
            hash.end();
        });
    }
    
    /*****
     * Base64 URL encoding is required in various algorithms and is like base64
     * but without the = + or /.  This crypto library has static methods that
     * support encoding to and decoding from base64 URL formatted text.
    *****/
    static encodeBase64Url(value) {
        return npmBase64Url.encode(value.toString());
    }

    /*****
     * Generates an RSA public key pair with a legth of 4096 bits.  The returned
     * value is an object containing both the public and private keys in PEM
     * format.  This is exactly what's used by the framework for TSL crypto and
     * for TLS certificates.
    *****/
    static generateKeyPair(bits) {
        return new Promise((ok, fail) => {
            CRYPTO.generateKeyPair(
                'rsa', {
                    modulusLength: bits ? bits : 4096,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem',
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem',
                    },
                },
                (error, publicPem, privatePem) => {
                    ok({
                        publicKey: {
                            alg: 'rsa',
                            bits: 4096,
                            type: 'public',
                            created: mkTime(),
                            pem: publicPem,
                        },

                        privateKey: {
                            alg: 'rsa',
                            bits: 4096,
                            type: 'private',
                            created: mkTime(),
                            pem: privatePem,
                        },
                    });
                }
            );
        });
    }
    
    /*****
     * Very simply a kode framwework wrapper for the NodeJS hasing feature. This
     * provides all of the underlying features packaged into a simple single-
     * line asynchronous/promise-base API interface.
    *****/
    static hash(algorithmName, value) {
        return new Promise((ok, fail) => {
            const hasher = CRYPTO.createHash(algorithmName);
            
            hasher.on('readable', () => {
                ok(hasher.read());
            });
            
            hasher.write(value);
            hasher.end();
        });
    }
    
    /*****
     * An easy-to-use random number generator.  Use this internally or for
     * other framework code.
    *****/
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    /*****
     * A simplified wrapper for the builtin nodeJS crypto.Sign() class.  Note
     * that unless otherwise specified, there are two assumptions in the code:
     * (a) the provided value is either a string or a Buffer and (b) that the
     * encoding for the return value is base64.  Other encoding names are also
     * allowed including a special purpose one called 'buffer';
    *****/
    static sign(alg, pem, value, encoding) {
        let signer = CRYPTO.createSign(alg);
        signer.write(value);
        signer.end();
        
        switch (encoding) {
            case 'base64':
                return signer.sign(pem, 'base64');
                
            case 'base64url':
                return signer.sign(pem, 'base64').split('=')[0]
                        .replace(/[+]/g, '-').replace(/[\/]/g, '_');
                
            case 'hex':
                return signer.sign(pem, 'hex');

            default:
                return signer.sign(pem);
        }
    }
});
