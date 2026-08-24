**Author:** Joshua Sideris  
**Date:** January 17, 2026 (Updated August 21, 2026)  
**Subject:** Eliminating Artificial Energy Gain in Single-Pass Impulse Solvers via Kinematic Restitution Balancing

# Kinematic Restitution Balancing (KRB)
**A Per-Constraint Energy Audit for Velocity-Level Impulse Solvers**

## Abstract
Velocity-level sequential-impulse solvers gain energy from two analytic leaks: restitution and joint bias see the post-force velocity, and Baumgarte displacement does potential-energy work without a matching kinetic-energy tax. Kinematic Restitution Balancing (KRB) is a per-constraint `preSolve` audit of those leaks: Component A subtracts the force increment from the impact velocity, and Component B adjusts launch or bias speed for the expected correction $\Delta h$. A compile-time on/off ablation in Gearbox2D keeps a single elastic floor bounce at $E/E_0 \approx 1$ over $600\,\mathrm{s}$ (KRB off finishes at $6.53$) and holds a high-rate enclosure in-box; a Newton's cradle remains a bounded offset, not an invariant. The method adds no solver passes.

---

## 1. The Problem: Artificial Energy Sources
In a standard velocity-level impulse solver, two sources contribute to artificial mechanical energy gain during constraint resolution:

### 1.1 External Force Integration Drift
Most engines use Symplectic Euler integration [9] where velocity is updated before constraint resolution:

$$v_{solver} = v_{t} + a_{ext} \cdot \Delta t$$

Restitution and joint logic see $v_{solver}$ instead of the true relative velocity $v_{impact}$. For a perfect bounce ($e=1.0$), the launch velocity becomes $-(v_{t} + a_{ext} \cdot \Delta t)$, gaining $a_{ext} \cdot \Delta t$ extra speed per frame. For a joint at rest, the solver sees a non-zero velocity induced by gravity and applies an impulse to cancel it, effectively "fighting" gravity every frame at the velocity level, which can lead to artificial stiffness or damping artifacts.

### 1.2 Potential Energy Shift from Position Correction
Overlap and joint error resolution (Baumgarte stabilization [1], soft constraints [5]) displaces objects by $\Delta h$ to resolve penetration or joint drift. This displacement increases potential energy ($mgh$) without reducing kinetic energy. The added PE converts to KE on subsequent frames, causing runaway energy growth, which manifests as bouncing after a collision or runaway jitter in long joint chains.

Split impulse and equivalent decoupled position passes (e.g., a separate NGS position solver) [3], [4] prevent the *immediate* bounce-from-Baumgarte by keeping position-correcting impulses off the physical velocity used for restitution. They do not, however, account for the potential-energy work of the remaining displacement $\Delta h$. That leftover PE still becomes KE on later frames, which is the gap Component B closes.

---

## 2. Related Work
Interactive rigid-body solvers and their energy artifacts are surveyed by Bender, Erleben, and Trinkle [10]. The notes below are a starting map of the work KRB sits against; they are not a complete literature review.

### 2.1 Velocity-Level Iterative Solvers
Catto's projected Gauss-Seidel / sequential-impulse formulation [2] is the standard real-time approach: constraints are solved at the velocity level with a fixed iteration count, warm starting, and accumulated-impulse clamping. Box2D and most game engines descend from this model. Because the solve happens after explicit force integration, restitution and joint bias see $v_t + a_{ext} \Delta t$ rather than the pre-force impact velocity. Component A is a correction for that pipeline, not a replacement for PGS.

### 2.2 Position Correction: Baumgarte, Split Impulse, and NGS
Baumgarte stabilization [1] feeds a fraction of the constraint error back as a velocity bias, $v_{bias} = \beta C / \Delta t$. It is cheap and universal, but the resulting displacement does work against external fields without a matching kinetic-energy change—the leak in §1.2.

Split impulse and nonlinear Gauss-Seidel (NGS) position solvers [3], [4] were introduced to stop Baumgarte from becoming visible bounce. The position pass uses pseudo-velocities that never write back into the physical velocity used for restitution. That removes the *immediate* bounce-from-correction artifact. It does not tax the leftover potential-energy change from the remaining $\Delta h$. Catto's later Solver2D comparison [4] treats NGS, soft constraints [5], TGS, and XPBD as alternative ways to hide or damp that response; none of them perform the kinematic PE/KE audit that Component B applies.

### 2.3 Dual-Pass and Temporal Solvers
PhysX Temporal Gauss-Seidel (TGS) [8] and equivalent sub-stepped / dual-pass schemes improve convergence and can reduce energy injected while correcting penetrations, at extra cost per step. KRB targets the opposite trade: keep a single-pass sequential-impulse profile, and cancel the two analytic energy sources instead of iterating them away.

### 2.4 Position-Based Alternatives
Position Based Dynamics [6] and XPBD [7] resolve constraints by projecting positions, then backing out velocities. That sidesteps velocity-level restitution bias, but it is a different solver family: stiffness becomes a compliance / iteration parameter, and the engine is no longer a drop-in SI/PGS stack. KRB is meant for engines that want to keep velocity-level impulses.

### 2.5 Geometric Integration
Symplectic Euler is a first-order geometric integrator [9]. Variational / structure-preserving integrators can bound long-term energy drift for unconstrained Hamiltonian systems. KRB is not a variational integrator. It is a per-constraint energy audit layered on an existing SI pipeline, and it does not claim the global conservation properties of that literature. Section 7 states the coupled-constraint gap that follows from that choice.

### 2.6 The Gap
Prior velocity-level practice either (a) accepts Baumgarte energy gain, (b) hides the bounce with a second position pass, or (c) leaves the velocity-level stack for PBD/XPBD. Among the SI variants cited here, none apply an analytic PE/KE balance to the expected correction displacement $\Delta h$ at solver setup, for both contacts and joints, inside a single-pass impulse solver. That is the claim KRB makes.

---

## 3. The Solution: Kinematic Restitution Balancing
KRB performs an energy audit during constraint resolution via two independent corrections.

### 3.1 Component A: Force Velocity Compensation
With symplectic Euler, integration updates velocity before the constraint solve ($v_{solver} = v_t + a_{ext} \cdot \Delta t$), so restitution and joint bias see force-induced drift rather than the pre-force relative velocity. Track the per-body increment $v_{force} = a_{ext} \cdot \Delta t$ during integration and subtract it at setup to recover the true impact velocity before restitution or bias is applied:

$$v_{impact} = v_{relative} - (v_{force,B} - v_{force,A})$$

The correction is independent of the bias method. It calculates the constraint's corrective impulses relative to the force-induced velocity field.

### 3.2 Component B: Kinematic Energy Balancing
Consider a dynamic body against a static floor, contact normal $\mathbf{n}$ as in $v = (v_B - v_A)\cdot\mathbf{n}$, with center-of-mass motion along $\mathbf{n}$. If the position solver will raise the body by an expected distance $\Delta h$ (§3.3; predicted Baumgarte displacement this step, not the work of the impulses the solver actually applied), free-flight rewind to the surface is $v_{impact}^2 = v_{surf}^2 - 2(\mathbf{a}\cdot\mathbf{n})\Delta h$, hence $v_{surf}^2 = v_{impact}^2 + 2(\mathbf{a}\cdot\mathbf{n})\Delta h$. Equivalently, $\Delta E_p = -m(\mathbf{a}\cdot\mathbf{n}_{out})\Delta h$ taken from $\tfrac12 m v^2$ yields the same update: $\Delta(v^2) = -2\Delta E_p/m = 2(\mathbf{a}\cdot\mathbf{n}_{out})\Delta h$, so $m$ cancels. The implementation applies this identity to the relative normal speed with $\mathbf{a}_{rel} = \mathbf{a}_B - \mathbf{a}_A$ (Listing 1, `forceVn` $/$ $\Delta t$). That is the static-floor case when $\mathbf{a}_B = \mathbf{0}$. If both bodies share the same external acceleration, $\mathbf{a}_{rel} = \mathbf{0}$ and Component B is a no-op, consistent with an inverse-mass-weighted correction leaving pair-COM height unchanged. The identity does not include rotation, tangent motion, or impulse work; those residuals are the coupled-graph gap (§7). When available kinetic energy cannot pay the tax, clamp with $\max(0,\cdot)$ and apply restitution $v_{final} = e\, v_{surf}$:

$$v_{surf} = \sqrt{\max(0, v_{impact}^2 + 2 (\mathbf{a}_{rel} \cdot \mathbf{n}) \Delta h)}$$

For ground collisions ($\mathbf{a}_{rel} \cdot \mathbf{n} < 0$), Component B taxes launch velocity to pay for increased PE; for ceiling collisions ($\mathbf{a}_{rel} \cdot \mathbf{n} > 0$), it credits velocity for work against external forces.

### 3.3 Effective Displacement Prediction
$\Delta h$ in the Component B identity is a per-class *predictor* of this step's Baumgarte travel—not the full constraint error, and not a measurement of the impulses `solvePosition` actually applied. Contacts and distance joints share that identity; they do not share a predictor.

For bouncing contacts the velocity bias is restitution, so Component B predicts the later position pass. After slop $s$, the kinematic bounce $v_{launch} = -e \cdot v_{impact}$ partially resolves overlap before that pass. The remaining overlap is the effective depth:

$$d_{eff} = \max(0, (d - s) - (v_{launch} \cdot \Delta t))$$

That equation uses the pre-tax launch. Substituting the post-tax $v_{final} = e\,v_{surf}$ would make $\Delta h$ implicit; we keep the explicit predictor. On a ground tax, $|v_{final}| < |v_{launch}|$, so $d_{eff}$ is slightly low and the tax is slightly light---same sign as the original leak, and $O(\Gamma\,|a_{rel}|\Delta t/|v_{impact}|)$ when $d_{eff}$ is interior. If $v_{launch}\Delta t$ already clears $(d-s)$, then $d_{eff} = 0$ and there is no loop.

Many engines clamp per-iteration correction (e.g., `MAX_POSITION_CORRECTION`). The contact predictor is then:

$$\Delta h = \min(d_{eff}, \Delta h_{max}) \cdot \Gamma$$

Where $\Gamma = 1 - (1 - \beta)^n$ is the isolated geometric series (remaining error $\times(1-\beta)$ each iteration) over $n$ position iterations with factor $\beta$. It is not a fit to coupled NGS. When $d_{eff} > \Delta h_{max}$ every iteration, real travel is closer to $n\beta\Delta h_{max}$ than $\Gamma\Delta h_{max}$; the floor bounce does not hit that regime. Distance joints use the bias travel $\beta C$ (§4.2), not this $\Gamma$ formula.

---

## 4. Constraint-Specific Application

### 4.1 Unilateral Constraints (Collisions & Speculative)
For physical collisions, both **Component A and Component B** are required to balance the energy injected by the positional correction.

Speculative contacts, however, are created *before* overlap occurs to prevent high-speed objects from tunneling. In these cases, the penetration $d$ is negative ($d < 0$), representing a gap. Because the objects are not yet touching, **Component B is not required** ($\Delta h = 0$), as there is no position correction work to balance. However, **Component A remains critical**. Without it, speculative contacts would "see" gravity-induced velocity as part of the impact speed, causing objects to bounce off "thin air".

### 4.2 Bilateral Constraints (Joints) & The Zero-Velocity Paradox
Bilateral constraints (joints) aim to maintain a target relative velocity of zero. 

Early revisions of KRB suggested entirely omitting Component B for joints to prevent a "numerical dead zone" (the Zero-Velocity Paradox) where a joint "cannot afford the energy tax" to fix small position errors if the objects are at rest.

However, completely omitting Component B creates a subtle but persistent **energy leak**. When the positional solver (Baumgarte) performs work against gravity to correct joint stretch, doing so without a corresponding reduction in kinetic energy injects artificial energy into the system every frame. In oscillatory setups like a Newton's Cradle, this manifests as accumulated sway and instability.

To keep the joint from injecting that leak, **Component B must be applied to joints**, but capped so a resting constraint is not paralyzed. The ideal correction velocity $v_{bias} = \frac{\beta}{\Delta t} C(\mathbf{x})$ demands a kinetic energy cost of $v_{bias}^2$. If the work term implies we are fighting gravity, we must audit the energy:

$$v_{bias\_actual} = \sqrt{\max(0, v_{bias}^2 - 2 (\mathbf{a}_{rel} \cdot \mathbf{n}) (\beta C))}$$

The equation above is the Component B identity with joint predictor $\Delta h_{\mathrm{joint}} = \beta C$: the travel implied by $v_{bias} = \beta C / \Delta t$, not $\Gamma$ and not the position pass. Slop, the per-step $0.2$ clamp, and extra joint position iterations when contacts overlap are uncaptured PE work (already inside the cradle residual). If the available kinetic energy cannot pay the potential energy tax, the joint allows a microscopic amount of "Baumgarte sag." That prefers a bounded energy audit over infinite stiffness at rest—which is physically accurate, as a resting pendulum requires tension and a tiny amount of stretch to hang. This paper's setup recipe covers contacts and *distance* joints; other joint types are outside the listed implementation.

---

## 5. Implementation

KRB runs at contact and distance-joint `preSolve`, before the velocity iteration loop. Per dynamic body at integrate, store `forceVelocity = a_ext * dt` (two floats), with $a_{ext}$ from gravity and external force before linear damping; zero for sleeping or infinite-mass bodies.

### 5.1 Collisions (Component A + B)
The implementation requires storing $v_{force} = a_{ext} \cdot \Delta t$ per body during integration, then applying the correction during solver setup:

```
// Component A: True impact velocity
v_impact = v_relative - (v_force_B - v_force_A)

// Component B: Energy-balanced launch velocity  
v_bounce = -e * v_impact
d_eff = max(0, (depth - slop) - v_bounce * dt)
h_expected = min(d_eff, MAX_POSITION_CORRECTION) * cumulative_factor
v_surf = sqrt(max(0, (v_impact)² + 2 * dot(a_ext, n) * h_expected))
v_final = e * v_surf
```

### 5.2 Distance Joints (Component A + B)
For joints, we calculate the bias using both Component A and a modified Component B.

```cpp
// Component A: Force Velocity Compensation
float forceVn = (bodyB->forceVelocity - bodyA->forceVelocity).dot(normal);

// Theoretical ideal velocity needed to fix error
float v_bias_ideal = beta * C / dt;

// Component B: Energy Audit for the correction work
float expectedDisplacement = v_bias_ideal * dt; 
float accVn = forceVn / dt;
float workTerm = 2.0f * accVn * expectedDisplacement;

float v_bias_sq = v_bias_ideal * v_bias_ideal;
// Bidirectional energy audit
float adjusted_v_bias_sq = max(0.0f, v_bias_sq - workTerm);
float v_bias_actual = sqrt(adjusted_v_bias_sq);
// Force compensation (-forceVn) is folded into the bias here to avoid
// subtracting it from relative_vn during every solver iteration.
bias = (v_bias_ideal > 0 ? v_bias_actual : -v_bias_actual) - forceVn;

// During the iterative solve phase:
float relative_vn = v_relative.dot(normal);
float lambda = -mass * (relative_vn + bias);
```

---

## 6. Results
Four datasets: A–B $600\,\mathrm{s}$ energy; C KRB-on $8\,\mathrm{h}$ ($t = 28800\,\mathrm{s}$); D native `world.step()` wall-time. Figure 1 is a compile-time ablation of the Gearbox2D sequential-impulse solver: the default binary (KRB on) versus the same sources built with `-DGEARBOX_DISABLE_KRB`. Figure 2 places that KRB-on build next to unmodified Box2D-WASM, p2.js, and Matter.js. Dataset C traces are in `data/dataset-c/`; Dataset D in `data/timing/`. We do not report a patched-Box2D result. An earlier Box2D v3 port used an older revision of the method; those energy-gain and CPU-overhead numbers are withdrawn.

Energy results use $dt = 1/60$, $e = 1$, zero friction and damping, sleep off. Datasets A and C use stock `World()` plus `constants.h`: `velocity_iterations=8`, `position_iterations=3`, $\beta = 0.2$, `MAX_POSITION_CORRECTION=0.2`, slop $0.016$, restitution threshold $0.01`. Dataset B Gearbox2D rows are a native offline recapture (`logEnergy --format b`, translational $E/E_0$); Box2D-WASM, p2.js, and Matter.js remain unmodified whole-engine WASM traces. The ablation switch is full KRB on/off. Mechanical energy is $E = E_k + E_p$ (Datasets A and C include rotational KE; Dataset B is translational only); the reported ratio is $E/E_0$. Instantaneous samples alias the bounce; $60\,\mathrm{s}$ windowed means are the drift signal; the enclosure series uses $600\,\mathrm{s}$ windows of the $8\,\mathrm{h}$ trace.

| Set | Scene | Horizon | Surface | Outcome / metric |
| :--- | :--- | :--- | :--- | :--- |
| A | all | $600\,\mathrm{s}$ | native `log-energy` | Table A |
| B | floor, cradle | $600\,\mathrm{s}$ | offline Gearbox + WASM others | Table B |
| C | enclosure | $8\,\mathrm{h}$ | native `log-energy` | in box; 600 s win. $1.006 \to 0.976$ |
| C | cradle | $8\,\mathrm{h}$ | native `log-energy` | $E/E_0 \in [1.031, 1.074]$; mean $1.052$ |
| D | cradle + stack | timed steps | native `g++` | Table D |

### 6.1 Ablation (Dataset A)
Traces and the logger are in `data/*-{krb,nokrb}.csv` and `log-energy.cpp`.

![Figure 1. KRB on/off energy ablation.](figures/fig-energy-ablation.png)

**Figure 1.** Mechanical energy ratio over $600\,\mathrm{s}$. (a) Single elastic floor contact. (b) High-rate enclosure; KRB on is a 60 s windowed mean, KRB off is raw 1 Hz samples terminating at tunneling ($t = 2.7\,\mathrm{s}$). (c) Newton's cradle (coupled contacts and joints). Vector original: `figures/fig-energy-ablation.pdf`.

| Scene | KRB | $E/E_0$ at $600\,\mathrm{s}$ | Windowed mean | Outcome |
| :--- | :--- | ---: | :--- | :--- |
| Floor bounce | on | $0.999$ | $1.000$ | bounded |
| Floor bounce | off | $6.53$ | climbing | runaway |
| High-pressure circle | on | — | $1.00$ | stayed in box |
| High-pressure circle | off | — | — | escaped, step $161$ |
| Newton's cradle | on | $1.05$ | $1.05$ after $t=300$ | bounded offset |
| Newton's cradle | off | $1.79$ | climbing | secular gain |

Contact-only scenes match §1. With KRB, the floor bounce stays at $E/E_0 = 1.000 \pm 0.001$ in every 60 s window and never exceeds its start height. Without KRB the same drop gains about $0.55\,E_0$ per minute and finishes at $E/E_0 = 6.53$, with the apex 50 length units above the release. The high-pressure enclosure is the same leak at a higher impact rate: KRB window means stay at $1.00$ for the full run; without KRB the body leaves the box after $2.7\,\mathrm{s}$ at $E/E_0 \approx 10$. Instantaneous 1 Hz samples of the on-curve swing between $0.67$ and $1.33$ because they alias the bounce; the windowed mean is the drift signal.

The cradle is better with KRB but is not an invariant (Section 7). Without KRB, $E/E_0$ climbs from $1.00$ to $1.79$ and outer-ball peak height from $1.35$ to $2.43$. With KRB, energy sits slightly low ($\sim 0.96$) for four minutes, steps to $\sim 1.05$ around $t = 240$–$360\,\mathrm{s}$, then plateaus (windowed mean $1.05$ after $t=300$). That is a bounded offset, not the linear SI ramp.

### 6.2 Stock engines (Dataset B)
Figure 2 uses the same floor-bounce and cradle setups at 1 Hz of simulation time. Gearbox2D is the default KRB-on native recapture (`logEnergy --format b`). Box2D-WASM, p2.js, and Matter.js are unmodified website exports. Iteration counts and damping differ, so this is whole-engine context, not an in-engine KRB ablation. Traces are in `data/dataset-b-*-600s.csv`.

![Figure 2. Four-engine energy traces.](figures/fig-energy-engines.png)

**Figure 2.** Mechanical energy ratio over $600\,\mathrm{s}$. Gearbox2D is a native KRB-on recapture (translational meter); Box2D-WASM, p2.js, and Matter.js are unmodified website exports. (a) Elastic floor contact. (b) Newton's cradle. Vector original: `figures/fig-energy-engines.pdf`.

| Scene | Engine | $E/E_0$ at $600\,\mathrm{s}$ | Outcome |
| :--- | :--- | ---: | :--- |
| Floor bounce | Gearbox2D (KRB on) | $0.999$ | bounded |
| Floor bounce | Box2D-WASM | $6.61$ | runaway |
| Floor bounce | p2.js | $0.376$ | slow loss |
| Floor bounce | Matter.js | $\approx 0$ | dead by $t\approx 160\,\mathrm{s}$ |
| Newton's cradle | Gearbox2D (KRB on) | $1.051$ | bounded offset |
| Newton's cradle | Box2D-WASM | $0.221$ | stepped loss |
| Newton's cradle | p2.js | $0.320$ | slow loss |
| Newton's cradle | Matter.js | $\approx 0$ | dead by $t\approx 40\,\mathrm{s}$ |

The floor bounce is the contact leak from §1 in a production SI engine. Box2D-WASM climbs to $E/E_0 = 6.61$, matching Gearbox with KRB off ($6.53$) to a few percent. Gearbox with KRB on stays at $1.000 \pm 0.001$ in every 60 s window, as in Figure 1a. p2.js and Matter.js fail the other way: they dissipate, Matter reaching rest by $t\approx 160\,\mathrm{s}$.

The cradle is a different regime—elastic contacts plus joints—and the other engines lose energy rather than gain it. Matter is done by $t\approx 40\,\mathrm{s}$. Box2D-WASM falls in steps to $0.22$ (restitution velocity threshold plus Baumgarte on the rods). p2.js drains smoothly to $0.32$. Gearbox repeats Figure 1c: a step from $\sim 0.96$ to $\sim 1.05$ near four minutes, then a plateau.

### 6.3 Cost (Dataset D)
Per dynamic body, KRB stores `forceVelocity = a_ext * dt`; each contact or distance-joint `preSolve` adds a `forceVn` dot, optional $\Gamma$, a `workTerm`, one `sqrt`, and a bias update. There are no extra PGS, velocity, or position iterations. The table reports native `g++` on/off wall-time (`make log-timing`; `BENCH_FLAGS`: `-O3 -march=native -mfma -pthread -DGEARBOX_MT`). The stack is the contact-heavy scene and is not Dataset A. Traces and the logger are in `data/timing/timing-summary-{krb,nokrb}.csv` and `log-timing.cpp`.

| Scene | KRB on mean (range) ms/step | KRB off mean (range) ms/step |
| :--- | ---: | ---: |
| Newton's cradle | $0.051$ ($0.050$–$0.052$) | $0.052$ ($0.050$–$0.053$) |
| Large stack | $0.448$ ($0.445$–$0.453$) | $0.426$ ($0.419$–$0.432$) |

Paper scenes sit in timer scatter; the denser stack is about $+5\%$ mean `world.step()` with non-overlapping repeats, and that is whole-step wall time, not isolated `preSolve`.

---

## 7. Known Limitations
KRB is a per-constraint audit, not a coupled one: resolving one constraint can force work on another, as when a horizontal collision lifts a pendulum rod. In the Newton's cradle that shows up as a step from $\sim 0.96$ to $\sim 1.05$ near four minutes, after which $E/E_0$ stays in $[1.031, 1.074]$ (mean $1.052$) through $8\,\mathrm{h}$. The Dataset C enclosure stays in-box; $600\,\mathrm{s}$ windowed $E/E_0$ drifts $1.006 \to 0.976$, a slow loss of about $0.030\,E_0$ rather than the KRB-off SI gain of Figure 1b.

Energy results use the protocol in §6: single-pass SI/PGS, symplectic Euler, contacts and distance joints, $e = 1$, zero friction and damping, sleep off, and the stock `World()`/`constants.h` knobs. Friction, $e < 1$, other $dt$, and other iteration counts were not measured.

A coupled-constraint audit, tunneling, and long ill-conditioned chains remain future work, as do other integrators, hinge joints, and a switch to XPBD or TGS. Variational integrators [9] are a different claim.

---

## 8. Conclusion
KRB is a `preSolve` audit for sequential-impulse solvers [2]: Component A subtracts symplectic-Euler force drift from the impact velocity, and Component B taxes the expected correction $\Delta h$. Contact scenes in the Gearbox2D ablation stay bounded; the coupled-constraint gap is in Section 7.

---

## References

[1] J. Baumgarte, "Stabilization of Constraints and Integrals of Motion in Dynamical Systems," *Computer Methods in Applied Mechanics and Engineering*, vol. 1, no. 1, pp. 1–16, 1972. doi: [10.1016/0045-7825(72)90018-7](https://doi.org/10.1016/0045-7825(72)90018-7)

[2] E. Catto, "Iterative Dynamics with Temporal Coherence," presented at the Game Developers Conference, San Francisco, CA, 2005. [Online]. Available: https://box2d.org/files/ErinCatto_IterativeDynamics_GDC2005.pdf

[3] E. Catto, "Understanding Constraints," presented at the Game Developers Conference, San Francisco, CA, 2014. [Online]. Available: https://box2d.org/files/ErinCatto_UnderstandingConstraints_GDC2014.pdf

[4] E. Catto, "Solver2D," *Box2D*, Feb. 2024. [Online]. Available: https://box2d.org/posts/2024/02/solver2d/

[5] E. Catto, "Soft Constraints," presented at the Game Developers Conference, San Francisco, CA, 2011. [Online]. Available: https://box2d.org/files/ErinCatto_SoftConstraints_GDC2011.pdf

[6] M. Müller, B. Heidelberger, M. Hennix, and J. Ratcliff, "Position Based Dynamics," *Journal of Visual Communication and Image Representation*, vol. 18, no. 2, pp. 109–118, 2007. doi: [10.1016/j.jvcir.2007.01.005](https://doi.org/10.1016/j.jvcir.2007.01.005)

[7] M. Macklin, M. Müller, and N. Chentanez, "XPBD: Position-Based Simulation of Compliant Constrained Dynamics," in *Proc. 9th ACM SIGGRAPH Conference on Motion in Games (MIG)*, Burlingame, CA, 2016, pp. 49–54. doi: [10.1145/2994258.2994272](https://doi.org/10.1145/2994258.2994272)

[8] NVIDIA Corporation, "Rigid Body Dynamics," *PhysX SDK 5.4 Documentation*, 2024. [Online]. Available: https://nvidia-omniverse.github.io/PhysX/physx/5.4.1/docs/RigidBodyDynamics.html

[9] E. Hairer, C. Lubich, and G. Wanner, *Geometric Numerical Integration: Structure-Preserving Algorithms for Ordinary Differential Equations*, 2nd ed., Springer Series in Computational Mathematics, vol. 31. Berlin, Germany: Springer-Verlag, 2006. doi: [10.1007/3-540-30666-8](https://doi.org/10.1007/3-540-30666-8)

[10] J. Bender, K. Erleben, and J. Trinkle, "Interactive Simulation of Rigid Body Dynamics in Computer Graphics," *Computer Graphics Forum*, vol. 33, no. 1, pp. 246–270, 2014. doi: [10.1111/cgf.12272](https://doi.org/10.1111/cgf.12272)
