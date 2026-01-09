# GearBox2D - High-Speed 2D Physics Engine

**⚠️ WORK IN PROGRESS (Alpha)** - *Gearbox2D is currently in active development. APIs are subject to change.*

Gearbox2D is a blazing-fast, **web-first** 2D physics engine engineered from the ground up for the modern browser. Built in C++ and compiled to WebAssembly (WASM), it provides a high-performance core with a developer-friendly TypeScript wrapper.

## The Mission

The web deserves a physics engine that isn't just a port of a desktop library. Gearbox2D is designed to bridge the gap between high-fidelity simulation and web-based interactivity, focusing on:

1.  **Web-First Performance**: Leveraging WASM and shared memory to eliminate the "bridge bottleneck" between JS and native code.
2.  **Authoritative Synchronization**: Built to be highly stable and deterministic, making it ideal for real-time multiplayer games where state is updated from a remote server.
3.  **Integrated AI & Robotics**: Beyond just collisions, Gearbox2D includes built-in support for NavMeshes, RVO/ORCA, and pathfinding to power intelligent agents.

## Key Features

- **Data-Oriented Architecture**: Zero-copy memory sharing between WASM and JavaScript. Direct `TypedArray` views provide O(1) access to physical state without serialization overhead.
- **Real-time Stability**: Designed to handle external state injections (e.g., from a server) gracefully, maintaining simulation stability even with high-frequency position/velocity updates.
- **AI-Ready Core**: Native implementations of AI navigation tools (NavMeshes, RVO/ORCA) running at native speeds.
- **Advanced Constraints**: High-performance implementations of Hinge, Distance, Spring, and Gear joints for complex mechanical simulations.
- **Novel Optimizations**: Includes unique features like BVH Collision Mask Biasing and speed-dependent bounding area padding.

## Use Cases

- **High-Performance Web Games**: From massive fruit-merging games to complex mechanical simulations.
- **Physics-Based UI**: Advanced, fluid animations and interactive layouts that respond to physical forces.
- **AI & Robotics Research**: Fast prototyping of multi-agent systems with integrated obstacle avoidance.
- **Educational Simulations**: Visualizing complex mechanical systems (like clockwork or engines) in the browser.

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
