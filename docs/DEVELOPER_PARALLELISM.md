# Parallelism Architecture in Gearbox2D

Gearbox2D supports both Multithreaded (MT) and Single-threaded (ST) modes using a single C++ codebase. This document outlines the architecture and guidelines for maintaining and extending this functionality.

## Core Principles

1.  **Conditional Compilation**: We use the `GEARBOX_MT` preprocessor macro to distinguish between MT and ST builds.
2.  **DRY Codebase**: Use abstractions to keep the core physics logic identical across both modes.
3.  **Thread Safety**: All shared resources must be protected when `GEARBOX_MT` is defined.

## C++ Implementation Details

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

## Build System

The `Makefile` is configured to produce two sets of WASM artifacts:
*   `gearbox-module-mt.js/wasm`: Compiled with `-pthread` and `-DGEARBOX_MT`.
*   `gearbox-module-st.js/wasm`: Compiled without threading flags.

TypeScript initialization logic (`engine.ts`) automatically detects the environment and loads the appropriate version.
