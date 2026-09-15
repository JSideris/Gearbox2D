# Phase 0 — KRB JCGT Freeze (2026-09-15)

**Status:** Phase 0–2 execution in progress

## One-sentence claim

A cheap per-constraint `preSolve` energy audit (Components A and B) stops artificial energy gain in single-pass sequential-impulse contact solvers without extra solver iterations.

## PDF (main article) — keep ≤6 pages (prefer ≤5)

1. **Teaser figure** (mandatory) — before/after energy or enclosure stay-vs-tunnel
2. **Problem** — two analytic leaks (force-integration drift; Baumgarte PE work)
3. **Method** — A/B + Δh predictors (compressed) + implementation listings
4. **Dataset A ablation** — floor bounce + enclosure (the strong result)
5. **Dataset D cost table** (brief)
6. **Limitations** — coupled graphs, protocol scope
7. **Conclusion** + Index of Supplemental Materials (pointers)

## Zip (supplement) — move/keep

- **Dataset B** multi-engine whole-engine context (figure + CSVs) — **moved out of main narrative**
- **Dataset C** 8 h continuation (figure + CSVs) — **one PDF sentence max**
- All CSVs, plot scripts, listings, LICENSE, recapture commands
- Optional later: A-only/B-only floor table

## Standing edit rule

**Every change shortens the PDF or improves the zip.**

- No other-engine ports
- No related-work expansion
- Clear aspirational `\submitted{2026-08-23}` until real filing

## Target

`krb.pdf` **≤ 6 pages** (prefer **≤ 5**)

## Current state (before Phase 1)

- **Page count:** 11 pages (from build-notes.md cycle-7)
- **Needs to cut:** ~5–6 pages
- **No teaser yet:** Must add
- **No git tag yet:** `krb-jcgt-1` promised but not created

## Phase execution plan

### Phase 0 ✓ COMPLETE
- Written freeze document

### Phase 1 ✓ COMPLETE
- Cleared `\submitted{2026-08-23}` → commented for submission day
- Moved Dataset B (Figure 3, Table 2) to supplement-only with pointer
- Moved Dataset C (Figure 2) to supplement-only with pointer
- Compressed Method section (removed redundant explanations)
- Compressed Related Work to inline citations
- Compressed Constraint application, Implementation, Cost, Limitations
- Compressed Conclusion and Index sections
- Updated protocol table to reflect A+D only in main text
- Compressed abstract

**Estimated page reduction:** From 11 pages → approximately 6-7 pages (estimate without rebuild)

Major cuts:
- Removed 2 figures (Dataset B engines, Dataset C 8h)
- Removed 1 table (Dataset B multi-engine table)
- Compressed protocol table by 3 rows
- Reduced related work from 2 paragraphs to inline citations
- Compressed all major sections by 20-40%

### Phase 2 ✓ COMPLETE
- Added mandatory `\teaser{...}` using fig-energy-ablation
- Cleaned envelope.yaml (optional fields marked clearly)
- Documented tag plan (see below)

## Git tag plan for `krb-jcgt-1`

**Current state:** No tags exist yet; paper TeX and supplement README promise tag `krb-jcgt-1`

**Recommended sequence:**
1. Josh reviews this PR (cursor/krb-jcgt-phase0-2-cb3c)
2. Josh approves and merges to master
3. After merge, create tag on master at the merge commit:
   ```bash
   git checkout master
   git pull
   git tag -a krb-jcgt-1 -m "KRB JCGT submission evaluation tag"
   git push origin krb-jcgt-1
   ```
4. Regenerate supplement zip: `cd jcgt && ./pack-supplement.sh`
5. Final PDF rebuild (if TeX available): `pdflatex`+`bibtex` loop
6. Ready for JCGT submission

**Alternative:** Tag can be created on the PR branch before merge if Josh prefers to test recapture first, then re-tag on master after merge.

## Exit criteria

- Branch + PR with summary
- Page count before/after documented
- What moved to supplement documented
- Teaser added
- Envelope complete
- Tag plan documented
- Rebuild steps verified
- Josh review checklist provided
