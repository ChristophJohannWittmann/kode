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
#include <pg.hh>


/*****
 * PgStatus is a C++ wrapper for the pgConnection pointer.  It's a status in
 * the sense of the Node API.  It's a status in that it's data that's added to
 * a NapiValue in order to maintain a specific internal state.
*****/
class PgStatus {
    public:
    PgStatus(PGconn* pgConn, int binaryMode) {
        _pgConn = pgConn;
        _binaryMode = binaryMode;
    }
    
    int binaryMode() {
        return _binaryMode;
    }
    
    PGconn* pgConn() {
        return _pgConn;
    }
    
    private:
    PGconn* _pgConn;
    int _binaryMode;
};


/*****
 * Make a request to cancel a query that's been started.  There is no postgres
 * guarantee that the request can be cancelled or how long it will take to
 * complete the cancellation.
*****/
napi_value cancel(napi_env env, napi_callback_info callbackInfo) {
    Kode kode(env, callbackInfo);
    
    char errorBuffer[256];
    PgStatus* pgStatus = reinterpret_cast<PgStatus*>(kode.data());
    PGcancel* cancel = pqGetCancel(pgStatus->pgConn());
    pqCancel(cancel, errorBuffer, sizeof(errorBuffer));
    pqFreeCancel(cancel);
    
    return kode.result(null(&kode));
}


/*****
 * Close a PostgreSQL connection with the server.  The PostgreSQL API function
 * pqFinishg() is called to close the connection with the server.  The data is
 * then deleted because it's no longer needed.
*****/
napi_value close(napi_env env, napi_callback_info callbackInfo) {
    Kode kode(env, callbackInfo);
    
    PgStatus* pgStatus = reinterpret_cast<PgStatus*>(kode.data());
    pqFinish(pgStatus->pgConn());
    delete pgStatus;
    
    return kode.result(undefined(&kode));
}


/*****
 * This function is very important for processing results from a query.  It
 * utilizes the resouces of the PgTypeInfo, the PgToNapi_t table, and DBMS
 * function calls to iterate through each row and each column to generate the
 * corresponding results as a NapiArray.
*****/
void pgResultToNapi(Kode* kode, bool binaryMode, PGresult* pgResult, NapiObject* napiResult) {
    int nFields = pqNfields(pgResult);
    napiResult->set("fields", new NapiObject(kode));
    PgTypeInfo* fieldTypeInfo[nFields];
    char** fieldNames = new char*[nFields];
    
    for (int i = 0; i < nFields; i++) {
        auto field = new NapiObject(kode);
        Oid oid = pqFtype(pgResult, i);
        PgTypeInfo* typeInfo;
        
        if (typesByOid.find(oid) == typesByOid.end()) {
            typeInfo = typesByOid[0];
        }
        else {
            typeInfo = typesByOid[oid];
        }
        
        fieldTypeInfo[i] = typeInfo;
        auto fieldName = pqFname(pgResult, i);
        fieldNames[i] = fieldName;
        field->set("fieldName", new NapiString(kode, fieldName));
        field->set("dbmsType", new NapiString(kode, typeInfo->pgName));
        field->set("kodeType", new NapiString(kode, typeInfo->kodeName));
        field->set("isArray", new NapiBool(kode, typeInfo->array));
        napiResult->get("fields")->toNapiObject()->set(pqFname(pgResult, i), field);
    }
    
    int nRows = pqNtuples(pgResult);
    NapiArray* rows = new NapiArray(kode);
    napiResult->set("rows", rows);
    
    for (int rowIndex = 0; rowIndex < nRows; rowIndex++) {
        NapiObject* rowOut = new NapiObject(kode);
        rows->push(rowOut);
        
        for (int fieldIndex = 0; fieldIndex < nFields; fieldIndex++) {
            PgTypeInfo* fieldInfo = fieldTypeInfo[fieldIndex];
            
            if (pqGetIsNull(pgResult, rowIndex, fieldIndex)) {
                rowOut->set(fieldNames[fieldIndex], null(kode));
            }
            else if (!binaryMode) {
                rowOut->set(fieldNames[fieldIndex], fieldInfo->txtToNapi(pgResult, kode, rowIndex, fieldIndex));
            }
            else {
                rowOut->set(fieldNames[fieldIndex], fieldInfo->binToNapi(pgResult, kode, rowIndex, fieldIndex));
            }
        }
    }
    
    delete[] fieldNames;
}


/*****
 * When the server makes a query, this is the function that's called indirectly
 * via from the javascript code perform that query.  The query is sent using
 * the ansyncronous API function.  Another function is called, pqGetResult(), to
 * fetch the complete result.  pqGetResult() returns when the query result is
 * ready to be returned.  After a successful query, this function calls the
 * pgResultToNapi() function to generate a NapiArray containiong the result
 * values.
*****/
napi_value query(napi_env env, napi_callback_info callbackInfo) {
    Kode kode(env, callbackInfo);
    
    PGresult* pgResult;
    PgStatus* pgStatus = reinterpret_cast<PgStatus*>(kode.data());
    
    bool ok = true;
    const char* message = "ok";
    
    auto napiResult = new NapiObject(&kode);
    napiResult->set("ok", new NapiBool(&kode, ok));
    napiResult->set("message", new NapiString(&kode, message));
    napiResult->set("dbmsName", new NapiString(&kode, "postgres"));
    napiResult->set("dbmsVersion", new NapiNumber(&kode, 12));
    
    bool sent = pqSendQueryParams(
        pgStatus->pgConn(),
        kode.argv(0)->toString(),
        0,
        NULL,
        NULL,
        NULL,
        NULL,
        pgStatus->binaryMode()
    );
    
    if (sent) {
        PGresult* previous = NULL;
        pgResult = pqGetResult(pgStatus->pgConn());
        
        while (pgResult) {
            previous = pgResult;
            pgResult = pqGetResult(pgStatus->pgConn());
        }
        
        pgResult = previous;
        
        if (pgResult) {
            auto status = pqResultStatus(pgResult);
            
            switch (status) {
                case PGRES_TUPLES_OK:
                    pgResultToNapi(&kode, pgStatus->binaryMode(), pgResult, napiResult);
                    break;
                
                case PGRES_COMMAND_OK:
                    message = "Empty Result";
                    break;
                
                default:
                    ok = false;
                    message = pqResultErrorMessage(pgResult);
                    break;
            }
        }
        else {
            ok = false;
            message = pqResultErrorMessage(pgResult);
        }
    }
    else {
        ok = false;
        message = "Query string not dispatched";
    }
    
    pqClear(pgResult);
    napiResult->set("ok", new NapiBool(&kode, ok));
    napiResult->set("message", new NapiString(&kode, message));
    return kode.result(napiResult);
}


/*****
 * Connect to the specified PostgreSQL server and database.  What makes this
 * function long is that it parses through the Napi configuration object to
 * get the connection data.  That gets bundeled together as two C-language
 * arrays: (a) parameter names, (b) parameter values.  pqConnect uses these
 * to attempt to authenticate and connect with the server.  If successful,
 * a javascript object is returned with cancel(), query(), and close() functions.
 * Note that the binary PostreSQL connection pointer is stored in each of the
 * function calls as NAPI "hidden" or "status" data.
*****/
napi_value connect(napi_env env, napi_callback_info callbackInfo) {
    Kode kode(env, callbackInfo);
    auto settings = kode.argv(0)->toNapiObject();

    if (!libPq) {
        auto pgPath = settings->get("libPath")->toNapiString();
        auto pqPath = String::concat(&kode, pgPath->toString(), "/lib/libpq", NULL);
        pgInit(pqPath->toString());
    }
    
    bool binaryMode = false;
    
    if (settings->has("binaryMode")) {
        binaryMode = settings->get("binaryMode")->toBool();
    }
    
    ArrayBuilder<const char*>* keywords = new ArrayBuilder<const char*>(&kode);
    ArrayBuilder<const char*>* values = new ArrayBuilder<const char*>(&kode);
    
    if (settings->has("hostname")) {
        keywords->push("host");
        values->push(settings->get("hostname")->toString());
    }
    else if (settings->has("hostaddr")) {
        keywords->push("hostaddr");
        values->push(settings->get("hostaddr")->toString());
    }
    else {
        keywords->push("host");
        values->push("localhost");
    }
    
    if (settings->has("port")) {
        keywords->push("port");
        values->push(settings->get("port")->toNapiNumber()->toString());
    }
    else {
        keywords->push("port");
        values->push("5433");
    }
    
    if (settings->has("database")) {
        keywords->push("dbname");
        values->push(settings->get("database")->toString());
    }
    else {
        keywords->push("dbname");
        values->push(settings->get("postgres")->toString());
    }
    
    if (settings->has("username")) {
        keywords->push("user");
        values->push(settings->get("username")->toString());
    }
    
    if (settings->has("password")) {
        keywords->push("password");
        values->push(settings->get("password")->toString());
    }
    
    PGconn* pgConn = pqConnect(keywords->array(), values->array(), 0);
    PgStatus* pgStatus = new PgStatus(pgConn, binaryMode ? 1 : 0);
    
    auto conn = new NapiObject(&kode);
    conn->set("native", new NapiBigInt(&kode, reinterpret_cast<uint64_t>(pgConn)));
    conn->set("cancel", new NapiFunction(&kode, "cancel", cancel, pgStatus));
    conn->set("query", new NapiFunction(&kode, "query", query, pgStatus));
    conn->set("close", new NapiFunction(&kode, "close", close, pgStatus));
    NapiObject::freeze(&kode, conn);
    return kode.result(conn);
}


/*****
 * When the NAPI module is loaded, there's an initizor function call required
 * to set things up.  That's what this function does.  In essence, the setup
 * is to return an object, PostgreSQL connector client, that can connect to
 * the server and return a connection object.
*****/
static napi_value Init(napi_env env, napi_value napi_exports) {
    Kode kode(env);
    auto exports = from(&kode, napi_exports)->toNapiObject();
    exports->set("connect", new NapiFunction(&kode, "connect", connect));
    return exports->napi();
}


NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
