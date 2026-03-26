# Parallelism Architecture in Gearbox2D

Gearbox2D supports both Multithreaded (MT) and Single-threaded (ST) modes using a single C++ codebase. This document outlines the architecture and guidelines for maintaining and extending this functionality.

## Core Principles

1.  **Conditional Compilation**: We use the `GEARBOX_MT` preprocessor macro to distinguish between MT and ST builds.
2.  **DRY Codebase**: Use abstractions to keep the core physics logic identical across both modes.
3.  **Thread Safety**: All shared resources must be protected when `GEARBOX_MT` is defined.
4.  **Data-Parallelism (SIMD)**: Prefer Structure-of-Arrays (SoA) over Array-of-Structures (AoS) for global data processing to enable WASM SIMD optimizations.

## Data-Parallelism (SIMD)

Gearbox2D uses **Google Highway** to provide portable SIMD support (WASM SIMD128, AVX2, NEON). This requires a specific data layout and access pattern.

### Structure-of-Arrays (SoA)

Unlike traditional physics engines that store data in `Body` objects (Array-of-Structures), Gearbox2D stores performance-critical data in flat, contiguous vectors within the `World` class:
*   `liveBodyFloatData` / `liveBodyIntData`
*   `liveFixtureFloatData` / `liveFixtureIntData`

This layout allows the CPU to load multiple values into a single SIMD register (128-bit, holding 4 floats or 4 integers) and process them in parallel.

### Indexing and Macros

To access data in the SoA layout, you must use the indexing macros defined in `cpp/include/constants.h`:
*   `GET_BODY_FDATA_INDEX(index, offset)`
*   `GET_BODY_IDATA_INDEX(index, offset)`
*   `GET_FIXTURE_FDATA_INDEX(index, offset)`
*   `GET_FIXTURE_IDATA_INDEX(index, offset)`

The formula used is `(offset * MAX_CAPACITY + index)`. This ensures that data for the same attribute (e.g., `X` position) is stored contiguously for all bodies, enabling efficient SIMD loads.

### Fixed Capacity

Because the SoA indexing depends on a fixed stride, the engine uses pre-defined capacities:
*   `MAX_BODIES`: 10,000
*   `MAX_FIXTURES`: 10,000

These must match exactly between C++ (`constants.h`) and TypeScript (`constants.ts`).

### Centralized SIMD Helpers (`simd-math.h`)

All SIMD operations should use the macros defined in `cpp/include/simd-math.h`. This header provides a portable abstraction layer built on **Google Highway**:
1.  **Highway Macros**: Wrappers like `v128_add_f32`, `v128_load_f32`, and `v128_select` that map to `hn::` operations.
2.  **Multi-Platform Support**: Automatically targets WASM SIMD, AVX2, NEON, or SSE depending on the compilation target.
3.  **Automatic Fallbacks**: Highway provides its own optimized scalar fallbacks when SIMD is unavailable.

### SIMD Implementation Pattern

When implementing a vectorized loop, always follow the "4-way processing + tail handling" pattern:

```cpp
int vectorizedCount = (count / 4) * 4;

for (int i = 0; i < vectorizedCount; i += 4) {
    // 1. Load 4 values at once
    V128 vx = v128_load_f32(&liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
    
    // 2. Perform SIMD math
    V128 res = v128_add_f32(vx, some_other_v128);
    
    // 3. Store results back
    v128_store_f32(&liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)], res);
}

// 4. Handle remaining elements (tail) sequentially
for (int i = vectorizedCount; i < count; ++i) {
    // Scalar logic...
}
```

### SIMD Math Library Guidelines

To maintain consistency and performance, all agents must use the centralized math macros in `cpp/include/simd-math.h` instead of manual intrinsic calls for common operations.

#### 1. The 4-Way SoA Pattern
The math library is designed for Structure-of-Arrays (SoA) layouts. This means geometric operations expect vectors to be split across registers:
-   **Register A (X)**: Contains the X components of 4 vectors.
-   **Register A (Y)**: Contains the Y components of 4 vectors.

```cpp
// Example: Dot product of 4 pairs of vectors
V128 ax = v128_load_f32(&x_array[i]);
V128 ay = v128_load_f32(&y_array[i]);
V128 bx = v128_load_f32(&other_x[i]);
V128 by = v128_load_f32(&other_y[i]);

V128 results = v128_dot_f32(ax, ay, bx, by); // Result contains 4 dot products
```

#### 2. Available High-Level Macros
| Macro | Description | Logic |
| :--- | :--- | :--- |
| `v128_dot_f32(ax, ay, bx, by)` | 4-way Dot Product | `ax*bx + ay*by` |
| `v128_cross_f32(ax, ay, bx, by)` | 4-way 2D Cross Product | `ax*by - ay*bx` |
| `v128_mag_sq_f32(vx, vy)` | 4-way Magnitude Squared | `vx*vx + vy*vy` |
| `v128_mag_f32(vx, vy)` | 4-way Magnitude | `sqrt(vx*vx + vy*vy)` |
| `v128_rotate_x_f32(vx, vy, cosA, sinA)` | 4-way Rotation (X component) | `vx*cosA - vy*sinA` |
| `v128_rotate_y_f32(vx, vy, cosA, sinA)` | 4-way Rotation (Y component) | `vx*sinA + vy*cosA` |

#### 3. Usage Strategies
-   **Global Passes**: Use for operations that touch every body (e.g., integration, gravity).
-   **1-vs-4 Batching**: When testing one object against many (e.g., broad-phase or narrow-phase), splat the single object's properties to a register and load 4 neighbors into other registers.
-   **Constraint Solvers**: Group constraints into batches of 4 that share no common bodies to avoid race conditions.

#### 4. Implementation Rules
1.  **Prefer Highway Ops**: When adding new functionality, use `hwy::HWY_NAMESPACE` (`hn::`) operations directly in `simd-math.h`.
2.  **Avoid SIMD Branching**: Use comparison macros (e.g., `v128_gt_f32`) and `v128_select` to handle logic instead of `if` statements inside vectorized loops.
3.  **Use Sqrt sparingly**: Sqrt is expensive even in SIMD. Prefer `v128_mag_sq_f32` for threshold checks.
4.  **Alignment**: Ensure data arrays are aligned to 16-byte boundaries for optimal SIMD performance.

---

## C++ Implementation Details (Multithreading)

### The `GEARBOX_MT` Macro

When building for MT (WASM or Native), `-DGEARBOX_MT` is defined. This enables:
*   Inclusion of `<mutex>` and `<future>`.
*   Threading primitives like `std::mutex` and `std::async`.
*   Atomic-safe data structures.

### Island Solving

The primary point of parallelism is the Island Solver.
*   **MT Mode**: Islands are collected and enqueued to a persistent `ThreadPool`. We use `threadPool->wait()` to synchronize before moving to the next physics phase.
*   **ST Mode**: Islands are processed sequentially in the same loop.

> **WARNING**: `std::async(std::launch::async, ...)` is **FORBIDDEN**. It causes Emscripten to dynamically spawn new Web Workers, leading to excessive HTTP requests and browser crashes.

```cpp
#ifdef GEARBOX_MT
    for (auto& isl : islands) {
        threadPool->enqueue([this, &isl, dt, substepIndex]() {
            this->_solveIsland(isl, dt, substepIndex);
        });
    }
    threadPool->wait();
#else
    for (auto& isl : islands) {
        _solveIsland(isl, dt, substepIndex);
    }
#endif
```

### Job System (ThreadPool)

Gearbox2D uses a persistent `ThreadPool` (defined in `cpp/include/thread-pool.h`) to manage a fixed set of worker threads.

- **Initialization**: The pool is initialized once in the `World` constructor with a size matching `PTHREAD_POOL_SIZE` (default 4).
- **Enqueueing**: Use `threadPool->enqueue(callback)` to submit work.
- **Synchronization**: Always call `threadPool->wait()` to block the main thread until all enqueued tasks are finished. This is essential for maintaining physics consistency between substeps.
- **Task Granularity**: Avoid enqueuing thousands of tiny tasks. If processing many small objects, batch them (e.g., 100 objects per task) to minimize queue overhead.

### Common Pitfalls & Deadlocks

1.  **Dynamic Spawning**: Do not use `std::thread` or `std::async`. These bypass our pool and cause the browser to freeze while it attempts to spin up new Web Workers on-the-fly.
2.  **The "Main Thread" Rule**: Worker threads **MUST NOT** call functions that proxy back to JavaScript (e.g., `emscripten::val` methods or `console.log`) while the Main Thread is blocked on `threadPool->wait()`. This will cause an immediate deadlock because the Main Thread is unavailable to process the incoming proxy request from the worker.
3.  **Shared State**: Always initialize shared data structures on the Main Thread before enqueuing parallel work.

### Shared Resource Protection

Currently, `eventData` is the main shared resource modified during the parallel solve phase (via `wakeUp()` or `sleep()`). It is protected by `eventMutex` when `GEARBOX_MT` is defined.

```cpp
void World::addEvent(...) {
#ifdef GEARBOX_MT
    std::lock_guard<std::mutex> lock(eventMutex);
#endif
    eventData.push_back(...);
}
```

## Guidelines for Future Parallelization (LLM Prompt)

If you are an AI assistant tasked with parallelizing a new part of the codebase (e.g., Narrow-Phase Detection or Global Integrators), follow these rules:

1.  **Always wrap threading logic**: Use `#ifdef GEARBOX_MT` for any header includes or member variables related to threading.
2.  **Use the ThreadPool**: Never spawn threads manually. Use `world->threadPool->enqueue` and `world->threadPool->wait()`.
3.  **Maintain ST parity**: Ensure that the code still builds and runs correctly in Single-threaded mode. The ST path should be a direct, sequential equivalent of the MT path.
4.  **Use `std::uint8_t` for flags**: Avoid `std::vector<bool>` for shared flags, as bit-packing is not thread-safe. Use `std::vector<uint8_t>` instead.
5.  **Pre-initialize shared state**: If multiple threads need to read from a shared structure, initialize it fully on the main thread before starting parallel tasks.
6.  **Minimize lock contention**: Keep critical sections (protected by mutexes) as small as possible to avoid bottlenecking the parallel execution.
7.  **No JS proxying**: Ensure parallel code is pure C++ and does not call back into JS via `emscripten::val` to avoid deadlocks.
8.  **Maintain SoA Parity**: When adding new physical properties, add them to the SoA layout in `constants.h` and `constants.ts`.
9.  **Prefer SIMD for Global Passes**: Use SIMD for operations that affect all bodies (gravity, damping, integration). Use ThreadPool for operations that are naturally partitioned (islands).
10. **Build Flags**: Ensure `-msimd128` is present in the `Makefile` for WASM builds.
11. **No JS proxying in SIMD**: Just like with worker threads, ensure SIMD loops are pure C++ and do not call back into JS to avoid performance degradation.

## Build System

The `Makefile` is configured to produce two sets of WASM artifacts:
*   `gearbox-module-mt.js/wasm`: Compiled with `-pthread` and `-DGEARBOX_MT`.
*   `gearbox-module-st.js/wasm`: Compiled without threading flags.

TypeScript initialization logic (`engine.ts`) automatically detects the environment and loads the appropriate version.
