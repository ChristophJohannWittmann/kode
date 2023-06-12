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


register(class Crypto {
    /**
     * When a certificate is ussued from letsencrypt, we need to package it up the
     * certificate chain some other values that can be display.  The expiration date
     * and the certificate subject are primary values amongst those.  This is where
     * we take care of that since all of the certificate and crypto stuff belong
     * in this module.
     */
    static async analyzeCertificateChain(certificateChain) {
        let pemChain = certificateChain.split('\n\n');
        let pemChainTemp = await writeTemp(pemChain[0]);

        let result = await execShell(`openssl x509 -in ${pemChainTemp.path} -enddate -noout`);
        let expires = mkTime(result.stdout.split('=')[1]);
        result = await execShell(`openssl x509 -in ${pemChainTemp.path} -subject -noout`);
        let subject = result.stdout;
        
        await pemChainTemp.rm();

        return {
            expires: expires,
            subject: subject,
            created: mkTime(),
            certificate: pemChain,
        };
    }

    /**
     * Creates a new CSR and converts it from PEM to DER format.  DER format is
     * what's needed by ACME / letsencrypt.  This particular implementation uses
     * openssl and the node child-process module.  We write files and then use
     * openssl command-line features in a shell to perform our crypto functions.
     * The result of this function is the returned promises's resolution.
     */
    static async createCsr(opts) {
        let csrTemp;
        let derTemp;
        let pkeyTemp;

        try {
            csrTemp = await writeTemp('');
            pkeyTemp = await writeTemp(opts.privateKey);

            let subj = `/C=${opts.country}/ST=${opts.state}/L=${opts.locale}/O=${opts.org}/CN=${opts.hostname}`;
            await execShell(`openssl req -new -key ${pkeyTemp.path} -out ${csrTemp.path} -days ${opts.days} -subj "${subj}"`);

            if (opts.der) {
                derTemp = await writeTemp('');
                await execShell(`openssl req -in ${csrTemp.path} -out ${derTemp.path} -outform DER`);
                return await derTemp.read();
            }
            else {
                return (await csrTemp.read()).toString();
            }
        }
        finally {
            csrTemp ? await csrTemp.rm() : false;
            derTemp ? await derTemp.rm() : false;
            pkeyTemp ? await pkeyTemp.rm() : false;
        }
    };

    /*****
     * Generates an RSA public key pair with a legth of 4096 bits.  The returned
     * value is an object containing both the public and private keys in PEM
     * format.  This is exactly what's used by the framework for TSL crypto and
     * for TLS certificates.
    *****/
    static decodeBase64Url(base64url, type) {
        let base64 = base64url.replaceAll('-', '+').replaceAll('_', '/');

        switch (base64.Length % 4)
        {
            case 0: break;
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }

        if (type == 'object') {
            return fromStdJson(mkBuffer(base64, 'base64').toString());
        }
        else if (type == 'base64') {
            return base64;
        }
        else {
            return mkBuffer(base64, 'base64').toString();
        }
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
        if (value instanceof Buffer) {
            return value.toString('base64')
                .split('=')[0]
                .replaceAll('+', '-')
                .replaceAll('/', '_');
        }
        else if (typeof value == 'object') {
            return mkBuffer(toStdJson(value))
                .toString('base64')
                .split('=')[0]
                .replaceAll('+', '-')
                .replaceAll('/', '_');
        }
        else {
            return mkBuffer(value)
                .toString('base64')
                .split('=')[0]
                .replaceAll('+', '-')
                .replaceAll('/', '_');
        }
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
    static hash(algorithmName, value, encoding) {
        return new Promise((ok, fail) => {
            const hasher = CRYPTO.createHash(algorithmName);
            
            hasher.on('readable', () => {
                let buffer = hasher.read();

                if (buffer) {
                    switch (encoding) {
                        case 'base64':
                            ok(buffer.toString('base64'));
                            break;
                            
                        case 'base64url':
                            ok(
                                buffer.toString('base64').split('=')[0]
                                .replace(/[+]/g, '-').replace(/[\/]/g, '_')
                            );
                            break;
                            
                        case 'hex':
                            ok(buffer.toString('hex'));
                            break;

                        default:
                            ok(buffer);
                            break;
                    }
                }
            });

            if (value instanceof Buffer || value instanceof Uint8Array) {
                hasher.write(value);
            }
            else {
                hasher.write(mkBuffer(value));
            }

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
    *****/
    static privateDecrypt(encryptedText, pem) {
    }
    
    /*****
    *****/
    static privateEncrypt(plainText, pem) {
    }
    
    /*****
    *****/
    static publicDecrypt(encryptedText, pem) {
    }
    
    /*****
    *****/
    static publicEncrypt(plainText, pem) {
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
    
    /*****
     * Crypto function to generate a signature based on said content and crypto
     * key.  This uses HMAC and can return varioues encodings depending on what
     * the caller requests.
    *****/
    static signHmac(alg, key, content, encoding) {
        let signer = CRYPTO.createHmac(alg, key);
        signer.update(content);
        let hmac = signer.digest();

        switch (encoding) {
            case 'base64':
                return hmac.toString('base64');
                
            case 'base64url':
                return hmac.toString('base64').split('=')[0]
                        .replace(/[+]/g, '-').replace(/[\/]/g, '_');
                
            case 'hex':
                return hmac.toString('hex');

            default:
                return hmac;
        }
    }
});
