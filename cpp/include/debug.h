#pragma once

#ifndef __EMSCRIPTEN__
#include <unordered_map>
#include <string>
#include <variant>
#include <cstdint>
#include <type_traits>

class MockVal {
public:
    std::variant<int, float, bool, uint32_t, std::monostate> val;
    std::unordered_map<std::string, MockVal> properties;

    MockVal() : val(std::monostate{}) {}

    template<typename T, typename = std::enable_if_t<std::is_arithmetic_v<T> || std::is_same_v<T, bool>>>
    MockVal& operator=(T v) {
        val = v;
        return *this;
    }

    bool hasOwnProperty(const std::string& key) const {
        return properties.find(key) != properties.end();
    }

    bool isUndefined() const {
        return std::holds_alternative<std::monostate>(val) && properties.empty();
    }

    template<typename T>
    T as() const {
        if (std::holds_alternative<T>(val)) {
            return std::get<T>(val);
        }
        
        // Handle basic numeric conversions if possible
        if constexpr (std::is_same_v<T, float>) {
            if (std::holds_alternative<int>(val)) return (float)std::get<int>(val);
            if (std::holds_alternative<uint32_t>(val)) return (float)std::get<uint32_t>(val);
        } else if constexpr (std::is_same_v<T, int>) {
            if (std::holds_alternative<float>(val)) return (int)std::get<float>(val);
            if (std::holds_alternative<uint32_t>(val)) return (int)std::get<uint32_t>(val);
        } else if constexpr (std::is_same_v<T, bool>) {
            if (std::holds_alternative<int>(val)) return (bool)std::get<int>(val);
        }
        
        return T();
    }

    MockVal& operator[](const std::string& key) {
        return properties[key];
    }

    MockVal& operator[](int index) {
        return properties[std::to_string(index)];
    }
};

using emscripten_val = MockVal;
#else
#include <emscripten/bind.h>
using emscripten_val = emscripten::val;
#endif

//---------------------------------------------------------------------------------------

#include <iostream>

// #define DEBUG
#ifdef DEBUG
    #define DEBUG_PRINT(x) std::cout << x << std::endl
#else
    #define DEBUG_PRINT(x)
#endif
