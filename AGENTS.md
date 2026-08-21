# Gearbox2D — agent notes

Web-first 2D rigid-body engine for **fast, high-fidelity, realtime games**. Not NASA. Performance is a first-class constraint: stay in a single-pass sequential-impulse / PGS pipeline (WASM, fixed iteration counts, SIMD where it already exists).

Fidelity here means **no fake energy, no scene-specific silencing of constraints**, and rules that apply to a whole constraint class. It does **not** mean a new solver family (XPBD, TGS, extra position-solver stacks) unless that is an explicit, measured project.

Kinematic Restitution Balancing (KRB) is the template: a cheap analytic correction that applies to every contact/joint of that class. Read `studies/kinematic_restitution_balancing/KRB_Whitepaper.md` before changing restitution, bias, or force-velocity.

## Non-goals

- Global energy invariants or variational integrators
- Per-demo solver modes (`if (example === "motorcycle")`)
- Passing one gtest by starving another constraint class
- “Just damp it” as a substitute for a model (see also future aerodynamics vs `linearDamping`)

## Solver policy

- **Contacts** are hard unilateral constraints. **Soft springs** (`frequencyHz > 0`) are CFM / Baumgarte+gamma in velocity space. A mouse joint is a spring to a kinematic/fixed body, not a new solver.
- Do **not** add island-wide or scene-wide weaken/kill switches for springs (or any joint) because *some* contact in the island overlaps. That glued sandbox grabs and pancaked suspension.
- Do **not** reuse `MAX_POSITION_CORRECTION`, `PENETRATION_SLOP`, or other *length* constants as force or impulse caps. Wrong units, global blast radius.
- PGS **order is a bias**, not physics. The velocity loop currently solves joints/springs, then contacts, then springs again so contacts-last does not fully cancel bilateral springs. Treat that as interleave, not “springs always win.” Do not add `if (motorcycle)` next to it. Do not reintroduce contacts-always-last without a spring turn.
- Position correction and `BAUMGARTE_FACTOR` still exist. KRB **taxes** the energy of that displacement; it does not mean “delete stabilization.” Do not add more velocity bias to hide a bug. Do not rip out position correction without replacing the energy story.
- `constants.h` solver knobs are hand-tuned. Do not retune them to pass one test or one showcase.

## Engine vs examples

Showcases (motorcycle, sandbox, clockwork) are **models**. If the bike wheelies or bottoms, retune that scene (mass, rest length, `frequencyHz`, torque, wheel inertia). If sandbox junk will not extract, reproduce with a **minimal gtest** (see `cpp/tests/regression_pile_extraction_tests.cpp`), then fix the engine.

A bug that only appears in a demo is not a license to special-case the island solver.

## Tests

State an **invariant**, not a frozen hack:

- Good: packed 3 Hz mouse pull still displaces; resting `e = 1` bounce does not gain energy; SIMD lane matches scalar.
- Bad: “impulse equals `MAX_POSITION_CORRECTION`” (that enshrined spring-weaken).

When you touch contacts, springs, islands, or KRB:

- Run native `make test` (or the focused suite you changed).
- Keep SIMD/scalar parity (`cpp/tests/joint-simd-parity_tests.cpp`). A fix that lives in only one path is invalid.
- Add a regression that would fail if the old special case came back.

Failing motorcycle **throttle** penetration tests are not a reason to cap every dynamic spring. Failing distance-joint gtests when examples look fine: investigate, do not “fix” by loosening unrelated constraints.

## Forbidden (by name)

- Gate inner-loop behavior on island overlap, showcase key, or body name
- Skip `solvePosition` or zero a constraint “because it fights terrain”
- Raise `velocityIterations` / substeps to hide one scene
- Change default friction / restitution / mass to paper over stacking
- Leave diagnostic flags or commented “Test C/D” policy in production
- Scalar-only or SIMD-only constraint math

## Workflow

1. Minimal repro in a gtest when the bug is engine-level.
2. Prefer one rule for all springs, all contacts, all mouse joints.
3. If an example still looks wrong after a correct engine change, calibrate the example.
4. Performance: no extra passes over the world unless measured and justified; do not regress the single-pass SI profile KRB is built for.

Later work (aerodynamics replacing linear drag, less Baumgarte) must follow the same bar: general, cheap, tested — not a showcase patch.
