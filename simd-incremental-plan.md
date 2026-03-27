# Phased Incremental SIMD Implementation Plan (Section 4.2)

This plan breaks down the migration to Google Highway and SIMD optimization into small, testable increments to ensure numerical stability and minimize scope explosion.

## Phase 1: Infrastructure & Highway Setup
**Goal**: Replace the legacy SIMD math library with Google Highway while maintaining existing functionality.

*   **Task 1.1**: Update `simd-math.h` to include Google Highway headers and define `SimdVec`, `SimdMask`, and `DF` (ScalableTag). Keep all existing `wasm_` macros but alias them to Highway equivalents (using `hn::LoadU` and `hn::StoreU`).
*   **Task 1.2**: Implement basic Highway tests in `cpp/tests/simd-math_tests.cpp` to verify that `DF` works on the current architecture.
*   **Verification**: `make test` should pass all existing tests (since no logic has changed yet, just the backend of the macros).

## Phase 2: Graph Coloring (Race-Free Batches)
**Goal**: Group constraints into independent batches so they can be solved in parallel later.

*   **Task 2.1**: Implement `World::_colorIsland(Island& island)` using a greedy coloring algorithm.
*   **Task 2.2**: Modify `_solveIslandVelocity` and `_solveIslandPosition` to iterate through the new `island.contactBatches` etc.
*   **Critical**: In this phase, call the **SCALAR** `solveFast()` and `solvePosition()` methods inside the batch loops.
*   **Verification**: Run regression tests. Simulation results should be **bit-identical** to the un-colored version. This proves the coloring correctly identifies independent constraints and prevents race conditions.

## Phase 3: Dense Data Integration (Integrator SIMD)
**Goal**: Vectorize the high-loop integration passes which don't have complex dependencies.

*   **Task 3.1**: Refactor `_doIntegrateVelocitiesSIMD` to use `SIMD_LANE_COUNT` loop increments. Use `hn::IsFinite` for robust NaN/Inf checks.
*   **Task 3.2**: Refactor `_doIntegratePositionsSIMD`. Ensure `sleepTimer` and error accumulators are handled correctly for variable lane widths.
*   **Task 3.3**: Refactor `_syncFixturesSIMD`.
*   **Verification**: Run `RegressionPileTest`. If it fails here, we know the bug is in the integration logic, not the solver.

## Phase 4: Joint Solver Vectorization
**Goal**: Vectorize specific joint types one by one.

*   **Task 4.1**: Implement `DistanceJoint::solveFastSIMD`.
*   **Task 4.2**: Implement `SpringJoint::solveFastSIMD`.
*   **Task 4.3**: Implement `HingeJoint::solveFastSIMD`.
*   **Task 4.4**: Implement `GearJoint::solveFastSIMD`.
*   **Verification**: Run `DistanceJointTest` and `SpringJointTest`. Verify performance gains with `make benchmark`.

## Phase 5: Contact Solver Vectorization (Hardest Part)
**Goal**: Vectorize the primary contact solver.

*   **Task 5.1**: Implement `ContactConstraint::preSolveSIMD`. This is the most complex function.
*   **Task 5.2**: Implement `ContactConstraint::solveFastSIMD`.
*   **Verification**: Run `RegressionStackingTest`. This is where numerical parity is most likely to break. Use "Bit-for-Bit Validation" if needed (comparing scalar vs SIMD results for a single frame).

## Phase 6: Final Integration & Cleanup
**Goal**: Remove all legacy Emscripten guards and optimize tail handling.

*   **Task 6.1**: Remove all `#ifdef __EMSCRIPTEN__` blocks related to SIMD.
*   **Task 6.2**: Standardize on `v128_` or `hn::` naming conventions.
*   **Verification**: Full regression suite pass on native Linux.
