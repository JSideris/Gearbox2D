#pragma once

#ifndef __EMSCRIPTEN__
#include <unordered_map>
#include <string>
#include <variant>
#include <cstdint>
#include <type_traits>

class MockVal {
public:
    std::unordered_map<std::string, std::variant<int, float, bool, uint32_t>> properties;
    std::string lastKey;

    bool hasOwnProperty(const std::string& key) const {
        return properties.find(key) != properties.end();
    }

    bool isUndefined() const {
        return properties.find(lastKey) == properties.end();
    }

    template<typename T>
    T as() const {
        auto it = properties.find(lastKey);
        if (it == properties.end()) return T();
        
        if (std::holds_alternative<T>(it->second)) {
            return std::get<T>(it->second);
        }
        
        // Handle basic numeric conversions if possible
        if constexpr (std::is_same_v<T, float>) {
            if (std::holds_alternative<int>(it->second)) return (float)std::get<int>(it->second);
            if (std::holds_alternative<uint32_t>(it->second)) return (float)std::get<uint32_t>(it->second);
        } else if constexpr (std::is_same_v<T, int>) {
            if (std::holds_alternative<float>(it->second)) return (int)std::get<float>(it->second);
            if (std::holds_alternative<uint32_t>(it->second)) return (int)std::get<uint32_t>(it->second);
        }
        
        return T();
    }

    MockVal& operator[](const std::string& key) {
        lastKey = key;
        return *this;
    }

    MockVal& operator[](int index) {
        lastKey = std::to_string(index);
        return *this;
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
