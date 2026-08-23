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

**Open (Phase 2+):** ~~timing / analytic cost evidence for the “Low-Cost” title claim~~ **done** — Dataset D captured (Phase 2), typeset in `tab:dataset-d` (Phase 3), claims guarded (Phase 4). Historical freeze text retained above.

**Phase 2 captured (2026-08-21):** `data/timing/timing-summary-{krb,nokrb}.csv` and `log-timing.cpp` recapture in `data/README.md` § Dataset D. Phase 3 typesets the cost subsection/table in `krb.tex` / SoT.

**Phase 3 typeset (2026-08-21):** Dataset D subsection and `tab:dataset-d` in `krb.tex`; mirrored in `KRB_Whitepaper.md` §6.3; supplemental index lists `data/timing/` and `log-timing.cpp`.

**Phase 4 claim guard (2026-08-21):** Evaluation 600 s protocol scoped to Datasets A–C; Conclusion and SoT §8 state contacts and distance joints; TeX Evaluation lead-in aligned to four datasets.

## Harness hygiene verification (`KRB_JCGT_HARNESS_HYGIENE`)

Iterate run `20260821-a3c54c` attempt 1, Phase 5 (2026-08-21). Full harness command from `.decomposer/iterate/20260821-a3c54c/harness.json` executed verbatim (not shortened).

**Step return codes:** `pdflatex`×3 = 0, `bibtex` = 0, `make test -B` = 2, `EnergyHarness.*` filter = 0, full `build_returncode` = 1.

**Guards:** `latex_error_count` = 0 (`krb.pdf`, 11 pp). `build_returncode` = 1 — expected red from unrelated gtest suites; harness goal not retargeted.

**Primaries (all 0):** `sot_tex_evaluation_mismatch_count` (TeX vs SoT: Four datasets; For Datasets A–C; contacts and distance joints; `tab:dataset-d` cells). `table_csv_terminal_mismatch_count` (floor bounce on `0.999` ↔ CSV `0.999228`; off `6.53` ↔ `6.53393`; cradle on `1.07` ↔ `1.06755`; Dataset B Box2D `6.61` ↔ `6.60555`; Dataset D means/ranges match timing CSVs). `supplemental_dangling_path_count` (all Index paths present, including `data/timing/timing-summary-{krb,nokrb}.csv` and `log-timing.cpp`). `bib_entry_undiscussed_count` (four `krb.bib` keys cited and discussed).

**Two-sided target:** `dataset_a_floor_bounce_krb_e600s` = **0.999**; CSV terminal `0.999228` — no clamp, no solver retune.

**`make test -B` failures (documented, not fixed):** `DistanceJointTest.DistanceIsMaintained`, `DistanceJointTest.ReactionForce`, `MotorcycleIsland.ThrottleDoesNotProgressivelySink`, `MotorcycleIsland.CauseIsolationRanking`.

**Side-checks:** `EnergyHarness.NewtonsCradleBenchmark` PASS (also passed inside `make test` before the four-suite abort). `DatasetDCost.*` (4/4) PASS — BENCH_FLAGS, gitignore, timing CSV schema, README `-O3` note.

**Hygiene:** `logTiming` / `logTiming-nokrb` not in git index; `.gitignore` entries present. No energy/timing CSV, `harness.json`, `cpp/src/`, Makefile, or `krb.bib` edits. Title remains **Low-Cost**; cradle ~7% plateau unchanged in Limitations.

## Reviewer-card pass (`KRB_JCGT_REVIEWER_CARD`)

Iterate run `20260822-c3b329` attempt 1 (2026-08-21). Compressed SoT §2 placement map, Component A/B derivations, extended `krb.bib`, Dataset B three-site fairness, and Limitations-only cradle-gap authority in `krb.tex` / SoT §3. Energy/cost numbers and harness command unchanged.

## Page budget heal (`KRB_JCGT_PAGE_BUDGET`)

Manuscript run `20260822-200dcc` / chat `2598bfd1` (2026-08-22). Closed hole `h-residual-length`.

- **Before:** 12 pp (at pack `max_pages` ceiling)
- **After:** 11 pp (`krb.log`: `Output written on krb.pdf (11 pages, …)`)
- Index compressed to seven grouped items; `KRB_Whitepaper.md` demoted to number mirror (not SoT)
- Author affiliation aligned to envelope `Gear3Games`; contact + ISC license merged
- Figures `0.80\columnwidth`; listings `\footnotesize`; Evaluation deduped
- Energy/cost table numbers, harness command, and `cpp/` unchanged

## Evaluation horizon (`KRB_JCGT_EVAL_HORIZON`)

Manuscript run `20260823-2c8d77` / chat `74a43cdb` (2026-08-22). Closed hole `h-eval-ac-horizon`.

- **Before:** Evaluation lead-in scoped 600 s protocol to Datasets A–C (Phase 4 claim guard).
- **After:** Energy protocol is A–B at 600 s; Dataset C at 8 h ($t = 28800\,\mathrm{s}$); Dataset D remains wall-time only.
- Frozen table cells, CSV terminals, C07 windowed drift ($1.009 \to 0.977$), and Limitations cradle band unchanged.

## Hole close (`KRB_JCGT_HOLE_CLOSE`)

Manuscript run `20260823-2c8d77` / chat `8eb79bc3` (2026-08-22). Path-only close of remaining cycle-1/2 minor holes.

- **`h-eval-ac-horizon`:** verified kept (`KRB_JCGT_EVAL_HORIZON`); opener names A–B 600 s and C 8 h before figures.
- **`h-no-component-ablation`:** Evaluation states Components A/B are analytic; empirical switch is full KRB on/off only.
- **`h-eval-protocol-narrow`:** C01–C07 scoped to $e=1$, zero friction/damping, sleep off; Limitations clause added.
- **`h-window-protocol-mixed`:** protocol paragraph names instantaneous / 60 s / 600 s-on-8h / README hourly conventions.
- **`h-c07-not-tabulated`:** `tab:protocol` cells freeze C07 $1.009 \to 0.977$ and C06 band.
- **`h-qualitative-unfigured`:** resting-chain and cradle-transfer qualitative lines removed from Evaluation.
- **`h-measurement-surface-split`:** `tab:protocol` discloses native `log-energy`, WASM benchmarks, and native `g++` timing.
- **`h-length-density`:** honest 11 pp vs typical ~4 pp clause; within `max_pages` 12.

Frozen A/B/D table cells, CSV bytes, `cpp/`, `harness.json`, and `krb.bib` unchanged. Rebuild: `krb.pdf` 11 pp (`krb.log`).

## Artifact snapshot (`KRB_JCGT_ARTIFACT_SNAPSHOT`)

Manuscript run `20260823-2c8d77` / Phase 1 restore buildable paper tree (2026-08-22). Closes hole `h-artifact-snapshot`.

- **Pre-check:** `figures/fig-energy-{ablation,engines}.pdf`, `jcgt/krb.pdf`, and `jcgt/CC-BY-ND.png` were already present and tracked in git; `pdflatex`+`bibtex` loop succeeds with both energy PDFs and `CC-BY-ND.png` resolved.
- **Figures:** Regenerated from committed CSVs via `plot-energy-ablation.py` and `plot-energy-engines.py` (matplotlib via `.decomposer/sandbox/krb-plot-venv`; system `python3` lacks matplotlib).
- **Build:** `pdflatex`+`bibtex` loop → `krb.pdf` 11 pp, 327165 bytes; `latex_error_count` 0 (overfull hboxes only).
- **Not closed here:** `h-length-density`, `h-c07-under-narrated`, `h-no-ab-only-ablation`. Frozen numerics and `krb.tex` wording unchanged.

## Length cut (`KRB_JCGT_LENGTH_CUT`)

Manuscript run `20260823-2c8d77` / Phase 2 cut length before adding prose (2026-08-22). Partially addresses hole `h-length-density`; hedge close overridden.

- **Before:** 11 pp (`krb.log` at HEAD `2593422`: 327165 bytes)
- **After:** 10 pp (`krb.log`: 317119 bytes); `latex_error_count` 0
- **Cuts:** Evaluation table/figure restatement removed (L231–233, L265–267); L269 11-vs-4 hedge removed; Dataset D prose folded into `tab:dataset-d` caption; joint listing float replaced with body sketch (contact listing inlined, `float=false`); intro placement map tightened; Limitations/Conclusion/index compressed
- **Frozen:** all table cells (A/B/D/protocol), both `\includegraphics`, Method equations, contact listing semantics (speculative $\Delta h=0$, joint sqrt cap, `-forceVn` fold)
- **Residual:** 10 pp vs JCGT typical ~4 pp (`pack.json` `typical_pages: 4`); desk-reject length risk remains; preferred ≤8 not met — room for Phase 3 C07 Limitations sentence (~2 pp headroom under `max_pages` 12)
- **Still open:** `h-c07-under-narrated`, `h-no-ab-only-ablation`; `h-length-density` partially closed (pages dropped, not ≤8)
