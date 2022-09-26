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
#include <kode.hh>


/*****
 * The Kode class is like a handle and/or memory manager for NodeJS addonts.
 * In generate, for each addon binary function call, you need to create a kode
 * instance, which is used until the thread of that call is done.  The kode
 * argument is required by virtually all of the infrastructure class's ctors.
 * One purpose is to accept and decode passed parameters from the javascript
 * caller.  Another purpose is to ensure that all objects during the function
 * call allocate memory using the kode object, which will then free everything
 * up when code is destroyed.  That is our approach to ensuring there are no
 * memory leaks.
*****/
Kode::Kode() {
    _env = NULL;
    _argc = 0;
    _argv = NULL;
    _that = NULL;
    _data = NULL;
}

Kode::Kode(napi_env env) {
    _env = env;
    _argc = 0;
    _argv = NULL;
    _that = NULL;
    _data = NULL;
}

Kode::Kode(napi_env env, napi_callback_info callbackInfo) {
    _env = env;
    
    if (callbackInfo) {
        napi_get_cb_info(_env, callbackInfo, &_argc, NULL, NULL, NULL);
        _argv = new napi_value[_argc];
        napi_get_cb_info(_env, callbackInfo, &_argc, _argv, &_that, &_data);
    }
}

Kode::~Kode() {
    for (auto at = _bases.begin(); at != _bases.end(); ++at) {
        delete *at;
    }
    
    delete[] _argv;
}

size_t Kode::argc() {
    return _argc;
}

NapiValue* Kode::argv(size_t index) {
    return from(this, _argv[index]);
}

void* Kode::data() {
    return _data;
}

napi_env Kode::env() {
    return _env;
}

void* Kode::fire(NapiValue* value) {
    napi_throw(_env, value->napi());
    return NULL;
}

void* Kode::fire(String* code, String* message) {
    napi_throw_error(_env, (const char*)code, (const char*)message);
    return NULL;
}

void* Kode::fire(const char* code, const char* message) {
    napi_throw_error(_env, code, message);
    return NULL;
}

void Kode::log(NapiValue* value) {
    auto g = global(this);
    auto console = g->get("console")->toNapiObject();
    auto log = console->get("log")->toNapiFunction();
    log->call(g, value, NULL);
}

napi_value Kode::result(NapiValue* value) {
    return value->napi();
}

NapiValue* Kode::that() {
    return from(this, _that);
}


/*****
 * The Base is the conceptual base class for a series of wrappers and other
 * objects whose lifespan depends on a pointer to a Kode instance.  The purpose
 * here is to have a suite of classes and objects that don't leak memory.
*****/
Base::Base(Kode* kode) {
    _kode = kode;
    _kode->_bases.push_back(this);
}

Base::~Base() {
}

napi_env Base::env() {
    return _kode->_env;
}

Kode* Base::kode() {
    return _kode;
}


/*****
 * This is a useful utility class that helps us manipulate strings with more of
 * scripting-like simplicity, while still tagging allocated memory with a kode
 * object's lifetime.
*****/
String::String(Kode* kode) : Base(kode) {
    _chars = new char[0];
}

String::String(String* string) : Base(string->kode()) {
    _chars = new char[string->length() + 1];
    strcpy(_chars, string->_chars);
}

String::String(Kode* kode, const char* cstring) : Base(kode) {
    _chars = new char[strlen(cstring)+1];
    strcpy(_chars, cstring);
}

String::String(Kode* kode, const char* string0, const char* stringN) : Base(kode) {
    size_t length = stringN - string0 + 1;
    _chars = new char[length+1];
    strncpy(_chars, string0, length);
    _chars[length] = 0;
}

String::String(Kode* kode, napi_value value) : Base(kode) {
    size_t length;
    napi_get_value_string_utf8(kode->env(), value, NULL, NAPI_AUTO_LENGTH, &length);
    _chars = new char[length + 1];
    napi_get_value_string_utf8(kode->env(), value, _chars, length+1, &length);
}

String::String(Kode* kode, size_t length) : Base(kode) {
    _chars = new char[length + 1];
}

String:: ~String() {
    delete[] _chars;
}

size_t String::length() {
    return strlen(_chars);
}

String* String::substr(int32_t index, int32_t length) {
    String* substr = new String(kode(), length);
    strcpy(substr->_chars, &_chars[index]);
    return substr;
}

const char* String::toString() {
    return _chars;
}

String* String::concat(String* string, ...) {
    list<String*> strings;
    size_t length = 0;
    
    va_list arglist;
    va_start(arglist, string);
    Kode* kode = string->kode();
    
    while (string) {
        strings.push_back(string);
        length += string->length();
        string = va_arg(arglist, String*);
    }
    
    va_end(arglist);
    String* combined = new String(kode, length+1);
    combined->_chars[0] = 0;
    
    for (list<String*>::iterator at = strings.begin(); at != strings.end(); ++at) {
        strcat(combined->_chars, (*at)->_chars);
    }
    
    return combined;
}

String* String::concat(Kode* kode, const char* cstring, ...) {
    list<const char*> cstrings;
    size_t length = 0;
    
    va_list arglist;
    va_start(arglist, cstring);
    
    while (cstring) {
        cstrings.push_back(cstring);
        length += strlen(cstring);
        cstring = va_arg(arglist, const char*);
    }
    
    va_end(arglist);
    String* string = new String(kode, length+1);
    string->_chars[0] = 0;
    
    for (list<const char*>::iterator at = cstrings.begin(); at != cstrings.end(); ++at) {
        strcat(string->_chars, *at);
    }
    
    return string;
}


/*****
 * A napi value refers to the C-language API called Node API, i.e., napi.  At
 * the most fundamental level, the javascript value is the most basic unit. This
 * class provides simplified features for creating and managing lists of node
 * values.
*****/
NapiList::NapiList(Kode* kode) : Base(kode) {
}

NapiList::NapiList(Kode* kode, NapiValue* arg, ...) : Base(kode) {
    va_list arglist;
    va_start(arglist, arg);
    
    while (arg) {
        _args.push_back(arg);
        arg = va_arg(arglist, NapiValue*);
    }
    
    va_end(arglist);
}

NapiList::~NapiList() {
    for (auto at = _arrays.begin(); at != _arrays.end(); ++at) {
        delete[] *at;
    }
}

napi_value* NapiList::array() {
    size_t index = 0;
    size_t length = _args.size();
    auto array = new napi_value[length];
    _arrays.push_back(array);
    
    for (auto at = _args.begin(); at != _args.end(); ++at) {
        array[index++] = (*at)->napi();
    }
    
    return array;
}

size_t NapiList::length() {
    return _args.size();
}

NapiValue* NapiList::pop() {
    auto value = _args.back();
    _args.pop_back();
    return value;
}

NapiList* NapiList::push(NapiValue* arg) {
    _args.push_back(arg);
    return this;
}

NapiList* NapiList::push(napi_value arg) {
    _args.push_back(new NapiValue(kode(), arg));
    return this;
}

NapiValue* NapiList::shift() {
    auto value = _args.front();
    _args.pop_front();
    return value;
}

NapiList* NapiList::unshift(NapiValue* arg) {
    _args.push_front(arg);
    return this;
}

NapiList* NapiList::unshift(napi_value arg) {
    _args.push_front(new NapiValue(kode(), arg));
    return this;
}


/*****
 * Within javascript, a value is the most fundamental or base class of values.
 * Values can be only one of the following types: undefined, null, boolean,
 * number, bigint, string, function, external, symbol and object.  This is the
 * base class for all of them.  This wrapper is how we wrap the C-languge
 * napi_value pointer and manage to provide simplified features.  Generally,
 * the C-language API is cumbersome, error-prone and difficult to follow.
 * NapiValue is the base class for the rest of the classes in this source file.
*****/
NapiValue::NapiValue(Kode* kode) : Base(kode) {
    _napi = NULL;
}

NapiValue::NapiValue(Kode* kode, napi_value napiValue) : Base(kode) {
    _napi = napiValue;
}

NapiValue::~NapiValue() {
}

NapiValue* NapiValue::get(const char* key) {
    napi_value napi;
    napi_get_named_property(kode()->env(), _napi, key, &napi);
    return from(kode(), napi);
}

napi_value NapiValue::napi() {
    return _napi;
}

napi_valuetype NapiValue::napiType() {
    napi_valuetype type;
    napi_typeof(env(), _napi, &type);
    return type;
}

const char* NapiValue::napiTypeName() {
    switch (napiType()) {
        case napi_undefined:
            return "undefined";

        case napi_null:
            return "null";

        case napi_boolean:
            return "bool";

        case napi_number:
            return "number";

        case napi_string:
            return "string";

        case napi_symbol:
            return "symbol";

        case napi_object:
            return "object";

        case napi_function:
            return "function";

        case napi_external:
            return "external";

        case napi_bigint:
            return "bigint";
    }
}

NapiValue* NapiValue::invoke(const char* key) {
    return get(key)->toNapiFunction()->call(this);
}

NapiValue* NapiValue::invoke(const char* key, NapiList* args) {
    return get(key)->toNapiFunction()->call(this, args);
}

NapiValue* NapiValue::invoke(const char* key, NapiValue* arg, ...) {
    auto args = new NapiList(kode());
    
    va_list arglist;
    va_start(arglist, arg);
    
    while (arg) {
        args->push(arg);
        arg = va_arg(arglist, NapiValue*);
    }
    
    va_end(arglist);
    return get(key)->toNapiFunction()->call(this, args);
}

bool NapiValue::isArray() {
    bool result;
    napi_is_array(env(), _napi, &result);
    return result;
}

bool NapiValue::isBigInt() {
    return napiType() == napi_bigint;
}

bool NapiValue::isBool() {
    return napiType() == napi_boolean;
}

bool NapiValue::isBuffer() {
    if (napiType() == napi_object) {
        NapiFunction* buffer = static_cast<NapiFunction*>(global(kode())->get("Buffer"));
        return static_cast<NapiObject*>(this)->instanceof(buffer);
    }
    
    return false;
}

bool NapiValue::isDate() {
    if (napiType() == napi_object) {
        NapiFunction* buffer = static_cast<NapiFunction*>(global(kode())->get("Date"));
        return static_cast<NapiObject*>(this)->instanceof(buffer);
    }
    
    return false;
}

bool NapiValue::isExternal() {
    return napiType() == napi_external;
}

bool NapiValue::isFunction() {
    return napiType() == napi_function;
}

bool NapiValue::isNull() {
    return napiType() == napi_null;
}

bool NapiValue::isNumber() {
    return napiType() == napi_number;
}

bool NapiValue::isObject() {
    return napiType() == napi_object;
}

bool NapiValue::isPromise() {
    bool isPromise;
    napi_is_promise(kode()->env(), _napi, &isPromise);
    return isPromise;
}

bool NapiValue::isString() {
    return napiType() == napi_string;
}

bool NapiValue::isSymbol() {
    return napiType() == napi_symbol;
}

bool NapiValue::isUndefined() {
    return napiType() == napi_undefined;
}

bool NapiValue::toBool() {
    kode()->fire("NapiValue", "Value cannot be converted to boolean.");
    return false;
}

time_t NapiValue::toDate() {
    kode()->fire("NapiValue", "Value cannot be converted to time_t.");
    return 0;
}

double NapiValue::toDouble() {
    kode()->fire("NapiValue", "Value cannot be converted to double.");
    return 0.0;
}

int32_t NapiValue::toInt32() {
    kode()->fire("NapiValue", "Value cannot be converted to int32_t.");
    return 0;
}

int64_t NapiValue::toInt64() {
    kode()->fire("NapiValue", "Value cannot be converted to int64_t.");
    return 0;
}

const char* NapiValue::toString() {
    return invoke("toString")->toNapiString()->toString();
}

uint32_t NapiValue::toUint32() {
    kode()->fire("NapiValue", "Value cannot be converted to uint32_t.");
    return 0;
}

uint64_t NapiValue::toUint64() {
    kode()->fire("NapiValue", "Value cannot be converted to uint64_t.");
    return 0;
}

NapiArray* NapiValue::toNapiArray() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiArray*.");
    return NULL;
}

NapiBigInt* NapiValue::toNapiBigInt() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiBigInt*.");
    return NULL;
}

NapiBool* NapiValue::toNapiBool() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiBool*.");
    return NULL;
}

NapiBuffer* NapiValue::toNapiBuffer() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiBuffer*.");
    return NULL;
}

NapiDate* NapiValue::toNapiDate() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiDate*.");
    return NULL;
}

NapiExternal* NapiValue::toNapiExternal() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiExternal*.");
    return NULL;
}

NapiFunction* NapiValue::toNapiFunction() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiFunction*.");
    return NULL;
}

NapiNumber* NapiValue::toNapiNumber() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiNumber*.");
    return NULL;
}

NapiObject* NapiValue::toNapiObject() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiObject*.");
    return NULL;
}

NapiSymbol* NapiValue::toNapiSymbol() {
    kode()->fire("NapiValue", "Value cannot be converted to NapiSymbol*.");
    return NULL;
}

NapiString* NapiValue::toNapiString() {
    return invoke("toString")->toNapiString();
}


/*****
 * BigInt
*****/
NapiBigInt::NapiBigInt(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiBigInt::NapiBigInt(Kode* kode, int64_t bigint) : NapiValue(kode) {
    napi_create_bigint_int64(kode->env(), bigint, &_napi);
}

NapiBigInt::NapiBigInt(Kode* kode, uint64_t bigint) : NapiValue(kode) {
    napi_create_bigint_uint64(kode->env(), bigint, &_napi);
}

NapiBigInt* NapiBigInt::toNapiBigInt() {
    return this;
}

int64_t NapiBigInt::toInt64() {
    int64_t value;
    bool lossless;
    napi_get_value_bigint_int64(env(), _napi, &value, &lossless);
    return value;
}

uint64_t NapiBigInt::toUint64() {
    uint64_t value;
    bool lossless;
    napi_get_value_bigint_uint64(env(), _napi, &value, &lossless);
    return value;
}


/*****
 * Boolean
*****/
NapiBool::NapiBool(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiBool::NapiBool(Kode* kode, bool boolean) : NapiValue(kode) {
    napi_get_boolean(kode->env(), boolean, &_napi);
}

NapiBool* NapiBool::toNapiBool() {
    return this;
}

bool NapiBool::toBool() {
    bool value;
    napi_get_value_bool(env(), _napi, &value);
    return value;
}


/*****
 * External
*****/
NapiExternal::NapiExternal(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiExternal* NapiExternal::toNapiExternal() {
    return this;
}


/*****
 * Function
*****/
NapiFunction::NapiFunction(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiFunction::NapiFunction(Kode* kode, const char* name, napi_callback cb, void* data) : NapiValue(kode) {
    napi_create_function(kode->env(), name, NAPI_AUTO_LENGTH, cb, data, &_napi);
}

NapiValue* NapiFunction::call(NapiValue* that) {
    napi_value result;

    napi_call_function(
        kode()->env(),
        that->napi(),
        napi(),
        0,
        NULL,
        &result
    );
    
    return from(kode(), result);
}

NapiValue* NapiFunction::call(NapiValue* that, NapiList* args) {
    napi_value result;

    napi_call_function(
        kode()->env(),
        that->napi(),
        napi(),
        args->length(),
        args->array(),
        &result
    );
    
    return from(kode(), result);
}

NapiValue* NapiFunction::call(NapiValue* that, NapiValue* arg, ...) {
    napi_value result;
    auto args = new NapiList(kode());
    
    va_list arglist;
    va_start(arglist, arg);
    
    while (arg) {
        args->push(arg);
        arg = va_arg(arglist, NapiValue*);
    }
    
    va_end(arglist);

    napi_call_function(
        kode()->env(),
        that->napi(),
        napi(),
        args->length(),
        args->array(),
        &result
    );
    
    return from(kode(), result);
}

NapiObject* NapiFunction::getPrototype() {
    napi_value prototype;
    napi_get_prototype(kode()->env(), _napi, &prototype);
    return new NapiObject(kode(), prototype);
}

NapiFunction* NapiFunction::toNapiFunction() {
    return this;
}


/*****
 * Number
*****/
NapiNumber::NapiNumber(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiNumber::NapiNumber(Kode* kode, float number) : NapiValue(kode) {
    napi_create_double(kode->env(), number, &_napi);
}

NapiNumber::NapiNumber(Kode* kode, double number) : NapiValue(kode) {
    napi_create_double(kode->env(), number, &_napi);
}

NapiNumber::NapiNumber(Kode* kode, int32_t number) : NapiValue(kode) {
    napi_create_int32(kode->env(), number, &_napi);
}

NapiNumber::NapiNumber(Kode* kode, int64_t number) : NapiValue(kode) {
    napi_create_int64(kode->env(), number, &_napi);
}

NapiNumber::NapiNumber(Kode* kode, uint32_t number) : NapiValue(kode) {
    napi_create_uint32(kode->env(), number, &_napi);
}

NapiNumber* NapiNumber::toNapiNumber() {
    return this;
}

double NapiNumber::toDouble() {
    double value;
    napi_get_value_double(env(), _napi, &value);
    return value;
}

int32_t NapiNumber::toInt32() {
    int32_t value;
    napi_get_value_int32(kode()->env(), _napi, &value);
    return value;
}

int64_t NapiNumber::toInt64() {
    int64_t value;
    napi_get_value_int64(kode()->env(), _napi, &value);
    return value;
}

uint32_t NapiNumber::toUint32() {
    uint32_t value;
    napi_get_value_uint32(kode()->env(), _napi, &value);
    return value;
}


/*****
 * Object
*****/
NapiObject::NapiObject(Kode* kode) : NapiValue(kode) {
    napi_create_object(kode->env(), &_napi);
}

NapiObject::NapiObject(Kode* kode, const char* json) : NapiValue(kode) {
    auto fromJson = global(kode)->get("$fromJson")->toNapiFunction();
    _napi = fromJson->call(global(kode), new NapiString(kode, json), NULL)->napi();
}

NapiObject::NapiObject(Kode* kode, napi_value napiValue) : NapiValue(kode, napiValue) {
}

void NapiObject::del(const char* key) {
    bool result;
    auto napiKey = new NapiString(kode(), key);
    napi_delete_property(kode()->env(), _napi, napiKey->napi(), &result);
}

NapiFunction* NapiObject::getCtor() {
    auto getPrototypeOf = global(kode(), "Reflect")->toNapiObject()->get("getPrototypeOf")->toNapiFunction();
    auto prototype = getPrototypeOf->call(global(kode()), this, NULL)->toNapiObject();
    return prototype->get("constructor")->toNapiFunction();
}

NapiObject* NapiObject::getPrototype() {
    auto getPrototypeOf = global(kode(), "Reflect")->toNapiObject()->get("getPrototypeOf")->toNapiFunction();
    return getPrototypeOf->call(global(kode()), this, NULL)->toNapiObject();
}

bool NapiObject::has(const char* key) {
    bool result;
    napi_has_named_property(kode()->env(), _napi, key, &result);
    return result;
}

bool NapiObject::instanceof(NapiFunction* napiFunction) {
    bool result;
    napi_instanceof(kode()->env(), _napi, napiFunction->napi(), &result);
    return result;
}

NapiArray* NapiObject::listAllPropertyNames() {
    napi_value names;
    
    napi_get_all_property_names(
        kode()->env(),
        _napi,
        napi_key_include_prototypes,
        napi_key_all_properties,
        napi_key_keep_numbers,
        &names
    );
    
    return from(kode(), names)->toNapiArray();
}

NapiArray* NapiObject::listOwnPropertyNames() {
    napi_value names;
    napi_get_property_names(kode()->env(), _napi, &names);
    return from(kode(), names)->toNapiArray();
}

NapiObject* NapiObject::set(const char* key, NapiValue* napiValue) {
    napi_set_named_property(kode()->env(), _napi, key, napiValue->napi());
    return this;
}

NapiObject* NapiObject::set(const char* key, napi_value napi) {
    napi_set_named_property(kode()->env(), _napi, key, napi);
    return this;
}

NapiObject* NapiObject::toNapiObject() {
    return this;
}

NapiObject* NapiObject::create(Kode* kode, NapiFunction* ctor) {
    napi_value instance;
    napi_new_instance(kode->env(), ctor->napi(), 0, NULL, &instance);
    return from(kode, instance)->toNapiObject();
}

NapiObject* NapiObject::create(Kode* kode, NapiFunction* ctor, NapiList* args) {
    napi_value instance;
    napi_new_instance(kode->env(), ctor->napi(), args->length(), args->array(), &instance);
    return from(kode, instance)->toNapiObject();
}

NapiObject* NapiObject::create(Kode* kode, NapiFunction* ctor, NapiValue* arg, ...) {
    napi_value instance;
    list<NapiValue*> args;
    
    va_list arglist;
    va_start(arglist, arg);
    
    while (arg) {
        args.push_back(arg);
        arg = va_arg(arglist, NapiValue*);
    }
    
    va_end(arglist);
    NapiList* napis = new NapiList(kode);
    
    for (auto at = args.begin(); at != args.end(); ++at) {
        napis->push(*at);
    }
    
    napi_new_instance(kode->env(), ctor->napi(), napis->length(), napis->array(), &instance);
    return from(kode, instance)->toNapiObject();
}

NapiValue* NapiObject::freeze(Kode* kode, NapiObject* object) {
    auto freeze = global(kode, "Object")->get("freeze")->toNapiFunction();
    return freeze->call(global(kode), object, NULL);
}

NapiValue* NapiObject::seal(Kode* kode, NapiObject* object) {
    auto seal = global(kode, "Object")->get("seal")->toNapiFunction();
    return seal->call(global(kode), object, NULL);
}


/*****
 * String
*****/
NapiString::NapiString(Kode* kode, napi_value value) : NapiValue(kode, value) {
}

NapiString::NapiString(Kode* kode, const char* string) : NapiValue(kode) {
    napi_create_string_utf8(kode->env(), string, NAPI_AUTO_LENGTH, &_napi);
}

NapiString::~NapiString() {
    for (auto it = _strings.begin(); it != _strings.end(); ++it) {
        delete[] *it;
    }
}

NapiString* NapiString::toNapiString() {
    return this;
}

const char* NapiString::toString() {
    char* chars;
    size_t length;
    napi_get_value_string_utf8(kode()->env(), _napi, NULL, NAPI_AUTO_LENGTH, &length);
    chars = new char[length + 1];
    napi_get_value_string_utf8(kode()->env(), _napi, chars, length+1, &length);
    _strings.push_back(chars);
    return chars;
}


/*****
 * Symbol
*****/
NapiSymbol::NapiSymbol(Kode* kode, napi_value napi) : NapiValue(kode, napi) {
}

NapiSymbol::NapiSymbol(Kode* kode, const char* description) : NapiValue(kode) {
    auto napiDescription = new NapiString(kode, description);
    napi_create_symbol(kode->env(), napiDescription->napi(), &_napi);
}

NapiSymbol* NapiSymbol::toNapiSymbol() {
    return this;
}


/*****
*****/
NapiArray::NapiArray(Kode* kode, napi_value napi) : NapiObject(kode, napi) {
}

NapiArray::NapiArray(Kode* kode) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
}

NapiArray::NapiArray(Kode* kode, NapiList* elements) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    napi_value* array = elements->array();
    
    for (size_t i = 0; i < elements->length(); i++) {
        auto key = new NapiNumber(kode, (int32_t)i);
        napi_set_property(kode->env(), _napi, key->napi(), array[i]);
    }
}

NapiArray::NapiArray(Kode* kode, NapiValue* element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        napi_set_property(kode->env(), _napi, key->napi(), element->napi());
        element = va_arg(arglist, NapiValue*);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, time_t element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiBigInt(kode, (int64_t)element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, time_t);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, double element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiNumber(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, double);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, int32_t element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiNumber(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, int32_t);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, int64_t element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiBigInt(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, int64_t);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, String* element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiString(kode, element->toString());
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, String*);
    }
    
    va_end(arglist);
}


NapiArray::NapiArray(Kode* kode, const char* element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiString(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, const char*);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, uint32_t element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiNumber(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, uint32_t);
    }
    
    va_end(arglist);
}

NapiArray::NapiArray(Kode* kode, uint64_t element, ...) : NapiObject(kode) {
    napi_create_array(kode->env(), &_napi);
    size_t index = 0;
    
    va_list arglist;
    va_start(arglist, element);
    
    while (element) {
        auto key = new NapiNumber(kode, (int32_t)index++);
        auto value = new NapiBigInt(kode, element);
        napi_set_property(kode->env(), _napi, key->napi(), value->napi());
        element = va_arg(arglist, uint64_t);
    }
    
    va_end(arglist);
}

NapiValue* NapiArray::elementAt(int32_t index) {
    napi_value element;
    auto key = new NapiNumber(kode(), index);
    napi_get_property(kode()->env(), _napi, key->napi(), &element);
    return from(kode(), element);
}

int32_t NapiArray::length() {    
    return this->get("length")->toNapiNumber()->toInt32();
}

NapiValue* NapiArray::pop() {
    return invoke("pop");
}

NapiArray* NapiArray::push(napi_value element) {
    invoke("push", from(kode(), element), NULL);
    return this;
}

NapiArray* NapiArray::push(NapiValue* element) {
    invoke("push", element, NULL);
    return this;
}

NapiArray* NapiArray::set(int32_t index, napi_value element) {
    auto napiIndex = new NapiNumber(kode(), index);
    napi_set_property(kode()->env(), _napi, napiIndex->napi(), element);
    return this;
}

NapiArray* NapiArray::set(int32_t index, NapiValue* element) {
    auto napiIndex = new NapiNumber(kode(), index);
    napi_set_property(kode()->env(), _napi, napiIndex->napi(), element->napi());
    return this;
}

NapiValue* NapiArray::shift() {
    return invoke("shift");
}

NapiArray* NapiArray::unshift(napi_value element) {
    invoke("unshift", from(kode(), element), NULL);
    return this;
}

NapiArray* NapiArray::unshift(NapiValue* element) {
    invoke("unshift", element, NULL);
    return this;
}

NapiArray* NapiArray::toNapiArray() {
    return this;
}


/*****
*****/
NapiBuffer::NapiBuffer(Kode* kode, napi_value napi) : NapiObject(kode, napi) {
    napi_get_buffer_info(kode->env(), _napi, &_data, &_length);
    endian();
}

NapiBuffer::NapiBuffer(Kode* kode, size_t length) : NapiObject(kode) {
    _length = length;
    napi_create_buffer(kode->env(), length, &_data, &_napi);
    endian();
}

NapiBuffer::NapiBuffer(Kode* kode, size_t length, void* data) : NapiObject(kode) {
    _length = length;
    napi_create_buffer_copy(kode->env(), length, data, &_data, &_napi);
    endian();
}

void* NapiBuffer::data() {
    return _data;
}

size_t NapiBuffer::length() {
    return _length;
}

NapiBuffer* NapiBuffer::toNapiBuffer() {
    return this;
}

void NapiBuffer::zero() {
    memset(_data, 0, _length);
}

int8_t NapiBuffer::getInt8(size_t offset) {
    int8_t* src = reinterpret_cast<int8_t*>(_data);
    return src[offset];
}

uint8_t NapiBuffer::getUint8(size_t offset) {
    uint8_t* src = reinterpret_cast<uint8_t*>(_data);
    return src[offset];
}

int16_t NapiBuffer::getInt16BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int16_t* src = reinterpret_cast<int16_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        int16_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
        return result;
    }
}

int16_t NapiBuffer::getInt16LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int16_t* src = reinterpret_cast<int16_t*>(&buf[offset]);
    
    if (_be) {
        int16_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

uint16_t NapiBuffer::getUint16BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint16_t* src = reinterpret_cast<uint16_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        uint16_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
        return result;
    }
}

uint16_t NapiBuffer::getUint16LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint16_t* src = reinterpret_cast<uint16_t*>(&buf[offset]);
    
    if (_be) {
        uint16_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

int32_t NapiBuffer::getInt32BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int32_t* src = reinterpret_cast<int32_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        int32_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
        return result;
    }
}

int32_t NapiBuffer::getInt32LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int32_t* src = reinterpret_cast<int32_t*>(&buf[offset]);
    
    if (_be) {
        int32_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

uint32_t NapiBuffer::getUint32BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint32_t* src = reinterpret_cast<uint32_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        uint32_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
        return result;
    }
}

uint32_t NapiBuffer::getUint32LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint32_t* src = reinterpret_cast<uint32_t*>(&buf[offset]);
    
    if (_be) {
        uint32_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

int64_t NapiBuffer::getInt64BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int64_t* src = reinterpret_cast<int64_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        int64_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
        return result;
    }
}

int64_t NapiBuffer::getInt64LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    int64_t* src = reinterpret_cast<int64_t*>(&buf[offset]);
    
    if (_be) {
        int64_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

uint64_t NapiBuffer::getUint64BE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint64_t* src = reinterpret_cast<uint64_t*>(&buf[offset]);
    
    if (_be) {
        return *src;
    }
    else {
        uint64_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
        return result;
    }
}

uint64_t NapiBuffer::getUint64LE(size_t offset) {
    uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
    uint64_t* src = reinterpret_cast<uint64_t*>(&buf[offset]);
    
    if (_be) {
        uint64_t result;
        uint8_t* dst = reinterpret_cast<uint8_t*>(&result);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
        return result;
    }
    else {
        return *src;
    }
}

NapiBuffer* NapiBuffer::setInt8(size_t offset, int8_t value) {
    int8_t* dst = reinterpret_cast<int8_t*>(_data);
    dst[offset] = value;
    return this;
}

NapiBuffer* NapiBuffer::setUint8(size_t offset, uint8_t value) {
    uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
    dst[offset] = value;
    return this;
}

NapiBuffer* NapiBuffer::setInt16BE(size_t offset, int16_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int16_t* dst = reinterpret_cast<int16_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setInt16LE(size_t offset, int16_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int16_t* dst = reinterpret_cast<int16_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint16BE(size_t offset, uint16_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint16_t* dst = reinterpret_cast<uint16_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint16LE(size_t offset, uint16_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint16_t* dst = reinterpret_cast<uint16_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

NapiBuffer* NapiBuffer::setInt32BE(size_t offset, int32_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int32_t* dst = reinterpret_cast<int32_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setInt32LE(size_t offset, int32_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int32_t* dst = reinterpret_cast<int32_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint32BE(size_t offset, uint32_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint32_t* dst = reinterpret_cast<uint32_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[3];
        dst[offset+1] = src[2];
        dst[offset+2] = src[1];
        dst[offset+3] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint32LE(size_t offset, uint32_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[1];
        dst[offset+1] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint32_t* dst = reinterpret_cast<uint32_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

NapiBuffer* NapiBuffer::setInt64BE(size_t offset, int64_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int64_t* dst = reinterpret_cast<int64_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setInt64LE(size_t offset, int64_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        int64_t* dst = reinterpret_cast<int64_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint64BE(size_t offset, uint64_t value) {
    if (_be) {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint64_t* dst = reinterpret_cast<uint64_t*>(&buf[offset]);
        *dst = value;
    }
    else {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
    }

    return this;
}

NapiBuffer* NapiBuffer::setUint64LE(size_t offset, uint64_t value) {
    if (_be) {
        uint8_t* dst = reinterpret_cast<uint8_t*>(_data);
        uint8_t* src = reinterpret_cast<uint8_t*>(&value);
        dst[offset] = src[7];
        dst[offset+1] = src[6];
        dst[offset+2] = src[5];
        dst[offset+3] = src[4];
        dst[offset+4] = src[3];
        dst[offset+5] = src[2];
        dst[offset+6] = src[1];
        dst[offset+7] = src[0];
    }
    else {
        uint8_t* buf = reinterpret_cast<uint8_t*>(_data);
        uint64_t* dst = reinterpret_cast<uint64_t*>(&buf[offset]);
        *dst = value;
    }

    return this;
}

char hexes[] = {
      0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   1,   2,   3,   4,   5,   6,   7,   8,   9,   0,   0,   0,   0,   0,   0,
      0,  10,  11,  12,  13,  14,  15,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,  10,  11,  12,  13,  14,  15,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
};

NapiBuffer* NapiBuffer::fromHex(Kode* kode, const char* hex) {
    int32_t chars = strlen(hex);
    int32_t bytes = chars/2;
    NapiBuffer* buffer = new NapiBuffer(kode, bytes);
    uint8_t* data = (uint8_t*)buffer->data();
    
    for (int32_t i = 0; i < chars; i += 2) {
        data[i/2] = hexes[(int32_t)hex[i]] << 4 | hexes[(int32_t)hex[i+1]];
    }
    
    return buffer;
}

NapiBuffer* NapiBuffer::fromString(Kode* kode, const char* string) {
    uint32_t length = strlen(string);
    return new NapiBuffer(kode, length + 1, (void*)string);
}


void NapiBuffer::endian() {
    uint32_t i = 1;
    char* c = reinterpret_cast<char*>(&i);
    _be = *c ? false : true;
}


/*****
*****/
NapiDate::NapiDate(Kode* kode, napi_value napi) : NapiObject(kode, napi) {
}

NapiDate::NapiDate(Kode* kode, time_t sinceEpoch) : NapiObject(kode) {
    napi_create_date(kode->env(), (double)sinceEpoch, &_napi);
}

NapiDate::NapiDate(Kode* kode, double sinceEpoch) : NapiObject(kode) {
    napi_create_date(kode->env(), sinceEpoch, &_napi);
}

NapiDate::NapiDate(Kode* kode, bool utc, int32_t part, ...) : NapiObject(kode) {
    auto args = new NapiList(kode);
    auto ctor = global(kode)->get("Date")->toNapiFunction();
    
    va_list arglist;
    va_start(arglist, part);
    
    while (part) {
        args->push(new NapiNumber(kode, part));
        part = va_arg(arglist, int32_t);
    }
    
    va_end(arglist);
    
    if (utc) {
        auto utc = ctor->get("UTC")->toNapiFunction()->call(ctor, args)->toNapiNumber();
        _napi = NapiObject::create(kode, ctor, utc, NULL)->napi();
    }
    else {
        _napi = NapiObject::create(kode, ctor, args)->napi();
    }
}

NapiString* NapiDate::toIsoString() {
    return invoke("toISOString")->toNapiString();
}

NapiString* NapiDate::toLocaleString() {
    return invoke("toLocaleString")->toNapiString();
}

NapiString* NapiDate::toLocaleDateString() {
    return invoke("toLocaleDateString")->toNapiString();
}

NapiString* NapiDate::toLocaleTimeString() {
    return invoke("toLocaleTimeString")->toNapiString();
}

NapiDate* NapiDate::toNapiDate() {
    return this;
}


/*****
*****/
NapiPromise::NapiPromise(Kode* kode) : NapiObject(kode) {
    napi_create_promise(env(), &_deferred, &_napi);
}

NapiPromise::NapiPromise(Kode* kode, napi_value promise, napi_deferred deferred) : NapiObject(kode) {
    _napi = promise;
    _deferred = deferred;
}

napi_deferred NapiPromise::deferred() {
    return _deferred;
}

void NapiPromise::reject(NapiValue* value) {
    napi_reject_deferred(env(), _deferred, value->napi());
}

void NapiPromise::resolve(NapiValue* value) {
    napi_resolve_deferred(env(), _deferred, value->napi());
}


/*****
*****/
NapiValue* from(Kode* kode, napi_value napi) {
    napi_valuetype napiType;
    napi_typeof(kode->env(), napi, &napiType);
 
    switch (napiType) {
        case napi_undefined:
            return undefined(kode);
 
        case napi_null:
            return null(kode);
 
        case napi_boolean:
            return new NapiBool(kode, napi);
 
        case napi_number:
            return new NapiNumber(kode, napi);
 
        case napi_string:
            return new NapiString(kode, napi);
 
        case napi_symbol:
            return new NapiSymbol(kode, napi);
 
        case napi_object:
            {
                NapiValue* napiValue = new NapiValue(kode, napi);
 
                if (napiValue->isArray()) {
                    return new NapiArray(kode, napi);
                }
                else if (napiValue->isBuffer()) {
                    return new NapiBuffer(kode, napi);
                }
                else if (napiValue->isDate()) {
                    return new NapiDate(kode, napi);
                }
                else {
                    return new NapiObject(kode, napi);
                }
            }
 
        case napi_function:
            return new NapiFunction(kode, napi);
 
        case napi_external:
            return new NapiExternal(kode, napi);
 
        case napi_bigint:
            return new NapiBigInt(kode, napi);
    }
}


/*****
*****/
NapiObject* global(Kode* kode) {
    napi_value napiValue;
    napi_get_global(kode->env(), &napiValue);
    return new NapiObject(kode, napiValue);
}


/*****
*****/
NapiValue* global(Kode* kode, const char* key) {
    napi_value napiValue;
    napi_value napiGlobal;
    napi_get_global(kode->env(), &napiGlobal);
    napi_get_named_property(kode->env(), napiGlobal, key, &napiValue);
    
    if (napiValue) {
        return from(kode, napiValue);
    }
    else {
        return undefined(kode);
    }
}


/*****
*****/
NapiValue* null(Kode* kode) {
    napi_value napiValue;
    napi_get_null(kode->env(), &napiValue);
    return new NapiValue(kode, napiValue);
}


/*****
*****/
NapiValue* undefined(Kode* kode) {
    napi_value napiValue;
    napi_get_undefined(kode->env(), &napiValue);
    return new NapiValue(kode, napiValue);
}
