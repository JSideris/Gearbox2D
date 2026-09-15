# KRB supplemental materials

ISC-licensed listings, energy CSVs, timing traces, and figure scripts for
*Kinematic Restitution Balancing* (JCGT). Paths below are relative to this
archive root (`krb-supplement.zip`).

## Layout

```
listings/contact-presolve.cpp
listings/distance-joint-presolve.cpp
listings/integrate-force-velocity.cpp
data/dataset-a/          # 600 s KRB on/off ablation
data/dataset-b/          # 600 s four-engine traces (translational meter)
data/dataset-c/          # 8 h KRB-on continuation
data/timing/             # native g++ on/off wall-time
plots/                   # redraw scripts for all figures
figures/                 # PDF originals: teaser (in paper) + Dataset B/C (supplement-only)
```

Listings match the paper recipes (Listings 1--2 and the integrate store), not
the full Gearbox2D SIMD sources.

Dataset B is a translational whole-engine meter (not an in-engine KRB ablation);
Gearbox2D rows are native offline recapture, Box2D-WASM / p2.js / Matter.js
remain unmodified WASM traces.

## Redraw figures

Needs Python 3 with matplotlib. From this directory:

```bash
python3 plots/plot-energy-ablation.py   # Figure 1 (paper teaser)
python3 plots/plot-energy-engines.py    # Dataset B multi-engine (supplement-only)
python3 plots/plot-energy-dataset-c.py  # Dataset C 8 h continuation (supplement-only)
```

Writes `figures/fig-energy-ablation.{pdf,png}` (paper Figure 1 teaser),
`figures/fig-energy-engines.{pdf,png}` (Dataset B, supplement-only), and
`figures/fig-energy-dataset-c.{pdf,png}` (Dataset C, supplement-only).

## Recapture (optional)

Energy and timing numbers in the paper were produced with Gearbox2D. Clone
<https://github.com/JSideris/Gearbox2D> and check out the evaluation tag
`krb-jcgt-1`:

```bash
git checkout krb-jcgt-1
make log-energy
./logEnergy --out studies/kinematic_restitution_balancing/data --seconds 600
make log-energy GEARBOX_DISABLE_KRB=1
./logEnergy-nokrb --out studies/kinematic_restitution_balancing/data --seconds 600

./logEnergy --out studies/kinematic_restitution_balancing/data \
	--scene floor-bounce,cradle --seconds 600 --format b

make log-timing
./logTiming --out studies/kinematic_restitution_balancing/data/timing \
	--scene paper+dense --repeats 3
```

See `studies/kinematic_restitution_balancing/data/README.md` in the engine
repository for Dataset C (8 h) and the Dataset B merge of website engine
exports.
