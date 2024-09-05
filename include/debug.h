#pragma once

#ifndef EMSCRIPTEN
#include <unordered_map>
#include <string>
#include <variant>
// #include <sstream>

class MockVal {
public:
    std::unordered_map<std::string, std::variant<int, float>> properties;

    bool hasOwnProperty(const std::string& key) const {
        return properties.find(key) != properties.end();
    }

    template<typename T>
    T as() const {
        return std::get<T>(properties.at("type"));
    }

    MockVal& operator[](const std::string& key) {
        return *this; // For simplicity, return the same object; you can expand this as needed.
    }
};

using emscripten_val = MockVal;  // Redefine emscripten::val to MockVal
#else
#include <emscripten/bind.h>
using emscripten_val = emscripten::val;
#endif

//---------------------------------------------------------------------------------------

#include <iostream>

// #define DEBUG
#ifdef DEBUG
    // #define DEBUG_PRINT(x) do { \
    //     std::stringstream ss; \
    //     ss << x; \
    //     std::cout << ss.str() << std::endl; \
    // } while(0)
    #define DEBUG_PRINT(x) std::cout << x << std::endl
#else
    #define DEBUG_PRINT(x)
#endif