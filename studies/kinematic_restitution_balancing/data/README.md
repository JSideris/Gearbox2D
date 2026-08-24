# Dataset A — KRB compile-time ablation

Headless traces from `../log-energy.cpp`. Same scenes, same \(dt = 1/60\), \(e = 1\), no damping, sleep off. Stock `World()` defaults: `velocity_iterations=8`, `position_iterations=3`; `constants.h`: `BAUMGARTE_FACTOR=0.2`, `MAX_POSITION_CORRECTION=0.2`, `PENETRATION_SLOP=0.016`, `RESTITUTION_THRESHOLD=0.01` (Listing 1 \(\Gamma\) uses that \(n,\beta\)). `krb` is the default binary; `nokrb` is `-DGEARBOX_DISABLE_KRB`.

```bash
make log-energy
./logEnergy --out studies/kinematic_restitution_balancing/data --seconds 600
make log-energy GEARBOX_DISABLE_KRB=1
./logEnergy-nokrb --out studies/kinematic_restitution_balancing/data --seconds 600
python3 plot-energy-ablation.py
```

Columns: `t_s,ke,pe,e_total,e_over_e0,peak_height`. A `# escaped_at_step=` trailer means the body left the enclosure and the series stops.

# Dataset B — stock engines vs Gearbox+KRB

Floor bounce and Newton's cradle. Gearbox2D rows are a native offline recapture (`logEnergy --format b`) on the same translational \(E/E_0\) meter as `site/benchmarks.html`. Box2D-WASM, p2.js, and Matter.js remain unmodified whole-engine WASM traces from the last All-Engines export. This is whole-engine context, not an in-engine KRB ablation. The high-pressure enclosure was collected but omitted from the engines figure: Matter/p2 stop bouncing, Box2D enters a two-value limit cycle, so it is not a conservation comparison.

```bash
python3 plot-energy-engines.py
```

Files in this folder:

```
dataset-b-floor-bounce-600s.csv
dataset-b-newtons-cradle-600s.csv
```

Columns: `engine,t_s,e_over_e0`. Chart \(x\) is simulation time (`step * 1/60`), sampled at 1 Hz.

# Dataset C — long-horizon Gearbox+KRB (8 h)

Headless KRB-on continuation of the cradle (the coupled case) and a contact-only enclosure check. Separate folder so Dataset A is not overwritten.

```bash
make log-energy
./logEnergy --out studies/kinematic_restitution_balancing/data/dataset-c \
	--scene cradle,bounce-circle --seconds 28800 --sample-every 600
```

Columns match Dataset A. Sampled every \(10\,\mathrm{s}\) of simulation time. KRB on only. Same `World()`/`constants.h` deploy knobs as Dataset A (see above).

Results (2026-08-23, `./logEnergy` at stock `World()` 8/3, ~14 min wall for the cradle, ~8 min for the circle):

- **Cradle:** the step from \(\sim 0.96\) to \(\sim 1.05\) at \(t \approx 240\)–\(360\,\mathrm{s}\) is the only step in \(8\,\mathrm{h}\). After \(t=360\,\mathrm{s}\), raw \(E/E_0 \in [1.031, 1.074]\) (mean \(1.052\)); last-hour mean \(1.052\). End \(E/E_0 = 1.063\).
- **Bounce circle:** stayed in the box. Instantaneous samples alias \(0.66\)–\(1.33\). Full \(600\,\mathrm{s}\) windows go \(1.006 \to 0.976\) (about \(3.1\%\) loss over \(8\,\mathrm{h}\)).

# Recapture Dataset B

Gearbox2D rows are recaptured offline (same scenes and translational \(E/E_0\) meter as `site/benchmarks.html`). Box2D / p2 / Matter rows stay from the last All-Engines export.

```bash
make log-energy
./logEnergy --out studies/kinematic_restitution_balancing/data \
	--scene floor-bounce,cradle --seconds 600 --format b
python3 studies/kinematic_restitution_balancing/merge-dataset-b-gearbox.py
python3 studies/kinematic_restitution_balancing/plot-energy-engines.py
```

To recapture the other engines, serve the site (`npm start`), open Benchmarks → All Engines, capture `600 s` with Fast-forward, Export, and replace the files above (then re-run the merge so Gearbox rows stay current).

# Dataset D — KRB cost / wall-time ablation (native)

Compile-time KRB on vs `-DGEARBOX_DISABLE_KRB` on the **same native `g++` binary** (`make log-timing` uses `BENCH_FLAGS`: `-O3 -march=native -mfma -pthread -DGEARBOX_MT`). This is **not** a Gearbox-vs-Box2D comparison (Dataset B is whole-engine energy, not CPU ablation). Product ships WASM; these numbers are a native ablation a reviewer can recapture.

```bash
make log-timing
./logTiming --out studies/kinematic_restitution_balancing/data/timing --scene paper+dense --repeats 3
make log-timing GEARBOX_DISABLE_KRB=1
./logTiming-nokrb --out studies/kinematic_restitution_balancing/data/timing --scene paper+dense --repeats 3
```

Outputs:

```
data/timing/timing-summary-krb.csv
data/timing/timing-summary-nokrb.csv
```

Columns: `scene,krb,repeat,mean_ms,p95_ms,notes`. `#` header records `dt`, warmup/timed step counts, and build note.

Scenes:

- `floor-bounce`, `bounce-circle`, `cradle` — same geometry as Dataset A (`log-energy.cpp`), `dt = 1/60`, `e = 1`, sleep off.
- `large-stack` — denser contact island (`not-dataset-a`); optional when paper scenes are inside timer jitter.

Protocol: 100 warmup `world.step()` calls, then 1000 timed steps; mean and p95 per repeat (default 3 repeats).

**Capture (2026-08-23, i9-9900KF, g++ 13.3.0, `BENCH_FLAGS`, 8/3):** the paper table typesets cradle + stack only. Floor bounce and the high-pressure enclosure remain in the CSVs and must not be quoted as overhead (enclosure KRB-off escapes; floor first-repeat is cold). Do not report a percent speedup from those Dataset A rows.

## Analytic KRB extra work (checkable vs listings)

Per dynamic body at integrate (`world-simd.cpp`): store `forceVelocity = a_ext * dt` (2 floats).

Per contact `preSolve` when KRB is on (`contact-constraint.cpp`): `forceVn` dot, `relativeVn`, optional `d_eff` + `pow` for \(\Gamma\), `workTerm`, one `sqrt`, bias update — **no extra PGS / velocity / position iterations**.

Per distance-joint `preSolve` (`distance-joint.cpp`): `forceVn`, `workTerm`, one `sqrt`, `-forceVn` folded into `bias` — **no extra iterations**.

Whole-step timing may include hinge Component A (engine-only); the paper recipe lists contacts and distance joints only.

**Zero extra solver passes.** KRB is a few scalars per constraint at `preSolve`, not a second position pass or coupled-island PE tax.
