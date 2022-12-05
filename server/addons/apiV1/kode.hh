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
#ifndef KODE_HH
#define KODE_HH
#define NAPI_VERSION 8

#include <node_api.h>
#include <cstdarg>
#include <cstdint>
#include <cstring>
#include <ctime>
#include <iostream>
#include <list>
#include <map>

using namespace std;

class Base;
class Kode;
class NapiArray;
class NapiBigInt;
class NapiBool;
class NapiBuffer;
class NapiDate;
class NapiExternal;
class NapiFunction;
class NapiList;
class NapiNumber;
class NapiObject;
class NapiPromise;
class NapiString;
class NapiSymbol;
class NapiValue;
class String;


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
class Kode {
    public:
    Kode();
    Kode(napi_env env);
    Kode(napi_env env, napi_callback_info callbackInfo);
    ~Kode();
    size_t argc();
    NapiValue* argv(size_t index);
    void* data();
    napi_env env();
    void* fire(NapiValue* value);
    void* fire(String* code, String* message);
    void* fire(const char* code, const char* message);
    void log(NapiValue* value);
    napi_value result(NapiValue* value);
    NapiValue* that();
    
    private:
    napi_env     _env;
    void*        _data;
    napi_value   _that;
    size_t       _argc;
    napi_value*  _argv;
    list<Base*>  _bases;
    
    friend class Base;
    friend class String;
};


/*****
 * The Base is the conceptual base class for a series of wrappers and other
 * objects whose lifespan depends on a pointer to a Kode instance.  The purpose
 * here is to have a suite of classes and objects that don't leak memory.
*****/
class Base {
    public:
    Base(Kode* kode);
    virtual ~Base();
    napi_env env();
    Kode* kode();
    
    private:
    Kode* _kode;
};


/*****
 * This is a useful utility class that helps us manipulate strings with more of
 * scripting-like simplicity, while still tagging allocated memory with a kode
 * object's lifetime.
*****/
class String : public Base {
    public:
    String(Kode* kode);
    String(String* string);
    String(Kode* kode, const char* cstring);
    String(Kode* kode, const char* string0, const char* stringN);
    String(Kode* kode, napi_value value);
    ~String();
    size_t length();
    String* substr(int32_t index, int32_t length=-1);
    const char* toString();
    
    public:
    static String* concat(String* string, ...);
    static String* concat(Kode* kode, const char* cstring, ...);
    
    private:
    String(Kode* kode, size_t length);
    char* _chars;
};


/*****
 * A napi value refers to the C-language API called Node API, i.e., napi.  At
 * the most fundamental level, the javascript value is the most basic unit. This
 * class provides simplified features for creating and managing lists of node
 * values.
*****/
class NapiList : public Base {
    public:
    NapiList(Kode* kode);
    NapiList(Kode* kode, NapiValue* arg, ...);
    ~NapiList();
    napi_value* array();
    size_t length();
    NapiValue* pop();
    NapiList* push(NapiValue* value);
    NapiList* push(napi_value value);
    NapiValue* shift();
    NapiList* unshift(NapiValue* value);
    NapiList* unshift(napi_value value);

    private:
    list<NapiValue*>  _args;
    list<napi_value*> _arrays;
};


/*****
 * Within javascript, a value is the most fundamental or base class of values.
 * Values can be only one of the following types: undefined, null, boolean,
 * number, bigint, string, function, external, symbol and object.  This is the
 * base class for all of them.  This wrapper is how we wrap the C-languge
 * napi_value pointer and manage to provide simplified features.  Generally,
 * the C-language API is cumbersome, error-prone and difficult to follow.
 * NapiValue is the base class for the rest of the classes in this source file.
*****/
class NapiValue : public Base {
    public:
    virtual ~NapiValue();
    NapiValue* get(const char* key);
    NapiValue* invoke(const char* key);
    NapiValue* invoke(const char* key, NapiList* args);
    NapiValue* invoke(const char* key, NapiValue* arg, ...);
    napi_value napi();
    napi_valuetype napiType();
    const char* napiTypeName();
    
    bool isArray();
    bool isBigInt();
    bool isBool();
    bool isBuffer();
    bool isDate();
    bool isExternal();
    bool isFunction();
    bool isNull();
    bool isNumber();
    bool isObject();
    bool isPromise();
    bool isString();
    bool isSymbol();
    bool isUndefined();
    
    virtual bool toBool();
    virtual time_t toDate();
    virtual double toDouble();
    virtual int32_t toInt32();
    virtual int64_t toInt64();
    virtual const char* toString();
    virtual uint32_t toUint32();
    virtual uint64_t toUint64();
    
    virtual NapiArray* toNapiArray();
    virtual NapiBigInt* toNapiBigInt();
    virtual NapiBool* toNapiBool();
    virtual NapiBuffer* toNapiBuffer();
    virtual NapiDate* toNapiDate();
    virtual NapiExternal* toNapiExternal();
    virtual NapiFunction* toNapiFunction();
    virtual NapiNumber* toNapiNumber();
    virtual NapiObject* toNapiObject();
    virtual NapiSymbol* toNapiSymbol();
    virtual NapiString* toNapiString();
    
    protected:
    NapiValue(Kode* kode);
    NapiValue(Kode* kode, napi_value napiValue);
    
    protected:
    napi_value _napi;
    
    friend class NapiList;
    friend NapiValue* from(Kode*, napi_value);
    friend NapiValue* null(Kode*);
    friend NapiValue* undefined(Kode*);
};

class NapiBigInt : public NapiValue {
    public:
    NapiBigInt(Kode* kode, int64_t bigint);
    NapiBigInt(Kode* kode, uint64_t bigint);
    virtual NapiBigInt* toNapiBigInt();
    virtual int64_t toInt64();
    virtual uint64_t toUint64();
    
    private:
    NapiBigInt(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiBool : public NapiValue {
    public:
    NapiBool(Kode* kode, bool boolean);
    virtual NapiBool* toNapiBool();
    virtual bool toBool();
    
    private:
    NapiBool(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiExternal : public NapiValue {
    public:
    virtual NapiExternal* toNapiExternal();
    
    private:
    NapiExternal(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiFunction : public NapiValue {
    public:
    NapiFunction(Kode* kode, const char* fname, napi_callback cb, void* data=NULL);
    NapiValue* call(NapiValue* that);
    NapiValue* call(NapiValue* that, NapiList* args);
    NapiValue* call(NapiValue* that, NapiValue* arg, ...);
    NapiObject* getPrototype();
    virtual NapiFunction* toNapiFunction();
    
    private:
    NapiFunction(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiNumber : public NapiValue {
    public:
    NapiNumber(Kode* kode, float number);
    NapiNumber(Kode* kode, double number);
    NapiNumber(Kode* kode, int32_t number);
    NapiNumber(Kode* kode, int64_t number);
    NapiNumber(Kode* kode, uint32_t number);
    virtual NapiNumber* toNapiNumber();
    virtual double toDouble();
    virtual int32_t toInt32();
    virtual int64_t toInt64();
    virtual uint32_t toUint32();
    
    private:
    NapiNumber(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiObject : public NapiValue {
    public:
    NapiObject(Kode* kode);
    NapiObject(Kode* kode, const char* json);
    void del(const char* key);
    NapiFunction* getCtor();
    NapiObject* getPrototype();
    bool has(const char* key);
    bool instanceof(NapiFunction* napiFunction);
    NapiArray* listAllPropertyNames();
    NapiArray* listOwnPropertyNames();
    NapiObject* set(const char* key, NapiValue* napiValue);
    NapiObject* set(const char* key, napi_value napi);
    virtual NapiObject* toNapiObject();
    
    public:
    static NapiObject* create(Kode* kode, NapiFunction* ctor);
    static NapiObject* create(Kode* kode, NapiFunction* ctor, NapiList* args);
    static NapiObject* create(Kode* kode, NapiFunction* ctor, NapiValue* args, ...);
    static NapiValue* freeze(Kode* kode, NapiObject* object);
    static NapiValue* seal(Kode* kode, NapiObject* object);
    
    private:
    NapiObject(Kode* kode, napi_value value);
    
    friend class NapiArray;
    friend class NapiBuffer;
    friend class NapiDate;
    friend class NapiFunction;
    friend class NapiPromise;
    friend NapiObject* global(Kode*);
    friend NapiValue*  from(Kode*, napi_value);
};

class NapiString : public NapiValue {
    public:
    NapiString(Kode* kode, const char* string);
    virtual ~NapiString();
    virtual NapiString* toNapiString();
    virtual const char* toString();
    
    private:
    list<char*> _strings;
    
    private:
    NapiString(Kode* kode, napi_value value);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiSymbol : public NapiValue {
    public:
    NapiSymbol(Kode* kode, const char* description);
    virtual NapiSymbol* toNapiSymbol();
    
    private:
    NapiSymbol(Kode* kode, napi_value value);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiArray : public NapiObject {
    public:
    NapiArray(Kode* kode);
    NapiArray(Kode* kode, NapiList* elements);
    NapiArray(Kode* kode, NapiValue* element, ...);
    NapiArray(Kode* kode, time_t element, ...);
    NapiArray(Kode* kode, double element, ...);
    NapiArray(Kode* kode, int32_t element, ...);
    NapiArray(Kode* kode, int64_t element, ...);
    NapiArray(Kode* kode, String* element, ...);
    NapiArray(Kode* kode, const char* element, ...);
    NapiArray(Kode* kode, uint32_t element, ...);
    NapiArray(Kode* kode, uint64_t element, ...);
    
    NapiValue* elementAt(int32_t index);
    int32_t length();
    NapiValue* pop();
    NapiArray* push(napi_value element);
    NapiArray* push(NapiValue* element);
    NapiArray* set(int32_t index, napi_value element);
    NapiArray* set(int32_t index, NapiValue* element);
    NapiValue* shift();
    NapiArray* unshift(napi_value element);
    NapiArray* unshift(NapiValue* element);
    
    virtual NapiArray* toNapiArray();
    
    private:
    NapiArray(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiBuffer : public NapiObject {
    public:
    NapiBuffer(Kode* kode, size_t length);
    NapiBuffer(Kode* kode, size_t length, void* data);
    
    void* data();
    size_t length();
    virtual NapiBuffer* toNapiBuffer();
    void zero();
    
    int8_t getInt8(size_t offset);
    uint8_t getUint8(size_t offset);
    int16_t getInt16BE(size_t offset);
    int16_t getInt16LE(size_t offset);
    uint16_t getUint16BE(size_t offset);
    uint16_t getUint16LE(size_t offset);
    int32_t getInt32BE(size_t offset);
    int32_t getInt32LE(size_t offset);
    uint32_t getUint32BE(size_t offset);
    uint32_t getUint32LE(size_t offset);
    int64_t getInt64BE(size_t offset);
    int64_t getInt64LE(size_t offset);
    uint64_t getUint64BE(size_t offset);
    uint64_t getUint64LE(size_t offset);
    
    NapiBuffer* setInt8(size_t offset, int8_t value);
    NapiBuffer* setUint8(size_t offset, uint8_t value);
    NapiBuffer* setInt16BE(size_t offset, int16_t value);
    NapiBuffer* setInt16LE(size_t offset, int16_t value);
    NapiBuffer* setUint16BE(size_t offset, uint16_t value);
    NapiBuffer* setUint16LE(size_t offset, uint16_t value);
    NapiBuffer* setInt32BE(size_t offset, int32_t value);
    NapiBuffer* setInt32LE(size_t offset, int32_t value);
    NapiBuffer* setUint32BE(size_t offset, uint32_t value);
    NapiBuffer* setUint32LE(size_t offset, uint32_t value);
    NapiBuffer* setInt64BE(size_t offset, int64_t value);
    NapiBuffer* setInt64LE(size_t offset, int64_t value);
    NapiBuffer* setUint64BE(size_t offset, uint64_t value);
    NapiBuffer* setUint64LE(size_t offset, uint64_t value);
    
    public:
    static NapiBuffer* fromHex(Kode* kode, const char* hex);
    static NapiBuffer* fromString(Kode* kode, const char* string);
    
    private:
    NapiBuffer(Kode* kode, napi_value napi);
    void endian();
    
    private:
    bool   _be;
    void*  _data;
    size_t _length;
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiDate : public NapiObject {
    public:
    NapiDate(Kode* kode, time_t sinceEpoch);
    NapiDate(Kode* kode, double sinceEpoch);
    NapiDate(Kode* kode, bool utc, int32_t part, ...);
    NapiString* toIsoString();
    NapiString* toLocaleString();
    NapiString* toLocaleDateString();
    NapiString* toLocaleTimeString();
    virtual NapiDate* toNapiDate();
    
    private:
    NapiDate(Kode* kode, napi_value napi);
    
    friend NapiValue* from(Kode*, napi_value);
};

class NapiPromise : public NapiObject {
    public:
    NapiPromise(Kode* kode);
    NapiPromise(Kode* kode, napi_value promise, napi_deferred deferred);
    napi_deferred deferred();
    void reject(NapiValue* value);
    void resolve(NapiValue* value);
    
    private:
    napi_deferred _deferred;
};

NapiValue*  from(Kode* kode, napi_value napi);
NapiObject* global(Kode* kode);
NapiValue*  global(Kode* kode, const char* key);
NapiValue*  null(Kode* kode);
NapiValue*  undefined(Kode* kode);


#endif
