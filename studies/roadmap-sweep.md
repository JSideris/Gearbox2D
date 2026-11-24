# Gearbox2D roadmap sweep

The sweep covered public API behavior, collision reports, stability regressions, and browser step cost. Measurements below refer to the configurations in the linked tests and reports.

## Public API and CI

- **#5 · Spatial queries after a teleport.** Writing a body’s position or rotation now refreshes its spatial bounds immediately. A query between the write and the next step sees the moved fixtures. [Evidence](https://github.com/JSideris/Gearbox2D/commit/d1b16c45ccb6ce4622ee84e30c3293fa6a9113dc)
- **#10 · WASM in pull-request CI.** CI builds the WASM modules and TypeScript wrapper, then runs integration and navigation parity tests against those artifacts. [Evidence](https://github.com/JSideris/Gearbox2D/commit/de9bbd62e6c6ee7a53b3a54ca89e0a65316ded32)
- **#11 · Live spring edits.** New regression coverage exercises rest length, frequency and damping on loaded springs through the public WASM API. The existing solver handled the edits. [Evidence](https://github.com/JSideris/Gearbox2D/commit/24a3e929690f7348d823edaed57115ed9f923846)
- **#12 · Runtime mass.** JavaScript and native bodies now share mass-override semantics. A positive override survives fixture density edits while inertia is recalculated. Clearing the override restores density-derived mass. [Evidence](https://github.com/JSideris/Gearbox2D/commit/54a05098bff6ac6a61fa397f94ede6315012083f)

## Collision reports verified with the existing engine

- **#13 · Bullet through paper.** At 60 Hz, a 0.1 m radius circle launched at 50 m/s stayed on the approach side of a 0.05 m wall. The existing thin-wall regression and six related tunneling tests passed. The tested case needed no code change. [Evidence](https://github.com/JSideris/Gearbox2D/issues/13#issuecomment-7131200048)
- **#14 · High-energy bounce.** The historical benchmark launched the circle above the engine speed cap, with nominal travel of 33.33 units per step in a 10-unit chamber. Escape triggered a score of zero even though the circle still had velocity. The corrected setup rebounded 3,273 times in 600 simulated seconds without escape. Isolated elastic impacts reversed speeds of 40 and 80 units/s to within 0.0001 units/s. Verification required no further change. [Evidence](https://github.com/JSideris/Gearbox2D/issues/14#issuecomment-7131264813)

## Stability measurements added to regression coverage

- **#15 · Incline drift.** An awake box with high friction moved 0.932 mm in four seconds on a 20° incline. With lower or zero friction, the two sliding distances were within 0.43% of their Coulomb predictions. [Evidence](https://github.com/JSideris/Gearbox2D/commit/d2a249ec876f976a7aa93b1a5816026e80c3bd18)
- **#16 · Settled piles.** With bodies held awake, peak penetration over seconds 5–10 was 7.513 mm in the four-row pyramid and 2.832 mm in the loaded roller pile. Both had less than 0.001 mm of center displacement over that window. [Evidence](https://github.com/JSideris/Gearbox2D/commit/3f33bd6b60defa944411a598783bf0bd8bc67339)
- **#17 · Sleep and wake.** The TC-9 box slept on step 61 and stayed asleep through the five-second baseline. Lifting it 0.25 m produced one immediate wake. The observed resting jitter did not produce repeated wakes in this case. [Evidence](https://github.com/JSideris/Gearbox2D/commit/9d3eba59dbe1eeb89b43c2f5cf4f86f76437bbec)

## Reproduced failures and fixes

- **#18 · 20-link chain.** The solver now constrains both velocity components at coincident distance-joint anchors. In the perturbed hanging chain, peak anchor separation over seconds 30–60 fell from 150.94 to 8.33 mm. [Evidence](https://github.com/JSideris/Gearbox2D/commit/0b6f5a28e497190695fab982d2cbbc267f1d065f)
- **#19 · Driven chain belt.** Contact prediction now includes rotation in closing speed for circle–box and circle–capsule pairs. The showcase also fits the belt under tension and matches the initial pulley speed. Over 3,600 steps, peak overlap fell from 120.75 to 19.67 mm. [Evidence](https://github.com/JSideris/Gearbox2D/commit/21620544bdf9a81112386eb7fd9addc2bf72192e)
- **#20 · Motorcycle.** Calibrating the showcase drive torque and directional speed limits reduced peak rear-wheel penetration from 0.7480 to 0.0122 m on terrain seed 1. Peak suspension compression fell from 0.1509 to 0.0377 m in the same throttle run. [Evidence](https://github.com/JSideris/Gearbox2D/commit/7a8da535efbeac5dcd6185b76054fcbd405270c0)

## Browser performance and next experiment

**#21 · Browser step timing.** Single-threaded WASM had lower median and p95 step times in all nine comparisons on one i9-9900KF running headless Chrome. The study used four workers and measured physics steps for mostly sleeping bodies, dense piles, and independent islands at 64, 256, and 1,024 dynamic bodies. For 512 two-body islands, four workers completed 1,024 tasks per step. Median step time rose from 1.370 to 1.590 ms. [Report, samples and harness](browser-step/README.md)

**#27 · Open experiment.** Measure enqueue, wait, and solve time separately, then repeat the matrix with small islands batched into fewer tasks. The baseline establishes a cost gap on the measured machine. The effect of batching remains unmeasured. [Experiment scope](https://github.com/JSideris/Gearbox2D/issues/27)

## Subsequent sleeping-impact reports

Issues #23–#25 are closed. In the cradle, an incoming contact lost its impulse on the receiver’s wake step. After the fix, peak first-impact overlap fell from 34.56% to 2.62% of ball diameter, matching the awake control. The slab follow-up restored contact support in waking stacks and under heavy loads, with regressions for impact transmission and compression. These cases exercise incoming impacts on sleeping bodies beyond the resting scenes in #16 and #17. [Cradle measurements](https://github.com/JSideris/Gearbox2D/issues/24#issuecomment-7133359220) · [Slab fix and tests](https://github.com/JSideris/Gearbox2D/commit/b04202c4e3578fede917d2ba4b206885914bf7ac)
