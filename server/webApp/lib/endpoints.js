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
 * This is kind of a conveninece constructor for creating a new endpoint for
 * an endpoint container.  In effect, the endpoint method name contains both
 * the endpoint name and it's required permissions.
*****/
register(function mkWebAppEndpoint(name, ...permissions) {
    return `#ENDPOINT#${toJson({ name: name, permissions: permissions })}`
});


/*****
 * Symbols are useful for this class since we don't want to muck up the object's
 * namespace names that are NOT one of the defined endpoints.
*****/
//const authorize = Symbol('authorize');


/*****
 * A web application endpoint is essentially a handler that's assigned to handle
 * a specific WebApp message.  A WebAppEndpointContainer is an instance of an
 * object that is coded to handle one or more endpoints for a single specific
 * WebApp instance.
*****/
register(class WebAppEndpointContainer {
    static unauthorized = Symbol('unauthorized');
    static internalError = Symbol('internalError');
    static ignored = Symbol('ignored');
    static nonOrgPermissions = mkStringSet('system');

    constructor(webapp) {
        for (let propertyName of Object.getOwnPropertyNames(Reflect.getPrototypeOf(this))) {
            if (propertyName.startsWith('#ENDPOINT#')) {
                let endpoint = fromJson(propertyName.substr(10));
                this[`on${endpoint.name}`] = this[propertyName];

                webapp.on(endpoint.name, async req => {
                    try {
                        if (true) {
                        //if (await this[authorize](endpoint, req)) {
                            await this[propertyName](req);
                        }
                        else {
                            return WebAppEndpointContainer.unauthorized;
                        }
                    }
                    catch (e) {
                        return WebAppEndpointContainer.internalError;
                    }
                });
            }
        }
    }

    /*
    async [authorize](endpoint, req) {
        const permissions = mkStringSet(endpoint.permissions);

        if (permissions.has('nosession')) {
            return true;
        }
        else {
            req.session = await Ipc.queryPrimary({
                messageName: '#SessionsGetSession',
                session: req['#Session'],
            });
            
            if (req.session) {
                for (let permission of permissions) {
                    if (!(permission in req.session.grants)) {
                        return false;
                    }

                    if (!WebAppEndpointContainer.nonOrgPermissions.has(permission)) {
                        if (!('permissionOrgOid' in req)) {
                            return false;
                        }

                        if (req.user.orgOid > 0) {
                            if (!req.session.orgs.has(req.permissionOrgOid)) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }
            else {
                return false;
            }
        }
    }
    */
});
