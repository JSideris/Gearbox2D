#pragma once

#ifndef __EMSCRIPTEN__
#include <unordered_map>
#include <string>
#include <variant>
#include <cstdint>
// #include <sstream>

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
        return std::get<T>(it->second);
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

using emscripten_val = MockVal;  // Redefine emscripten::val to MockVal
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
#include <fstream>
#include <chrono>

inline void write_agent_log(const std::string& message, const std::string& hypothesisId, const std::string& location, const std::string& data_json = "{}") {
    std::ofstream log_file("/home/josh/Desktop/PROJECTS/Gearbox2D/.cursor/debug.log", std::ios::app);
    if (!log_file.is_open()) return;
    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    log_file << "{\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"" << hypothesisId 
             << "\",\"location\":\"" << location << "\",\"message\":\"" << message 
             << "\",\"data\":" << data_json << ",\"timestamp\":" << ms << "}\n";
}

