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

## C07 Limitations taxonomy (`KRB_JCGT_C07_LIMITATIONS`)

Manuscript run `20260823-2c8d77` / Phase 3 put C07 in Limitations taxonomy (2026-08-22). Closes hole `h-c07-under-narrated`.

- **Before:** Limitations on HEAD `05888fe` taxonomized C06 cradle band and Fig. 1b KRB-off escape; `1.009 \to 0.977` appeared only in `tab:protocol`, not `sec:limitations`.
- **After:** Limitations adds Dataset C KRB-on enclosure: in box for $8\,\mathrm{h}$; $600\,\mathrm{s}$ windowed $E/E_0$ $1.009 \to 0.977$ (slow loss, not KRB-off SI gain of Fig. 1b). C06 cradle paragraph unchanged. Not README hourly $0.999 \to 0.982$. Rebuild: `krb.pdf` 10 pp, 317458 bytes; `latex_error_count` 0.
- **Frozen:** all table cells, C01–C09 claim text, both energy figures, no Dataset C figure.
- **Still open:** `h-no-ab-only-ablation`; `h-length-density` residual vs typical ~4 pp unchanged.

## A/B-only claim narrow (`KRB_JCGT_AB_ONLY_NARROW`)

Manuscript run `20260823-2c8d77` / Phase 4 narrow A/B-only hole in claim language (2026-08-22). Closes hole `h-no-ab-only-ablation`.

- **Before:** Evaluation L151 and Limitations L258 disclosed no A-only/B-only traces but did not name the deployer-diagnostic gap (HEAD `f88db09`).
- **After:** Evaluation names analytic A/B vs empirical full on/off only; C01--C03 do not isolate which leak each component closed. Limitations states published traces cannot attribute Dataset A or D residuals to A vs B; isolating the two leaks remains future work. C06/C07 Limitations unchanged.
- **No new experiments:** no A-only/B-only flags, traces, or table rows; C01--C09 claim text unchanged.
- **Rebuild:** `krb.pdf` 10 pp, 317819 bytes; `latex_error_count` 0.
- **Still open:** `h-length-density` residual vs typical ~4 pp unchanged.

## Session closeout (`KRB_JCGT_SESSION_CLOSEOUT`)

Manuscript run `20260823-2c8d77` / Phase 5 rebuild, SoT verify, and residual record (2026-08-22). Closes Phases 1–4 hole work; records `h-length-density` residual honestly.

- **HEAD:** `66486e0` (Phase 4 A/B-only narrow)
- **Rebuild:** `pdflatex`+`bibtex` loop → `krb.pdf` **10 pp**, 317819 bytes (no-op vs HEAD); `latex_error_count` 0 (overfull hboxes only). Both `fig-energy-{ablation,engines}.pdf` and `CC-BY-ND.png` resolved.
- **SoT verified (TeX authoritative):** A–B 600 s, C 8 h (`t = 28800`), D wall-time; Limitations C06 band `[1.034, 1.093]` mean `1.053`; C07 `600\,\mathrm{s}` windows `1.009 \to 0.977` (not README hourly); A/B analytic vs full on/off, cannot attribute Dataset A/D, future work; frozen table cells match CSV terminals at stated precision (`0.999`/`0.999228`, `6.53`/`6.53393`, `1.07`/`1.06755`, Box2D `6.61`/`6.60555`, `escaped_at_step=161`); supplemental index paths on disk; `KRB_Whitepaper.md` mirrors TeX (no contradiction fix required). `claims.json` C01–C09 unchanged.
- **Closed this session:** `h-artifact-snapshot` (Phase 1), `h-c07-under-narrated` (Phase 3), `h-no-ab-only-ablation` (Phase 4). No 11-vs-4 hedge restored in TeX.
- **Residual (human-owned / desk-reject risk):** `h-length-density` — **10 pp** vs pack `typical_pages: 4`; within `max_pages: 12`. Phase 2 partial close (11→10). Preferred ≤8 **not** met. **Not fully closed.** Recorded in `residuals.json`.
- **Out of session (documented, not fixed):** unrelated `make test` reds (`KRB_JCGT_HARNESS_HYGIENE`); no A-only/B-only experiments.

## Path heal (`KRB_JCGT_PATH_HEAL`)

Manuscript run `20260823-2c8d77` / cycle-4 path-only hole close (2026-08-22). HEAD `cdc35ed` (10 pp).

- **Before:** 10 pp (`krb.log` 317819 bytes); no `lst:joint`; no Dataset C figure; Low-Cost title; abstract “removes”; hinge note in Dataset D body only.
- **After:** 10 pp (`krb.log` 339136 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-distance-joint-listing` (`lst:joint` in body); `h-no-dataset-c-figure` (`fig-energy-dataset-c.pdf` from committed CSVs); `h-lowcost-title-scope` (title → per-constraint audit); `h-abstract-coupled` (audit/cancel + in-abstract coupled caveat); `h-hinge-footnote` (hinge in `tab:dataset-d` caption).
- **Partial:** `h-length-density` — still 10 pp vs typical ~4; length ack added in Limitations; preferred ≤8 not met; within `max_pages` 12.
- **Frozen:** all table cells, C01–C09 claim text, CSV bytes; no `cpp/` / harness / bib edits.
- **New artifacts:** `plot-energy-dataset-c.py`, `figures/fig-energy-dataset-c.{pdf,png}`.

## Cycle-1 scope close (`KRB_JCGT_CYCLE1_SCOPE`)

Manuscript run `20260823-26fb84` / cycle-1 path-only hole close (2026-08-23). HEAD `8376c50` (10 pp).

- **Before:** 10 pp (`krb.log` 339136 bytes); energy protocol omitted `World()`/`constants.h` deploy knobs; Index paper-root only (no `distance-joint.cpp`); no explicit symplectic-Euler / non-causal Dataset B / venue regime blocks.
- **After:** 10 pp (`krb.log` 339291 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-deploy-params` (Evaluation L161: `velocity_iterations=50`, `position_iterations` $n=10$, $\beta=0.2$, caps/slop/threshold for Datasets A/C); `h-supp-ptr` (Index: repo-root paths + `cpp/src/solvers/distance-joint.cpp`, `contact-constraint.cpp`); `h-integrator-scope` (Limitations regime: symplectic Euler only, no non-symplectic eval); `h-dataset-b` (`tab:dataset-b` caption + Limitations: placement not causal); `h-venue-regime` (Limitations **Evaluation regime** block: in/out/failure scope).
- **Residual:** `h-length-typical` — still **10 pp** vs pack `typical_pages: 4`; within `max_pages` 12; page count did not increase; preferred ≤8 not met. **Not fully closed.**
- **Out of session:** `h-empirical-ab` (no A-only/B-only traces).
- **Frozen:** all table cells, C01–C07 claim meaning, CSV data rows, `cpp/`, `krb.bib`, listings, figures; no energy recapture.
- **Mirrors:** `KRB_Whitepaper.md` §6–7; `data/README.md` Dataset A/C deploy knobs.

## Cycle-3 path close (`KRB_JCGT_CYCLE3_PATH`)

Manuscript run `20260823-26fb84` / cycle-3 path-only hole close (2026-08-23). HEAD `f9d9b79` (10 pp).

- **Before:** 10 pp (`krb.log` 339291 bytes); Index preamble repo-root with mixed bases (bare `krb.bib`); `claims.json` M02–M06 evidence on Dataset A on/off CSVs.
- **After:** 10 pp (`krb.log` 339320 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-supp-ptr` — Index preamble paper-root + repo-root `cpp/...`; item 1 `jcgt/krb.tex`, `jcgt/krb.bib`, `jcgt/build-notes.md`; all listed paths resolve on disk.
- **Partial:** `h-empirical-ab` — M02–M06 `claims.json` evidence retargeted to `jcgt/krb.tex` + `contact-constraint.cpp` / `distance-joint.cpp`; TeX full on/off only unchanged; no A-only/B-only traces.
- **Residual:** `h-length-typical` — still **10 pp** vs pack `typical_pages: 4`; within `max_pages` 12; page count did not increase. **Not fully closed.**
- **Frozen:** all table cells, C01–C07 claim meaning, CSV data rows, `cpp/`, `krb.bib`, listings, figures; no energy recapture.

## Cycle-4 path close (`KRB_JCGT_CYCLE4_PATH`)

Manuscript run `20260823-26fb84` / cycle-4 path-only hole close (2026-08-23). HEAD `d362d08` (10 pp).

- **Before:** 10 pp (`krb.log` 339320 bytes); `eq:deff` slop-free vs `lst:contact`; no integrate-store paragraph in Implementation; C05 cradle meter split not interpreted in Limitations.
- **After:** 10 pp (`krb.log` 348694 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-slop-omission` — `eq:deff` uses $(d-s)-v_{\mathrm{launch}}\Delta t$; M04 narrowed in `claims.json`; whitepaper §3.3 mirrored.
- **Closed:** `h-integrate-hook` — `\paragraph{Integrate store}` before `lst:contact`; supplemental `cpp/src/world/world-simd.cpp`; pre-damping / sleep / infinite-mass caveats.
- **Closed:** `h-energy-metric-split` — Limitations Evaluation regime: Dataset A/C cradle includes rotational $E_k$; Dataset B cradle translational only; $1.07$ vs $1.062$ not equated.
- **Residual:** `h-length-typical` — still **10 pp** vs pack `typical_pages: 4`; within `max_pages` 12; page count did not increase. **Not fully closed.**
- **Frozen:** all table cells, C01–C07 claim meaning, CSV data rows, `cpp/`, `krb.bib`, listings, figures; no energy recapture.

## Cycle-5 path close (`KRB_JCGT_CYCLE5_PATH`)

Manuscript run `20260823-26fb84` / cycle-5 path-only hole close (2026-08-23). HEAD `6f65b6a` (10 pp).

- **Before:** 10 pp (`krb.log` 348694 bytes); abstract "cancels" two leaks; intro "To our knowledge"; no portability merge sentence; Dataset D caption without WASM / same-load cost hedge; Conclusion overclaims cradle compensation; C01–C07 regime not named explicitly; `claims.json` M02–M06 on Dataset A CSVs.
- **After:** 10 pp (`krb.log` 350004 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-prior-art-sentence` — intro Bender-as-map, no "To our knowledge"; whitepaper §2.6 mirrored.
- **Closed:** `h-regime-singularity` — Limitations: C01–C07 this regime only; whitepaper §7 mirrored.
- **Closed:** `h-cradle-tone` — Conclusion: C06 bounded offset after early step, not full cradle compensation; abstract narrowed.
- **Closed:** `h-c07-meter` — Conclusion: KRB-on not perfect meter; C07 slow loss not Dataset A KRB-off gain.
- **Closed:** `h-portability` — Implementation merge-listings sentence after Integrate store.
- **Closed:** `h-timing-wasm` — Dataset D caption: product WASM, native `g++` recapture; high-pressure row kept with same-load cost footnote (not overhead claim); whitepaper §6.3 mirrored.
- **Partial:** `h-empirical-ab` — abstract narrowed; M02–M06 `claims.json` retargeted to `jcgt/krb.tex` + `contact-constraint.cpp` / `distance-joint.cpp`; M04 slop in claim text; no A-only/B-only traces.
- **Residual:** `h-length-typical` — still **10 pp** vs pack `typical_pages: 4`; within `max_pages` 12; page count did not increase. **Not fully closed.** Recorded in `residuals.json`.
- **Frozen:** all energy table cells (`0.999`/`6.53`/`1.07`/Box2D `6.61`/C06 band/C07 `1.009→0.977`/escape step `161`); Dataset D timing cells unchanged; C01–C07 claim meaning; CSV bytes; `cpp/`, `krb.bib`, harness, listings, figures.

## Cycle-6 path close (`KRB_JCGT_CYCLE6_PATH`)

Manuscript run `20260823-1e6d9e` / cycle-6 path-only hole close (2026-08-23). HEAD `f644d10` (10 pp).

- **Before:** 10 pp (`krb.log` 350004 bytes); Component B lead-in claimed unrestricted mechanical energy; Limitations L278 length-ack; claim ids `C01`–`C07` in abstract/Evaluation/captions/Limitations/Conclusion.
- **After:** 10 pp (`krb.log` 349686 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `h-method-approx` — Method Component B states 1-D / relative / predicted-$\Delta h$ domain before `eq:vsurf`; whitepaper §3.2 mirrored; ties to `workTerm` listing.
- **Partial:** `h-length-typical` — length-ack sentence deleted; claim ids stripped; Evaluation/Dataset D captions compressed; page count unchanged at 10 (not increased); still **10 pp** vs pack `typical_pages: 4`. **Not fully closed.** Recorded in `residuals.json`.
- **Frozen:** all energy/timing table cells; cradle off `1.79` secular gain; Method equation algebra; listing semantics; cycle-5 WASM/same-load/merge-listings prose; no `cpp/`/CSV/`krb.bib`/harness edits.

## Cycle-7 path close (`KRB_JCGT_CYCLE7_PATH`)

Manuscript run `20260823-1e6d9e` / cycle-7 path-only hole close (2026-08-23). HEAD `82ca731` (10 pp).

- **Before:** 10 pp (`krb.log` 349686 bytes); C07 `1.009 \to 0.977` without explicit $\Delta$; Dataset D native `g++` scope in caption only; Component A “all constraints”; unqualified Conclusion drop-in; no measured recipe sentence.
- **After:** 11 pp (`krb.log` 350774 bytes); `latex_error_count` 0 (overfull hboxes only).
- **Closed:** `C07-loss-quant` — Limitations $\Delta \approx 0.032$; Conclusion drop of $0.032$, about $3\%$ of $E_0$ over $8\,\mathrm{h}$; not README hourly $0.999 \to 0.982$.
- **Closed:** `dataset-d-hedge` — Cost subsection body names native `g++` / `make log-timing`; Conclusion Table D hedge; caption unchanged.
- **Closed:** `h-venue-method-stated` — measured recipe in Implementation (merge-listings paragraph); Component A scoped to contact/distance-joint `preSolve`; Conclusion scoped to Section~\ref{sec:implementation} recipe.
- **Partial:** `h-length-typical` — **11 pp** vs pack `typical_pages: 4`; within `max_pages` 12; preferred $\le 10$ not met. **Not fully closed.**
- **Frozen:** all energy/timing table cells (`0.999`/`6.53`/`1.07`/Box2D `6.61`/C06 band/C07 `1.009\to0.977`/escape step `161`/Dataset D cells); cradle off `1.79` secular gain; Method equation algebra; listing semantics; cycle-5/6 prose; no `cpp/`/CSV/`krb.bib`/harness edits.
