# Gearbox2D C++ Performance Enhancement Plan

This document outlines a phased approach to improving the performance of the Gearbox2D C++ physics engine, with a focus on multithreading, SIMD vectorization, and memory efficiency.

---

## Phase 1: Foundational & Sequential Optimizations [COMPLETED]
*Focus: Improving cache locality and reducing overhead in the existing single-threaded execution.*

### 1.1. Refactor Integrators to World-Level Loops [DONE]
- **Goal:** Move integration logic out of individual `Body` objects and into bulk processing loops in `World`.
- **Action:** Transition `Body::integrateVelocities` and `Body::integratePositions` to static or world-level functions that iterate over the `liveBodyFloatData` and `liveBodyIntData` arrays directly.
- **Benefit:** Prepares the codebase for SIMD and improves instruction cache usage.

### 1.2. Flatten Map Accesses [DONE]
- **Goal:** Reduce the overhead of `std::unordered_map` lookups during the simulation step.
- **Action:** Replace ID-based map lookups with direct index access where possible, especially in the solver and narrow-phase. Use a "Flat Map" or simple array lookup for internal ID-to-index mapping.
- **Benefit:** Fewer hash calculations and better cache performance.

---

## Phase 2: Task-Based Parallelism (Multithreading)
*Focus: Leveraging multiple CPU cores for independent physics tasks.*

### 2.1. Parallel Island Solver [DONE]
- **Goal:** Solve independent physics islands concurrently.
- **Action:** Modify `World::_buildAndProcessIslands` to use a task-based system (e.g., `std::async`, `Intel TBB`, or a custom thread pool) to call `_solveIsland` in parallel for each identified island.
- **Dependency:** Ensure thread-safety for shared resources (though islands are designed to be independent).

### 2.2. Parallel Narrow-Phase Detection [DONE]
- **Goal:** Speed up the most expensive part of collision detection.
- **Action:** Parallelize the loop in `World::_doNarrowPhase` that iterates over `bvh.collisionPairs`.
- **Benefit:** Significant performance gains in scenes with high object density and many potential collisions.

### 2.3. Parallel Global Integrators
- **Goal:** Speed up basic motion updates for all bodies.
- **Action:** Use simple loop parallelization (e.g., `#pragma omp parallel for`) for gravity application and velocity/position integration.

---

## Phase 3: Data-Parallelism (SIMD/Vectorization) [DONE]
*Focus: Using CPU vector instructions (AVX/NEON) to process multiple data points at once.*

**Note on Highway Migration:** The transition from manual WASM intrinsics to Google Highway achieved full portability (AVX2/NEON/SSE4) but introduced a temporary performance regression (~20-200% slowdown in WASM) due to "Type Hopping" between Vectors and Masks. This validates the need for Phase 6 (Tuning).

### 3.1. SIMD-Accelerated Math Library [DONE]
- **Goal:** Replace scalar `Vec2` operations with SIMD-optimized equivalents.
- **Action:** Transitioned from manual WASM intrinsics to a portable Google Highway abstraction layer in `simd-math.h`.
- **Benefit:** Enables SIMD performance on all platforms, not just WASM.

### 3.2. Vectorized Integrators [DONE]
- **Goal:** Process 4-8 bodies simultaneously during integration.
- **Action:** Implemented portable Highway versions of the world-level integration loops.
- **Benefit:** Drastic reduction in time spent on basic motion updates on native hardware.

### 3.3. SIMD Narrow-Phase Solvers [DONE]
- **Goal:** Accelerate individual collision tests.
- **Action:** Implemented Highway-based versions of the most common solvers (e.g., `_solveCircleCircle`).
- **Benefit:** Significant speedup in dense scenes on native hardware.

### 3.4. Vectorized Joint Solvers [DONE]
- **Goal:** Accelerate pre-solving for large numbers of constraints.
- **Action:** Implemented Highway paths for `DistanceJoint` and `SpringJoint`.
- **Benefit:** Batch processing of joint constraints.

---

## Phase 4: Advanced Algorithmic Optimizations
*Focus: Refining complex systems for maximum efficiency.*

### 4.1. SIMD BVH Traversal [DONE]
- **Goal:** Accelerate broad-phase collision detection.
- **Action:** Implement 4-way or 8-way BVH traversal, testing a bounding box against multiple child nodes simultaneously using SIMD.

### 4.2. SIMD Constraint Solver (Advanced) [DONE]
- **Goal:** Vectorize the iterative impulse solver.
- **Action:** Group contact constraints into batches of 4 or 8 that do not share bodies and solve them using SIMD instructions.
- **Benefit:** Theoretical 4-8x speedup for the most computationally intensive part of the engine.

### 4.3. Bulk World-Data Sync [DONE]
- **Goal:** Eliminate scalar overhead in synchronization passes.
- **Action:** Use the SIMD math layer to perform world-space vertex transforms and AABB re-synchronization for all active bodies in a single vectorized pass.
- **Benefit:** Improves performance during high-movement frames.

## Phase 5: Refinement & Advanced SIMD
*Focus: Eliminating remaining scalar bottlenecks and extending vectorization to complex solvers.*

### 5.1. Rotation Caching & Component Reuse
- **Goal:** Eliminate redundant trigonometric calls for the same body rotation.
- **Action:** Pre-calculate `std::cos(rotation)` and `std::sin(rotation)` once per body at the start of the physics step. Reuse these components in all contact solvers, joint pre-solvers, and vertex transformations.
- **Benefit:** Reduces the "trig tax" in scenes with many constraints per body.

### 5.2. Extended SIMD Solver Coverage
- **Goal:** Vectorize non-circular collision types.
- **Action:** Implement "1-vs-4" SIMD paths for `Box-Box`, `Box-Point`, and `Circle-Box` collision solvers.
- **Benefit:** Improves performance in heterogeneous scenes with mixed shape types.

### 5.3. Conditional & Optimized Island Sorting
- **Goal:** Reduce sorting overhead for small islands.
- **Action:** Make the island-level contact/joint sorting conditional on a minimum number of constraints. Explore using specialized sorting for small N or maintaining sorted orders during insertion.
- **Benefit:** Improves performance in sparse environments with many small independent islands.

### 5.4. Aligned SIMD Memory Management
- **Goal:** Maximize memory throughput for SIMD operations.
- **Action:** Use `alignas(16)` for all temporary stack arrays used in SIMD extraction and batching. Transition from unaligned (`_mm_storeu_ps`) to aligned (`_mm_store_ps`) memory operations where possible.
- **Benefit:** Reduces CPU cycles spent on memory alignment during SIMD stores/loads.

### 5.5. Logical-Mask BVH Pruning
- **Goal:** Improve broad-phase pruning efficiency.
- **Action:** Integrate logical collision bitmask checks directly into the SIMD BVH traversal loop. Prune subtrees as soon as a logical incompatibility is detected, before performing spatial overlap tests.
- **Benefit:** Reduces broad-phase overhead in complex scenes with many logical layers (e.g., UI vs. Game vs. Particles).

---

## Phase 6: Google Highway Performance Tuning
*Focus: Optimizing the Highway abstraction layer to achieve native performance parity and leverage advanced CPU features.*

### 6.1. Eliminate "Type Hopping" in Logical Ops
- **Goal:** Remove unnecessary `BitCast` calls in bitwise operations.
- **Action:** Refactor `v128_and`, `v128_or`, `v128_xor`, and `v128_not` in `simd-math.h` to use Highway's native float-tag operations (e.g., `hn::And(df(), a, b)`) instead of casting to `du8`.
- **Benefit:** Allows the compiler to keep data in floating-point registers and use specialized ISA instructions (like `ANDPS`), reducing pipeline stalls.

### 6.2. Native Vector Selection (Bitwise)
- **Goal:** Bypass the expensive Highway `Mask` system for selection logic.
- **Action:** Re-implement `v128_select` using bitwise logic: `Or(And(mask, a), AndNot(mask, b))`. 
- **Benefit:** Eliminates the overhead of `MaskFromVec`, which is costly on SSE4.1/WASM. This is expected to significantly improve BVH traversal and particle simulation performance.

### 6.3. Targeted Loading & Storing (LoadU/StoreU)
- **Goal:** Use optimized intrinsic hints for memory operations.
- **Action:** Replace the current defensive byte-based loads with `hn::LoadU(df(), ptr)` and `hn::StoreU(v, df(), ptr)`. 
- **Benefit:** Provides clearer hints to the compiler to use `MOVUPS`/`MOVAPS` instructions and removes the "load-as-bytes" abstraction penalty.

### 6.4. Leverage Highway Dynamic Dispatch
- **Goal:** Automatically utilize the best available ISA (AVX2, AVX-512) at runtime.
- **Action:** Update the `Makefile` and `main.cpp` to use Highway's `HWY_DYNAMIC_DISPATCH`. Compile the codebase multiple times for different targets (e.g., SSE4, AVX2) and link them into a single binary.
- **Benefit:** Users with modern CPUs will see a massive (2x-4x) performance boost in the BVH and Integrators without code changes.

### 6.5. Replace "Make" Helpers with Register Splats
- **Goal:** Reduce stack traffic during vector construction.
- **Action:** Transition `v128_make_f32` away from local arrays and `Load` operations. Use `hn::Set` for splatting or `hn::Interleave` patterns where applicable.
- **Benefit:** Allows the compiler to move values directly from GPRs to SIMD registers, avoiding slow L1 cache round-trips.

---

## Future Considerations & Experimental Research
*These concepts represent significant architectural shifts and should be treated as research projects. They must not be bundled with standard feature work without extreme scrutiny, isolated benchmarking, and careful consideration of the memory architecture.*

### Experimental: Data-Oriented SIMD Graph Solvers
Attempting to apply SIMD to graph-based systems (like constraints and contacts) using "Software Gather/Scatter" memory access often results in a net performance loss due to the penalty of packing and unpacking data from scattered memory locations. To achieve true SIMD acceleration in the solver (similar to Box2D v3), the engine architecture would need to be fundamentally redesigned:

1. **Constraint Graph Coloring**
   - **Concept:** Run a graph coloring algorithm over the contact graph before solving. Group constraints into "batches" (colors) where no two constraints in a batch share a body.
   - **Benefit:** Eliminates data dependency races, allowing an entire batch to be solved in parallel (via multithreading or SIMD) without locking or atomic operations.

2. **The "Gather-Iterate-Scatter" Cache (SoA)**
   - **Concept:** Instead of gathering data from `liveBodyFloatData` on every solver iteration, perform a single "Gather" pass to pack the velocities, masses, and normals of all bodies in a Color Batch into a contiguous, cache-aligned Structure of Arrays (SoA) buffer.
   - **Execution:** Run the 8-10 velocity iterations *entirely inside this dense cache* using pure SIMD instructions.
   - **Scatter:** After all iterations complete, unpack the final velocities and write them back to main memory once.
   - **Benefit:** Amortizes the heavy memory packing penalty across the multiple solver iterations, allowing the mathematical speedup of SIMD to dominate.

3. **Type-Segregated Narrow-Phase Queues**
   - **Concept:** Instead of testing collision pairs immediately as the BVH finds them, push them into shape-specific arrays (e.g., `Array<CircleVsCircle>`, `Array<BoxVsBox>`).
   - **Execution:** Process these dense, homogeneous arrays using SIMD without any `if/else` branching (which stalls SIMD pipelines).
   - **Benefit:** Maximizes SIMD lane utilization and instruction cache coherence during the narrow-phase.

### Other Research
- **GPGPU Acceleration:** Investigating Compute Shaders (via WebGPU for WASM) for massive-scale particle or fluid simulations.
- **Continuous Collision Detection (CCD):** Optimizing the planned CCD implementation with similar multithreaded/SIMD strategies from the start.


### 6.4. Leverage Highway Dynamic Dispatch (Post-Mortem & Re-evaluation)

**The Challenge:**
Initial implementation resulted in a catastrophic performance regression (+400% to +2700% slowdown). The primary difficulty lies in the engine's reliance on deep, recursive tree traversals (BVH) and high-frequency solver iterations. Runtime dynamic dispatch introduces call overhead that is significant when the work per-call is small (e.g., processing a single BVH node).

**What was tried:**
- Vectorizing BVH insertion using a greedy SIMD search.
- Bulk-pruning BVH children using aggregated properties (SoA) and bitmask checks.
- Moving SIMD logic into dedicated translation units with `foreach_target` headers.

**What worked:**
- The SoA data layout for `BvhNode` (child bounds and properties) is efficient for memory access and should be kept.
- The build system configuration for multi-ISA compilation (AVX2/SSE4) is now functional.

**What didn't work:**
- Dynamic dispatch inside recursive functions: The overhead of `HWY_DYNAMIC_DISPATCH` at every level of the tree is too high.
- Branching based on SIMD bitmasks: Moving data from SIMD registers to branch units caused significant pipeline stalls.

**Proposed Phased Approach for Retry:**

1.  **Phase 1: Leaf-Only Vectorization**
    - Keep the high-level traversal scalar.
    - Only use SIMD when a "leaf batch" is reached (e.g., testing 4 fixtures at once). This ensures the work-to-overhead ratio is favorable.
2.  **Phase 2: "Flat" Dispatch**
    - Dispatch only at the top-most entry points (e.g., `World::Step`). 
    - Once inside a vectorized translation unit, use static dispatch for all internal helper calls to allow the compiler to inline them.
3.  **Phase 3: Iterative BVH Traversal**
    - Convert recursive BVH functions to iterative versions using a small stack. This makes the loop structure more visible to the compiler and avoids the overhead of repeated function calls.
4.  **Phase 4: Targeted Dynamic Dispatch**
    - Only enable dynamic dispatch for the "heavy hitters" (Integration and the Solver loops) where the work is naturally "flat" and data-parallel.