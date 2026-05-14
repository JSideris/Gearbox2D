import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        */import{M as g}from"./markdown-oLTTx95D.js";const b="# Documentation Structure: Gearbox2D\n\n## Getting Started\n- `introduction.md`: Introduction\n- `installation.md`: Setup\n- `core-concepts.md`: Core Concepts\n- `first-simulation.md`: First Simulation\n- `game-loop.md`: The Simulation Loop\n- `development.md`: Engine Development\n- `plan.md`: Project Roadmap\n\n## Core Architecture\n- `architecture-world.md`: Engine & World Lifecycle\n- `architecture-wasm-memory.md`: WASM & Shared Memory\n- `architecture-coordinates.md`: Coordinates & Units\n\n## Bodys\n- `objects-body-types.md`: Body Types\n- `objects-lifecycle.md`: Object Lifecycle\n- `objects-properties.md`: Body Properties\n\n## Shapes & Geometry\n- `shapes.md`: Supported Shapes\n\n## Constraints & Joints\n- `joints-overview.md`: Joints Overview\n- `joints-hinge.md`: Hinge Joints\n- `joints-distance.md`: Distance Joints\n- `joints-spring.md`: Spring Joints\n- `joints-gear.md`: Gear Joints\n\n## Collision System\n- `collision-broad-phase.md`: Broad Phase\n- `collision-narrow-phase.md`: Narrow Phase\n- `collision-filtering.md`: Collision Filtering\n\n## Events\n- `events.md`: Body Events\n\n## Spatial Queries & Interaction\n- `interaction-queries.md`: Spatial Queries\n\n## Graphics & Debugging\n- `graphics-debug.md`: Debug Graphics\n\n## Performance & Optimization\n- `performance-tips.md`: Performance Tips\n- `performance-optimizations.md`: Optimizations\n\n## Advanced & Planned Features\n- `planned-fluid-dynamics.md`: Fluid Dynamics (Planned)\n- `planned-ai-pathfinding.md`: AI Pathfinding (Planned)\n- `planned-ccd.md`: Continuous Collision Detection (Planned)\n\n",p=Object.freeze(Object.defineProperty({__proto__:null,default:b},Symbol.toStringTag,{value:"Module"})),f='# Parallelism Architecture in Gearbox2D\n\nGearbox2D supports both Multithreaded (MT) and Single-threaded (ST) modes using a single C++ codebase. This document outlines the architecture and guidelines for maintaining and extending this functionality.\n\n## Core Principles\n\n1.  **Conditional Compilation**: We use the `GEARBOX_MT` preprocessor macro to distinguish between MT and ST builds.\n2.  **DRY Codebase**: Use abstractions to keep the core physics logic identical across both modes.\n3.  **Thread Safety**: All shared resources must be protected when `GEARBOX_MT` is defined.\n4.  **Data-Parallelism (SIMD)**: Prefer Structure-of-Arrays (SoA) over Array-of-Structures (AoS) for global data processing to enable WASM SIMD optimizations.\n\n## Data-Parallelism (SIMD)\n\nGearbox2D uses **Google Highway** to provide portable SIMD support (WASM SIMD128, AVX2, NEON). This requires a specific data layout and access pattern.\n\n### Structure-of-Arrays (SoA)\n\nUnlike traditional physics engines that store data in `Body` objects (Array-of-Structures), Gearbox2D stores performance-critical data in flat, contiguous vectors within the `World` class:\n*   `liveBodyFloatData` / `liveBodyIntData`\n*   `liveFixtureFloatData` / `liveFixtureIntData`\n\nThis layout allows the CPU to load multiple values into a single SIMD register (128-bit, holding 4 floats or 4 integers) and process them in parallel.\n\n### Indexing and Macros\n\nTo access data in the SoA layout, you must use the indexing macros defined in `cpp/include/constants.h`:\n*   `GET_BODY_FDATA_INDEX(index, offset)`\n*   `GET_BODY_IDATA_INDEX(index, offset)`\n*   `GET_FIXTURE_FDATA_INDEX(index, offset)`\n*   `GET_FIXTURE_IDATA_INDEX(index, offset)`\n\nThe formula used is `(offset * MAX_CAPACITY + index)`. This ensures that data for the same attribute (e.g., `X` position) is stored contiguously for all bodies, enabling efficient SIMD loads.\n\n### Fixed Capacity\n\nBecause the SoA indexing depends on a fixed stride, the engine uses pre-defined capacities:\n*   `MAX_BODIES`: 10,000\n*   `MAX_FIXTURES`: 10,000\n\nThese must match exactly between C++ (`constants.h`) and TypeScript (`constants.ts`).\n\n### Centralized SIMD Helpers (`simd-math.h`)\n\nAll SIMD operations should use the macros defined in `cpp/include/simd-math.h`. This header provides a portable abstraction layer built on **Google Highway**:\n1.  **Highway Macros**: Wrappers like `v128_add_f32`, `v128_load_f32`, and `v128_select` that map to `hn::` operations.\n2.  **Multi-Platform Support**: Automatically targets WASM SIMD, AVX2, NEON, or SSE depending on the compilation target.\n3.  **Automatic Fallbacks**: Highway provides its own optimized scalar fallbacks when SIMD is unavailable.\n\n### SIMD Implementation Pattern\n\nWhen implementing a vectorized loop, always follow the "4-way processing + tail handling" pattern:\n\n```cpp\nint vectorizedCount = (count / 4) * 4;\n\nfor (int i = 0; i < vectorizedCount; i += 4) {\n    // 1. Load 4 values at once\n    V128 vx = v128_load_f32(&liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);\n    \n    // 2. Perform SIMD math\n    V128 res = v128_add_f32(vx, some_other_v128);\n    \n    // 3. Store results back\n    v128_store_f32(&liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)], res);\n}\n\n// 4. Handle remaining elements (tail) sequentially\nfor (int i = vectorizedCount; i < count; ++i) {\n    // Scalar logic...\n}\n```\n\n### SIMD Math Library Guidelines\n\nTo maintain consistency and performance, all agents must use the centralized math macros in `cpp/include/simd-math.h` instead of manual intrinsic calls for common operations.\n\n#### 1. The 4-Way SoA Pattern\nThe math library is designed for Structure-of-Arrays (SoA) layouts. This means geometric operations expect vectors to be split across registers:\n-   **Register A (X)**: Contains the X components of 4 vectors.\n-   **Register A (Y)**: Contains the Y components of 4 vectors.\n\n```cpp\n// Example: Dot product of 4 pairs of vectors\nV128 ax = v128_load_f32(&x_array[i]);\nV128 ay = v128_load_f32(&y_array[i]);\nV128 bx = v128_load_f32(&other_x[i]);\nV128 by = v128_load_f32(&other_y[i]);\n\nV128 results = v128_dot_f32(ax, ay, bx, by); // Result contains 4 dot products\n```\n\n#### 2. Available High-Level Macros\n| Macro | Description | Logic |\n| :--- | :--- | :--- |\n| `v128_dot_f32(ax, ay, bx, by)` | 4-way Dot Product | `ax*bx + ay*by` |\n| `v128_cross_f32(ax, ay, bx, by)` | 4-way 2D Cross Product | `ax*by - ay*bx` |\n| `v128_mag_sq_f32(vx, vy)` | 4-way Magnitude Squared | `vx*vx + vy*vy` |\n| `v128_mag_f32(vx, vy)` | 4-way Magnitude | `sqrt(vx*vx + vy*vy)` |\n| `v128_rotate_x_f32(vx, vy, cosA, sinA)` | 4-way Rotation (X component) | `vx*cosA - vy*sinA` |\n| `v128_rotate_y_f32(vx, vy, cosA, sinA)` | 4-way Rotation (Y component) | `vx*sinA + vy*cosA` |\n\n#### 3. Usage Strategies\n-   **Global Passes**: Use for operations that touch every body (e.g., integration, gravity).\n-   **1-vs-4 Batching**: When testing one object against many (e.g., broad-phase or narrow-phase), splat the single object\'s properties to a register and load 4 neighbors into other registers.\n-   **Constraint Solvers**: Group constraints into batches of 4 that share no common bodies to avoid race conditions.\n\n#### 4. Implementation Rules\n1.  **Prefer Highway Ops**: When adding new functionality, use `hwy::HWY_NAMESPACE` (`hn::`) operations directly in `simd-math.h`.\n2.  **Avoid SIMD Branching**: Use comparison macros (e.g., `v128_gt_f32`) and `v128_select` to handle logic instead of `if` statements inside vectorized loops.\n3.  **Use Sqrt sparingly**: Sqrt is expensive even in SIMD. Prefer `v128_mag_sq_f32` for threshold checks.\n4.  **Alignment**: Ensure data arrays are aligned to 16-byte boundaries for optimal SIMD performance.\n\n---\n\n## C++ Implementation Details (Multithreading)\n\n### The `GEARBOX_MT` Macro\n\nWhen building for MT (WASM or Native), `-DGEARBOX_MT` is defined. This enables:\n*   Inclusion of `<mutex>` and `<future>`.\n*   Threading primitives like `std::mutex` and `std::async`.\n*   Atomic-safe data structures.\n\n### Island Solving\n\nThe primary point of parallelism is the Island Solver.\n*   **MT Mode**: Islands are collected and enqueued to a persistent `ThreadPool`. We use `threadPool->wait()` to synchronize before moving to the next physics phase.\n*   **ST Mode**: Islands are processed sequentially in the same loop.\n\n> **WARNING**: `std::async(std::launch::async, ...)` is **FORBIDDEN**. It causes Emscripten to dynamically spawn new Web Workers, leading to excessive HTTP requests and browser crashes.\n\n```cpp\n#ifdef GEARBOX_MT\n    for (auto& isl : islands) {\n        threadPool->enqueue([this, &isl, dt, substepIndex]() {\n            this->_solveIsland(isl, dt, substepIndex);\n        });\n    }\n    threadPool->wait();\n#else\n    for (auto& isl : islands) {\n        _solveIsland(isl, dt, substepIndex);\n    }\n#endif\n```\n\n### Job System (ThreadPool)\n\nGearbox2D uses a persistent `ThreadPool` (defined in `cpp/include/thread-pool.h`) to manage a fixed set of worker threads.\n\n- **Initialization**: The pool is initialized once in the `World` constructor with a size matching `PTHREAD_POOL_SIZE` (default 4).\n- **Enqueueing**: Use `threadPool->enqueue(callback)` to submit work.\n- **Synchronization**: Always call `threadPool->wait()` to block the main thread until all enqueued tasks are finished. This is essential for maintaining physics consistency between substeps.\n- **Task Granularity**: Avoid enqueuing thousands of tiny tasks. If processing many small objects, batch them (e.g., 100 objects per task) to minimize queue overhead.\n\n### Common Pitfalls & Deadlocks\n\n1.  **Dynamic Spawning**: Do not use `std::thread` or `std::async`. These bypass our pool and cause the browser to freeze while it attempts to spin up new Web Workers on-the-fly.\n2.  **The "Main Thread" Rule**: Worker threads **MUST NOT** call functions that proxy back to JavaScript (e.g., `emscripten::val` methods or `console.log`) while the Main Thread is blocked on `threadPool->wait()`. This will cause an immediate deadlock because the Main Thread is unavailable to process the incoming proxy request from the worker.\n3.  **Shared State**: Always initialize shared data structures on the Main Thread before enqueuing parallel work.\n\n### Shared Resource Protection\n\nCurrently, `eventData` is the main shared resource modified during the parallel solve phase (via `wakeUp()` or `sleep()`). It is protected by `eventMutex` when `GEARBOX_MT` is defined.\n\n```cpp\nvoid World::addEvent(...) {\n#ifdef GEARBOX_MT\n    std::lock_guard<std::mutex> lock(eventMutex);\n#endif\n    eventData.push_back(...);\n}\n```\n\n## Guidelines for Future Parallelization (LLM Prompt)\n\nIf you are an AI assistant tasked with parallelizing a new part of the codebase (e.g., Narrow-Phase Detection or Global Integrators), follow these rules:\n\n1.  **Always wrap threading logic**: Use `#ifdef GEARBOX_MT` for any header includes or member variables related to threading.\n2.  **Use the ThreadPool**: Never spawn threads manually. Use `world->threadPool->enqueue` and `world->threadPool->wait()`.\n3.  **Maintain ST parity**: Ensure that the code still builds and runs correctly in Single-threaded mode. The ST path should be a direct, sequential equivalent of the MT path.\n4.  **Use `std::uint8_t` for flags**: Avoid `std::vector<bool>` for shared flags, as bit-packing is not thread-safe. Use `std::vector<uint8_t>` instead.\n5.  **Pre-initialize shared state**: If multiple threads need to read from a shared structure, initialize it fully on the main thread before starting parallel tasks.\n6.  **Minimize lock contention**: Keep critical sections (protected by mutexes) as small as possible to avoid bottlenecking the parallel execution.\n7.  **No JS proxying**: Ensure parallel code is pure C++ and does not call back into JS via `emscripten::val` to avoid deadlocks.\n8.  **Maintain SoA Parity**: When adding new physical properties, add them to the SoA layout in `constants.h` and `constants.ts`.\n9.  **Prefer SIMD for Global Passes**: Use SIMD for operations that affect all bodies (gravity, damping, integration). Use ThreadPool for operations that are naturally partitioned (islands).\n10. **Build Flags**: Ensure `-msimd128` is present in the `Makefile` for WASM builds.\n11. **No JS proxying in SIMD**: Just like with worker threads, ensure SIMD loops are pure C++ and do not call back into JS to avoid performance degradation.\n\n## Build System\n\nThe `Makefile` is configured to produce two sets of WASM artifacts:\n*   `gearbox-module-mt.js/wasm`: Compiled with `-pthread` and `-DGEARBOX_MT`.\n*   `gearbox-module-st.js/wasm`: Compiled without threading flags.\n\nTypeScript initialization logic (`engine.ts`) automatically detects the environment and loads the appropriate version.\n',v=Object.freeze(Object.defineProperty({__proto__:null,default:f},Symbol.toStringTag,{value:"Module"})),w=`# Coordinate System and Units

Gearbox2D uses a 2D Cartesian coordinate system and is fundamentally **unitless**. This means the engine does not care if a unit represents a meter, a kilometer, or a pixel. However, due to floating-point precision and fixed internal constants, there are significant practical considerations for stability and performance.

## The Coordinate System

- **X-Axis**: Increases to the right.
- **Y-Axis**: Increases upwards.
- **Rotation**: Measured in **radians**. Positive rotation is **counter-clockwise**.
- **Origin**: (0, 0) is the default reference point for the world.

## Recommended Units (MKS)

For the best numerical stability, it is strongly recommended to use the **MKS (Meters-Kilogram-Seconds)** system:
- **Length**: Meters (m)
- **Mass**: Kilograms (kg)
- **Time**: Seconds (s)

### Why MKS?
The engine is tuned for objects roughly between **0.1 and 10.0 units** in size. If you use pixels as units (where a typical character might be 64 or 128 units tall), the physics solver may struggle with:
1.  **Penetration Slop**: The engine allows a small overlap (\`PENETRATION_SLOP = 0.008\`) to prevent jitter. If your objects are very small (e.g., 0.01 units), this slop becomes a significant percentage of their size.
2.  **Stability**: Large coordinates and velocities can lead to floating-point precision loss.

## Best Practices for Scaling

### 1. Object Sizes
- **Dynamic Bodies**: Keep between 0.1 and 10 units. A human-sized character should be ~1.8 units tall.
- **Static Bodies**: Can be much larger (e.g., a 500-unit ground plane), but avoid extreme aspect ratios or scales compared to dynamic objects.

### 2. Mass and Density
- Aim for a **Density** around 1.0. 
- Avoid extremely light objects (mass < 0.01) or extremely heavy objects (mass > 1000) interacting with each other, as this creates a high mass ratio that can make the solver converge slowly or become unstable.

### 3. Simulation Speed
- The \`World::step(dt)\` function expects \`dt\` in seconds (e.g., \`1.0 / 60.0\`). 
- Avoid using very large or very small time steps.

## Multi-Scale Simulations

If your simulation operates on vastly different scales (e.g., a solar system or a microscopic environment):

- **Planetary Scale**: Instead of using actual kilometers, scale your world down so that your primary actors are within the "stable range" (0.1 - 10 units). You can apply a visual scaling factor in your renderer.
- **Microscopic Scale**: Scale up your units. If you are simulating microbes, 1 unit could represent 1 micrometer.

## Summary Table

| Property | Recommended Unit | Convention |
| :--- | :--- | :--- |
| Position | Meters | X right, Y up |
| Angle | Radians | Counter-clockwise |
| Mass | Kilograms | Positive non-zero |
| Velocity | Meters / Second | |
| Angular Velocity | Radians / Second | |
| Force | Newtons (kg·m/s²) | |
| Gravity | Meters / Second² | (0, -9.8) for Earth-like |

> [!TIP]
> Use a conversion factor (e.g., \`pixels_per_meter = 30\`) when translating between physics units and your rendering engine. Only convert to pixels in your draw call; keep the internal logic in physics units.
`,x=Object.freeze(Object.defineProperty({__proto__:null,default:w},Symbol.toStringTag,{value:"Module"})),S=`# WASM & Shared Memory

Gearbox2D achieve its industry-leading performance by leveraging a hybrid memory architecture. The core physics calculations happen in highly optimized C++ compiled to WebAssembly (WASM), while the high-level API is provided in TypeScript.

## The WASM Heap

Unlike standard JavaScript objects, which are managed by a garbage collector, Gearbox2D objects live in a dedicated block of memory called the **WASM Heap**.

### Manual Allocation
When you call \`world.createBody()\` or \`world.createJoint()\`, the engine allocates space on the C++ heap. This memory **persists** even if you lose all JavaScript references to the object. 

### Manual Disposal
Because WASM cannot see JS references and JS cannot automatically free WASM memory, you must manage the lifecycle of your physics world:
*   Use \`world.clear()\` to empty a world.
*   Use \`world.destroy()\` to delete the world and its heap allocation.

## Zero-Copy State Access

The "WASM Bottleneck" in most web engines is the cost of copying data (like positions and rotations) between the WASM memory and JS objects every frame. Gearbox2D solves this with **Shared Data Buffers** and zero-copy abstractions.

### How it works:
1.  The C++ core maintains data in a **Structure-of-Arrays (SoA)** layout. Instead of an array of objects, each property (like \`x\`, \`y\`, or \`vx\`) has its own contiguous array within a large shared buffer.
2.  The TypeScript \`World\` object creates \`TypedArray\` views (like \`liveBodyFloatData\`) directly over these memory addresses.
3.  This layout is designed for **WASM SIMD** (Single Instruction, Multiple Data), allowing the engine to process 4 objects simultaneously in a single CPU instruction.
4.  When the C++ engine updates a position, it is **instantly available** to TypeScript with zero copying.

### Property Accessors
To provide a clean API while maintaining performance, Gearbox2D uses internal **RowViews**. Each \`Body\` and \`Fixture\` instance is a lightweight wrapper that points to its specific index in the shared SoA buffers.

\`\`\`typescript
// Under the hood, body.x is a property getter using a RowView.
// It calculates the memory offset as (property_offset * MAX_BODIES + body_index).
const x = body.x; 
\`\`\`

## Memory Access Abstractions

To prevent bugs from manual offset calculations, Gearbox2D provides two primary abstractions for shared memory access:

### 1. BufferView
A \`BufferView\` manages a full typed array with a **fixed stride**. In the SoA architecture, the stride is always \`MAX_BODIES\` (10,000) for body data and \`MAX_FIXTURES\` (10,000) for fixture data.

\`\`\`typescript
// Accessing the 'x' position of the 5th body manually:
const x = world.bodyFloats.get(5, BODY_X_OFFSET);
\`\`\`

### 2. RowView
A \`RowView\` is bound to a specific object and its index. It provides a localized view of the object's properties across the SoA arrays.

\`\`\`typescript
// RowViews support get, set, and add operations
this.floats.add(BODY_NFX_OFFSET, forceX);
\`\`\`

## Fixed Capacity & Engine Limits

To maximize SIMD performance and minimize heap fragmentation, Gearbox2D uses a **fixed-capacity** memory model.

*   **MAX_BODIES**: 10,000 per world.
*   **MAX_FIXTURES**: 10,000 per world.

These limits are pre-allocated upon world creation. If your simulation requires more objects, you may need to distribute them across multiple \`World\` instances.

## Direct Buffer Access

For advanced users or performance-critical tasks, you can access both the new views and the underlying raw buffers via the \`World\` instance:

### Structured Views (Recommended)
*   \`world.bodyFloats\`: \`BufferView<Float32Array>\` for body state.
*   \`world.bodyInts\`: \`BufferView<Int32Array>\` for flags and IDs.
*   \`world.fixtureFloats\`: \`BufferView<Float32Array>\` for shape data.
*   \`world.fixtureInts\`: \`BufferView<Int32Array>\` for shape properties.

### Raw Data Buffers
*   \`world.liveBodyFloatData\`
*   \`world.liveBodyIntData\`
*   \`world.liveFixtureFloatData\`
*   \`world.liveFixtureIntData\`

### Performance Tip: GPU Uploads
If you are building a custom high-performance renderer (e.g., using WebGL or WebGPU), you can upload the underlying raw buffers (like \`world.liveBodyFloatData\`) directly to the GPU. This allows you to render thousands of objects with zero CPU overhead per-object.

## Memory Safety Best Practices

1.  **Don't "New" in Loops**: Avoid creating worlds inside frequent events or animation frames.
2.  **Recycle IDs**: Use a consistent ID mapping strategy to avoid confusion when bodies are removed and added.
3.  **Check Heap Growth**: Be aware that as the number of objects grows, the WASM heap may resize. Gearbox2D handles this internally, but frequent resizing can cause small performance hitches.
`,A=Object.freeze(Object.defineProperty({__proto__:null,default:S},Symbol.toStringTag,{value:"Module"})),T=`# World Object

The \`World\` object is the central container for all physical entities in Gearbox2D. It manages the lifecycle of bodys and joints, orchestrates the simulation steps, and handles global physics settings like gravity and collision resolution.

## Introduction

In Gearbox2D, the \`World\` acts as the coordinator for the entire physics simulation. It maintains internal data structures (like the BVH for spatial partitioning) and provides the interface for creating, querying, and manipulating the physical environment.

Key responsibilities include:
- **Entity Management**: Creating and removing bodys and joints.
- **Simulation Control**: Stepping the physics forward in time.
- **Global Settings**: Configuring gravity and toggleable physics features (restitution, friction, etc.).
- **Spatial Queries**: Performing point queries and broad-phase checks.

## Engine & World Lifecycle

Understanding the lifecycle of Gearbox2D is critical for managing memory effectively and ensuring high performance, especially in long-running applications or those with multiple scenes.

### 1. Engine Initialization

Before any physics can happen, the WebAssembly module must be loaded and initialized. This should only be done **once** per page load.

\`\`\`typescript
import gearbox from 'gearbox2d';

async function start() {
    // One-time initialization
    await gearbox.init();
    
    // Now you can create worlds
    const world = gearbox.createWorld();
}
\`\`\`

### 2. World Creation

\`gearbox.createWorld()\` allocates a new physics world in the WebAssembly heap. While you can create multiple worlds for side-by-side simulations or isolated UI physics, each world consumes a significant block of WASM memory.

### 3. Stepping the Simulation

The simulation progresses in discrete time intervals called "steps". Typically, you call \`world.step()\` within your application's main loop (e.g., inside \`requestAnimationFrame\`).

\`\`\`typescript
function update() {
    // Advance the simulation by one time step
    world.step();
    
    // Request the next frame
    requestAnimationFrame(update);
}
\`\`\`

By default, the engine uses a fixed time step (60Hz). For maximum stability, it is recommended to use a fixed time step. You can adjust this using \`setTimeStep(dt)\`. See [The Simulation Loop](game-loop.md) for advanced implementation details.

### 4. Resetting vs. Destroying

When moving between levels or scenes, you have two options for managing world memory:

#### Option A: World Recycling (Recommended)
If you are simply restarting a level or moving to a new scene with similar requirements, use \`world.clear()\`.

*   **Action**: \`world.clear()\`
*   **Result**: Removes all bodies, fixtures, and joints from the simulation.
*   **Behavior**: Instead of freeing memory, it **zero-fills the existing pre-allocated data buffers**, keeping the \`World\` object and its memory pool ready for immediate reuse.
*   **Best for**: Fast scene transitions and preventing heap fragmentation.

#### Option B: Explicit Destruction
If you are moving to a part of your application that no longer requires physics, or if you need to create a completely different world configuration, use \`world.destroy()\`.

*   **Action**: \`world.destroy()\`
*   **Result**: Calls the C++ destructor and **immediately frees the underlying WASM memory**.
*   **Best for**: Freeing resources when physics is no longer needed.

## Simulation Mechanics

The \`world.step()\` method executes several distinct phases to resolve physics for the current frame:

1.  **Kinematics (Integration)**: Updates positions and velocities based on current forces, gravity, and damping.
2.  **Broad Phase (BVH)**: Uses a Bounding Volume Hierarchy to quickly identify pairs of objects whose AABBs overlap.
3.  **Narrow Phase**: Performs precise collision detection for the pairs identified in the broad phase to find contact points and penetration depths.
4.  **Contact Management**: Tracks collisions over time, triggering \`onCollisionStart\` and \`onCollisionEnd\` events.
5.  **Constraint Solving**: Resolves impulses for collisions and joints using an iterative solver.

### Time Steps

Stability in physics simulations depends heavily on the consistency of the time step. Gearbox2D is optimized for a fixed time step.

\`\`\`typescript
// Set the simulation to 120Hz for higher precision
world.setTimeStep(1 / 120);
\`\`\`

## Physics Configuration

The \`World\` provides global toggles and settings that affect all objects within it.

### Gravity

Gravity is a global force applied to all dynamic objects.

\`\`\`typescript
// Set gravity (x, y)
world.setGravity(0, 9.81);
\`\`\`

### Feature Toggles

You can enable or disable specific parts of the physics solver to optimize performance or achieve specific behaviors:

- **Penetration Resolution**: \`setHasPenetrationResolution(bool)\` - Toggles whether objects should push each other out when overlapping.
- **Restitution**: \`setHasRestitution(bool)\` - Toggles bounciness calculation.
- **Friction**: \`setHasFriction(bool)\` - Toggles friction calculation.

\`\`\`typescript
world.setHasRestitution(true);
world.setHasFriction(true);
world.setHasPenetrationResolution(true);
\`\`\`

## ID Management

In Gearbox2D, every body, fixture, and joint can be assigned a unique **ID** at creation time. These IDs are primarily for your own tracking and convenience.

### IDs are Optional
Providing an ID is completely optional. The physics engine operates perfectly fine without user-provided IDs, as it manages its own internal identifiers for simulation purposes.

You should provide an ID if:
- You need to look up an object later using methods like \`world.getBodyById(id)\` or \`world.getJointById(id)\`.
- You want to identify specific objects in global event handlers (like \`onCollisionStart\`).
- You need to remove specific objects by ID via \`world.removeObject(id)\` or \`world.removeJoint(id)\`.

If you do not provide an ID:
- Registry lookup methods will return \`undefined\`.
- Event handlers will receive \`undefined\` for the ID parameters of that object.
- You must maintain your own direct reference to the object returned by the creation method if you need to manipulate or remove it later.

## Object and Joint Management

The \`World\` provides a registry for managing entities. This allows for efficient lookups across the JavaScript and WebAssembly boundary.

### Bodys

Objects are created with an optional unique ID and a specification object. You can attach fixtures (shapes) atomically during creation or add them later.

\`\`\`typescript
// Atomic creation with multiple fixtures
const obj = world.createBody({ 
    id: 101, // Optional user-provided ID
    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
    x: 0,
    y: 0,
    fixtures: [
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: -1 },
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: 1 }
    ]
});

// Adding a fixture at runtime
obj.createFixture({
    id: 201, // Optional
    shape: gearbox.shapes.BOX,
    width: 2,
    height: 1
});

// Remove an object by ID (only if an ID was provided)
world.removeObject(101);
\`\`\`

### Joints

Joints are created through factory methods on the \`World\` instance. They connect two \`Body\` instances. All joint creation methods take an optional \`id\` within the \`options\` object.

- **Hinge Joint**: \`createHingeJoint(bodyA, bodyB, options)\`
- **Distance Joint**: \`createDistanceJoint(bodyA, bodyB, options)\`
- **Spring Joint**: \`createSpringJoint(bodyA, bodyB, options)\`
- **Gear Joint**: \`createGearJoint(joint1, joint2, options)\`

\`\`\`typescript
const hinge = world.createHingeJoint(boxA, boxB, {
    id: 301, // Optional
    worldAnchor: { x: 5, y: 5 }
});

// Remove a joint by ID
world.removeJoint(301);
\`\`\`

## Interaction and Queries

### Spatial Queries

You can query the world to find objects at specific coordinates. There are two levels of granularity:

#### 1. Body Queries (High-Level)
Use \`queryBodiesAtPoint\` to find which physical bodies exist at a given point. This automatically filters out duplicates if multiple shapes on the same body are hit.

\`\`\`typescript
// Find all unique bodies at (x, y) matching a collision mask
const bodyHits = world.queryBodiesAtPoint(5.5, 10.2, 0xFFFF);
bodyHits.forEach(id => {
    // Note: getBodyById returns undefined if the body has no ID
    const body = world.getBodyById(id);
    if (body) {
        console.log(\`Hit body: \${id}\`);
    }
});
\`\`\`

#### 2. Fixture Queries (Fine-Grained)
Use \`queryFixturesAtPoint\` to find exactly which shapes were hit. This is useful for detecting hits on specific parts of a complex object.

\`\`\`typescript
// Find all specific fixtures at (x, y)
const fixtureHits = world.queryFixturesAtPoint(5.5, 10.2, 0xFFFF);
fixtureHits.forEach(fixtureId => {
    const fixture = world.fixturesById[fixtureId];
    console.log(\`Hit fixture: \${fixtureId} on body \${fixture.body.id}\`);
});
\`\`\`

### Collision Events

The \`World\` provides hooks for responding to collision events.

\`\`\`typescript
world.onCollisionStart = (idA, idB, impulse) => {
    console.log(\`Collision started between \${idA} and \${idB}\`);
};

world.onCollisionEnd = (idA, idB, impulse) => {
    console.log(\`Collision ended between \${idA} and \${idB}\`);
};
\`\`\`

## Performance: Live Data Buffers

A key architectural feature of Gearbox2D is the use of shared memory buffers for performance.

When a \`World\` is created, it exposes four primary \`TypedArrays\` that map directly to the underlying C++ data structures in WASM memory:

*   \`world.liveBodyFloatData\`: Position, velocity, and damping.
*   \`world.liveBodyIntData\`: IDs, types, and flags.
*   \`world.liveFixtureFloatData\`: Shape dimensions and physical properties.
*   \`world.liveFixtureIntData\`: Shape IDs and hierarchy mapping.

Instead of calling expensive getter/setter functions for every object's position every frame, the engine updates these buffers directly in a **Structure-of-Arrays (SoA)** layout. The TypeScript \`Body\` wrappers use these buffers to provide high-performance access to object state.

\`\`\`typescript
// Accessing live data directly (via Body)
const x = obj.x; // Reads from liveBodyFloatData at (BODY_X_OFFSET * MAX_BODIES + obj.index)
obj.x = 10;      // Writes to liveBodyFloatData
\`\`\`

## Multiple World Support

Gearbox2D fully supports multiple independent \`World\` instances running simultaneously. 

Each world has its own:
- Object and Joint registries.
- BVH spatial index.
- Physics settings (gravity, time step, etc.).
- Event listeners.

This is useful for scenarios like:
- **Simulating sub-scenes**: Running a separate UI or inventory physics simulation alongside the main game world.
- **Parallel simulations**: Running multiple "what-if" simulations for AI pathfinding or prediction.
- **Multi-room environments**: Managing different rooms or levels that don't interact with each other physically.

\`\`\`typescript
const gameWorld = gearbox.createWorld();
const uiWorld = gearbox.createWorld();

// These worlds are completely isolated
gameWorld.setGravity(0, 9.81);
uiWorld.setGravity(0, 0);gameWorld.step();
uiWorld.step();
\`\`\`

## Memory Safety and Cleanup

Gearbox2D is backed by C++, which does not have automatic garbage collection for WASM heap allocations.

*   **Never leave worlds dangling**: If you call \`createWorld()\` repeatedly without calling \`destroy()\`, your application will eventually crash with an **Out of Memory (OOM)** error.
*   **Reference Cleanup**: When you call \`world.destroy()\`, ensure you also nullify any JavaScript references to that world to allow the JS garbage collector to clean up the wrapper object.
`,_=Object.freeze(Object.defineProperty({__proto__:null,default:T},Symbol.toStringTag,{value:"Module"})),j=`# Broad Phase

Gearbox2D uses a Dynamic Bounding Volume Hierarchy (BVH) for its broad phase collision detection. To maximize performance, the BVH employs several "logical biasing" techniques during object insertion. These heuristics encourage objects with similar physical properties to cluster together, allowing the engine to prune entire subtrees of potential collisions early in the detection process.

## Biasing Optimizations

The insertion cost is calculated using a Surface Area Heuristic (SAH) combined with several experimental weights.

### 1. Spatial Fit (SAH)
The fundamental heuristic. Objects prefer to be inserted into branches where they cause the smallest increase in total surface area.

### 2. Sleep Biasing
Sleeping objects are biased to group with other sleeping objects. 
*   **Why?** The engine can skip self-collision checks for subtrees containing only sleeping objects ($O(1)$ pruning).

### 3. Mask & Category Biasing
Objects with similar collision filters (user-defined categories and masks) prefer to cluster.
*   **Why?** If a dynamic object is spatially near a static object but their masks don't allow interaction, logical biasing keeps them in separate branches to avoid unnecessary AABB tests.

### 4. Static Island Biasing
Static level geometry is strongly encouraged to form "pure" static branches.
*   **Why?** Static-vs-Static checks are common and entirely unnecessary. Pure static branches can be skipped globally during broadphase.

### 5. Body Biasing
Multiple fixtures belonging to the same physical \`Body\` are biased to stay together.
*   **Why?** Fixtures on the same body almost never collide with each other. Grouping them allows for massive early pruning.

### 6. Sensor Biasing
Triggers and sensors are grouped separately from rigid physical bodies.
*   **Why?** Sensors often have unique collision rules (e.g., they might ignore environment tiles but look for players).

### 7. Velocity Biasing
Objects moving in similar directions or at similar speeds are encouraged to cluster.
*   **Why?** This improves the efficiency of "Fat AABBs" and can be a precursor to advanced continuous collision detection (CCD) optimizations.

## Experimental Tuning

All bias weights are internally adjustable, allowing for fine-grained performance tuning based on the specific needs of a simulation (e.g., high body counts vs. high particle counts).
`,I=Object.freeze(Object.defineProperty({__proto__:null,default:j},Symbol.toStringTag,{value:"Module"})),B=`# Collision Filtering
TODO

`,D=Object.freeze(Object.defineProperty({__proto__:null,default:B},Symbol.toStringTag,{value:"Module"})),C=`# Narrow Phase
TODO

`,P=Object.freeze(Object.defineProperty({__proto__:null,default:C},Symbol.toStringTag,{value:"Module"})),k=`# Core Concepts

Understanding these three fundamental concepts will help you build stable and predictable simulations in Gearbox2D.

## 1. The World
The \`World\` is the heart of your simulation. It is the container for all bodys, joints, and global settings like gravity.

\`\`\`javascript
const world = gearbox.createWorld();
world.setGravity(0, 9.8); // Set gravity to 9.8 m/s² downwards
\`\`\`

Think of the World as the "universe" of your physics scene. It handles:
- **Collision Detection**: Finding which objects are touching.
- **Constraint Solving**: Making sure joints (like hinges) stay connected.
- **Integration**: Calculating new positions based on velocities and forces.

## 2. Steps and Ticks
Physics engines don't simulate time continuously. Instead, they move forward in small, discrete "ticks" or "steps."

\`\`\`javascript
// Progress the simulation by 1/60th of a second
world.step(1/60);
\`\`\`

### The Importance of a Fixed Timestep
For the most stable results, you should ideally step the world at a **fixed frequency** (like 60Hz). While Gearbox2D can handle variable time steps (e.g., using your game loop's \`dt\`), huge spikes in time can cause objects to tunnel through walls or joints to explode.

**Pro-tip:** If your game's frame rate drops, it's better to run multiple small physics steps than one giant one.

## 3. Forces vs. Impulses
There are two primary ways to move objects manually beyond gravity and collisions.

### Forces
A **Force** is applied over a period of time. Think of it like a rocket engine firing or wind blowing.
- **Method**: \`object.applyForce(x, y)\`
- **Behavior**: It is added to the object's acceleration. You must call it every frame you want the force to persist.
- **Unit**: Newtons ($kg \\cdot m/s^2$).

### Impulses
An **Impulse** is an instantaneous change in momentum. Think of it like a hammer blow, a jump, or an explosion.
- **Method**: \`object.applyImpulse(x, y, contactX, contactY)\`
- **Behavior**: It immediately changes the object's velocity. You usually call it only once for a specific event.
- **Unit**: $kg \\cdot m/s$.

| Feature | Force | Impulse |
| :--- | :--- | :--- |
| **Duration** | Continuous (must be reapplied) | Instantaneous (one-off) |
| **Effect** | Gradual acceleration | Immediate velocity change |
| **Common Use** | Walking, flying, gravity | Jumping, collisions, firing |

### Angular Impulses
If you want to spin an object instantly without hitting a specific point, use \`applyAngularImpulse(torque)\`.

`,O=Object.freeze(Object.defineProperty({__proto__:null,default:k},Symbol.toStringTag,{value:"Module"})),M=`# Development & Contributing

Follow these instructions to build Gearbox2D from source or contribute to the C++ core. If you just want to use the engine in your project, see [Installation](#installation).

## Prerequisites

To build Gearbox2D, you'll need the following dependencies installed.

### Required Dependencies

1.  **Node.js and npm** (v18 or higher recommended)
    - Download from [nodejs.org](https://nodejs.org/)
    - Verify with: \`node --version\` and \`npm --version\`

2.  **Emscripten SDK** (for WebAssembly compilation)
    - Install via [emsdk](https://emscripten.org/docs/getting_started/downloads.html):
    \`\`\`bash
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    ./emsdk install latest
    ./emsdk activate latest
    source ./emsdk_env.sh  # On Windows: emsdk_env.bat
    \`\`\`
    - Verify with: \`emcc --version\`

3.  **GNU Make** (for build automation)
    - **Linux/macOS**: Usually pre-installed.
    - **Windows**: Install via WSL, MinGW, or use \`nmake\`.

4.  **C++ Compiler** (for running native tests)
    - **Linux**: \`g++\`
    - **macOS**: \`xcode-select --install\`
    - **Windows**: MinGW or WSL

5.  **Google Test** (for C++ unit tests)
    - The \`Makefile\` expects it at \`/usr/src/googletest/googletest\` by default. You can override this by setting the \`GTEST_DIR\` environment variable.

### Optional Dependencies

- **Live Server**: For running examples: \`npm install -g live-server\` or use \`npx http-server\`.

## Building from Source

1.  **Clone the repository**:
    \`\`\`bash
    # Ensure you use --recursive to fetch submodules (e.g., Google Highway)
    git clone --recursive https://github.com/JSideris/Gearbox2D.git
    cd Gearbox2D
    \`\`\`
    *If you already cloned the repo without submodules, run:*
    \`\`\`bash
    git submodule update --init --recursive
    \`\`\`

2.  **Install Node.js dependencies**:
    \`\`\`bash
    npm install
    \`\`\`

3.  **Build the Project**:
    You can build the entire project or individual components:
    \`\`\`bash
    # Build everything (C++ to WASM + TypeScript + Standalone)
    npm run build

    # Build WebAssembly module only
    npm run build:cpp

    # Build TypeScript interface only
    npm run build:ts
    \`\`\`

## Running Tests

Gearbox2D includes both C++ and TypeScript test suites:

\`\`\`bash
# Run all tests
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
\`\`\`

## Troubleshooting

- **Emscripten not found**: Ensure you have run \`source ./emsdk_env.sh\` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from \`file://\` URLs.
- **Build failures**: Try \`npm run clean && npm run build\` to rebuild from scratch.

`,E=Object.freeze(Object.defineProperty({__proto__:null,default:M},Symbol.toStringTag,{value:"Module"})),F=`# Events

Gearbox2D provides an event system to react to changes in the physics world, such as collisions and sleep state transitions.

## Enabling Events

To improve performance, events are opt-in per object. You must set \`wantsEvents: true\` on either a \`Body\` or a specific \`Fixture\` to receive events for it.

### Body Opt-in

If you set \`wantsEvents: true\` on a body, you will receive events for all collisions involving any of its fixtures.

\`\`\`typescript
const obj = world.createBody({ id: id, 
  type: gearbox.bodyTypes.DYNAMIC_OBJECT,
  x: 5, y: 5,
  wantsEvents: true // Enable for all fixtures on this body
});
obj.createFixture({
  shape: gearbox.shapes.CIRCLE,
  radius: 1,
});
\`\`\`

### Fixture Opt-in

Alternatively, you can enable events only for specific fixtures. This is useful for large objects where you only care about certain parts (e.g., a car bumper or a character's feet).

\`\`\`typescript
const obj = world.createBody({ id: id,  x: 5, y: 5 });
obj.createFixture({
  shape: gearbox.shapes.CIRCLE,
  radius: 1,
  wantsEvents: true // Only collisions with this fixture trigger events
});
\`\`\`

### Collision Logic

A collision event is generated if **any** of the participants have opted in:
- Body A OR Fixture A has \`wantsEvents: true\`
- OR Body B OR Fixture B has \`wantsEvents: true\`

### Dynamic Toggling

You can enable or disable events at any time after creation:

\`\`\`typescript
obj.wantsEvents = true; // Start receiving events
fixture.wantsEvents = false; // Stop receiving events for this part
\`\`\`

## Global Event Handlers

You can set global handlers on the \`World\` instance to listen for events from all objects that have opted in.

### Collision Events

*   \`onCollisionStart(idA, idB, fIdA, fIdB, impulse)\`: Fired when two fixtures begin colliding.
*   \`onCollisionEnd(idA, idB, fIdA, fIdB)\`: Fired when two fixtures stop colliding.

> **Note on IDs**: If a body or fixture was created without an ID, the corresponding \`id\` or \`fId\` parameter will be \`undefined\`.

\`\`\`typescript
world.onCollisionStart = (idA, idB, fIdA, fIdB, impulse) => {
  if (idA !== undefined && idB !== undefined) {
    console.log(\`Body \${idA} (Fixture \${fIdA}) and Body \${idB} (Fixture \${fIdB}) started colliding.\`);
  }
};
\`\`\`

### Sleep and Wake Events

*   \`onSleep(id)\`: Fired when an object enters the sleeping state.
*   \`onWake(id)\`: Fired when an object wakes up from the sleeping state.

> **Note on IDs**: The \`id\` parameter will be \`undefined\` if the body was created without an ID.

\`\`\`typescript
world.onSleep = (id) => {
  console.log(\`Object \${id} is now sleeping.\`);
};

world.onWake = (id) => {
  console.log(\`Object \${id} has woken up.\`);
};
\`\`\`

## Per-Object Event Handlers

Alternatively, you can set event handlers directly on \`Body\` instances.

\`\`\`typescript
const obj = world.createBody({ id: id,  x: 5, y: 5, wantsEvents: true });
obj.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 1 });

obj.onSleep = () => {
  console.log("I am going to sleep!");
};

obj.onWake = () => {
  console.log("I am waking up!");
};
\`\`\`

## Events vs. Polling

While you can always check the \`isSleeping\` state of an object by reading its properties, using events is generally more efficient and easier for reactive logic:

1.  **Efficiency**: Events are only fired when a transition occurs, avoiding the need to poll every frame.
2.  **Timing**: \`onSleep\` and \`onWake\` are fired at the exact moment the state change is detected within the physics step.
3.  **Integration**: Events fit well into reactive UI frameworks or state management systems.

Note: Reading \`obj.isSleeping\` is still useful for logic that needs to know the current state at any time without tracking transitions.
`,W=Object.freeze(Object.defineProperty({__proto__:null,default:F},Symbol.toStringTag,{value:"Module"})),R=`# Your First Simulation

This guide will walk you through creating a simple physics simulation: a box falling onto a static floor.

## 1. Basic HTML Template

Create an \`index.html\` file. We will use a \`<canvas>\` element to render our simulation.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Gearbox2D Hello World</title>
    <style>
        body { margin: 0; overflow: hidden; background: #1a1a1a; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>

    <!-- OPTION A: Using the Standalone CDN (Easiest for this guide) -->
    <script src="https://unpkg.com/gearbox2d/dist/standalone/gearbox.js"><\/script>
    <script src="main.js"><\/script>

    <!-- OPTION B: Using NPM/Bundlers (Vite, Webpack, etc.) -->
    <!-- <script type="module" src="main.js"><\/script> -->
</body>
</html>
\`\`\`

## 2. The Simulation Code

Create a \`main.js\` file. This script initializes the engine, sets up the world, and runs the simulation loop.

\`\`\`javascript
/**
 * 1. ACCESS THE ENGINE
 * 
 * If you used the CDN script tag in index.html, 'gearbox2d' is already 
 * available globally. If you are using NPM/Vite, uncomment the line below:
 */
// import gearbox from 'gearbox2d';

async function start() {
    // 2. Initialize the engine
    await gearbox.init();

    // 2. Create the physics world
    const world = gearbox.createWorld();
    world.setGravity(0, 9.8); // 9.8 m/s² downwards

    // 3. Create a static floor
    // ID: 1, Position: (5, 9), Size: 10x1
    world.createBody({ id: 1, 
        x: 5,
        y: 9,
        type: gearbox.bodyTypes.FIXED_OBJECT,
        color: "#444"
    }).createFixture({ id: 1, 
        shape: gearbox.shapes.BOX,
        width: 10,
        height: 1,
    });

    // 4. Create a dynamic falling box
    // ID: 2, Position: (5, 2), Size: 1x1
    const box = world.createBody({ id: 2, 
        x: 5,
        y: 2,
        color: "#ff4444"
    });
    box.createFixture({ id: 2, 
        shape: gearbox.shapes.BOX,
        width: 1,
        height: 1,
    });

    // 5. Setup Rendering (using debug graphics)
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 6. Simulation Loop
    let lastTime = performance.now();

    function loop() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000; // Delta time in seconds
        lastTime = now;

        // Step the physics world
        // We cap dt to avoid huge jumps if the tab loses focus
        world.step(Math.min(dt, 0.1));

        // Render using debug helper
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // The debug helper draws the world in "meters"
        // We scale the context so 1 meter = 50 pixels
        ctx.save();
        ctx.scale(50, 50); 
        gearbox.debug.drawWorld(ctx, world);
        ctx.restore();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

start().catch(console.error);
\`\`\`

## Key Concepts

To build more complex simulations, it is important to understand how the engine handles time and forces.

-   **Meters, not Pixels**: Gearbox2D calculates everything in meters. 
-   **The World**: The container for all your physics objects.
-   **Steps and Ticks**: How time progresses in the simulation.
-   **Forces vs. Impulses**: The different ways to move objects.

For a deep dive into these topics, see the **[Core Concepts](#core-concepts)** guide.

## Running the Example

### If using the Standalone CDN
You can simply open \`index.html\` in your browser! Because the WASM core is inlined in the standalone build, it doesn't suffer from the usual \`file://\` protocol restrictions.

### If using NPM/Bundlers
You must serve your files using a web server to allow the browser to load the \`.wasm\` file:

\`\`\`bash
npx http-server .
\`\`\`Open your browser to \`http://localhost:8080\`, and you should see a red box fall and bounce on the floor!
`,G=Object.freeze(Object.defineProperty({__proto__:null,default:R},Symbol.toStringTag,{value:"Module"})),z=`# The Simulation Loop

For a physics engine, how you advance time is just as important as the physics calculations themselves. This guide covers the best practices for setting up a stable and smooth simulation loop in Gearbox2D.

## Why use \`requestAnimationFrame\`?

While you might be tempted to use \`setTimeout\` or \`setInterval\` for a "fixed" interval, \`requestAnimationFrame\` (rAF) is the superior choice for web-based physics:

1.  **V-Sync Alignment**: rAF is synchronized with the browser's display refresh rate. This ensures that every physics step you calculate results in a visual update that aligns perfectly with the monitor, eliminating screen tearing and micro-stutter.
2.  **Resource Management**: rAF automatically pauses or slows down when the tab is backgrounded, saving CPU cycles and battery life.
3.  **High Precision**: rAF provides a high-resolution timestamp (accurate to microseconds) as an argument to its callback, which is essential for accurate timing.

## The "Fixed Timestep with Accumulator" Pattern

Physics simulations are most stable when the time step ($dt$) is consistent. If $dt$ fluctuates (variable timestep), objects might "tunnel" through walls or joints might become unstable during frame rate drops.

The **Accumulator Pattern** allows you to maintain a fixed physics step regardless of the monitor's refresh rate or minor lag spikes.

### Implementation

\`\`\`javascript
let lastTime = performance.now();
let accumulator = 0;
const physicsStep = 1/60; // 60Hz physics

function loop(now) {
    // 1. Calculate time since last frame
    let dt = (now - lastTime) / 1000; // convert to seconds
    lastTime = now;

    // 2. "Spiral of Death" Protection
    // If the browser stalls (or the user returns from a backgrounded tab),
    // we cap the delta time to prevent the loop from trying to run
    // thousands of steps in a single frame.
    if (dt > 0.25) dt = 0.25; 

    accumulator += dt;

    // 3. Consume accumulated time in fixed chunks
    while (accumulator >= physicsStep) {
        world.step(); // Uses the internal fixed step (default 1/60)
        accumulator -= physicsStep;
    }

    // 4. Render the world
    // Update the engine's interpolation value for the renderer
    world.interpolationAlpha = accumulator / physicsStep;
    render();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
\`\`\`

## Smoothing Visuals: Interpolation vs. Extrapolation

Even with a fixed timestep, visual jitter can occur if your screen's refresh rate (e.g., 144Hz) doesn't match your physics rate (60Hz). There are two main ways to solve this:

### 1. Interpolation (Recommended)
Interpolation blends between the **previous** physics state and the **current** one. This results in perfectly smooth motion but introduces exactly one frame of visual latency (16.6ms at 60Hz).

**The Math:**
\\[ \\text{RenderPos} = (\\text{CurrentPos} \\times \\alpha) + (\\text{PreviousPos} \\times (1 - \\alpha)) \\]
*Where $\\alpha$ is \`accumulator / physicsStep\`.*

Gearbox2D supports this natively in its \`DebugGraphics\` and stores previous states in shared memory for zero-overhead access.

### 2. Extrapolation
Extrapolation predicts where an object **will be** in the future based on its current velocity. This has zero visual latency but can cause "jitter" or "overshoot" (e.g., an object appearing to pass through a wall for a split second before snapping back).

**The Math:**
\\[ \\text{RenderPos} = \\text{CurrentPos} + (\\text{Velocity} \\times \\text{remainderTime}) \\]

### Which should I use?
*   **Use Interpolation** for most objects, background physics, and complex mechanical systems (like gears).
*   **Use Extrapolation** for the local player's character or projectiles in competitive shooters where minimizing input-to-pixel latency is more important than visual perfection.

## Choosing a Physics Step

By default, Gearbox2D is tuned for **60Hz** (\`1/60\` seconds).

*   **1/60 (Default)**: Balanced performance and stability for most games.
*   **1/120+**: Higher precision for fast-moving objects or complex joint systems.
*   **1/30**: Better performance for low-end devices, but can lead to "squishy" physics or tunneling.

### Changing the Engine Timestep

If you decide to run your physics at a different rate than 60Hz, you **must** inform the engine so it can scale internal damping and decay rates correctly:

\`\`\`javascript
// Run physics at 120Hz
const hz = 120;
const dt = 1 / hz;

world.setTimeStep(dt);

// In your loop, match the accumulator consumption:
while (accumulator >= dt) {
    world.step();
    accumulator -= dt;
}
\`\`\`

## Engine Specifics: Internal Damping

Gearbox2D uses a precomputed \`decayMap\` to ensure that velocities decay consistently regardless of the chosen timestep. When you call \`world.setTimeStep(dt)\`, the engine recalculates these multipliers so that "10% friction per second" feels the same at 60Hz as it does at 120Hz.
`,H=Object.freeze(Object.defineProperty({__proto__:null,default:z},Symbol.toStringTag,{value:"Module"})),L=`# Debug Graphics
TODO

`,J=Object.freeze(Object.defineProperty({__proto__:null,default:L},Symbol.toStringTag,{value:"Module"})),V=`# Installation

Gearbox2D is a high-performance 2D physics engine. Because it is powered by WebAssembly, there are a few specific ways to include it in your project.

## 1. Using NPM (Recommended)

If you are using a modern build tool (Vite, Webpack, esbuild, etc.), install the package via npm:

\`\`\`bash
npm install gearbox2d
\`\`\`

### Basic Usage with a Bundler

\`\`\`typescript
import gearbox from 'gearbox2d';

async function startPhysics() {
    // 1. Initialize the WASM core
    await gearbox.init();

    // 2. Create your physics world
    const world = gearbox.createWorld();
    
    // ... setup simulation ...
}

startPhysics();
\`\`\`

---

## 2. Using a Script Tag (CDN / Standalone)

For simple projects, prototyping, or environments without a build step, use the **standalone** build. This version has the WebAssembly core built-in as a Base64 string, so it requires no extra files or fetch requests.

\`\`\`html
<!-- 1. Include the engine via CDN -->
<script src="https://unpkg.com/gearbox2d/dist/standalone/gearbox.js"><\/script>

<script>
  async function init() {
    // 2. Initialize the engine (it already has the WASM inside!)
    await gearbox.init();
    
    // 3. Create your physics world
    const world = gearbox.createWorld();
    console.log("Physics World Created:", world);
  }

  init();
<\/script>
\`\`\`

---

## 3. WebAssembly & Multi-Threading

Gearbox2D is compiled with **Multi-Threading** support (using SharedArrayBuffer) and **SIMD** instructions to achieve maximum performance. This requires specific browser security headers to be set on your web server.

### Required Security Headers
For the multi-threaded WASM build to function correctly, your server **must** send the following HTTP headers:

*   \`Cross-Origin-Opener-Policy: same-origin\`
*   \`Cross-Origin-Embedder-Policy: require-corp\`

These headers enable **SharedArrayBuffer**, which allows the physics engine to run its solvers across multiple CPU cores. Without these headers, the engine will fall back to a single-threaded mode, significantly reducing performance for large simulations.

### Local Development
Most modern development servers (like Vite, Webpack Dev Server, or Browsersync) provide a simple way to enable these headers.

**Vite Example (\`vite.config.js\`):**
\`\`\`javascript
export default {
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
\`\`\`

## 4. WebAssembly & Local Servers

**Standalone/CDN Users:** 
If you are using the \`dist/standalone/gearbox.js\` file, you can likely run your project by simply opening an \`.html\` file from your file explorer, because the WASM is inlined.

**NPM/Standard Users:**
If you are using the standard build (npm package), you **must** serve your project via a local web server because browsers block the loading of external \`.wasm\` files over the \`file://\` protocol.

If you don't have a local server, you can use \`npx\`:

\`\`\`bash
# Start a simple server in your project folder
npx http-server .
\`\`\`

---

## Next Steps

Once you have the engine installed, check out [Your First Simulation](#first-simulation) to build a falling box demo.

`,q=Object.freeze(Object.defineProperty({__proto__:null,default:V},Symbol.toStringTag,{value:"Module"})),U=`# Spatial Queries
TODO

`,N=Object.freeze(Object.defineProperty({__proto__:null,default:U},Symbol.toStringTag,{value:"Module"})),X=`# Introduction

**Gearbox2D** is a high-performance 2D physics and AI engine written in C++, compiled to WebAssembly, and designed for the modern web. 

Unlike traditional ports of physics libraries, Gearbox2D is engineered specifically for the performance characteristics and architectural requirements of the browser, eliminating the performance bottlenecks of the JS-WASM bridge.

## Why Gearbox2D?

*   **Zero-Copy Interop**: Access physical state (position, rotation) with O(1) overhead. The TypeScript wrapper reads directly from WASM memory buffers.
*   **Integrated Intelligence**: Pathfinding, RVO/ORCA obstacle avoidance, and high-frequency sensors run natively inside the physics loop.
*   **Authoritative Synchronization**: Native support for real-time state updates and rollback, optimized for multiplayer architectures.

## Core Features

### Performance
- **Data-Oriented Architecture**: Optimized for CPU caches and massive object counts.
- **BVH Spatial Partitioning**: Sub-millisecond queries for raycasting and area checks.
- **Shared Memory Model**: No serialization or copying across the WASM-JS bridge.

### AI and Robotics
- **NavMeshes**: Rapid pathfinding through complex environments.
- **Local Navigation**: Collision-free movement for hundreds of agents using ORCA/RVO.
- **Agent Perception**: High-efficiency raycast and area sensor queries.

### Constraints and Joints
- Stable implementations of Hinge, Distance, Spring, and Gear joints for complex mechanical systems.

## Unique Innovations

Gearbox2D introduces several architectural advancements designed for modern, large-scale web applications:

*   **Novel BVH Biasing**: Our spatial partitioning engine uses **Collision Mask Biasing** and **Sleep Biasing** to dynamically restructure the Bounding Volume Hierarchy. This significantly reduces intersection tests in complex scenes where many objects occupy the same space but belong to different collision layers.
*   **Physics-Native AI Suite**: A* pathfinding, NavMeshes, and RVO/ORCA local navigation are integrated directly into the physics loop. This allows agents to navigate complex environments with full awareness of physical constraints and dynamic obstacles at native speeds.
*   **The "Big World" Solver**: Specialized handling for microscopic and galactic scales solves the precision issues common in standard engines, enabling massive-scale simulations without coordinate jitter or "big world" floating-point errors.
*   **Hybrid Soft Constraints**: Leverage per-object Baumgarte bias factors to create "squishy" interactions and soft joints without the performance penalty of a dedicated soft-body engine.
*   **Speed-Adaptive Bounding**: Bounding volume padding that scales with velocity and angular momentum, preventing "tunneling" for high-speed objects while keeping the broad-phase tight for slow-moving ones.
*   **Kinematic Restitution Balancing (KRB)**: A mathematically rigorous "energy audit" that eliminates artificial energy gain in bouncy objects by analytically taxing launch speeds to pay for solver-induced position correction.

## Project Status
Gearbox2D has been in development since 2023 and was first published to npm in January 2026. The engine is currently in **Alpha**. While the core physics solver is stable, APIs are evolving as we finalize the AI and fluid dynamics modules.

[View the Development Roadmap →](#plan)

---

## Quick Start
1.  **[Installation Guide](#installation)** - Get the engine running in your project.
2.  **[Core Concepts](#core-concepts)** - Learn about the World, Ticks, and Forces.
3.  **[Your First Simulation](#first-simulation)** - Build a basic world in minutes.
`,Y=Object.freeze(Object.defineProperty({__proto__:null,default:X},Symbol.toStringTag,{value:"Module"})),$="# Distance Joint\n\nA **Distance Joint** maintains a fixed distance between two points on two separate bodys. It prevents the objects from moving closer together or further apart than the specified length.\n\nFor general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).\n\n## Creation\n\nTo create a distance joint, use the `world.createDistanceJoint` method.\n\n```javascript\nconst joint = world.createDistanceJoint(bodyA, bodyB, {\n    id: 101, // Optional\n    worldAnchorA: { x: 2, y: 5 },\n    worldAnchorB: { x: 8, y: 5 }\n});\n```\n\n### Options\n\n| Property | Type | Description |\n| :--- | :--- | :--- |\n| `id` | `number` | (Optional) A unique ID for tracking and lookup. |\n| `worldAnchorA` | `Vec2` | World coordinate for anchor on `bodyA`. |\n| `worldAnchorB` | `Vec2` | World coordinate for anchor on `bodyB`. |\n| `anchorA` | `Vec2` | Local anchor relative to `bodyA`. |\n| `anchorB` | `Vec2` | Local anchor relative to `bodyB`. |\n| `length` | `number` | The target distance. If omitted, it's calculated from anchors at creation. |\n\n## Properties\n\nIn addition to the [common joint properties](./joints-overview.md#common-properties), the Distance Joint provides:\n\n| Property | Type | Access | Description |\n| :--- | :--- | :--- | :--- |\n| `length` | `number` | Read/Write | The current target distance for the joint. |\n| `localAnchorA` | `Vec2` | Read/Write | Local anchor point on `bodyA`. |\n| `localAnchorB` | `Vec2` | Read/Write | Local anchor point on `bodyB`. |\n\n## Example: Rigid Rod\n\n```javascript\nconst ball1 = world.createBody({ id: 1,  x: 5, y: 5 });\nconst ball2 = world.createBody({ id: 2,  x: 10, y: 5 });// Connect with a 5m rigid rod\nball1.createFixture({ id: 1,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });\nball2.createFixture({ id: 2,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });\nworld.createDistanceJoint(ball1, ball2, {\n    id: 101,\n    length: 5\n});\n```\n",K=Object.freeze(Object.defineProperty({__proto__:null,default:$},Symbol.toStringTag,{value:"Module"})),Q=`# Gear Joint

A **Gear Joint** links the rotation of two bodys by constraining their relative angles via two existing [Hinge Joints](./joints-hinge.md).

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

A gear joint requires two existing hinge joints.

\`\`\`javascript
const hinge1 = world.createHingeJoint(bodyA, bodyB, { id: 1, ... });
const hinge2 = world.createHingeJoint(bodyC, bodyD, { id: 2, ... });

const gear = world.createGearJoint(hinge1, hinge2, {
    id: 101, // Optional
    ratio: 2.0
});
\`\`\`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| \`joint1\` | \`HingeJoint\` | The first hinge joint to link. |
| \`joint2\` | \`HingeJoint\` | The second hinge joint to link. |
| \`options\` | \`JointOptions\`| Configuration object. |

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`number\` | - | (Optional) A unique ID for tracking and lookup. |
| \`ratio\` | \`number\` | \`1.0\` | The gear ratio. |

## Mechanics

The gear joint enforces the following constraint:
\\[ \\theta_2 + \\text{ratio} \\times \\theta_1 = \\text{constant} \\]

- **Ratio**: If the ratio is \`2.0\`, then \`joint1\` rotating by 1° causes \`joint2\` to rotate by -2°.

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Gear Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| \`ratio\` | \`number\` | Read/Write | The gear ratio between the two joints. |
| \`reactionTorque\` | \`number\` | Read-only | The torque applied to maintain the gear constraint. |

## Example: Simple Gear Train

\`\`\`javascript
// Large gear
const gear1 = world.createBody({ id: 1,  x: 5, y: 5 });
gear1.createFixture({ id: 1,  shape: gearbox.shapes.CIRCLE, radius: 1.0 });
const hinge1 = world.createHingeJoint(staticBody, gear1, { 
    id: 10,
    worldAnchor: { x: 5, y: 5 } 
});

// Small gear
const gear2 = world.createBody({ id: 2,  x: 7, y: 5 });
gear2.createFixture({ id: 2,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });
const hinge2 = world.createHingeJoint(staticBody, gear2, { 
    id: 11,
    worldAnchor: { x: 7, y: 5 } 
});

// Link them with a 2:1 ratio
world.createGearJoint(hinge1, hinge2, {
    id: 101,
    ratio: 2.0
});
\`\`\`
`,Z=Object.freeze(Object.defineProperty({__proto__:null,default:Q},Symbol.toStringTag,{value:"Module"})),ee=`# Hinge Joint

A **Hinge Joint** (also known as a **Revolute Joint**) constrains two bodys to share a common point, allowing them to rotate freely around that point. This is similar to a pin or a hinge on a door.

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

To create a hinge joint, use the \`world.createHingeJoint\` method. 

\`\`\`javascript
const joint = world.createHingeJoint(bodyA, bodyB, {
    id: 101, // Optional
    worldAnchor: { x: 5, y: 5 }
});
\`\`\`

### Options

| Property | Type | Description |
| :--- | :--- | :--- |
| \`id\` | \`number\` | (Optional) A unique ID for tracking and lookup. |
| \`worldAnchor\` | \`Vec2\` | The point in world coordinates where the two bodies are joined. |
| \`anchorA\` | \`Vec2\` | Local anchor relative to \`bodyA\` (used if \`worldAnchor\` is not provided). |
| \`anchorB\` | \`Vec2\` | Local anchor relative to \`bodyB\` (used if \`worldAnchor\` is not provided). |

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Hinge Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| \`localAnchorA\` | \`Vec2\` | Read/Write | The anchor point relative to \`bodyA\`. |
| \`localAnchorB\` | \`Vec2\` | Read/Write | The anchor point relative to \`bodyB\`. |
| \`reactionTorque\` | \`number\` | Read-only | Always \`0\` for basic 2D hinges (no rotational constraint). |

## Example: Creating a Pendulum

A common use for a hinge joint is creating a pendulum by connecting a dynamic object to a fixed point in the world.

\`\`\`javascript
// 1. Create a static anchor
const anchor = world.createBody({ id: 1, 
    x: 10, y: 2,
    type: gearbox.bodyTypes.FIXED_OBJECT
});
anchor.createFixture({ id: 1,  shape: gearbox.shapes.CIRCLE, radius: 0.2 });

// 2. Create a dynamic weight
const weight = world.createBody({ id: 2, 
    x: 15, y: 2,
});
weight.createFixture({ id: 2,  shape: gearbox.shapes.BOX, width: 1, height: 1 });// 3. Connect them with a hinge at the anchor's position
world.createHingeJoint(anchor, weight, {
    id: 101,
    worldAnchor: { x: 10, y: 2 }
});
\`\`\`
`,ne=Object.freeze(Object.defineProperty({__proto__:null,default:ee},Symbol.toStringTag,{value:"Module"})),te=`# Joints Overview

Joints in Gearbox2D are used to constrain the movement of bodys relative to each other or to the world. By connecting bodies with joints, you can create complex mechanisms like pendulums, ragdolls, cars, and gear trains.

## Common Features

All joints in the engine share several fundamental concepts and API patterns.

### Creation and Removal

Joints are created through the \`World\` instance. You can optionally provide a unique ID within the \`options\` object. 

\`\`\`javascript
// Creation pattern
const joint = world.createHingeJoint(bodyA, bodyB, {
    id: 101, // Optional
    worldAnchor: { x: 5, y: 5 }
});

// Removal pattern (only if an ID was provided)
world.removeJoint(101);
\`\`\`

### The Anchor System

Most joints are defined by **Anchor Points**. These are points on the bodies where the joint is "attached."

1.  **World Anchor**: During creation, you often specify a \`worldAnchor\`. The engine automatically converts this into local coordinates for both bodies so that the joint is perfectly aligned at that moment.
2.  **Local Anchors (\`localAnchorA\`, \`localAnchorB\`)**: These define the attachment point relative to each body's center of mass. You can modify these at runtime to shift the pivot point of a joint.

### Common Properties

Every joint object provides access to the following:

| Property | Type | Description |
| :--- | :--- | :--- |
| \`id\` | \`number\` | (Optional) The unique ID provided at creation. |
| \`bodyA\` | \`Body\` | The first body connected by the joint. |
| \`bodyB\` | \`Body\` | The second body connected by the joint. |
| \`reactionForce\` | \`Vec2\` | The force (in Newtons) being applied by the joint to maintain the constraint. |
| \`reactionTorque\` | \`number\` | The torque being applied by the joint. |

---

## Choosing a Joint

Use this table to decide which joint is best for your specific use case:

| Joint Type | Behavior | Common Use Cases |
| :--- | :--- | :--- |
| **[Hinge Joint](./joints-hinge.md)** | Constraints two points to overlap, allowing rotation. | Doors, wheels, pendulums, limbs. |
| **[Distance Joint](./joints-distance.md)** | Maintains a rigid distance between two points. | Rigid rods, elevators, simple bridges. |
| **[Spring Joint](./joints-spring.md)** | A distance joint with elastic mass-spring-damper physics. | Suspension, ropes, soft connections. |
| **[Gear Joint](./joints-gear.md)** | Links the rotation of two hinge joints via a ratio. | Mechanical gears, transmission, pullies. |

## Tips for Working with Joints

- **Waking Up**: Modifying joint properties (like \`localAnchor\` or \`length\`) will automatically "wake up" the connected bodies if they were sleeping.
- **Breakable Joints**: You can simulate breakable connections by checking the magnitude of \`reactionForce\` every frame and calling \`world.removeJoint()\` if it exceeds a threshold.
- **Static Anchors**: To anchor an object to a fixed point in space, connect it to a \`FIXED_OBJECT\` body at the desired world location.

`,oe=Object.freeze(Object.defineProperty({__proto__:null,default:te},Symbol.toStringTag,{value:"Module"})),ie="# Spring Joint\n\nA **Spring Joint** (also known as a soft distance joint) maintains a target distance between two objects while allowing for elastic movement. It simulates a physical spring-damper system.\n\nFor general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).\n\n## Creation\n\nTo create a spring joint, use the `world.createSpringJoint` method.\n\n```javascript\nconst joint = world.createSpringJoint(bodyA, bodyB, {\n    id: 101, // Optional\n    worldAnchorA: { x: 5, y: 2 },\n    worldAnchorB: { x: 5, y: 5 },\n    frequencyHz: 2.0,\n    dampingRatio: 0.5\n});\n```\n\n### Options\n\n| Property | Type | Default | Description |\n| :--- | :--- | :--- | :--- |\n| `id` | `number` | - | (Optional) A unique ID for tracking and lookup. |\n| `frequencyHz` | `number` | `5.0` | Stiffness (Hertz). `0` makes it rigid. |\n| `dampingRatio` | `number` | `0.7` | Oscillation decay (`0` to `1+`). |\n| `length` | `number` | *auto* | Rest length of the spring. |\n| `worldAnchorA/B` | `Vec2` | - | World coordinates for anchors. |\n\n## Properties\n\nIn addition to the [common joint properties](./joints-overview.md#common-properties), the Spring Joint provides:\n\n| Property | Type | Access | Description |\n| :--- | :--- | :--- | :--- |\n| `frequencyHz` | `number` | Read/Write | Adjusts the stiffness. |\n| `dampingRatio` | `number` | Read/Write | Adjusts the oscillation decay. |\n| `length` | `number` | Read/Write | The rest length of the spring. |\n\n## Dynamics\n\n- **Frequency (`frequencyHz`)**: Higher values make the spring stiffer.\n- **Damping (`dampingRatio`)**: `0.0` is undamped (never stops), `1.0` is critically damped (stops quickly).\n\n## Example: Suspension System\n\n```javascript\nconst chassis = world.createBody({ id: 1,  x: 10, y: 5 });\nconst wheel = world.createBody({ id: 2,  x: 10, y: 6 });// Soft suspension\nchassis.createFixture({ id: 1,  shape: gearbox.shapes.BOX, width: 2, height: 1 });\nwheel.createFixture({ id: 2,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });\nworld.createSpringJoint(chassis, wheel, {\n    id: 101,\n    anchorA: { x: 0, y: 1 },\n    frequencyHz: 3.0,\n    dampingRatio: 0.5\n});\n```\n",ae=Object.freeze(Object.defineProperty({__proto__:null,default:ie},Symbol.toStringTag,{value:"Module"})),se=`# Body Types

In Gearbox2D, every body has a body type that determines how it interacts with the physics world. You can set the body type when creating an object using the \`type\` property.

## Available Body Types

### Rigid Body (Dynamic)
\`gearbox.bodyTypes.DYNAMIC_OBJECT\`

Dynamic bodies are fully simulated by the physics engine. They are affected by gravity, external forces, impulses, and collisions with other objects. This is the default type for most interactive objects like players, boxes, or debris.

\`\`\`typescript
const bodyId = nextId++;
const body = world.createBody({ id: bodyId, 
    x: 5, y: 5,
    mass: 1.0,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});
\`\`\`

### Fixed Object (Static)
\`gearbox.bodyTypes.FIXED_OBJECT\`

Fixed objects have infinite mass and are immovable by the physics simulation. They do not respond to forces or impulses. They are typically used for static environment elements like ground, walls, or platforms. While they can be moved manually by setting their position, they do not have velocity-based movement.

\`\`\`typescript
const bodyId = nextId++;
const body = world.createBody({ id: bodyId, 
    x: 5, y: 9,
    type: gearbox.bodyTypes.FIXED_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.AABB,
    width: 10, height: 1
});
\`\`\`

### Kinematic Object
\`gearbox.bodyTypes.KINEMATIC_OBJECT\`

Kinematic objects are a hybrid between dynamic and fixed objects. Like fixed objects, they have infinite mass and are unaffected by forces or collisions. However, they can have velocity and will move based on that velocity. This makes them ideal for moving platforms, elevators, or character-controlled objects that should "push" other objects without being pushed back.

\`\`\`typescript
const bodyId = nextId++;
const body = world.createBody({ id: bodyId, 
    x: 2, y: 5,
    vx: 2.0, // Moves horizontally
    type: gearbox.bodyTypes.KINEMATIC_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2, height: 0.5
});
\`\`\`

## Sensors vs. Body Types

It is important to distinguish between **Body Types** (which define movement behavior) and **Sensors** (which define collision response).

A **Sensor** is a property of a **Fixture**, not a body type. This allows you to attach sensors to any type of body:
- **Static Sensor:** A fixed trigger zone (Fixed Body).
- **Moving Sensor:** An elevator or platform trigger (Kinematic Body).
- **Attached Sensor:** A vision cone or proximity alert attached to a player (Dynamic Body).

To create a sensor, set the \`isSensor\` property to \`true\` on the fixture options.

### Example: Static Trigger Zone
\`\`\`typescript
const bodyId = nextId++;
world.createBody({ id: bodyId, 
    x: 5, y: 5,
    type: gearbox.bodyTypes.FIXED_OBJECT,
}).createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 2.0,
    isSensor: true // This fixture will trigger events but not block movement
});
\`\`\`

### Example: Attached Vision Cone
\`\`\`typescript
const player = world.createBody({ id: nextId++, 
    x: 5, y: 5,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT
});

// Physical body
player.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});

// Vision cone (sensor)
player.createFixture({
    shape: gearbox.shapes.BOX,
    width: 4, height: 2,
    localX: 2.5, // Positioned in front of the player
    isSensor: true
});
\`\`\`
`,re=Object.freeze(Object.defineProperty({__proto__:null,default:se},Symbol.toStringTag,{value:"Module"})),le=`# Body Lifecycle

Understanding the lifecycle of a \`Body\` is crucial for efficient simulation management. This page covers how objects are created, updated during the simulation loop, transitioned into sleep states, and eventually removed.

## Creation

Bodies are instantiated using the \`world.createBody()\` method. You can create a body with an initial shape, or add fixtures later using \`body.createFixture()\`.

### Engine Capacity Limits

To achieve maximum performance via SoA and WASM SIMD, Gearbox2D uses a fixed-capacity memory model. Each \`World\` instance has the following limits:

*   **Maximum Bodies**: 10,000
*   **Maximum Fixtures**: 10,000

Attempting to create more objects than these limits will result in an error. If your application requires more objects, consider using multiple \`World\` instances to partition your simulation.

### Atomic Creation
You can provide an array of fixtures during body creation.

\`\`\`typescript
const obj = world.createBody({ id: id, 
    x: 10,
    y: 20,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
    fixtures: [
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: -1 },
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: 1 }
    ]
});
\`\`\`

### Runtime Additions
Fixtures can also be added to an existing body.

\`\`\`typescript
const fixture = obj.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2,
    height: 0.5,
    restitution: 0.8
});
\`\`\`

> **Note on Concave Polygons**: When you add a concave polygon fixture, Gearbox2D decomposes it into multiple convex pieces internally. However, \`createFixture\` will still return a **single proxy Fixture object**. This proxy manages all the internal pieces transparently.

Upon creation, the engine:
1. Allocates space in the **Live Data Buffers**.
2. Computes the initial **AABB** (Axis-Aligned Bounding Box).
3. Inserts the fixture(s) into the **BVH** (Bounding Volume Hierarchy) for spatial tracking.

## Simulation Step (Integration)

Each time \`world.step()\` is called, every active (awake) object undergoes a movement update:

1.  **Impulse Application**: Any impulses applied during the frame are integrated into the velocity.
2.  **Force Integration**: Forces (including gravity and damping) are converted into acceleration and added to the velocity.
3.  **Position Update**: The object's position is updated based on its current velocity and the time step ($dt$).
4.  **AABB Update**: If the object moved significantly, its AABB is recomputed and its position in the BVH is updated.

## Sleeping and Waking

To maintain high performance with large numbers of objects, Gearbox2D implements an automatic "sleep" mechanism.

### Automatic Sleeping
An object will automatically enter a sleep state if its activity remains below certain thresholds for a sustained period (default is 1 second).

- **Velocity Threshold**: Linear velocity must be below \`0.005\`.
- **Angular Velocity Threshold**: Rotational speed must be below \`0.005\`.

When an object sleeps:
- It is no longer included in the kinematics integration step.
- Its AABB is "shrink-wrapped" to its exact bounds to minimize unnecessary collision checks.
- It is flagged in the data buffer with the \`IS_SLEEPING\` bit.

### Waking Up
An object is "woken up" when:
- It is hit by another active object.
- An impulse or force is applied via \`applyForce()\` or \`applyImpulse()\`.
- A property like \`x\`, \`y\`, or \`vx\` is changed via the JavaScript API.
- When an object wakes up, it automatically wakes up all objects it is currently in contact with.

### Manual Sleep Control
While Gearbox2D handles sleeping automatically, you can also take manual control of an object's state:

- **\`body.sleep()\`**: Immediately puts the object to sleep, zeroing out its velocity and removing it from the active simulation loop.
- **\`body.wakeUp()\`**: Wakes the object up if it was sleeping.
- **\`body.forceWakeUp()\`**: Wakes the object up and resets its internal sleep timer to zero, ensuring it stays awake for at least another full \`sleepTimeRequired\` period (even if it's not moving).

### Configuration
You can fine-tune how an object sleeps using these properties:

- **\`canSleep\`**: Set to \`false\` to prevent an object from ever entering a sleep state automatically. Useful for player characters or important dynamic elements.
- **\`sleepTimeRequired\`**: The amount of time (in seconds) an object must stay below the movement thresholds before it falls asleep. Default is \`1.0\`.

## Removal

When an object is no longer needed, it must be removed from the world.

\`\`\`typescript
world.removeObject(obj.id);
\`\`\`

During removal, the engine:
1. Removes all associated fixtures from the **BVH**.
2. Destroys any **Joints** connected to the body.
3. Clears contact tracking state.
4. Reorganizes the **SoA (Structure-of-Arrays)** buffers using a **swap-and-pop strategy** for $O(1)$ removal. This ensures that live data remains contiguous for efficient SIMD processing.

> **Warning**: After calling \`removeObject()\`, any JavaScript \`Body\` and \`Fixture\` wrappers pointing to the removed object or the one that was swapped into its place are **automatically updated** by the engine. However, you should avoid storing stale references to objects you've explicitly removed.
`,ce=Object.freeze(Object.defineProperty({__proto__:null,default:le},Symbol.toStringTag,{value:"Module"})),de=`# Object Properties

This page provides a detailed reference for the properties you can set on **Bodies** and **Fixtures** in Gearbox2D.

## Body Properties

Body properties define the state and movement of an object in the world.

### Position & Rotation
- \`x\`, \`y\`: The current position of the body's center of mass.
- \`r\`: The current rotation of the body in radians.

### Velocity
- \`vx\`, \`vy\`: Linear velocity in world units per second.
- \`vr\`: Angular velocity in radians per second.

### Mass & Inertia
- \`mass\`: Total mass of the body (sum of all fixture masses).
- \`inertia\`: The body's resistance to rotational acceleration.

### Damping
- \`linearDamping\`: Simulates air resistance or drag (0.0 to 1.0).
- \`angularDamping\`: Simulates rotational friction (0.0 to 1.0).

### Sleep Configuration
- \`canSleep\` (boolean): Whether the body can automatically go to sleep when inactive.
- \`isSleeping\` (boolean, read-only): Returns \`true\` if the body is currently in a sleep state.
- \`sleepTimeRequired\` (number): The number of seconds of inactivity required before the body sleeps. Default is \`1.0\`.

---

## Fixture Properties

Fixture properties define the physical behavior of a body's shape.

### Restitution (Bounciness)
\`restitution\`: A value typically between \`0.0\` and \`1.0\`.
- \`0.0\`: Perfectly inelastic collision (no bounce).
- \`1.0\`: Perfectly elastic collision (full bounce).
- Values greater than \`1.0\` are possible and will result in objects gaining energy during collisions.

### Friction
- \`staticFriction\`: Resistance to starting motion between two surfaces.
- \`kineticFriction\`: Resistance to maintaining motion between two surfaces.

Friction is typically set between \`0.0\` (perfectly slippery) and \`1.0\` (high friction). The actual friction between two colliding fixtures is calculated as the average of their respective friction values.

### Density
\`density\`: Used for automatic mass and inertia calculations.
The mass of a fixture is calculated as \`density * area\`. A density of \`1.0\` is recommended for standard objects.

### Sensor Mode
\`isSensor\`: A boolean property.
If \`true\`, the fixture will still trigger collision events but will **not** produce a physical response (objects will pass through it).

\`\`\`typescript
const fixture = body.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5,
    isSensor: true,
    restitution: 0.5,
    density: 1.0
});
\`\`\`

---

## Property Synchronization for Concave Polygons

When a concave polygon is added to a body, it is internally decomposed into multiple convex sub-fixtures. To ensure a consistent user experience, Gearbox2D automatically synchronizes properties across all these sub-fixtures.

When you modify a property on a proxy fixture (the \`Fixture\` object returned by \`createFixture\` for a concave polygon), the engine:
1.  **Iterates** through all internal sub-fixtures.
2.  **Updates** the corresponding property in the Live Data Buffers for each sub-fixture.
3.  **Refreshes** internal C++ state if necessary (e.g., updating the sensor flag in the core engine).

This ensures that the entire concave shape behaves as a single cohesive unit, with uniform friction, restitution, and density across all its parts.

### Example: Updating a Concave Shape
\`\`\`typescript
const star = world.createBody({ id: nextId++,  x: 0, y: 0 });
const starFixture = star.createFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: gearbox.polygon.makeStar(5, 1.0, 0.4)
});

// Setting restitution on the proxy fixture updates all internal pieces
starFixture.restitution = 0.8;
starFixture.staticFriction = 0.5;
\`\`\`

## Common Options

When creating a **Body**, **Fixture**, or **Joint**, you can pass an optional \`id\` property within the configuration object.

| Property | Type | Description |
| :--- | :--- | :--- |
| \`id\` | \`number\` | (Optional) A unique ID for tracking, lookups, and identifying objects in event handlers. |

For more information on how IDs are managed, see [ID Management in the World Object](architecture-world.md#id-management).
`,pe=Object.freeze(Object.defineProperty({__proto__:null,default:de},Symbol.toStringTag,{value:"Module"})),he=`# Performance Optimizations

Gearbox2D achieves high performance through several key architectural choices. This document provides an overview of the core technologies that make it fast.

## WebAssembly (WASM) & C++

The core physics engine is written in performance-critical C++ and compiled to **WebAssembly (WASM)**. This allows the engine to run at near-native speeds directly in the browser, bypassing the traditional overhead of JavaScript's garbage collection and dynamic typing.

## Structure-of-Arrays (SoA) Data Layout

Unlike traditional physics engines that use an **Array-of-Structures (AoS)** layout (where each object is a single struct containing its properties), Gearbox2D uses a **Structure-of-Arrays (SoA)** layout.

### Why SoA?
In an AoS layout, properties like \`x\` and \`y\` are interleaved with other data like \`mass\` or \`damping\`. This often results in "cache misses" when the CPU performs a global operation (like updating all positions).

In Gearbox2D's SoA layout:
- All \`x\` coordinates are stored in one contiguous array.
- All \`y\` coordinates are stored in another contiguous array.
- All \`vx\` (velocity) components are stored together, and so on.

### Benefits:
1.  **Cache Locality**: When the engine updates positions, it reads from a contiguous block of memory, which the CPU can pre-fetch into its cache extremely efficiently.
2.  **Zero-Copy Memory Access**: This layout allows the TypeScript API to create \`TypedArray\` views directly over specific property arrays, enabling zero-copy state access.
3.  **SIMD Readiness**: This is the primary requirement for efficient SIMD processing.

## WASM SIMD (Single Instruction, Multiple Data)

Gearbox2D leverages **WASM SIMD** (Single Instruction, Multiple Data) to perform 4-way parallel processing on compatible browsers.

### How it works:
Instead of processing objects one-by-one, the engine's global integrators use 128-bit SIMD registers to process **four objects simultaneously** in a single CPU instruction.

*   **Vectorized Position Integration**: Updates the \`x\` and \`y\` of 4 bodies at once.
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
`,ue=Object.freeze(Object.defineProperty({__proto__:null,default:he},Symbol.toStringTag,{value:"Module"})),me=`# Performance Tips

Gearbox2D is designed for high-performance physics, but how you use the engine can significantly impact your application's frame rate and stability. Follow these best practices to get the most out of the engine.

## 1. World Recycling (Scene Management)

Creating and destroying worlds is an expensive operation that involves allocating memory on the WebAssembly heap.

*   **Tip**: Instead of creating a \`new gearbox.createWorld()\` every time you change a level, use \`world.clear()\`.
*   **Benefit**: This reuses the same memory pool and avoids the overhead of WASM memory allocation and fragmentation.

## 2. Batch State Access

Accessing object properties (like \`body.x\`) is fast, but doing it thousands of times per frame in a tight loop still carries some JavaScript overhead.

*   **Tip**: If you need to iterate over all bodies for custom logic or rendering, use the shared buffers directly (\`world.liveBodyFloatData\`).
*   **SoA Advantage**: Because of the **Structure-of-Arrays (SoA)** layout, all \`x\` positions are stored contiguously, followed by all \`y\` positions, etc. This makes it extremely fast to upload specific properties to a GPU or process them in bulk.
*   **Tip**: Use \`world.iterateBodies(callback)\` for a cleaner but slightly slower alternative to direct buffer indexing.

## 3. SIMD-Friendly Scenes

Gearbox2D uses **WASM SIMD** to accelerate global integration and kinematics passes.

*   **Strategy**: To get the most out of SIMD, prefer many simple objects over a few extremely complex ones.
*   **How it works**: The engine's global integrators process bodies in batches of 4. Contiguous, active bodies in the SoA buffers benefit the most from these vectorized operations.
*   **Benefit**: Vectorized position and velocity integration can be up to 4x faster than traditional scalar loops.

## 3. Solver Iterations

The stability of your simulation depends on how many iterations the constraint solver performs.

*   **Tip**: If your simulation feels "mushy" or stacks are collapsing, increase the step frequency (e.g., \`1/120\`) rather than just cranking up solver iterations.
*   **Balance**: Higher iterations improve stability but increase CPU usage linearly.

## 4. Sleeping Objects

Physics engines spend most of their time checking collisions between objects that aren't even moving.

*   **Tip**: Ensure objects that have come to rest are marked as "Sleeping". Gearbox2D handles this automatically by default.
*   **Benefit**: Sleeping bodies are skipped during the most expensive parts of the physics loop, allowing for much larger worlds.

## 5. Collision Filtering

Reducing the number of collision checks is the most effective way to optimize large simulations.

*   **Tip**: Use \`categoryBits\` and \`maskBits\` to prevent collision checks between objects that you know should never interact (e.g., bullets and the player who fired them).
*   **Benefit**: This reduces the workload on both the Broad Phase (BVH) and Narrow Phase solvers.

## 6. Shape Selection

Different shapes have different performance costs:

*   **POINT**: Fastest (essentially zero cost).
*   **CIRCLE**: Very fast (simple distance check).
*   **AABB**: Fast (axis-aligned checks only).
*   **BOX**: Slower (requires full SAT or GJK/EPA resolution).

**Strategy**: Use \`CIRCLE\` or \`AABB\` fixtures for simple collision logic whenever possible, reserving \`BOX\` for objects where rotation-aligned collision is essential.
`,ye=Object.freeze(Object.defineProperty({__proto__:null,default:me},Symbol.toStringTag,{value:"Module"})),ge=`# AI & Pathfinding (Planned)
TODO

`,be=Object.freeze(Object.defineProperty({__proto__:null,default:ge},Symbol.toStringTag,{value:"Module"})),fe=`# Continuous Collision Detection (Planned)
TODO

`,ve=Object.freeze(Object.defineProperty({__proto__:null,default:fe},Symbol.toStringTag,{value:"Module"})),we=`# Fluid Dynamics (Planned)
TODO

`,xe=Object.freeze(Object.defineProperty({__proto__:null,default:we},Symbol.toStringTag,{value:"Module"})),Se=`# Supported Shapes & Geometry

In Gearbox2D, geometry is defined using **Fixtures**. A single **Body** can have multiple fixtures attached to it, allowing you to create complex composite shapes.

## Fixtures vs. Bodies

- **Body**: Represents a physical object in the world with a position, rotation, and velocity. It handles the integration of forces and movement.
- **Fixture**: Defines the shape, density, and friction of a part of a body. A body's total mass and inertia are calculated based on all its attached fixtures.

## Shape Types

### POINT
\`gearbox.shapes.POINT\`
A zero-radius marker. Points are useful for simple particles or as anchors. They have very low mass and can collide with other shapes, but do not collide with other points.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.POINT
});
\`\`\`

### CIRCLE
\`gearbox.shapes.CIRCLE\`
An optimized circular shape defined by a radius. Circles are the most computationally efficient shape for collision detection.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});
\`\`\`

### ELLIPSE
\`gearbox.shapes.ELLIPSE\`
An elliptical shape defined by \`radiusX\` and \`radiusY\`. Ellipses are useful for representing non-uniform circular bodies. Like the \`BOX\` shape, an ellipse **rotates with the body**.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.ELLIPSE,
    radiusX: 0.8,
    radiusY: 0.4
});
\`\`\`

### AABB
\`gearbox.shapes.AABB\`
An Axis-Aligned Bounding Box. It is defined by a \`width\` and \`height\`. Unlike other shapes, an AABB **does not rotate** even if the parent body rotates. It always remains aligned with the world axes.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.AABB,
    width: 2.0,
    height: 1.0
});
\`\`\`

### BOX
\`gearbox.shapes.BOX\`
An Oriented Bounding Box (OBB). Like an AABB, it is defined by \`width\` and \`height\`, but it **rotates with the body**.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2.0,
    height: 1.0
});
\`\`\`

### CAPSULE
\`gearbox.shapes.CAPSULE\`
A pill-shaped geometry defined by a \`radius\` and a \`height\`. The total height includes the hemispherical caps at both ends. Capsules are excellent for character controllers as they slide smoothly over edges.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.CAPSULE,
    radius: 0.25,
    height: 1.5
});
\`\`\`

### POLYGON
\`gearbox.shapes.POLYGON\`
A polygon defined by an array of vertices. Gearbox2D supports both **convex** and **concave** polygons.

\`\`\`typescript
body.createFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: [
        { x: -0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0, y: -0.5 }
    ]
});
\`\`\`

#### Concave Polygons & Automatic Decomposition
Internally, the physics engine core only supports convex polygons. When you add a concave polygon in the TypeScript wrapper, Gearbox2D automatically decomposes it into multiple convex pieces using **Bayazit's algorithm**.

From the user's perspective, this remains a **single Fixture**. Property changes (like friction or restitution) made to this fixture are automatically synchronized across all internal convex parts.

## Geometry Helpers

Gearbox2D provides procedural helpers to generate vertex arrays for common shapes. These are found under the \`gearbox.polygon\` namespace.

### Regular Polygons
Generates vertices for an equilateral shape with N sides.

\`\`\`typescript
// Create a hexagon
const hexVertices = gearbox.polygon.makeRegularPolygon(6, 0.5);

body.createFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: hexVertices
});
\`\`\`

### Stars
Generates vertices for a star shape. Stars are concave and will be automatically decomposed by the engine.

\`\`\`typescript
// Create a 5-pointed star
const starVertices = gearbox.polygon.makeStar(5, 0.5, 0.2);

body.createFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: starVertices
});
\`\`\`
`,Ae=Object.freeze(Object.defineProperty({__proto__:null,default:Se},Symbol.toStringTag,{value:"Module"})),Te=`# Plan:

## Solvers & Physics Loop
- [x] High-level physics loop implementation (\`step\`).
	- [x] Substepping (Velocity Substeps).
	- [x] Velocity Integration.
	- [x] Position Integration.
- [x] **Collision Solver** (Geometric Narrow Phase).
	- [x] Geometric intersection tests.
	- [x] Contact manifold generation (Point, Normal, Depth).
- [x] **Velocity Solver** (Sequential Impulse).
	- [x] Iterative solver for contact constraints.
	- [x] Friction resolution (Static & Kinetic).
	- [x] Warmstarting.
- [x] **Position Solver** (Non-linear Gauss-Seidel).
	- [x] Iterative penetration resolution.
	- [x] Baumgarte stabilization (with multi-fixture scaling).
- [x] **Joint Solver**.
	- [x] Pre-solve and solve phases.
	- [x] Integration with global iterative solver.

## Shapes, Kinematics, Collisions
- [x] Setup and test Rust w/ web assembly target.
- [x] Define basic starting classes for the physics module.
	- [x] RigidBody.
	- [x] Vec2.
- [x] Contain all objects in a world. Ability to add and remove objects to/from world.
- [x] Add a world tick.
- [ ] Ability to export raw data as a byte array.
- [x] Add debug visuals.
- [x] Add a few different shapes.
	- [x] AABB.
	- [x] Box.
	- [x] Capsule.
	- [x] Circle.
	- [x] Convex polygons.
	- [X] Concave polygons.
	- [ ] Edge (optional).
	- [x] Point.
- [x] Composite objects (Multi-fixture bodies).
- [x] Add rotations.
- [x] Compute/track AABB for each object.
- [x] Implement BVH.
- [x] Implement broad phase collision detection using BVH.
- [x] Implement narrow phase collision detection.
	- [x] AABB-AABB.
	- [x] Box-AABB -> Box-Box.
	- [x] Box-Box.
	- [x] Capsule-AABB.
	- [x] Capsule-Box.
	- [x] Capsule-Capsule.
	- [x] Circle-AABB.
	- [x] Circle-Box.
	- [x] Circle-Capsule.
	- [x] Circle-Circle.
	- [x] Polygon-AABB.
	- [x] Polygon-Box.
	- [x] Polygon-Capsule.
	- [x] Polygon-Circle.
	- [x] Polygon-Polygon.
	- [ ] Edge-AABB.
	- [ ] Edge-Box.
	- [ ] Edge-Capsule.
	- [ ] Edge-Circle.
	- [ ] Edge-Convex.
	- [ ] Edge-Edge.
	- [x] Point-AABB.
	- [x] Point-Box.
	- [x] Point-Capsule.
	- [x] Point-Circle.
	- [x] Polygon-Point.
	- [ ] Point-Edge.
	- [x] Point-Point.
- [x] Collision resolvers.
	- [x] **Collision Solver** (Geometric Narrow Phase).
		- [x] Geometric intersection tests.
		- [x] Contact manifold generation (Point, Normal, Depth).
	- [x] **Velocity Solver** (Sequential Impulse).
		- [x] Iterative solver for contact constraints.
		- [x] Friction resolution (Static & Kinetic).
		- [x] Warmstarting.
	- [x] **Position Solver** (Non-linear Gauss-Seidel).
		- [x] Iterative penetration resolution.
		- [x] Baumgarte stabilization (with multi-fixture scaling).
	- [x] **Joint Solver**.
		- [x] Pre-solve and solve phases.
		- [x] Integration with global iterative solver.
- [x] Implement collision events.
	- [X] Body-body collision events.
	- [X] Fixture-fixture collision events.
- [x] Define object types.
	- [x] Sensor.
	- [x] Physical.
	- [x] Fixed.
	- [X] Kinematic.
- [x] Implement an applyForce on objects.
- [x] Implement an applyImpulse on objects.
- [x] Implement an applyAngularImpulse on objects.
- [x] Determine and apply impulse for rigid body collisions with basic shapes.
- [X] Collision tracking.

## Constraints
- [x] Hinged.
- [x] Distance.
- [x] Spring.
- [x] Gear constraint.
	- [ ] Mechanical friction (optional).


## Interactions
- [x] Spatial picking (query BVH).
- [ ] Raycasting (planned).
- [ ] AABB queries (planned).

## Misc
- [x] Elasticity (restitution).
- [x] Static/dynamic friction.
- [x] Support changing the center of mass.
- [x] Live data buffers (Direct Wasm/TS memory mapping).
- [x] Per-fixture material properties (Friction, Restitution, Density).
- [ ] Squishy objects via per-object bias factor for Baumgarte stabilization (optional).


## Events
- [X] Events buffer.
- [X] Opt in per object.
- [X] On collision events.
	- [X] Return impulse.
- [X] On collision end events.
- [X] On sleep events.
- [X] On wake up.
- [ ] On pre-solve (optional).
- [ ] On post-solve (optional).

## Fluid Dynamics
- [X] Simple linear dampening.
- [X] Simple rotational dampening.
- [ ] Wind.
- [ ] Advanced drag.
- [ ] Under water / liquid.
	- [ ]  Bouancy.

## Optimizations

### General Optimizations
- [x] Cache inverse mass.
- [x] Cache inverse inertia.
- [x] Cache inverse dt.
- [x] Cache exponential decay factor when dt is set.
- [x] Implement collision masks.
- [X] Warmstarting.
- [ ] Focus areas & resolution.

### High-Fidelity Optimizations
- [X] Kinematic restitution balancing (novel).

### Broad Phase Optimizations
- [x] Broad phase using AABBs.
- [x] Do not recompute AABB when no movement happens.
- [ ] Stagger AABB recalculation when movement is slow.
- [x] Speed-dependant bounding area padding.
- [ ] Spin-dependant bounding area padding (optional).
- [x] Bounding volume hierarchy (BVH).
- [X] BVH heuristic biasing.
	- [x] BVH sleep biasing.
	- [x] BVH collision mask biasing (novel).
	- [X] BVH particle biasing.
	- [X] Static island biasing.
	- [X] Same-body biasing.
	- [X] Velocity biasing.
	- [X] Sensor biasing.
	- [ ] Experimentally fine-tune BVH biases.
- [ ] Rebalance BVH.
- [ ] Experimental: Caching previous broad-phase collisions.
- [ ] Experimental: Instead of reinserting on movement, consider tree traversal.
- [ ] Experimental: Consider combining the broad phase with the kinematics phase.

### Sleep Optimizations
- [x] Sleeping objects.
- [x] Islands.
- [x] Shrinkwrap AABB on sleep.
- [ ] Experimental: Separate vectors for sleeping/awake objects.
- [ ] Experimental: Re-insert into BVH upon sleep.
- [ ] Experimental: Sleep drift (sleeping at terminal velocity).

### Parallelization
#### SIMD Vectorization (WASM SIMD128)
- [x] SIMD-accelerated math library (2D dot, cross, rotate, etc.).
- [x] Vectorized global integrators (4-way SoA processing).
- [x] SIMD narrow-phase solvers (Circle-Circle, Box-Box, etc.).
- [x] SIMD BVH traversal (4/8-way bounding box tests).
- [x] SIMD constraint and joint solvers (batched solving).
- [x] Bulk world-data synchronization (vectorized vertex transforms).

#### Multi-threading
- [x] Persistent thread pool system.
- [x] Parallel island solver (concurrent independent islands).
- [x] Parallel narrow-phase detection (multi-threaded collision pairs).
- [ ] Parallel global integrators (gravity and motion updates).

## Advanced Features
- [x] Smart anti-tunelling (Speculative Contacts).
- [ ] Advanced drag.
- [ ] Forcefields.
- [ ] Microscopic scale.
- [ ] Galactic scales.
- [ ] Automatic handling for big world problem.
- [ ] Changing mass dynamically.
- [ ] Changing size dynamically (stretch goal)
- [ ] Snap nodes for complex objects (experimental).

## AI
- [ ] A*.
- [ ] A* biasing.
- [ ] A* advanced coordination.
- [ ] Precomputed nav mesh.
- [ ] High-performance sensors.
- [ ] Agent steering and movement.
- [ ] Local Navigation & Obsticle Avoidance (RVO/ORCA).
- [ ] Inverse Kinematics.
- [ ] Collision Prediction / Danger Maps (optional)

## Known Issues
- Spring joints can't be adjusted at runtime - see the commented-out spring test case.
- Bullet through paper is somewhat unreliable. Also affects the high-energy bounce benchmark, which is broken for Gearbox2d.
- Newton's cradle tests are showing some regression. After several bounces,
- Motorcycle example shows several issues. Back wheel sinks into the ground, and others. Likely a problem with KRB. Joints are also unstable.
- 20-Segment-Chain jitters automatically.
- Engine seems to have better performance in ST mode. Worth looking into this to re-evaluate whether MT is worth it.
- Slight jitter visible in the stacks benchmark. Might be possible to fix by making slight tweaks to some of the engine's constants.
- In the chain belt example, we can observe clipping and violent jitter. This was a regression likely introduced in mid Februrary 2026 while debugging other stability issues.`,_e=Object.freeze(Object.defineProperty({__proto__:null,default:Te},Symbol.toStringTag,{value:"Module"})),je=Object.assign({"../docs/structure.md":p})["../docs/structure.md"].default,c=Object.assign({"../docs/DEVELOPER_PARALLELISM.md":v,"../docs/architecture-coordinates.md":x,"../docs/architecture-wasm-memory.md":A,"../docs/architecture-world.md":_,"../docs/collision-broad-phase.md":I,"../docs/collision-filtering.md":D,"../docs/collision-narrow-phase.md":P,"../docs/core-concepts.md":O,"../docs/development.md":E,"../docs/events.md":W,"../docs/first-simulation.md":G,"../docs/game-loop.md":H,"../docs/graphics-debug.md":J,"../docs/installation.md":q,"../docs/interaction-queries.md":N,"../docs/introduction.md":Y,"../docs/joints-distance.md":K,"../docs/joints-gear.md":Z,"../docs/joints-hinge.md":ne,"../docs/joints-overview.md":oe,"../docs/joints-spring.md":ae,"../docs/objects-body-types.md":re,"../docs/objects-lifecycle.md":ce,"../docs/objects-properties.md":pe,"../docs/performance-optimizations.md":ue,"../docs/performance-tips.md":ye,"../docs/planned-ai-pathfinding.md":be,"../docs/planned-ccd.md":ve,"../docs/planned-fluid-dynamics.md":xe,"../docs/shapes.md":Ae,"../docs/structure.md":p,"../plan.md":_e});function Ie(n){const o=n.split(`
`),i=[];let e=null;for(const t of o)if(t.startsWith("##"))e={name:t.replace(/^##\s+/,"").trim(),pages:[]},i.push(e);else if(t.startsWith("-")){const s=t.match(/- `([^`]+\.md)`:\s*(.*)/);s&&e&&e.pages.push({file:s[1],title:s[2].trim().replace(/\.$/,"")})}return i}const h=Ie(je),d=document.getElementById("docs-list"),Be=document.getElementById("doc-title"),l=document.getElementById("doc-content");function De(){h.forEach(n=>{const o=document.createElement("li");o.className="section",o.textContent=n.name,d.appendChild(o),n.pages.forEach(i=>{const e=document.createElement("li"),t=document.createElement("a");t.className="sidebar-link",t.textContent=i.title,t.href=`#${i.file.replace(".md","")}`,t.dataset.file=i.file,e.appendChild(t),d.appendChild(e)})}),document.querySelectorAll(".sidebar-link").forEach(n=>{n.addEventListener("click",()=>{r()&&a.classList.add("collapsed")})})}async function u(){const n=window.location.hash.substring(1),o=n?`${n}.md`:h[0]?.pages[0]?.file||"";if(!o)return;document.querySelectorAll(".sidebar-link").forEach(e=>{e.getAttribute("href")===`#${o.replace(".md","")}`?(e.classList.add("active"),Be.textContent=e.textContent):e.classList.remove("active")});let i=c[`../docs/${o}`]?.default;!i&&o==="plan.md"&&(i=c["../plan.md"]?.default),i?(l.innerHTML=g.parse(i),l.querySelectorAll("pre code").forEach(e=>{const t=e.parentElement,s=Array.from(e.classList).find(y=>y.startsWith("language-"));s&&t.setAttribute("data-lang",s.replace("language-","")),hljs.highlightElement(e)})):l.innerHTML=`<p>Error: Could not load documentation file "${o}".</p>`,document.getElementById("main").scrollTop=0}window.addEventListener("hashchange",u);De();u();const r=()=>window.innerWidth<=768,a=document.getElementById("sidebar"),m=document.getElementById("sidebar-toggle");m.addEventListener("click",()=>{a.classList.toggle("collapsed")});r()&&a.classList.add("collapsed");window.addEventListener("resize",()=>{r()&&!a.classList.contains("collapsed")&&a.classList.add("collapsed")});window.addEventListener("click",n=>{r()&&!a.classList.contains("collapsed")&&!a.contains(n.target)&&!m.contains(n.target)&&a.classList.add("collapsed")});
