# Setup & Installation

Follow these instructions to get GearBox2D up and running on your local machine.

## Prerequisites

Before you can build and run GearBox2D, you'll need the following dependencies installed.

### Required Dependencies

1.  **Node.js and npm** (v18 or higher recommended)
    - Download from [nodejs.org](https://nodejs.org/)
    - Verify with: `node --version` and `npm --version`

2.  **Emscripten SDK** (for WebAssembly compilation)
    - Install via [emsdk](https://emscripten.org/docs/getting_started/downloads.html):
    ```bash
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    ./emsdk install latest
    ./emsdk activate latest
    source ./emsdk_env.sh  # On Windows: emsdk_env.bat
    ```
    - Verify with: `emcc --version`

3.  **GNU Make** (for build automation)
    - **Linux/macOS**: Usually pre-installed.
    - **Windows**: Install via WSL, MinGW, or use `nmake`.

4.  **C++ Compiler** (for running native tests)
    - **Linux**: `g++`
    - **macOS**: `xcode-select --install`
    - **Windows**: MinGW or WSL

5.  **Google Test** (for C++ unit tests)
    - The `Makefile` expects it at `/usr/src/googletest/googletest` by default. You can override this by setting the `GTEST_DIR` environment variable.

### Optional Dependencies

- **Live Server**: For running examples: `npm install -g live-server` or use `npx http-server`.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/JSideris/Gearbox2D.git
    cd Gearbox2D
    ```

2.  **Install Node.js dependencies**:
    ```bash
    npm install
    ```

## Building the Project

You can build the entire project or individual components using the following commands:

```bash
# Build everything (C++ to WASM + TypeScript)
npm run build

# Build WebAssembly module only
npm run build:cpp

# Build TypeScript interface only
npm run build:ts
```

## Running Tests

GearBox2D includes both C++ and TypeScript test suites:

```bash
# Run all tests
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
```

## Running Examples

1.  **Start a local server** (required for WASM loading):
    ```bash
    # Using live-server
    live-server examples/
    
    # Or using Node.js
    npx http-server examples/
    ```

2.  **Open your browser** and navigate to the provided local URL (usually `http://localhost:8080`).

3.  **View the examples** by opening `examples/index.html`.

## Troubleshooting

- **Emscripten not found**: Ensure you have run `source ./emsdk_env.sh` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from `file://` URLs.
- **Build failures**: Try `npm run clean && npm run build` to rebuild from scratch.
