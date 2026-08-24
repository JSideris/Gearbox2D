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
data/dataset-b/          # 600 s four-engine traces
data/dataset-c/          # 8 h KRB-on continuation
data/timing/             # native g++ on/off wall-time
plots/                   # redraw Figures 1--3
figures/                 # PDF originals shipped with the article
```

Listings match the paper recipes (Listings 1--2 and the integrate store), not
the full Gearbox2D SIMD sources.

## Redraw figures

Needs Python 3 with matplotlib. From this directory:

```bash
python3 plots/plot-energy-ablation.py
python3 plots/plot-energy-engines.py
python3 plots/plot-energy-dataset-c.py
```

Writes `figures/fig-energy-ablation.{pdf,png}`,
`figures/fig-energy-engines.{pdf,png}`, and
`figures/fig-energy-dataset-c.{pdf,png}`.

## Recapture (optional)

Energy and timing numbers in the paper were produced with Gearbox2D. After the
evaluation tag `krb-jcgt-1` is published, clone
<https://github.com/JSideris/Gearbox2D> and check out that tag. Until then,
use the repository default branch.

```bash
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
