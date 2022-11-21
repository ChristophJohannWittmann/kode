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
 * An endpoint is the sole handler for a uniquely named message that's sent to
 * a web application.  Beyond the name and handler, a set of permissions are
 * required in order to receive authorization to execute a request.  The
 * permissions arguments specify what those permissions are.  There is also
 * a special permission called "nosession", which marks an endpoint as being
 * completed unguarded or controlled.  The primary example of an uncontrolled
 * or unguarded enpoint is "SignSelfIn".
*****/
register(function mkEndpoint(name, permission) {
    return `#ENDPOINT#${toJson({ name: name, permission: permission })}`
});


/*****
 * An endpoint container is really a convenience and is generally used to bundle
 * a group of endpoints together into a single container object.  An endpoint
 * container must be instantiated for each instance of a webApp object that's
 * using those endpoints.  While being constructed, all prototype methods that
 * were created with the mkEndpoint() function will be attached to the webApp
 * as an endpoint handler.
*****/
register(class EndpointContainer {
    static unauthorized = Symbol('unauthorized');
    static internalError = Symbol('internalError');
    static ignored = Symbol('ignored');
    static nonOrgPermissions = mkStringSet('system');

    constructor(webapp) {
        for (let propertyName of Object.getOwnPropertyNames(Reflect.getPrototypeOf(this))) {
            if (propertyName.startsWith('#ENDPOINT#')) {
                let endpoint = fromJson(propertyName.substr(10));

                webapp.on(endpoint.name, async req => {
                    try {
                        if (endpoint.permission == 'nosession' || await Ipc.queryPrimary({
                            messageName: '#SessionManagerAuthorize',
                            session: req['#Session'],
                            permission: endpoint.permission,
                            context: req.context ? req.context : null,
                        })) {
                            await this[propertyName](req);

                        }
                        else {
                            return EndpointContainer.unauthorized;
                        }
                    }
                    catch (e) {
                        return EndpointContainer.internalError;
                    }
                });
            }
        }
    }
});
