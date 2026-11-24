# Browser step timing, issue #21

Single-threaded WASM had lower median and p95 step times in every measured scene at 64, 256 and 1,024 dynamic bodies. At 1,024 bodies, the dense pile came closest to breaking even. Four workers raised its median from 3.515 to 3.800 ms and its p95 from 3.700 to 4.410 ms.

## Measurements

Times are milliseconds per physics step. Candidates, tree leaf reinsertions and completed MT worker tasks are means per step from a separate diagnostic replay. Candidate and reinsertion counts matched between builds in all nine comparisons. ST completed zero worker tasks.

| Scene | Dynamic bodies | ST median | ST p95 | MT median | MT p95 | Candidates | Reinsertions | MT tasks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| sleeping | 64 | 0.015 | 0.020 | 0.035 | 0.050 | 0.0 | 0.11 | 8.0 |
| sleeping | 256 | 0.040 | 0.055 | 0.065 | 0.085 | 0.0 | 0.44 | 32.0 |
| sleeping | 1024 | 0.165 | 0.225 | 0.225 | 0.295 | 0.0 | 1.78 | 128.0 |
| pile | 64 | 0.140 | 0.185 | 0.170 | 0.235 | 164.7 | 5.02 | 18.9 |
| pile | 256 | 0.635 | 0.700 | 0.760 | 0.825 | 852.7 | 24.91 | 49.2 |
| pile | 1024 | 3.515 | 3.700 | 3.800 | 4.410 | 4694.0 | 116.34 | 102.8 |
| islands | 64 | 0.080 | 0.115 | 0.100 | 0.140 | 0.0 | 7.47 | 64.0 |
| islands | 256 | 0.325 | 0.515 | 0.430 | 0.690 | 0.0 | 29.87 | 256.0 |
| islands | 1024 | 1.370 | 2.310 | 1.590 | 2.505 | 0.0 | 119.47 | 1024.0 |

## Interpretation

Prioritize a measured prototype that batches small independent islands into a few worker tasks for each velocity and position pass. With 1,024 bodies in 512 independent two-body islands, MT finished 1,024 tasks per step with zero broad-phase candidates. Its median was 0.220 ms slower than ST. The mostly sleeping scene also had zero candidates, yet dispatched two tasks per awake body. Measure enqueue, wait and solve time separately and repeat the matrix with batching before adopting a dispatch policy.

The dense pile produced about 4,694 candidate pairs and 116 leaf reinsertions per step at 1,024 bodies. Those counts alone cannot assign the time gap to tree traversal, pair sorting, parallel narrow phase, serial merge or island solving. Time those phases before choosing a broad-phase rewrite or a crossover threshold. Larger islands with more work per task, other browsers and other worker counts could yield a different crossover.

## Method

- Engine baseline `7a8da535efbeac5dcd6185b76054fcbd405270c0`. Ubuntu 24.04.5 x86-64, Intel Core i9-9900KF (8 cores, 16 hardware threads), 46 GiB RAM visible, headless Google Chrome 157.0.8103.78, Emscripten 5.0.1. Chrome reported 16 logical CPUs. This was a shared desktop with normal OS scheduling.
- Directly imported the separately built ST and MT ES modules on an isolated loopback origin. Verified the live WASM heap was private for ST and shared for MT. Observed zero and four worker creations respectively. Diagnostic counters inside the worker completion path checked that workers executed physics tasks. A negative control serving ST at the MT URL failed the pool-size check.
- One fresh world per repeat, deterministic LCG seed 210021, 1/60 s timestep, default eight velocity and three position iterations, one substep. Sleeping scene: 15/16 stationary sleeping discs and 1/16 moving awake discs in zero gravity. Pile: gravity-loaded square grid of awake unit AABBs on one additional fixed floor. Islands: separated rotating pairs of awake discs joined by distance constraints in zero gravity. The harness checks dynamic sleep counts and finite positions before and after sampling.
- Four fresh-world repeats per mode and scene size, alternating ST/MT order. Each repeat warms up for 120 steps and measures the next 180 with `performance.now()` bracketing the Embind `World.step()` call. The table pools 720 observations per cell, using the median and nearest-rank p95. The CSV retains individual timings rounded to microseconds. Timer quantization matters for the smallest workloads. No rendering or application callbacks ran during the sample.
- Separate diagnostic ST and MT builds replayed the same 120 + 180 frames once per scene size, counting the final candidate list for the sole substep, successful `Bvh::updateLeaf` calls and finished thread-pool jobs. Module startup and world creation are outside every window. The timed release WASM binaries matched the existing dist binaries byte for byte.

## Reproduce from the repository root

Use the project Emscripten toolchain, Python 3.10+ and Google Chrome. The runner starts a temporary Chrome profile and a loopback HTTP server with COOP/COEP headers. Its JSON output contains timings in milliseconds for every repeat and the separate counter results.

```sh
make -B -j2 wasm BUILD_DIR=/tmp/gearbox21/release
make -B -j2 wasm BUILD_DIR=/tmp/gearbox21/diagnostic EMCC='em++ -DGEARBOX_BROWSER_BENCH'
python3 studies/browser-step/run.py /tmp/gearbox21 > /tmp/gearbox21-results.json
```
