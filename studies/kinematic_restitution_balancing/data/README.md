# Dataset A — KRB compile-time ablation

Headless traces from `../log-energy.cpp`. Same scenes, same \(dt = 1/60\), \(e = 1\), no damping, sleep off. `krb` is the default binary; `nokrb` is `-DGEARBOX_DISABLE_KRB`.

```bash
make log-energy
./logEnergy --out studies/kinematic_restitution_balancing/data --seconds 600
make log-energy GEARBOX_DISABLE_KRB=1
./logEnergy-nokrb --out studies/kinematic_restitution_balancing/data --seconds 600
python3 plot-energy-ablation.py
```

Columns: `t_s,ke,pe,e_total,e_over_e0,peak_height`. A `# escaped_at_step=` trailer means the body left the enclosure and the series stops.

# Dataset B — stock engines vs Gearbox+KRB

Floor bounce and Newton's cradle, same \(E/E_0\) as Dataset A, from `site/benchmarks.html` (All Engines). Whole-engine traces, not an ablation. The high-pressure enclosure was collected but omitted from Figure 2: Matter/p2 stop bouncing, Box2D enters a two-value limit cycle, so it is not a conservation comparison.

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

Columns match Dataset A. Sampled every \(10\,\mathrm{s}\) of simulation time. KRB on only.

Results (2026-08-21, `./logEnergy`, ~14 min wall for the cradle, ~8 min for the circle):

- **Cradle:** the \(\sim 7\%\) step at \(t \approx 240\)–\(300\,\mathrm{s}\) is the only step in \(8\,\mathrm{h}\). After that, \(E/E_0 \in [1.034, 1.093]\) (mean \(1.053\)); last-hour mean \(1.053\). End \(E/E_0 = 1.067\).
- **Bounce circle:** stayed in the box. Instantaneous samples alias \(0.66\)–\(1.33\). Hourly windowed means go \(0.999 \to 0.982\) (about \(1.7\%\) loss over \(8\,\mathrm{h}\)).

# Recapture Dataset B

1. Serve the site (`npm start`) with the default WASM build (KRB on).
2. Open Benchmarks, select **All Engines**.
3. Set **Capture** to `600 s` and enable **Fast-forward**.
4. Run **Floor Bounce** and **Newton's Cradle**. Wait until the status says capture complete.
5. Click **Export** and replace the files above.
