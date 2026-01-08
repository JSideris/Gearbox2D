# GearBox2D - High-Speed 2D Physics Engine

A blazing-fast 2D physics engine written in C++ and compiled to WebAssembly, with a TypeScript interface. Optimized for high-frequency simulations and applications requiring frequent updates via direct memory sharing.

## Prerequisites

Before you can build and run GearBox2D, you'll need the following:

### Required Dependencies

1. **Node.js and npm** (v18 or higher recommended)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Emscripten SDK** (for WebAssembly compilation)
   - Install via [emsdk](https://emscripten.org/docs/getting_started/downloads.html):
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh  # On Windows: emsdk_env.bat
   ```
   - Verify installation: `emcc --version`

3. **GNU Make** (for build automation)
   - **Linux/macOS**: Usually pre-installed. If not, use `sudo apt install make`.
   - **Windows**: Install via WSL, MinGW, or use `nmake`.

4. **C++ Compiler** (for running native tests)
   - **Linux**: `g++`
   - **macOS**: `xcode-select --install`
   - **Windows**: MinGW or WSL

5. **Google Test** (for C++ unit tests)
   - The `Makefile` expects it at `/usr/src/googletest/googletest` by default. You can override this by setting the `GTEST_DIR` environment variable or editing the `Makefile`.

### Optional Dependencies

- **Live Server**: For running examples: `npm install -g live-server` or use `npx http-server`.

## Installation

### Via npm

```bash
npm install gearbox-2d
```

### From source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JSideris/Gearbox2D.git
   cd Gearbox2D
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   # Build everything (C++ to WASM + TypeScript)
   npm run build
   
   # Or build components separately:
   npm run build:cpp  # Build WebAssembly module
   npm run build:ts   # Build TypeScript interface
   ```

## Usage

### API Quick Start

The TypeScript interface provides a clean API for creating and managing physics worlds:

```typescript
import gb2d from 'gearbox-2d';

// Initialize the engine
await gb2d.init();

// Create a world
const world = gb2d.makeWorld();

// Add objects and run simulation
// See examples/ for complete usage examples
```

### Running Tests

```bash
# Run all tests (C++ and TypeScript)
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
```

### Running Examples

1. **Start a local server** (required for WASM loading):
   ```bash
   # Using live-server
   live-server examples/
   
   # Or using Node.js
   npx http-server examples/
   ```

2. **Open your browser** and navigate to the provided local URL (usually `http://localhost:8080`).

3. **View the examples** by opening `examples/index.html`.

## Project Structure

```
Gearbox2D/
├── cpp/                    # C++ source code
│   ├── include/           # Header files
│   ├── src/              # Source files
│   └── tests/            # C++ unit tests
├── typescript/           # TypeScript source
│   └── src/              # TS interface code
├── examples/             # Web examples and demos
├── studies/              # Performance and optimization studies
├── dist/                 # Build output
│   ├── js/              # Compiled TypeScript
│   └── wasm/            # WebAssembly modules
├── Makefile             # C++ build configuration
├── package.json         # Node.js dependencies
├── plan.md              # Project roadmap and feature status
└── tsconfig.json        # TypeScript configuration
```

## Roadmap

Check the [plan.md](plan.md) file for a detailed list of implemented features and future development goals.

## Physical Object Data

GearBox2D is data-oriented, optimized for high-performance data transfer between JavaScript and WASM. Instead of copying object data on every step, the engine uses **shared memory**.

- **WASM Memory**: Volatile object data (position, velocity, etc.) is stored in contiguous buffers in C++.
- **TypedArray Views**: The TypeScript interface creates `Float32Array` and `Int32Array` views directly over these WASM memory buffers.
- **Direct Access**: When you access `object.x` or `object.vx` in TypeScript, you are reading/writing directly to the memory used by the WASM physics core.

This architecture minimizes overhead and allows for thousands of objects to be updated and rendered efficiently.

## Troubleshooting

- **Emscripten not found**: Ensure you have run `source ./emsdk_env.sh` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from `file://` URLs.
- **Build failures**: Try `npm run clean && npm run build` to rebuild from scratch.
