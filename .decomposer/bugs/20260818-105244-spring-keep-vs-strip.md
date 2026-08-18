# Spring keep vs strip inventory (Phase 2 freeze)

**Track:** `.decomposer/bugs/20260818-105244-spring-joint-impulse-starvation.md`  
**Status:** Normative for Phases 3–5. Do not edit without a new phase spec.

## Phase 1 evidence

On HEAD after Phase 1, the four new magnitude/settling tests (`StretchImpulseExceedsPositionCorrectionCap`, `StretchSettlesNearRestLength`, `CompressImpulseExceedsPositionCorrectionCap`, `CompressSettlesNearRestLength`) **fail** with **`vx == 0`** and unchanged center distance (stretch stays at 4 m, compress at 1 m)—not with a capped `|Δv| ≈ 0.2`. `PullsTogether`, `PushesApart`, and `Damping` fail the same way (pre-existing). `Creation` still **passes**. Root cause for isolated two-body spring islands: `World::_solveIslandVelocity` in `cpp/src/world/world-island.cpp` (~1788–1894) only walks joint batches (springs, hinges, gears) inside `if (islandHasOverlappingContact(island))`; the `!overlapping` branch runs contacts (none) and distance-joint Cdot only—**not** `SpringJoint::solveFast` / `solveFastSIMD`. Springs in contact-shared islands (e.g. motorcycle suspension) still enter the joint loop and are subject to global weakeners I2–I4.

## Classification legend

| Class | Meaning |
| :--- | :--- |
| **RESTORE-ISLAND** | Phase 3 must change `world-island.cpp` so isolated springs run velocity solve again. |
| **STRIP-GLOBAL** | Remove from every `frequencyHz > 0` path in Phase 3 (scalar) / Phase 4 (SIMD). Re-apply island-local in Phase 5 only if `MotorcycleIsland.*` goes red. |
| **KEEP** | Leave unless a later named phase proves otherwise. |
| **OUT** | Not this track. |

## Normative table (I1–I10)

| ID | Mechanism | Where | Class | Why |
| :--- | :--- | :--- | :--- | :--- |
| I1 | Joint velocity solve gated on `islandHasOverlappingContact` | `cpp/src/world/world-island.cpp` `_solveIslandVelocity` ~1788–1894: springs (and hinges/gears) only inside the overlapping-contact branch; `!overlapping` does contacts + distance Cdot only | **RESTORE-ISLAND** | Phase 1 `|Δv|=0`. Site springs that share a contact island still run and hit I2–I5. Isolated springs (Phase 1 recipe, some demos) never iterate. |
| I2 | `clampSoftSpringLambda` / `clampSoftSpringImpulse` / warm-start `impulse` clamp to `±MAX_POSITION_CORRECTION` | `cpp/src/solvers/spring-joint.cpp` `preSolve` L52–54, `solve`/`solveFast`, SIMD twins | **STRIP-GLOBAL** | Report: velocity impulse treated as position correction. Illegal on **every** soft spring. |
| I3 | `slipScale = 1/(1+\|Cdot\|·dt)` | `solve` / `solveFast` / `solveFastSIMD` (applied even when `frequencyHz==0`) | **STRIP-GLOBAL** for `frequencyHz > 0`; **do not** change rigid `frequencyHz==0` unless required to keep SIMD `select(isSpring)` parity | Extra global weakener copied from motorcycle work. |
| I4 | `armSpin = \|ωB\|` scale on **bias** and **λ** | `preSolve` L72–73, `solve`/`solveFast`, SIMD | **STRIP-GLOBAL** | Asymmetric (body B only); motorcycle-shaped. Do not keep globally. |
| I5 | Soft `solvePosition` early-return (`frequencyHz > 0`) | `SpringJoint::solvePosition` L423–426; island already special-cases springs + overlapping contacts | **KEEP** | Direct fight with wheel–terrain position solve. Report does not require revival. Phase 5 may isolate weakeners; it must not restore soft position correction as the first lever. |
| I6 | `maxBias = MAX_POSITION_CORRECTION / dt` clamp on **bias** (~12 m/s at 60 Hz) | `preSolve` L68–71 and SIMD | **KEEP** initially | Not in the report’s “do not keep” list. After I1–I4, first-step λ is still O(1) enough to beat `0.2` `|Δv|`. Revisit only if settle tests stay red after Phase 3/4. |
| I7 | Rigid `frequencyHz == 0` `solvePosition` + `MAX_POSITION_CORRECTION` | same file | **KEEP** | Not a soft-spring starve. |
| I8 | Gear `slipScale` / `clampGearLambda` | `gear-joint.cpp` | **OUT** unless Phase 5 motorcycle green requires it | Report out of scope. |
| I9 | `MAX_POSITION_CORRECTION` `#define` | `constants.h` | **KEEP** the value | Shared with contacts/hinges. Tests cite it; do not retune. |
| I10 | `MotorcycleIsland.*` / `JointSimdParity.*Spring*` | test TUs | **KEEP** as gates | Phase 4/5. Do not retarget in inventory phase. |

## Phase handoff (do not implement in Phase 2)

- **Phase 3** implements **I1** (`world-island.cpp`: isolated springs run `solveFast` / scalar joint batches again) **and I2–I4** (strip in scalar `preSolve` / `solve` / `solveFast`).
- **Phase 4** mirrors I2–I4 in SIMD twins (`preSolveSIMD`, `solveFastSIMD`).
- **Phase 5** re-applies I2–I4 **only** on `islandHasOverlappingContact` islands if `MotorcycleIsland.*` goes red after Phase 3+4—not on spring-endpoint fixture overlap.
- **I5** and **I6** stay unless motorcycle/settle evidence forces revisit.

**Motorcycle gate note:** The bike spring is chassis↔swingarm; wheel↔terrain contact is elsewhere. They share an island via hinges. Phase 5, if needed, uses `islandHasOverlappingContact` (already computed per island), not overlap on the spring anchor bodies.
