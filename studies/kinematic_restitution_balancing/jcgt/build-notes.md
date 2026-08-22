# Building `krb.tex`

Official JCGT class and bibliography style vendored from [jcgt.org/write.html](https://jcgt.org/write.html) (LaTeX template updated 2025-08-06; `jcgt-template.zip`).

## Prerequisites

`pdflatex` and `bibtex` (TeX Live).

`CC-BY-ND.png` ships with the official JCGT template and is required by `\afterdoc` in `jcgt.cls` (article CC BY-ND 4.0 badge).

## Build (Phase 1 scaffold — no bibliography yet)

```bash
cd studies/kinematic_restitution_balancing/jcgt
pdflatex -interaction=nonstopmode krb.tex
pdflatex -interaction=nonstopmode krb.tex
```

## Build (once `\bibliographystyle{jcgt}` and `\bibliography{krb}` are added)

```bash
cd studies/kinematic_restitution_balancing/jcgt
pdflatex -interaction=nonstopmode krb.tex
bibtex krb
pdflatex -interaction=nonstopmode krb.tex
pdflatex -interaction=nonstopmode krb.tex
```

Output: `krb.pdf`.

Phase 2 onward uses the **bibtex loop** above as the default build.

## Figures

From `studies/kinematic_restitution_balancing/` (matplotlib required):

```bash
python3 plot-energy-ablation.py
python3 plot-energy-engines.py
```

Writes `figures/fig-energy-ablation.{pdf,png}` and `figures/fig-energy-engines.{pdf,png}`. `krb.tex` includes the PDFs via `../figures/`.

## Artifacts

Do not commit `.aux`, `.log`, `.bbl`, `.blg`, or `.out` unless the template requires a checked-in `.bbl`.

## Measurement surface freeze (`KRB_JCGT_MEASUREMENT_SURFACE`)

Iterate run `20260821-a3c54c` attempt 1, Phase 1 (2026-08-21). Hybrid gates from `.decomposer/iterate/20260821-a3c54c/harness.json` — do not retarget scores or command.

**Guards (minimize to 0):** `build_returncode`, `latex_error_count`

**Primaries (minimize to 0):** `sot_tex_evaluation_mismatch_count`, `table_csv_terminal_mismatch_count`, `supplemental_dangling_path_count`, `bib_entry_undiscussed_count`

**Two-sided target:** `dataset_a_floor_bounce_krb_e600s` → **0.999** (`epsilon` 0; CSV terminal `0.999228` at `t=600` in `data/floor-bounce-krb.csv` rounds to table `0.999` — do not clamp to `1.000`)

**Frozen evaluation triples (TeX = SoT = committed CSV at table precision):**

| Scene | KRB | `E/E_0` @ 600 s | Notes |
| :--- | :--- | ---: | :--- |
| Floor bounce | on | 0.999 | windowed mean 1.000 |
| Floor bounce | off | 6.53 | CSV `6.53393` |
| Newton's cradle | on | 1.07 | 1.05 after t=300; CSV `1.06755` |
| Dataset B floor | Gearbox2D | 0.999 | whole-engine, not in-engine ablation |
| Dataset B floor | Box2D-WASM | 6.61 | |
| Dataset C cradle | on | [1.034, 1.093] | mean 1.053 |
| Dataset C enclosure | on | 1.009 → 0.977 | 600 s windowed drift |

**Verification (2026-08-21):** `pdflatex`+`bibtex` loop → `krb.pdf` (10 pp, no LaTeX errors). All Index of Supplemental Materials paths present. Four `krb.bib` keys cited and discussed. `EnergyHarness.NewtonsCradleBenchmark` passes. Full harness command also runs `make test -B`, which currently fails on four unrelated suites (`DistanceJointTest` ×2, `MotorcycleIsland` ×2); do not drop that step from the harness recipe.

**Open (Phase 2+):** timing / analytic cost evidence for the “Low-Cost” title claim. No timing table, SoT edit, or KRB retune in this freeze.

**Phase 2 captured (2026-08-21):** `data/timing/timing-summary-{krb,nokrb}.csv` and `log-timing.cpp` recapture in `data/README.md` § Dataset D. Phase 3 typesets the cost subsection/table in `krb.tex` / SoT.
