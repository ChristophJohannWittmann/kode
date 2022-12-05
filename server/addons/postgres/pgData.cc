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
#include <pg.hh>


/*****
 * Defintions of dynamic library (shared object) functions that are used by
 * this infrastrcuture.  PostgresSQL has dozens perhaps hundreds of API calls.
 * We just loading and using what's necessary.  All functions are strongly
 * typed in C language terms.
*****/
PQconnectdbParams_t pqConnect = NULL;
PQsendQuery_t pqSendQuery = NULL;
PQsendQueryParams_t pqSendQueryParams = NULL;
PQgetResult_t pqGetResult = NULL;
PQresultErrorMessage_t pqResultErrorMessage = NULL;
PQresultStatus_t pqResultStatus = NULL;
PQntuples_t pqNtuples = NULL;
PQnfields_t pqNfields = NULL;
PQftype_t pqFtype = NULL;
PQfname_t pqFname = NULL;;
PQgetisnull_t pqGetIsNull = NULL;
PQgetvalue_t pqGetValue = NULL;
PQgetlength_t pqGetLength = NULL;
PQgetCancel_t pqGetCancel = NULL;
PQcancel_t pqCancel = NULL;
PQfreeCancel_t pqFreeCancel = NULL;
PQclear_t pqClear = NULL;
PQfinish_t pqFinish = NULL;


/*****
 * The pointer to the C++ wrapper object for the dynamic library PostgreSQL.
 * The libPqMode specifies that we're running in either text or binary mode.
 * 0 = text and 1 = binary.
*****/
Dlib* libPq = NULL;


/*****
 * A helper function that takes and returned array value and splits it us for
 * use by the caller.  Remember that PostgreSQL has builtin support for column
 * types that are arrays.  This function accepts a result returned by postgres
 * in raw text format.
*****/
void textSplitArray(Kode* kode, const char* value, list<String*>& result) {
    size_t index0 = 0;
    size_t indexN = 0;
    bool quoteOpen = false;
    bool quotedSaved = false;
    
    while (value[indexN]) {
        switch (value[indexN]) {
            case '"':
                if (quoteOpen) {
                    if (value[indexN-1] == '\\') {
                        indexN++;
                    }
                    else {
                        quoteOpen = false;
                        quotedSaved = true;
                        result.push_back(new String(kode, &value[index0], &value[indexN - 1]));
                        indexN++;
                        index0 = indexN;
                    }
                }
                else {
                    quoteOpen = true;
                    indexN++;
                    index0 = indexN;
                }
                break;
            
            case ',':
                if (quoteOpen) {
                    indexN++;
                }
                else if (quotedSaved) {
                    quotedSaved = false;
                    indexN++;
                    index0 = indexN;
                }
                else {
                    result.push_back(new String(kode, &value[index0], &value[indexN - 1]));
                    indexN++;
                    index0 = indexN;
                }
                break;
            
            case '{':
                if (quoteOpen) {
                    indexN++;
                }
                else {
                    indexN++;
                    index0 = indexN;
                }
                break;
            
            case '}':
                if (quoteOpen) {
                    indexN++;
                }
                else if (quotedSaved) {
                    quotedSaved = false;
                    indexN++;
                    index0 = indexN;
                }
                else {
                    result.push_back(new String(kode, &value[index0], &value[indexN - 1]));
                    indexN++;
                    index0 = indexN;
                }
                break;
            
            default:
                indexN++;
                break;
        }
    }
}


/*****
 * *********************************
 * * * *   T E X T   M O D E   * * *
 * *********************************
 * This is the list of conversion functions for accepting PostgreSQL query
 * results in text form.  These conversion functions not only parse query text,
 * they also create NapiValues the properly represent their results.
*****/
NapiValue* pgBooleanToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    if (strcmp(pqGetValue(pgResult, iTuple, iField), "true") == 0) {
        return new NapiBool(kode, true);
    }
    else {
        return new NapiBool(kode, false);
    }
}

NapiValue* pgBinaryToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    String* hex = new String(kode, pqGetValue(pgResult, iTuple, iField));
    return NapiBuffer::fromHex(kode, hex->substr(2)->toString());
}

NapiValue* pgFloat4ToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    double number = stold(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, number);
}

NapiValue* pgFloat8ToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    double number = stold(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, number);
}

NapiValue* pgInt2ToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int16_t number = stoi(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, number);
}

NapiValue* pgInt4ToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int32_t number = stol(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, number);
}

NapiValue* pgInt8ToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int64_t number = stoll(pqGetValue(pgResult, iTuple, iField));
    return new NapiBigInt(kode, number);
}

NapiValue* pgJsonToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiObject(kode, pqGetValue(pgResult, iTuple, iField));
}

NapiValue* pgTextToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiString(kode, pqGetValue(pgResult, iTuple, iField));
}

NapiValue* pgTimeStampToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    auto Date = global(kode)->get("Date")->toNapiFunction();
    auto ds = String::concat(kode, pqGetValue(pgResult, iTuple, iField), "-0000", NULL);
    return NapiObject::create(kode, Date, new NapiString(kode, ds->toString()), NULL);
}

NapiValue* pgVarcharToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiString(kode, pqGetValue(pgResult, iTuple, iField));
}

/*****
 * VECTORS
*****/
NapiValue* pgIntVectorToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    auto g = global(kode);
    auto parseInt = g->get("parseInt")->toNapiFunction();
    auto string = new NapiString(kode, pqGetValue(pgResult, iTuple, iField));
    auto array = string->invoke("split", new NapiString(kode, " "), NULL)->toNapiArray();
    
    for (int i = 0; i < array->length(); i++) {
        auto napiInt = parseInt->call(g, array->elementAt(i), NULL);
        array->set(i, napiInt);
    }
    
    return array;
}

/*****
 * ARRAYS
*****/
NapiValue* pgBooleanArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiBool(kode, strcmp((*at)->toString(), "true")));
    }
    
    return array;
}

NapiValue* pgBinaryArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        auto hex = new String(kode, (*at)->substr(2)->toString());
        array->push(NapiBuffer::fromHex(kode, hex->toString()));
    }

    return array;
}

NapiValue* pgFloat4ArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiNumber(kode, (double)stod((*at)->toString())));
    }

    return array;
}

NapiValue* pgFloat8ArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiNumber(kode, (double)stod((*at)->toString())));
    }

    return array;
}

NapiValue* pgInt2ArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiNumber(kode, (int32_t)stol((*at)->toString())));
    }

    return array;
}

NapiValue* pgInt4ArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiNumber(kode, (int32_t)stol((*at)->toString())));
    }

    return array;
}

NapiValue* pgInt8ArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiBigInt(kode, (int64_t)stol((*at)->toString())));
    }

    return array;
}

NapiValue* pgJsonArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiObject(kode, (*at)->toString()));
    }

    return array;
}

NapiValue* pgTextArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiString(kode, (*at)->toString()));
    }
    
    return array;
}

NapiValue* pgTimeStampArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    auto Date = global(kode)->get("Date")->toNapiFunction();
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        auto ds = String::concat(kode, (*at)->toString(), "-0000", NULL);
        array->push(NapiObject::create(kode, Date, new NapiString(kode, ds->toString()), NULL));
    }

    return array;
}

NapiValue* pgVarcharArrayToNapiText(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    NapiArray* array = new NapiArray(kode);
    list<String*> result;
    textSplitArray(kode, pqGetValue(pgResult, iTuple, iField), result);
    
    for (auto at = result.begin(); at != result.end(); ++at) {
        array->push(new NapiString(kode, (*at)->toString()));
    }

    return array;
}


/*****
 * *************************************
 * * * *   B I N A R Y   M O D E   * * *
 * *************************************
 * This is the list of conversion functions for accepting PostgreSQL query
 * results in binary form.  Many of the following functions are stubs and have
 * TODOs embedded within them.  We need an initialization function that can
 * determine the floating-point representation of returned results before we
 * finish implementing the binary interface.  I anticipate that binary mode
 * provides for higher performance that text mode.  The code is just a wee bit
 * more complex.
*****/
NapiValue* pgBooleanToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    uint8_t* ptr = reinterpret_cast<uint8_t*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiBool(kode, (bool)*ptr);
}

NapiValue* pgBinaryToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int32_t bytes = pqGetLength(pgResult, iTuple, iField);
    void* ptr = reinterpret_cast<void*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiBuffer(kode, bytes, ptr);
}

NapiValue* pgFloat4ToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    float* ptr = reinterpret_cast<float*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, (float)(ntohl(*ptr)));
}

NapiValue* pgFloat8ToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    double* ptr = reinterpret_cast<double*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, (double)(ntohll(*ptr)));
}

NapiValue* pgInt2ToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int16_t* ptr = reinterpret_cast<int16_t*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, (int32_t)ntohs(*ptr));
}

NapiValue* pgInt4ToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int32_t* ptr = reinterpret_cast<int32_t*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiNumber(kode, ntohl(*ptr));
}

NapiValue* pgInt8ToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    int64_t* ptr = reinterpret_cast<int64_t*>(pqGetValue(pgResult, iTuple, iField));
    return new NapiBigInt(kode, ntohll(*ptr));
}

NapiValue* pgJsonToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiObject(kode, pqGetValue(pgResult, iTuple, iField));
}

NapiValue* pgTextToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiString(kode, pqGetValue(pgResult, iTuple, iField));
}

NapiValue* pgTimeStampToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    return new NapiString(kode, "binary convert pg timestamp to js date.");
}

NapiValue* pgVarcharToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    return new NapiString(kode, pqGetValue(pgResult, iTuple, iField));
}

/*****
 * VECTORS
*****/
NapiValue* pgIntVectorToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

/*****
 * ARRAYS
*****/
NapiValue* pgBooleanArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgBinaryArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgFloat4ArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgFloat8ArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgInt2ArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgInt4ArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgInt8ArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgJsonArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgTextArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgTimeStampArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}

NapiValue* pgVarcharArrayToNapiBin(PGresult* pgResult, Kode* kode, int32_t iTuple, int32_t iField) {
    // TODO
    NapiArray* array = new NapiArray(kode);
    return array;
}


/*****
 * Here is the table of supported PostgreSQL types.  PostgreSQL has hundreds of
 * data type implemented and we need code that supports each specific data type.
 * While working with queries, I learned that we needed support for name in
 * addition to text.  When selecting meta data, table names and column names are
 * of type name, not text.  Hence, the original version woudl throw an exception
 * since the table was lacking the appropriate tyoe.  Adding support for more
 * data types requies an entry in this table plus a text and binary parser.
*****/
PgTypeInfo definedTypes[] = {
    PgTypeInfo(   0, false, "passthru",   "Text",           (PgToNapi_t)pgTextToNapiText,           (PgToNapi_t)pgBinaryToNapiBin),
    PgTypeInfo(  16, false, "bool",       "Boolean",        (PgToNapi_t)pgBooleanToNapiText,        (PgToNapi_t)pgBooleanToNapiBin),
    PgTypeInfo(  17, false, "bytea",      "Binary",         (PgToNapi_t)pgBinaryToNapiText,         (PgToNapi_t)pgBinaryToNapiBin),
    PgTypeInfo( 700, false, "float4",     "Float32",        (PgToNapi_t)pgFloat4ToNapiText,         (PgToNapi_t)pgFloat4ToNapiBin),
    PgTypeInfo( 701, false, "float8",     "Float64",        (PgToNapi_t)pgFloat8ToNapiText,         (PgToNapi_t)pgFloat8ToNapiBin),
    PgTypeInfo(  21, false, "int2",       "Int16",          (PgToNapi_t)pgInt2ToNapiText,           (PgToNapi_t)pgInt2ToNapiBin),
    PgTypeInfo(  22, false, "int2vector", "Int16Array",     (PgToNapi_t)pgIntVectorToNapiText,      (PgToNapi_t)pgIntVectorToNapiBin),
    PgTypeInfo(  23, false, "int4",       "Int32",          (PgToNapi_t)pgInt4ToNapiText,           (PgToNapi_t)pgInt4ToNapiBin),
    PgTypeInfo(  20, false, "int8",       "Int64",          (PgToNapi_t)pgInt8ToNapiText,           (PgToNapi_t)pgInt8ToNapiBin),
    PgTypeInfo( 114, false, "json",       "Json",           (PgToNapi_t)pgJsonToNapiText,           (PgToNapi_t)pgJsonToNapiBin),
    PgTypeInfo(  19, false, "text",       "Text",           (PgToNapi_t)pgTextToNapiText,           (PgToNapi_t)pgTextToNapiBin),
    PgTypeInfo(  25, false, "text",       "Text",           (PgToNapi_t)pgTextToNapiText,           (PgToNapi_t)pgTextToNapiBin),
    PgTypeInfo(1114, false, "timestamp",  "TimeStamp",      (PgToNapi_t)pgTimeStampToNapiText,      (PgToNapi_t)pgTimeStampToNapiBin),
    PgTypeInfo(1043, false, "varchar",    "Varchar",        (PgToNapi_t)pgVarcharToNapiText,        (PgToNapi_t)pgVarcharToNapiBin),
    PgTypeInfo(1000,  true, "_bool",      "BooleanArray",   (PgToNapi_t)pgBooleanArrayToNapiText,   (PgToNapi_t)pgBooleanArrayToNapiBin),
    PgTypeInfo(1001,  true, "_bytea",     "BinaryArray",    (PgToNapi_t)pgBinaryArrayToNapiText,    (PgToNapi_t)pgBinaryArrayToNapiBin),
    PgTypeInfo(1021,  true, "_float4",    "Float32Array",   (PgToNapi_t)pgFloat4ArrayToNapiText,    (PgToNapi_t)pgFloat4ArrayToNapiBin),
    PgTypeInfo(1022,  true, "_float8",    "Float64Array",   (PgToNapi_t)pgFloat8ArrayToNapiText,    (PgToNapi_t)pgFloat8ArrayToNapiBin),
    PgTypeInfo(1005,  true, "_int2",      "Int16Array",     (PgToNapi_t)pgInt2ArrayToNapiText,      (PgToNapi_t)pgInt2ArrayToNapiBin),
    PgTypeInfo(1007,  true, "_int4",      "Int32Array",     (PgToNapi_t)pgInt4ArrayToNapiText,      (PgToNapi_t)pgInt4ArrayToNapiBin),
    PgTypeInfo(1016,  true, "_int8",      "Int64Array",     (PgToNapi_t)pgInt8ArrayToNapiText,      (PgToNapi_t)pgInt8ArrayToNapiBin),
    PgTypeInfo( 199,  true, "_json",      "JsonArray",      (PgToNapi_t)pgJsonArrayToNapiText,      (PgToNapi_t)pgJsonArrayToNapiBin),
    PgTypeInfo(1009,  true, "_text",      "TextArray",      (PgToNapi_t)pgTextArrayToNapiText,      (PgToNapi_t)pgTextArrayToNapiBin),
    PgTypeInfo(1115,  true, "_timestamp", "TimeStampArray", (PgToNapi_t)pgTimeStampArrayToNapiText, (PgToNapi_t)pgTimeStampArrayToNapiBin),
    PgTypeInfo(1015,  true, "_varchar",   "VarcharArray",   (PgToNapi_t)pgVarcharArrayToNapiText,   (PgToNapi_t)pgVarcharArrayToNapiBin),
};

map<int, PgTypeInfo*>         typesByOid;
map<const char*, PgTypeInfo*> typesByPgName;
map<const char*, PgTypeInfo*> typesByKodeName;


/*****
 * This PG initialization module.  This is where the dynamic library for pg is
 * loaded and required symbols loaded.  Moreover, this function needs to
 * determine the floating-point bitwise format for data on the server.
*****/
void pgInit(const char* path) {
    libPq = new Dlib(path);
    
    pqConnect = (PQconnectdbParams_t)libPq->symbol("PQconnectdbParams");
    pqSendQuery = (PQsendQuery_t)libPq->symbol("PQsendQuery");
    pqSendQueryParams = (PQsendQueryParams_t)libPq->symbol("PQsendQueryParams");
    pqGetResult = (PQgetResult_t)libPq->symbol("PQgetResult");
    pqResultErrorMessage = (PQresultErrorMessage_t)libPq->symbol("PQresultErrorMessage");
    pqResultStatus = (PQresultStatus_t)libPq->symbol("PQresultStatus");
    pqNtuples = (PQntuples_t)libPq->symbol("PQntuples");
    pqNfields = (PQnfields_t)libPq->symbol("PQnfields");
    pqFtype = (PQftype_t)libPq->symbol("PQftype");
    pqFname = (PQfname_t)libPq->symbol("PQfname");
    pqGetIsNull = (PQgetisnull_t)libPq->symbol("PQgetisnull");
    pqGetValue = (PQgetvalue_t)libPq->symbol("PQgetvalue");
    pqGetLength = (PQgetlength_t)libPq->symbol("PQgetlength");
    pqGetCancel = (PQgetCancel_t)libPq->symbol("PQgetCancel");
    pqCancel = (PQcancel_t)libPq->symbol("PQcancel");
    pqFreeCancel = (PQfreeCancel_t)libPq->symbol("PQfreeCancel");
    pqClear = (PQclear_t)libPq->symbol("PQclear");
    pqFinish = (PQfinish_t)libPq->symbol("PQfinish");
    
    int length = sizeof(definedTypes)/sizeof(PgTypeInfo);
    
    for (int i = 0; i < length; i++) {
        auto typeInfo = &definedTypes[i];
        typesByOid.emplace(typeInfo->oid, typeInfo);
        typesByPgName.emplace(typeInfo->pgName, typeInfo);
        typesByKodeName.emplace(typeInfo->kodeName, typeInfo);
    }
}
