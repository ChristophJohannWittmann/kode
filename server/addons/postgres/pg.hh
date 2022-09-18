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
#include <system.hh>
#include <libpq-fe.h>
#include <arpa/inet.h>


/*****
 * C-language definitions for the PostgreSQL library functions used by this
 * module.  Many of the types are located in the PostgreSQL include directory.
*****/
extern "C" typedef PGconn* (*PQconnectdbParams_t)(const char**, const char**, int32_t);
extern "C" typedef int (*PQsendQuery_t)(PGconn*, const char*);
extern "C" typedef int (*PQsendQueryParams_t)(PGconn*, const char*, int, void*, const char*, int*, int*, int);
extern "C" typedef PGresult* (*PQgetResult_t)(PGconn*);
extern "C" typedef char* (*PQresultErrorMessage_t)(const PGresult*);
extern "C" typedef ExecStatusType (*PQresultStatus_t)(const PGresult*);
extern "C" typedef int (*PQntuples_t)(const PGresult*);
extern "C" typedef int (*PQnfields_t)(const PGresult*);
extern "C" typedef char* (*PQfname_t)(const PGresult*, int);
extern "C" typedef Oid (*PQftype_t)(const PGresult*, int);
extern "C" typedef int (*PQgetisnull_t)(const PGresult*, int, int);
extern "C" typedef char* (*PQgetvalue_t)(const PGresult*, int, int);
extern "C" typedef int (*PQgetlength_t)(const PGresult*, int, int);
extern "C" typedef PGcancel* (*PQgetCancel_t)(PGconn*);
extern "C" typedef int (*PQcancel_t)(PGcancel*, char*, int);
extern "C" typedef PGcancel* (*PQfreeCancel_t)(PGcancel*);
extern "C" typedef void (*PQclear_t)(const PGresult*);
extern "C" typedef void (*PQfinish_t)(PGconn*);


/*****
 * These are the PostgrSQL dynamic library symbols needed for this addon module.
 * When loading in PostreSQL, these symbols are resolved using the C++ dlib
 * wapper.  They are initialized once while loading the PostgreSQL module.
*****/
extern PQconnectdbParams_t pqConnect;
extern PQsendQuery_t pqSendQuery;
extern PQsendQueryParams_t pqSendQueryParams;
extern PQgetResult_t pqGetResult;
extern PQresultErrorMessage_t pqResultErrorMessage;
extern PQresultStatus_t pqResultStatus;
extern PQntuples_t pqNtuples;
extern PQnfields_t pqNfields;
extern PQftype_t pqFtype;
extern PQfname_t pqFname;
extern PQgetisnull_t pqGetIsNull;
extern PQgetvalue_t pqGetValue;
extern PQgetlength_t pqGetLength;
extern PQgetCancel_t pqGetCancel;
extern PQcancel_t pqCancel;
extern PQfreeCancel_t pqFreeCancel;
extern PQclear_t pqClear;
extern PQfinish_t pqFinish;


/*****
 * Delcaration of the dynamic library and an integer that specifies the mode
 * in which PostgreSQL will execute: 0 = text, and 1 = binary.  Mode specifies
 * the format of query results.  Binary is faster than text, but it's a bit more
 * complicated.  To do binary right, we need to perform some operations againt
 * the database when first loading in the DLL to determine the format of floating
 * point numbers of the PostgreSQL DBMS server.
*****/
extern Dlib* libPq;


/*****
 * There is a library of functions that convert a returned PostgreSQL data
 * value into a node/javascript value.  This is the prototype function which
 * includes the following information:
 *      PGResult        = value return by postgres
 *      Kode            = Kode pointer, used for allocating resources
 *      int32_t         = row or tuple index
 *      int32_t         = column index
*****/
typedef NapiValue* (*PgToNapi_t)(const PGresult*, Kode*, int32_t, int32_t);


/*****
 * PgTypeInfo contains meta data pertaining to a specific PostgreSQL data type.
 * PostgreSQL has hundreds of supported types and each one has its own oid. When
 * results are returned from a query, the calls a postgres function to get the
 * oid for a specific column in the dataset.  The oid is the lookup key for
 * fetching data for that oid.  If the oid is NOT in our lookup table, the
 * query fails.  Declarations for the data strutures to contain the PgTypeInfo
 * are listed below.
*****/
class PgTypeInfo {
    public:
    PgTypeInfo(int oid, bool array, const char* pgName, const char* kodeName, PgToNapi_t pgTxt, PgToNapi_t pgBin) {
        this->oid = oid;
        this->array = array;
        this->pgName = pgName;
        this->kodeName = kodeName;
        this->binToNapi = pgBin;
        this->txtToNapi = pgTxt;
    }
    
    int         oid;
    bool        array;
    PgToNapi_t  binToNapi;
    PgToNapi_t  txtToNapi;
    const char* pgName;
    const char* kodeName;
};

extern map<int, PgTypeInfo*>         typesByOid;
extern map<const char*, PgTypeInfo*> typesByPgName;
extern map<const char*, PgTypeInfo*> typesByKodeName;


/*****
 * pgInit is called when the dynamic library is first opedn.  It's job is to
 * (a) load in the symbol addresses for the library functions used by this
 * module and (b) determine the floating-point format used for 64-bit and 80-
 * bit floating point numbers on the PostgreSQL server.
*****/
void pgInit(const char* path);
