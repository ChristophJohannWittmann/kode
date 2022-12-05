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
#ifndef KODE_SYSTEM_HH
#define KODE_SYSTEM_HH

#include <kode.hh>


/*****
 * The endianness of a hardware architecture is important for understanding the
 * bit and byte layout of numbers.  Integers are pretty straightforward, while
 * there are multiple floating point bit layouts, depending on the architecture
 * and endianness.  Utilimately, this code will provide support determining the
 * integer and floating-point layout for the local hardware and remote hardware.
*****/
enum Endianness {
    BE,
    LE,
};

enum FloatHalf {
    IEEEhalf,
};

enum FloatSingle {
    IEEEsingle,
};

enum FloatDouble {
    IEEEdouble,
};

enum FloatExtended {
    IEEEextended,
};

struct Achritecture {
    Endianness    endianness;
    FloatHalf     floatHalf;
    FloatSingle   floatSingle;
    FloatDouble   floatDouble;
    FloatExtended floatExtended;
 };


/*****
 * The array builder template helps us to build an array of the specified
 * template type.  This is just a useful utility with regards to our NodeJS
 * wrapper architecture.  As such, this template is for an array that can grow
 * while being populated.  It is NOT dynamic in the sense you can slice or
 * splice it.
*****/
template <typename T>
class ArrayBuilder : public Base {
    public:
    ArrayBuilder(Kode* kode);
    ~ArrayBuilder();
    size_t count();
    void push(T value);
    T* array();
    
    private:
    T*      _array;
    list<T> _values;
};

template <typename T>
ArrayBuilder<T>::ArrayBuilder(Kode* kode) : Base(kode) {
    _array = NULL;
}

template <typename T>
ArrayBuilder<T>::~ArrayBuilder() {
    if (_array) {
        delete _array;
    }
}

template <typename T>
size_t ArrayBuilder<T>::count() {
    return _values.size();
}

template <typename T>
void ArrayBuilder<T>::push(T value) {
    _values.push_back(value);
}

template <typename T>
T* ArrayBuilder<T>::array() {
    size_t index = 0;
    T* array = new T[_values.size() + 1];
    
    for (auto it = _values.begin(); it != _values.end(); ++it) {
        array[index++] = (*it);
    }
    
    array[index] = 0;
    return array;
}


/*****
 * Implementation of the dynamic library C++ wrapper.  The dynamic library is
 * a POSIX standard and should work across all platofrms.  The biggest issue
 * with platform dependency is the dynamic library's extension.
*****/
class Dlib {
    public:
    Dlib(const char* path);
    ~Dlib();
    void* handle();
    const char* path();
    void* symbol(const char* name);
    
    private:
    char*  _path;
    void*  _handle;
};

#endif
