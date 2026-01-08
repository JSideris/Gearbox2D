# Introduction

GearBox2D is a blazing-fast 2D physics engine written in C++ and compiled to WebAssembly, with a clean TypeScript interface. It is optimized for high-frequency simulations and applications requiring frequent updates via direct memory sharing.

## Design Philosophy

GearBox2D is designed with a data-oriented architecture, optimized for high-performance data transfer between JavaScript and WASM. Instead of copying object data on every step, the engine uses **shared memory**.

- **WASM Memory**: Volatile object data (position, velocity, etc.) is stored in contiguous buffers in C++.
- **TypedArray Views**: The TypeScript interface creates `Float32Array` and `Int32Array` views directly over these WASM memory buffers.
- **Direct Access**: When you access `object.x` or `object.vx` in TypeScript, you are reading/writing directly to the memory used by the WASM physics core.

This architecture minimizes overhead and allows for thousands of objects to be updated and rendered efficiently.

## Project Structure

The project is organized into several key directories:

- `cpp/`: C++ source code, including headers, implementations, and unit tests.
- `typescript/`: TypeScript source for the engine's public interface.
- `examples/`: Web-based examples and demos showcasing engine capabilities.
- `docs/`: In-depth documentation and guides (where you are now).
- `studies/`: Performance and optimization studies.
- `dist/`: Build output for both JavaScript and WebAssembly modules.

## Roadmap

The engine is under active development. Key focus areas include:
- Improving stability for complex constraints.
- Expanding supported shapes (Capsules, Polygons).
- Implementing Continuous Collision Detection (CCD).
- Integrating fluid dynamics and AI pathfinding.

Check the `plan.md` file in the repository for a detailed list of implemented features and future development goals.
