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
#include <system.hh>


#ifdef PLATFORM_MAC
#include <dlfcn.h>
#define DLIB_EXTENSION ".dylib"
#endif

#ifdef PLATFORM_LINUX
#include <dlfcn.h>
#define DLIB_EXTENSION ".so"
#endif

#ifdef PLATFORM_WIN
#define DLIB_EXTENSION ".dll"
#endif


/*****
 * Implementation of the dynamic library C++ wrapper.  The dynamic library is
 * a POSIX standard and should work across all platofrms.  The biggest issue
 * with platform dependency is the dynamic library's extension.
*****/
Dlib::Dlib(const char* path) {
    size_t pathLength = strlen(path) + strlen(DLIB_EXTENSION) + 1;
    _path = new char[pathLength];
    strcpy(_path, path);
    strcat(_path, DLIB_EXTENSION);
    _handle = dlopen(_path, RTLD_LOCAL|RTLD_LAZY);
}

Dlib::~Dlib() {
    delete[] _path;
    dlclose(_handle);
}

void* Dlib::handle() {
    return _handle;
}

const char* Dlib::path() {
    return _path;
}

void* Dlib::symbol(const char* symbol) {
    return dlsym(_handle, symbol);
}
