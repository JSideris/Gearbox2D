# Makefile for gb2d - a rigid body physics engine targeting WebAssembly

# Directories
SRC_DIR = src
BUILD_DIR = lib/build
INCLUDE_DIR = include

# Compiler
EMCC = emcc

# Project name
TARGET = gb2d-module

# Source files
SRC = $(wildcard $(SRC_DIR)/*.cpp)

# Output files
OUTPUT_JS = $(BUILD_DIR)/$(TARGET).js

# C++ compiler flags
CXXFLAGS = -O3 -s WASM=1 --bind -s MODULARIZE=1 -s EXPORT_ES6=1

# Default target to build the project
all: $(OUTPUT_JS)

# Rule to build the WebAssembly module
$(OUTPUT_JS): $(SRC)
	mkdir -p $(BUILD_DIR)
	$(EMCC) $(CXXFLAGS) $(SRC) -I$(INCLUDE_DIR) -o $(OUTPUT_JS)

# Clean up build files
clean:
	rm -rf $(BUILD_DIR)

.PHONY: all clean
