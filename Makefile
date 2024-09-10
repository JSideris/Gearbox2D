# Directories
SRC_DIR = src
BUILD_DIR = lib/build
INCLUDE_DIR = include
TEST_DIR = tests
TEST_SRC = $(wildcard $(TEST_DIR)/*.cpp)
GTEST_DIR ?= /home/josh/googletest/googletest

# Compiler
EMCC = emcc
CXX = g++  # Native C++ compiler for tests

# Project name
TARGET = gb2d-module
TEST_TARGET = runTests

# Source files
SRC = $(wildcard $(SRC_DIR)/*.cpp)

# Output files
OUTPUT_JS = $(BUILD_DIR)/$(TARGET).js

# C++ compiler flags
CXXFLAGS = -O3 -s WASM=1 --bind -s MODULARIZE=1 -s EXPORT_ES6=1
GTEST_FLAGS = -I$(GTEST_DIR)/include -I$(INCLUDE_DIR) -pthread

# Default target to build the project
all: wasm

# WASM build
wasm: $(OUTPUT_JS)

$(OUTPUT_JS): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(CXXFLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS)

# Test build
test: $(TEST_TARGET)

$(TEST_TARGET): $(SRC) $(TEST_SRC)
	$(CXX) $(GTEST_FLAGS) -o $(TEST_TARGET) $(SRC) $(TEST_SRC) $(GTEST_DIR)/src/gtest-all.o $(GTEST_DIR)/src/gtest_main.o -I$(INCLUDE_DIR) -L. -pthread
	./$(TEST_TARGET)

# Google Test build
$(GTEST_DIR)/src/gtest-all.o $(GTEST_DIR)/src/gtest_main.o:
	$(CXX) -isystem $(GTEST_DIR)/include -I$(GTEST_DIR) -pthread -c $(GTEST_DIR)/src/gtest-all.cc -o $(GTEST_DIR)/src/gtest-all.o
	$(CXX) -isystem $(GTEST_DIR)/include -I$(GTEST_DIR) -pthread -c $(GTEST_DIR)/src/gtest_main.cc -o $(GTEST_DIR)/src/gtest_main.o

# Clean up build files
clean:
	rm -rf $(BUILD_DIR) $(TEST_TARGET)

.PHONY: all clean wasm test
