# Packaging Fixes Summary — KRB JCGT PR #1 (2026-09-15)

**PR:** https://github.com/JSideris/Gearbox2D/pull/1  
**Branch:** `cursor/krb-jcgt-phase0-2-cb3c`  
**Status:** Updated with packaging fixes per `keep-zip-punchlist.md`

---

## What Was Fixed

### P1 Must-Fix (All Resolved)

#### 1. Restored `\label{sec:deff}` ✅
**Problem:** "Reference sec:deff on page 3 undefined"  
**Fix:** Added `\label{sec:deff}` to "Effective displacement prediction" subsection heading  
**Location:** Line 74 in krb.tex

#### 2. Teaser = ONLY Copy of Ablation Figure ✅
**Problem:** Figure printed twice (teaser + body duplicate)  
**Fix:**
- Kept teaser at line 17-20
- Added `\label{fig:ablation}` to teaser → now Figure 1
- Removed body duplicate (was at lines 178-183)
- Restored full caption:
  ```latex
  Mechanical energy ratio $E/E_0$ over $600\,\mathrm{s}$. 
  (a)~Elastic floor contact. 
  (b)~High-rate enclosure; KRB on is a $60\,\mathrm{s}$ windowed mean, 
      KRB off raw $1\,\mathrm{Hz}$ samples to tunneling ($t = 2.7\,\mathrm{s}$). 
  (c)~Newton's cradle.
  ```
**Result:** Limitations can now cite `Figure~\ref{fig:ablation}c` correctly

#### 3. Fixed Related-Work Accuracy ✅
**Problem:** Over-compressed related work lost critical distinctions  
**Fixes:**
- Restored Bender2014 survey citation as placement map
- Fixed split impulse/NGS: "hide bounce-from-correction but **do not tax PE work** of the remaining $\Delta h$"
- Separated TGS (PhysX2024) from soft constraints — different approaches:
  - `\cite{Catto2011,PhysX2024}` for TGS and soft constraints separately
- Restored uniqueness: "Among the SI variants cited here, **none apply an analytic PE/KE balance to expected $\Delta h$ for both contacts and distance joints** inside a single-pass impulse solver"

**Compare:**
- ❌ Old (incorrect): "soft constraints \cite{Catto2011,PhysX2024}" — lumped TGS with soft
- ✅ New (correct): "TGS, soft constraints, and XPBD \cite{Catto2011,PhysX2024,Macklin2016,Muller2007}" — separated

#### 4. Defined v_launch Before eq:deff + Restored Predictor Explanation ✅
**Problem:** v_launch used in equation without definition; predictor properties missing  
**Fixes:**
- Added before eq:deff: "For a bouncing contact, the kinematic bounce $v_{\mathrm{launch}} = -e\cdot v_{\mathrm{impact}}$ clears some overlap before the position pass."
- Restored predictor paragraph after eq:deltah:
  ```
  These Δh values are explicit predictors of Baumgarte travel, not a measurement 
  of the later position pass. Using the pre-tax v_launch keeps Δh closed-form; 
  a post-tax v_final would make it implicit. On a ground tax the predictor is 
  then slightly low---same sign as the original leak. Γ is the isolated geometric 
  series, not a fit to coupled NGS. If v_launch·Δt already clears (d-s), 
  d_eff=0 and there is no loop.
  ```

**Why it matters:** These are Method identities, not filler

### P2 Restore

#### 5. Abstract: Restored Newton's Cradle Caveat ✅
**Problem:** Abstract lost the coupled-constraint honesty  
**Fix:** Restored from master:
- "a Newton's cradle remains a bounded offset, not an invariant"
- Restored "joint bias" (was stripped to just "restitution sees") so Component A/B scope matches Listing 2

**Master abstract (restored):**
```latex
restitution and joint bias see the post-force velocity, and Baumgarte displacement 
does potential-energy work without a matching kinetic-energy tax. [...] 
a Newton's cradle remains a bounded offset, not an invariant.
```

---

## Restored Method Caveats (From Master)

### Component A
- "Store the per-body force increment [...] and subtract it from the relative velocity **seen at setup**."
- "That **recovers the true impact normal velocity** before restitution or bias is applied"
- "**The correction is independent of the bias method.**"

### Component B  
Restored full derivation from master (not invented):
- "For a dynamic body on a static floor, center-of-mass motion along $\mathbf{n}$, free-flight rewind is $v_{\mathrm{impact}}^2 = v_{\mathrm{surf}}^2 - 2(\mathbf{a}\cdot\mathbf{n})\Delta h$."
- "Equivalently, $\Delta E_p = -m(\mathbf{a}\cdot\mathbf{n})\Delta h$ taken from $\tfrac12 m v^2$ gives $\Delta(v^2) = 2(\mathbf{a}\cdot\mathbf{n})\Delta h$, **so $m$ cancels**."
- "If both bodies share the same $\mathbf{a}_{\mathrm{ext}}$, $\mathbf{a}_{\mathrm{rel}}=\mathbf{0}$ and **Component~B is a no-op**."
- "**Rotation, tangent motion, and impulse work are outside this identity** (Section~\ref{sec:limitations})."

**Why restored:** These are the actual derivations and scope boundaries, not optional prose

---

## Updated PHASE0.md

### Changed Target
- ❌ Old: "≤6 pages (prefer ≤5)"
- ✅ New: "~6-7 pages **with joints**"
- Note: contacts-only ~4 pages only if editor forces claim change

### Changed Claim
- ❌ Old: "stops artificial energy gain" (overclaim vs cradle residual)
- ✅ New: "**audits** artificial energy leaks; **bounded offset remains for coupled constraints**"

### Strategy Updated
- Rule: "Move exhibits, not identities"
- Do NOT shorten Method derivations
- Do NOT drop cradle caveat
- Do NOT keep Dataset B in main narrative
- Do NOT print ablation figure twice

---

## Verification Checklist for Josh

### Build & Refs
```bash
cd studies/kinematic_restitution_balancing/jcgt
pdflatex krb.tex && bibtex krb && pdflatex krb.tex && pdflatex krb.tex
grep "Reference.*undefined" krb.log  # should be empty
pdfinfo krb.pdf | grep Pages          # expect ~6-7 pages
```

### Visual Checks
- [ ] First page has teaser (3-panel energy, Figure 1)
- [ ] No duplicate ablation figure in body (removed)
- [ ] Limitations cites `Figure 1c` correctly (not `Figure ??`)
- [ ] Abstract mentions cradle bounded offset
- [ ] Method includes:
  - [ ] Component A: "independent of bias method"
  - [ ] Component B: why m cancels
  - [ ] Component B: a_rel=0 no-op
  - [ ] Component B: rotation/tangent outside identity
  - [ ] v_launch defined before eq:deff
  - [ ] Predictor properties (pre-tax, slightly low, Γ isolated)
- [ ] Related work:
  - [ ] Bender2014 survey present
  - [ ] Split impulse "do not tax PE work of remaining Δh"
  - [ ] TGS separate from soft constraints
  - [ ] Uniqueness line present

### Frozen Numbers (Must Match)
- [ ] Dataset A floor: 0.999 (on), 6.53 (off)
- [ ] Dataset A cradle: 1.07 (on), 1.79 (off)  
- [ ] Dataset A enclosure: escaped step 161 (off)
- [ ] Dataset D timing: cradle 0.051/0.052 ms, stack 0.448/0.426 ms
- [ ] C07 enclosure: 1.006 → 0.976

---

## Page Count Analysis

**Before packaging fixes:** ~8 pages
- Teaser: ablation figure
- Body: duplicate ablation figure ← removed
- Tables: protocol (2 rows), Dataset A, Dataset D
- Listings: contact + joint

**After packaging fixes:** Estimated ~6-7 pages
- Duplicate figure removed: saves ~0.5-1 page
- Method caveats restored: adds ~0.2 page (but required)
- Net: should be ~6-7 pages

**If still >7 pages, next cut:**
- Joint listing (Listing 2) → supplement, keep contact in PDF
- OR Dataset D timing table → supplement with pointer
- Do **NOT** cut Method derivations

---

## What Was NOT Changed

### Frozen (Per AGENTS.md)
- No energy/timing table cells changed
- No CSV data changed
- No `krb.bib` changed
- No `cpp/` implementation changed
- No new multi-engine implementations
- No expansion of Dataset B narrative

### Still in PDF
- Dataset A table (all frozen cells)
- Method equations (all preserved)
- Contact listing (Listing 1)
- Joint listing (Listing 2) — may move to zip if page pressure
- Cost table (Dataset D) — may move to zip if page pressure

### Still in Supplement
- Dataset B multi-engine figure + table
- Dataset C 8h figure
- All CSVs, plots, recapture commands

---

## Git Operations

```bash
# Branch: cursor/krb-jcgt-phase0-2-cb3c (same PR #1)
# Commits:
#   01c01eb - Phase 0-2: KRB JCGT length cuts and package hygiene
#   33466b4 - Add comprehensive Phase 0-2 completion summary  
#   6746fd3 - Packaging fixes per review (this commit)
```

**PR updated:** https://github.com/JSideris/Gearbox2D/pull/1

---

## Next Steps

1. **Josh rebuilds locally** and checks:
   - Page count (~6-7 expected)
   - No undefined references
   - Teaser renders
   - Frozen numbers preserved

2. **If page count ≤7:** Merge as-is

3. **If page count >7:** Move joint listing OR timing table to supplement (NOT Method prose)

4. **After merge:** Create tag `krb-jcgt-1`, final PDF rebuild, submit to JCGT

---

## Strategy Confirmation

✅ **This was a packaging pass, not a prose diet**
- Moved exhibits (Dataset B/C figures, duplicate ablation)
- Restored identities (Method caveats from master)
- Fixed accuracy (related work, predictor explanation)
- Kept honesty (cradle bounded offset)

❌ **Did NOT:**
- Shorten Method by 20%
- Drop cradle caveat to look more successful
- Keep Dataset B in main narrative
- Print ablation figure twice
- Invent new prose (restored master wording)

**Result:** Surgical packaging fixes that honor AGENTS.md and keep-zip-punchlist.md constraints.
