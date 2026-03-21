# Performance Optimizations

Gearbox2D achieves high performance through several key architectural choices. This document provides an overview of the core technologies that make it fast.

## WebAssembly (WASM) & C++

The core physics engine is written in performance-critical C++ and compiled to **WebAssembly (WASM)**. This allows the engine to run at near-native speeds directly in the browser, bypassing the traditional overhead of JavaScript's garbage collection and dynamic typing.

## Structure-of-Arrays (SoA) Data Layout

Unlike traditional physics engines that use an **Array-of-Structures (AoS)** layout (where each object is a single struct containing its properties), Gearbox2D uses a **Structure-of-Arrays (SoA)** layout.

### Why SoA?
In an AoS layout, properties like `x` and `y` are interleaved with other data like `mass` or `damping`. This often results in "cache misses" when the CPU performs a global operation (like updating all positions).

In Gearbox2D's SoA layout:
- All `x` coordinates are stored in one contiguous array.
- All `y` coordinates are stored in another contiguous array.
- All `vx` (velocity) components are stored together, and so on.

### Benefits:
1.  **Cache Locality**: When the engine updates positions, it reads from a contiguous block of memory, which the CPU can pre-fetch into its cache extremely efficiently.
2.  **Zero-Copy Memory Access**: This layout allows the TypeScript API to create `TypedArray` views directly over specific property arrays, enabling zero-copy state access.
3.  **SIMD Readiness**: This is the primary requirement for efficient SIMD processing.

## WASM SIMD (Single Instruction, Multiple Data)

Gearbox2D leverages **WASM SIMD** (Single Instruction, Multiple Data) to perform 4-way parallel processing on compatible browsers.

### How it works:
Instead of processing objects one-by-one, the engine's global integrators use 128-bit SIMD registers to process **four objects simultaneously** in a single CPU instruction.

*   **Vectorized Position Integration**: Updates the `x` and `y` of 4 bodies at once.
*   **Vectorized Velocity Integration**: Applies gravity and damping to 4 bodies at once.

### Performance Impact:
Global kinematics and integration passes see up to a **4x performance increase** when SIMD is enabled. This allows the engine to handle thousands of dynamic objects while maintaining a smooth 60fps.

## Multi-Threaded Island Solving

Gearbox2D uses a sophisticated multi-threaded solver for resolving collisions and joints.

1.  **Island Partitioning**: The engine identifies independent "islands" of objects that are in contact.
2.  **ThreadPool Processing**: These islands are distributed across multiple Web Worker threads.
3.  **Lock-Free Synchronization**: Independent islands are solved in parallel without the need for expensive cross-thread locks.

## Spatial Partitioning: BVH

For broad-phase collision detection, Gearbox2D uses a high-performance **Bounding Volume Hierarchy (BVH)**. This spatial index allows the engine to quickly discard thousands of object pairs that are too far apart to collide, focusing the expensive narrow-phase calculations only on objects that are likely to be interacting.
