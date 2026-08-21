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
