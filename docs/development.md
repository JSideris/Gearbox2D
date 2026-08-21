# Development & Contributing

Follow these instructions to build Gearbox2D from source or contribute to the C++ core. If you just want to use the engine in your project, see [Installation](#installation).

## Prerequisites

To build Gearbox2D, you'll need the following dependencies installed.

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

## Building from Source

1.  **Clone the repository**:
    ```bash
    # Ensure you use --recursive to fetch submodules (e.g., Google Highway)
    git clone --recursive https://github.com/JSideris/Gearbox2D.git
    cd Gearbox2D
    ```
    *If you already cloned the repo without submodules, run:*
    ```bash
    git submodule update --init --recursive
    ```

2.  **Install Node.js dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    You can build the entire project or individual components:
    ```bash
    # Build everything (C++ to WASM + TypeScript + Standalone)
    npm run build

    # Build WebAssembly module only
    npm run build:cpp

    # Build TypeScript interface only
    npm run build:ts
    ```

## Running Tests

Gearbox2D includes both C++ and TypeScript test suites:

```bash
# Run all tests
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
```

For a **research-only** native build with KRB disabled (algorithm ablation, not for release), see [Research builds (KRB ablation)](../readme.md#research-builds-krb-ablation).

## Troubleshooting

- **Emscripten not found**: Ensure you have run `source ./emsdk_env.sh` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from `file://` URLs.
- **Build failures**: Try `npm run clean && npm run build` to rebuild from scratch.

