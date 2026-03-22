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

## Phase 3: Data-Parallelism (SIMD/Vectorization)
*Focus: Using CPU vector instructions (AVX/NEON) to process multiple data points at once.*

### 3.1. SIMD-Accelerated Math Library [DONE]
- **Goal:** Replace scalar `Vec2` operations with SIMD-optimized equivalents.
- **Action:** Implement a specialized SIMD math layer for common operations (dot product, cross product, normalization, rotation).
- **Benefit:** Reduces the clock cycles required for fundamental geometric calculations.

### 3.2. Vectorized Integrators [DONE]
- **Goal:** Process 4-8 bodies simultaneously during integration.
- **Action:** Implement AVX/SSE/NEON versions of the world-level integration loops created in Phase 1.
- **Benefit:** Drastic reduction in time spent on basic motion updates.

### 3.3. SIMD Narrow-Phase Solvers [DONE]
- **Goal:** Accelerate individual collision tests.
- **Action:** Implement SIMD versions of the most common solvers (e.g., `_solveCircleCircle`, `_solveBoxBox`). Implement "1-vs-4" batching patterns (test one object against 4 others in a single SIMD operation).
- **Benefit:** Significant speedup in dense scenes.

### 3.4. Vectorized Joint Solvers [DONE]
- **Goal:** Accelerate pre-solving for large numbers of constraints.
- **Action:** Implement SIMD paths for `DistanceJoint` and `SpringJoint` to calculate effective mass and bias in batches of 4.
- **Benefit:** Theoretical 4x speedup for complex articulated systems.

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

### 4.3. Bulk World-Data Sync
- **Goal:** Eliminate scalar overhead in synchronization passes.
- **Action:** Use the SIMD math layer to perform world-space vertex transforms and AABB re-synchronization for all active bodies in a single vectorized pass.
- **Benefit:** Improves performance during high-movement frames.

---

## Future Considerations
- **GPGPU Acceleration:** Investigating Compute Shaders (via WebGPU for WASM) for massive-scale particle or fluid simulations.
- **Continuous Collision Detection (CCD):** Optimizing the planned CCD implementation with similar multithreaded/SIMD strategies from the start.
