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
 * All of the text used within the web application framework for all languages
 * by the development team.  Other languages will be added as needed and as
 * requexted by influential end users and developer community organizations.
*****/
register(class WebAppText extends MultilingualText {
    constructor() {
        super({
            // ****************************************************************
            // Forgot
            // ****************************************************************
            fwForgotEmail: {
                en: `Enter email address here`,
            },
            fwForgotInstructions: {
                en: `Enter your email adddress and click "Reset Password Now".  If you have an active account, an email with a password reset link will be sent to you.`,
            },
            fwForgotReset: {
                en: `Reset Password Now`,
            },
            fwForgotSignIn: {
                en: `Back to sign in`,
            },
            fwSignInForgotPassword: {
                en: `Forgot Password`,
            },

            // ****************************************************************
            // SignIn
            // ****************************************************************
            fwSignInPassword: {
                en: `Password`,
            },
            fwSignInSignIn: {
                en: `Sign In`,
            },
            fwSignInUsername: {
                en: `Email`,
            },

            // ****************************************************************
            // Misc
            // ****************************************************************
            fwMiscActive: {
                en: `Active`,
            },
            fwMiscSessionClosed: {
                en: `Your session has been closed.  Please sign in again.`,
            },

            // ****************************************************************
            // Nav
            // ****************************************************************
            fwNavCancel: {
                en: `Cancel`,
            },
            fwNavDone: {
                en: `Done`,
            },
            fwNavSignout: {
                en: `Signout`,
            },

            // ****************************************************************
            // Net
            // ****************************************************************
            fwNetAcme: {
                en: `ACME Provider`,
            },
            fwNetAddress: {
                en: `IP Address`,
            },
            fwNetCert: {
                en: `Certificate`,
            },
            fwNetCertExpires: {
                en: `Expiration`,
            },
            fwNetCertify: {
                en: `Request/Renew TLS Certificate`,
            },
            fwNetCopyKeyPem: {
                en: `Copy Public Key (PEM)`,
            },
            fwNetCreateKeyPair: {
                en: `Create Cryptographic Key Pair`,
            },
            fwNetDomain: {
                en: `Domain`,
            },
            fwNetHost: {
                en: `Host`,
            },
            fwNetInterface: {
                en: `Network Interface`,
            },
            fwNetPrivateKey: {
                en: `Private Key`,
            },
            fwNetPublicKey: {
                en: `Public Key`,
            },
        });
    }
});