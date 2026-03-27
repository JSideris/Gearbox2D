# Directories
SRC_DIR = cpp/src
INCLUDE_DIR = cpp/include
TEST_DIR = cpp/tests
BENCH_DIR = cpp/benchmarks
BUILD_DIR = dist/wasm
HIGHWAY_DIR = third_party/highway

TEST_SRC = $(wildcard $(TEST_DIR)/*.cpp)
BENCH_SRC = $(wildcard $(BENCH_DIR)/*.cpp)
GTEST_DIR ?= /usr/src/googletest/googletest
GTEST_LIB_DIR ?= .
GTEST_LIBS = -lgtest -lgtest_main

# Compiler
EMCC = emcc
CXX = g++  # Native C++ compiler for tests

# Project name
TARGET = gearbox-module
TEST_TARGET = runTests
BENCH_TARGET = runBenchmarks

# Source files
SRC = $(wildcard $(SRC_DIR)/*.cpp) $(wildcard $(SRC_DIR)/world/*.cpp) $(wildcard $(SRC_DIR)/solvers/*.cpp)

# Output files
OUTPUT_JS_MT = $(BUILD_DIR)/gearbox-module-mt.js
OUTPUT_JS_ST = $(BUILD_DIR)/gearbox-module-st.js

# C++ compiler flags
COMMON_FLAGS = -O3 -msimd128 -s WASM=1 --bind -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT='web,worker' -I$(HIGHWAY_DIR)
MT_FLAGS = -pthread -s PTHREAD_POOL_SIZE=4 -s ALLOW_MEMORY_GROWTH=1 -DGEARBOX_MT
ST_FLAGS = 

GTEST_FLAGS = -I$(GTEST_DIR)/include -I$(INCLUDE_DIR) -I$(HIGHWAY_DIR) -pthread -DGEARBOX_MT
BENCH_FLAGS = -I$(INCLUDE_DIR) -I$(HIGHWAY_DIR) -pthread -DGEARBOX_MT -O3 -march=native -mfma

# Default target to build the project
all: wasm

# WASM build
wasm: $(OUTPUT_JS_MT) $(OUTPUT_JS_ST)

$(OUTPUT_JS_MT): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(COMMON_FLAGS) $(MT_FLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS_MT)

$(OUTPUT_JS_ST): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(COMMON_FLAGS) $(ST_FLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS_ST)

# Test build
test: $(TEST_TARGET)

$(TEST_TARGET): $(SRC) $(TEST_SRC)
	$(CXX) $(GTEST_FLAGS) -o $(TEST_TARGET) $(SRC) $(TEST_SRC) -I$(INCLUDE_DIR) -L$(GTEST_LIB_DIR) -pthread $(GTEST_LIBS)
	./$(TEST_TARGET)

# Benchmark build
benchmark: $(BENCH_TARGET)

$(BENCH_TARGET): $(SRC) $(BENCH_SRC)
	$(CXX) $(BENCH_FLAGS) -o $(BENCH_TARGET) $(SRC) $(BENCH_SRC) -I$(INCLUDE_DIR)
	./$(BENCH_TARGET)

# Clean up build files
clean:
	rm -rf $(BUILD_DIR) $(TEST_TARGET) $(BENCH_TARGET)

.PHONY: all clean wasm test benchmark