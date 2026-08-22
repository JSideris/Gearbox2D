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
ifeq ($(GEARBOX_DISABLE_KRB),1)
LOG_ENERGY_BIN = logEnergy-nokrb
LOG_TIMING_BIN = logTiming-nokrb
else
LOG_ENERGY_BIN = logEnergy
LOG_TIMING_BIN = logTiming
endif
LOG_ENERGY_SRC = studies/kinematic_restitution_balancing/log-energy.cpp
LOG_TIMING_SRC = studies/kinematic_restitution_balancing/log-timing.cpp

# Source files
SRC = $(wildcard $(SRC_DIR)/*.cpp) $(wildcard $(SRC_DIR)/world/*.cpp) $(wildcard $(SRC_DIR)/world/island/*.cpp) $(wildcard $(SRC_DIR)/solvers/*.cpp)

# Output files
OUTPUT_JS_MT = $(BUILD_DIR)/gearbox-module-mt.js
OUTPUT_JS_ST = $(BUILD_DIR)/gearbox-module-st.js

# C++ compiler flags
COMMON_FLAGS = -O3 -msimd128 -s WASM=1 --bind -s MODULARIZE=1 -s EXPORT_ES6=1 -s ENVIRONMENT='web,worker' -I$(HIGHWAY_DIR)
MT_FLAGS = -pthread -s PTHREAD_POOL_SIZE=4 -s ALLOW_MEMORY_GROWTH=1 -DGEARBOX_MT
ST_FLAGS = 

# Research-only ablation. Default is KRB on.
#   make test GEARBOX_DISABLE_KRB=1
#   make benchmark GEARBOX_DISABLE_KRB=1
#   make log-energy
#   make log-energy GEARBOX_DISABLE_KRB=1
#   make log-timing
#   make log-timing GEARBOX_DISABLE_KRB=1
ifeq ($(GEARBOX_DISABLE_KRB),1)
KRB_FLAGS = -DGEARBOX_DISABLE_KRB
endif

GTEST_FLAGS = -I$(GTEST_DIR)/include -I$(INCLUDE_DIR) -I$(HIGHWAY_DIR) -pthread -DGEARBOX_MT $(KRB_FLAGS)
BENCH_FLAGS = -I$(INCLUDE_DIR) -I$(HIGHWAY_DIR) -pthread -DGEARBOX_MT -O3 -march=native -mfma $(KRB_FLAGS)

# Default target to build the project
all: wasm

# WASM build
wasm: $(OUTPUT_JS_MT) $(OUTPUT_JS_ST)

$(OUTPUT_JS_MT): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(COMMON_FLAGS) $(KRB_FLAGS) $(MT_FLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS_MT)

$(OUTPUT_JS_ST): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(COMMON_FLAGS) $(KRB_FLAGS) $(ST_FLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS_ST)

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

# Dataset A energy logger (does not run the gtest suite).
log-energy: $(LOG_ENERGY_BIN)

$(LOG_ENERGY_BIN): $(SRC) $(LOG_ENERGY_SRC)
	$(CXX) $(GTEST_FLAGS) -o $(LOG_ENERGY_BIN) $(SRC) $(LOG_ENERGY_SRC) -I$(INCLUDE_DIR)

# Dataset D KRB on/off wall-time logger (does not run the gtest suite).
log-timing: $(LOG_TIMING_BIN)

$(LOG_TIMING_BIN): $(SRC) $(LOG_TIMING_SRC)
	$(CXX) $(BENCH_FLAGS) -o $(LOG_TIMING_BIN) $(SRC) $(LOG_TIMING_SRC) -I$(INCLUDE_DIR)

# Clean up build files
clean:
	rm -rf $(BUILD_DIR) $(TEST_TARGET) $(BENCH_TARGET) logEnergy logEnergy-nokrb logTiming logTiming-nokrb

.PHONY: all clean wasm test benchmark log-energy log-timing