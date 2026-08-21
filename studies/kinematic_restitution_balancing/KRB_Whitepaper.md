**Author:** Joshua Sideris  
**Date:** January 17, 2026 (Updated August 21, 2026)  
**Subject:** Eliminating Artificial Energy Gain in Single-Pass Impulse Solvers via Kinematic Restitution Balancing

# Kinematic Restitution Balancing (KRB)
**A Low-Cost Analytical Fix for Energy Gain in Velocity-Level Impulse Solvers**

## Abstract
In discrete physics simulations using velocity-level impulse solvers (Sequential Impulse / Projected Gauss-Seidel), energy gain is a common numerical artifact. This paper introduces **Kinematic Restitution Balancing (KRB)**, a per-constraint correction for that leak in both unilateral constraints (collisions) and bilateral constraints (joints). By compensating for force-induced velocity drift (Component A) and auditing potential-energy shifts during position correction (Component B), KRB removes the two usual analytic energy sources inside a single-pass SI/PGS pipeline, without a second position pass. It does not claim a global energy invariant; Section 7 states the coupled-constraint gap that follows from the per-constraint audit.

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
Prior velocity-level practice either (a) accepts Baumgarte energy gain, (b) hides the bounce with a second position pass, or (c) leaves the velocity-level stack for PBD/XPBD. To our knowledge, none of these apply an analytic PE/KE balance to the expected correction displacement $\Delta h$ at solver setup, for both contacts and joints, inside a single-pass impulse solver. That is the claim KRB makes.

---

## 3. The Solution: Kinematic Restitution Balancing
KRB performs an energy audit during constraint resolution via two independent corrections.

### 3.1 Component A: Force Velocity Compensation
We track the velocity increment from external forces during integration ($v_{force} = a_{ext} \cdot \Delta t$) and compute the true relative velocity:

$$v_{impact} = v_{relative} - (v_{force,B} - v_{force,A})$$

This correction applies to **all constraints** whenever Symplectic Euler integration is used, independent of the bias method. It calculates the constraint's corrective impulses relative to the force-induced velocity field.

### 3.2 Component B: Kinematic Energy Balancing
We adjust the launch velocity to account for work done by external forces over the correction displacement $\Delta h$. We conceptually rewind the object to the surface to find the true surface velocity, and then apply the lossy restitution bounce:

$$v_{surf} = \sqrt{\max(0, v_{impact}^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h)}$$

Yielding a final velocity of:

$$v_{final} = e \cdot v_{surf} = e \sqrt{\max(0, v_{impact}^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h)}$$

The equation is symmetric: ground collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} < 0$) tax the launch velocity to pay for increased PE, while ceiling collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} > 0$) boost it to account for work done against external forces.

### 3.3 Effective Displacement Prediction
In solvers that use split impulse or an equivalent decoupled position pass (Sequential Impulse followed by Position Iterations), the energy audit must account for the temporal separation between the velocity and position phases. Specifically, the kinematic bounce velocity $v_{launch}$ partially resolves the penetration $d$ during the subsequent integration step before the position solver operates:

$$d_{eff} = \max(0, d - (v_{launch} \cdot \Delta t))$$

Furthermore, many solvers clamp the position correction per iteration to $\Delta h_{max}$ (e.g., `0.2f`). To ensure the energy audit remains consistent with the physical work performed, the balancing term must respect these constraints:

$$\Delta h = \min(d_{eff}, \Delta h_{max}) \cdot \Gamma$$

Where $\Gamma$ is the cumulative correction factor ($1 - (1 - \beta)^n$) for $n$ iterations with Baumgarte factor $\beta$.

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

$$v_{bias\_actual} = \sqrt{\max(0, v_{bias}^2 - 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) (\beta C))}$$

If the available kinetic energy cannot pay the potential energy tax, the joint allows a microscopic amount of "Baumgarte sag." That prefers a bounded energy audit over infinite stiffness at rest—which is physically accurate, as a resting pendulum requires tension and a tiny amount of stretch to hang.

---

## 5. Implementation

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
The observations below are from the Gearbox2D implementation. We do not report a patched-Box2D result. An earlier Box2D v3 port used an older revision of the method; those energy-gain and CPU-overhead numbers are withdrawn.

Long-horizon traces against unmodified Box2D, Matter, and p2 — and a KRB on/off ablation — are being collected with the project benchmark harness and will replace the qualitative notes here.

1.  **Stable collisions:** Elastic contacts at $e=1.0$ with no damping remain height-bounded over long runs. The usual SI per-frame energy gain does not appear.
2.  **Zero-G jitter:** Joint chains at rest remain stationary regardless of solver iterations, as no spurious force drift must be corrected at the velocity level.
3.  **Stiffness without damping:** High-frequency oscillations in stiff springs are preserved rather than numerically damped by force-integration drift.

---

## 7. Known Limitations
KRB is a per-constraint audit, not a coupled one. When resolving one constraint (for example a horizontal collision) forces a second constraint to do work against gravity (for example a pendulum rod lifting the body), the isolated PE/KE tax may miss the systemic change in potential energy.

Newton's cradle is that coupled case: elastic contacts plus joints doing gravity work. In the Gearbox2D cradle we do not observe a practical leak over long runs (hours). That is an empirical bound for this scene, not a proof. We have not shown the same bound for arbitrary contact/joint graphs, and we do not claim a global energy invariant of the kind variational integrators provide [9].

A coupled-constraint audit is future work. High-speed tunneling, long ill-conditioned chains, and other scenes that fail for reasons other than the two leaks in §1 are outside the claim.

---

## 8. Conclusion
Kinematic Restitution Balancing is a drop-in correction for velocity-level sequential-impulse solvers [2]. Component A removes force-integration drift from restitution and joint bias; Component B taxes (or credits) the launch or bias velocity for the potential-energy work of the expected correction displacement $\Delta h$. Both apply to contacts and joints, at the cost of a few extra scalars per constraint setup.

That is a narrower claim than a dual-pass solver or a reduced-coordinate formulation. Split impulse and NGS [3], [4], [8] still hide Baumgarte bounce by keeping position work off the physical velocity; KRB does not replace that machinery, and it does not match their convergence behavior. It cancels the two analytic leaks in §1 inside a single-pass SI profile, with the coupled-constraint gap in Section 7 left open.

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
