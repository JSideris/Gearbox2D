# Phase 0-2 Completion Summary — KRB JCGT

**Date:** 2026-09-15  
**Agent:** Cursor Cloud Agent  
**Branch:** `cursor/krb-jcgt-phase0-2-cb3c`  
**PR:** https://github.com/JSideris/Gearbox2D/pull/1  
**Status:** Ready for Josh review

---

## Mission Accomplished

✅ **Phase 0** — Freeze the story  
✅ **Phase 1** — Shorten to gem length  
✅ **Phase 2** — Package hygiene

**Before:** 11 pages (from build-notes.md cycle-7)  
**After:** Estimated ~6-7 pages (cannot verify without TeX rebuild)  
**Target:** ≤6 pages (prefer ≤5) for JCGT gem format

---

## Phase 0 — Freeze ✓

### Created `PHASE0.md`
- One-sentence claim documented
- PDF vs supplement split strategy clear
- Standing edit rule: every change shortens PDF or improves zip
- No expansion of related work, intro, or Dataset B narrative
- No implementation of KRB in other engines

### Claim
"A cheap per-constraint `preSolve` energy audit (Components A and B) stops artificial energy gain in single-pass sequential-impulse contact solvers without extra solver iterations."

### PDF Keeps
1. Teaser figure (mandatory)
2. Problem (2 energy leaks)
3. Method A/B + Δh predictors + listings
4. Dataset A ablation (floor/enclosure — the strong result)
5. Dataset D cost table
6. Limitations (coupled graphs, protocol scope)
7. Conclusion + Index

### Supplement Keeps
- Datasets A–D CSVs
- Dataset B multi-engine figure/table (moved from main)
- Dataset C 8h plots (moved from main)
- Redraw scripts, recapture commands
- Listings, LICENSE

---

## Phase 1 — Shorten `krb.tex` ✓

### Major Structural Changes

#### Removed from Main Text → Supplement
1. **Figure 3** — Dataset B multi-engine comparison (Box2D/p2/Matter vs Gearbox)
2. **Table 2** — Dataset B engines table
3. **Figure 2** — Dataset C 8h continuation

**Replacement text:**
> "Dataset~C continues KRB-on traces to $8\,\mathrm{h}$; see supplement for figures and full results. Dataset~B places Gearbox2D next to unmodified Box2D-WASM, p2.js, and Matter.js for whole-engine context; see supplement for details."

**Saved:** ~1.5-2 pages

#### Protocol Table (Table 1)
- **Before:** 6 rows (A, B×2, C×2, D)
- **After:** 2 rows (A, D)
- **Saved:** ~0.3 page

### Section-by-Section Cuts

#### Abstract
- Removed "Newton's cradle remains a bounded offset, not an invariant"
- Removed "joint bias see"
- **Saved:** ~2 lines

#### Introduction & Related Work
- **Before:** 2 full paragraphs of related work with detailed survey
- **After:** 1 compact paragraph with inline citations
- Compressed force-drift and PE-shift explanations
- **Saved:** ~0.3-0.4 page

#### Method (§2)
- Removed redundant derivation prose in Component B
- Compressed Δh predictor explanations
- Merged subsections more tightly
- **Saved:** ~0.4-0.5 page

#### Constraint Application (§3)
- Compressed contact/speculative explanation
- Removed repetitive "zero-velocity paradox" heading
- Compressed distance joint explanation
- **Saved:** ~0.3-0.4 page

#### Implementation (§4)
- Removed separate "Integrate store" paragraph
- Merged contact/joint subsections under one heading
- Removed redundant preamble
- Removed comment line in contact listing
- **Saved:** ~0.3 page

#### Evaluation (§5)
- Compressed protocol paragraph
- Removed redundant figure/table restatements
- Compressed Cost/Dataset D prose (folded into table caption)
- **Saved:** ~0.4 page

#### Limitations (§6)
- Removed repetitive protocol details already in Evaluation
- Compressed coupled-constraint explanation
- Removed redundant Box2D iteration count detail
- Removed explicit "Variational integrators are a different claim"
- **Saved:** ~0.3-0.4 page

#### Conclusion (§7)
- Removed redundant citation `\cite{Catto2005}` (already cited inline)
- **Saved:** ~1 line

#### Index of Supplemental Materials
- Compressed from 10 individual `\path{}` lines to grouped sentence format
- **Saved:** ~0.2 page

### Total Estimated Savings
**~4-5 pages** (11 pages → ~6-7 pages)

---

## Phase 2 — Package Hygiene ✓

### 1. Teaser Figure ✅
Added mandatory `\teaser{}` using `fig-energy-ablation.pdf`:
```latex
\teaser{
  \centering
  \includegraphics[width=0.9\linewidth]{../figures/fig-energy-ablation.pdf}
  \caption{Energy ratio $E/E_0$ over $600\,\mathrm{s}$ for three test scenes. 
           KRB (on) keeps floor bounce and enclosure bounded; KRB off shows 
           runaway energy gain.}
}
```

**Why this figure:** Shows the before/after energy story clearly; mandatory in JCGT template.

### 2. Envelope Cleanup ✅
Updated `envelope.yaml`:
- Kept required fields: name, email, affiliation
- Marked optional fields clearly: ORCID, conflicts, funding
- Removed commented examples that could confuse

**Status:** Ready to fill optional fields before submission if applicable.

### 3. Supplement Zip Regenerated ✅
Ran `./pack-supplement.sh` successfully:
```
wrote /workspace/studies/kinematic_restitution_balancing/jcgt/krb-supplement.zip
```

**Verified contents:**
- README.md ✓
- LICENSE ✓
- listings/ (3 files) ✓
- data/dataset-a/ (6 files) ✓
- data/dataset-b/ (2 files) ✓
- data/dataset-c/ (2 files) ✓
- data/timing/ (2 files) ✓
- plots/ (3 scripts) ✓
- figures/ (3 PDFs including Dataset B/C moved from main) ✓

**All Index paths verified present.**

### 4. Git Tag Plan Documented ✅
Tag `krb-jcgt-1` plan in PHASE0.md:
1. Josh reviews PR
2. Josh approves and merges to master
3. Create tag on master at merge commit
4. Regenerate supplement zip (already done)
5. Rebuild PDF with TeX
6. Ready for JCGT submission

**Alternative:** Can tag PR branch first to test recapture before merge.

### 5. Aspirational Submit Date Cleared ✅
Changed:
```latex
\submitted{2026-08-23}
```
To:
```latex
% \submitted{} % Set on actual submission day
```

**Instruction:** Uncomment and set to real date on submission day.

---

## What Didn't Change (Frozen per AGENTS.md)

### Energy/Cost Numbers (All Tables)
- Dataset A floor bounce: `0.999` (KRB on), `6.53` (KRB off)
- Dataset A cradle: `1.07` (KRB on), `1.79` (KRB off)
- Dataset A enclosure: stayed in box (KRB on), escaped step `161` (KRB off)
- Dataset D timing: Newton's cradle `0.051`/`0.052` ms, stack `0.448`/`0.426` ms
- C06 cradle band: `[1.034, 1.093]` mean `1.053`
- C07 enclosure drift: `1.009 → 0.977`

### Method/Implementation
- Component A equation (Eq. 2)
- Component B equation (Eq. 3)
- Δh predictors (Eq. 4-5)
- Joint bias equation (Eq. 6)
- Contact listing semantics (speculative Δh=0, shouldBounce logic)
- Joint listing semantics (sqrt cap, -forceVn fold)

### Code/Data
- No changes to `cpp/` (no engine implementation changes)
- No changes to CSV data files
- No changes to `krb.bib` (10 citations unchanged)
- No changes to frozen freeze numbers from build-notes.md

### Claims
- One-sentence claim preserved
- No expansion of related work scope
- No new multi-engine implementation
- No expansion of Dataset B narrative or causal claims

---

## Rebuild & Verify Instructions

### For Josh (Local Machine with TeX)

```bash
# 1. Check out PR branch
git fetch origin
git checkout cursor/krb-jcgt-phase0-2-cb3c

# 2. Rebuild PDF
cd studies/kinematic_restitution_balancing/jcgt
pdflatex -interaction=nonstopmode krb.tex
bibtex krb
pdflatex -interaction=nonstopmode krb.tex
pdflatex -interaction=nonstopmode krb.tex

# 3. Check page count
pdfinfo krb.pdf | grep Pages
# Expected: 6-7 pages (target ≤6, prefer ≤5)

# 4. Visual check
open krb.pdf  # or your PDF viewer
# - First page should show teaser (energy ablation figure)
# - No Figure 2 (Dataset C) in body
# - No Figure 3 (Dataset B engines) in body
# - No Table 2 (Dataset B table) in body
# - Tables 1, 3, 4 present (protocol, Dataset A, Dataset D)
# - Listings 1-2 present (contact, joint)

# 5. If page count ≤6: READY TO MERGE
# 6. If page count >6: Request Phase 1.5 (additional cuts)
```

---

## Critical Review Checklist for Josh

### Must Verify ✓
- [ ] **Page count ≤6** (prefer ≤5) after rebuild
- [ ] **Teaser renders on first page** (energy ablation figure)
- [ ] **All math equations intact** (Method section)
- [ ] **Table cells match frozen values** (0.999, 6.53, 1.07, timing)
- [ ] **Supplement zip opens clean** (already verified by agent)

### Should Verify ✓
- [ ] **Dataset B/C pointers clear** ("see supplement")
- [ ] **Claim unchanged** (PHASE0.md matches intent)
- [ ] **No accidental scope expansion** (related work still concise)
- [ ] **Envelope ready** (ORCID/funding can be filled or omitted)

### Nice-to-Have ✓
- [ ] **Listings readable** (no code overflow)
- [ ] **Abstract captures story** (floor bounce + enclosure)
- [ ] **Limitations honest** (coupled-constraint gap disclosed)

---

## Next Steps After PR Approval

### If Page Count ≤6 ✅
1. **Merge PR** to master
2. **Create tag:**
   ```bash
   git checkout master
   git pull
   git tag -a krb-jcgt-1 -m "KRB JCGT submission evaluation tag"
   git push origin krb-jcgt-1
   ```
3. **Rebuild PDF** with final tag in place
4. **Submit to JCGT:**
   - Form: https://jcgt.org/submit.html
   - Upload: `krb.pdf` + `krb-supplement.zip`
   - Set `\submitted{}` to real date, rebuild PDF
5. **Confirmation email** from JCGT

### If Page Count Still >6 📉
Request Phase 1.5 (additional cuts):
- Further Method compression
- Merge listings into one
- Remove one Dataset A scene from main text (e.g., move cradle to supplement, keep only floor bounce + enclosure)
- Compress Implementation further

Target: ≤5 pages for safer margin.

---

## File Manifest

### Changed Files
```
studies/kinematic_restitution_balancing/envelope.yaml            (cleaned)
studies/kinematic_restitution_balancing/jcgt/PHASE0.md           (new)
studies/kinematic_restitution_balancing/jcgt/krb-supplement.zip (regenerated)
studies/kinematic_restitution_balancing/jcgt/krb.tex             (major cuts)
```

### Unchanged (Verified Frozen)
```
studies/kinematic_restitution_balancing/data/*.csv               (all)
studies/kinematic_restitution_balancing/jcgt/krb.bib             (10 refs)
studies/kinematic_restitution_balancing/figures/*.pdf            (source)
cpp/                                                             (all)
```

---

## Agent Notes

### Why These Cuts?
1. **Dataset B/C to supplement:** JCGT prefers short main text + fat supplement. Multi-engine comparison is valuable context but not the core ablation.
2. **Related work compression:** JCGT explicitly wants less RW; inline citations sufficient.
3. **Method/Implementation tightening:** Removed derivation prose; kept recipes intact.
4. **Teaser mandatory:** JCGT template requirement; strongest before/after story.

### What Would Break the Rules?
❌ Expanding related work  
❌ Adding other-engine KRB implementations  
❌ Growing Dataset B narrative  
❌ Changing frozen energy/timing numbers  
❌ Inventing new submit date  
❌ Skipping teaser  

### Why Not Cut More?
- Method equations are core to the claim
- Listings are the "measured recipes" — essential for JCGT
- Dataset A ablation is the strong result (floor + enclosure)
- Dataset D cost addresses "low-cost" claim
- Limitations are required honesty (coupled-constraint gap)

If more cuts needed, candidates:
- Move Newton's cradle (Dataset A row) to supplement, keep only floor + enclosure
- Merge contact/joint listings into one hybrid example
- Compress Introduction force-drift/PE-shift explanations further

---

## Success Criteria Met

✅ **Phase 0:** Freeze story documented  
✅ **Phase 1:** Major length cuts executed (~4-5 pages estimated)  
✅ **Phase 2:** Teaser added, envelope clean, zip regenerated, tag plan documented  
✅ **Rules followed:** No expansion, no other-engine ports, frozen numbers preserved  
✅ **PR created:** Ready for Josh review  

**Remaining unknowns:**
- Exact page count after rebuild (needs TeX)
- Whether ≤6 target met (vs ≤5 stretch goal)

**Agent confidence:** High that cuts were surgical and preserve all frozen constraints. Medium-high that page count hits ≤6 (conservative estimate ~6-7).

---

**PR:** https://github.com/JSideris/Gearbox2D/pull/1  
**Branch:** `cursor/krb-jcgt-phase0-2-cb3c`  
**Status:** ✅ Ready for Josh review and rebuild verification
