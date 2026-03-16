**Author:** Joshua Sideris  
**Date:** January 17, 2026  
**Subject:** Eliminating Artificial Energy Gain in Single-Pass Impulse Solvers via Kinematic Restitution Balancing

# Kinematic Restitution Balancing (KRB)
**A Low-Cost Analytical Fix for Energy Gain in Velocity-Level Impulse Solvers**

## Abstract
In discrete physics simulations using velocity-level impulse solvers (Sequential Impulse / Projected Gauss-Seidel), energy gain is a common numerical artifact. This paper introduces **Kinematic Restitution Balancing (KRB)**, a method for eliminating energy gain by analytically compensating for force-induced velocity drift and potential energy shift during position correction. KRB achieves energy conservation comparable to dual-pass solvers at a fraction of the computational cost.

---

## 1. The Problem: Artificial Energy Sources
In a standard velocity-level impulse solver, two sources contribute to artificial mechanical energy gain during collision:

### 1.1 External Force Integration Drift
Most engines use Symplectic Euler integration where velocity is updated before collision resolution:

$$v_{solver} = v_{t} + a_{ext} \cdot \Delta t$$

Restitution logic sees $v_{solver}$ instead of the true impact velocity $v_{impact}$. For a perfect bounce ($e=1.0$), the launch velocity becomes $-(v_{t} + a_{ext} \cdot \Delta t)$, gaining $a_{ext} \cdot \Delta t$ extra speed per frame.

### 1.2 Potential Energy Shift from Position Correction
Overlap resolution (Baumgarte stabilization, soft constraints) displaces objects by $\Delta h$ to resolve penetration. This displacement increases potential energy ($mgh$) without reducing kinetic energy. The added PE converts to KE on subsequent frames, causing runaway energy growth.

---

## 2. The Solution: Kinematic Restitution Balancing
KRB performs an energy audit during collision resolution via two independent corrections.

### 2.1 Component A: Force Velocity Compensation
We track the velocity increment from external forces during integration ($v_{force} = a_{ext} \cdot \Delta t$) and compute the true impact velocity:

$$v_{impact} = v_{relative} - (v_{force,B} - v_{force,A})$$

This correction applies whenever Symplectic Euler integration is used, independent of bias method.

### 2.2 Component B: Kinematic Energy Balancing
We adjust the launch velocity to account for work done by external forces over the correction displacement $\Delta h$:

We conceptually rewind the object to the surface to find the true surface velocity, and then apply the lossy restitution bounce:

$$v_{surf} = \sqrt{\max(0, v_{impact}^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h)}$$

Yielding a final velocity of:

$$v_{final} = e \cdot v_{surf} = e \sqrt{\max(0, v_{impact}^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h)}$$

The equation is symmetric: ground collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} < 0$) tax the launch velocity to pay for increased PE, while ceiling collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} > 0$) boost it to account for work done against external forces.

### 2.3 Effective Displacement Prediction
In solvers where position correction is decoupled from velocity (e.g., Sequential Impulse followed by Position Iterations), the energy audit must account for the temporal separation between the velocity and position phases. Specifically, the kinematic bounce velocity $v_{launch}$ partially resolves the penetration $d$ during the subsequent integration step before the position solver operates:

$$d_{eff} = \max(0, d - (v_{launch} \cdot \Delta t))$$

Furthermore, many solvers clamp the position correction per iteration to $\Delta h_{max}$ (e.g., `0.2f`). To ensure the energy audit remains consistent with the physical work performed, the balancing term must respect these constraints:

$$\Delta h = \min(d_{eff}, \Delta h_{max}) \cdot \Gamma$$

Where $\Gamma$ is the cumulative correction factor ($1 - (1 - \beta)^n$) for $n$ iterations with Baumgarte factor $\beta$.

### 2.4 Application to Speculative Contacts (Anti-Tunneling)
Speculative contacts are created *before* overlap occurs to prevent high-speed objects from tunneling. In these cases, the penetration $d$ is negative ($d < 0$), representing a gap.

Because the objects are not yet touching, **Component B (Kinematic Energy Balancing) is not required** ($\Delta h = 0$), as there is no position correction work to balance. However, **Component A (Force Velocity Compensation) remains critical**. Without it, speculative contacts would "see" gravity-induced velocity as part of the impact speed, causing objects to bounce off "thin air" before they even reach the surface.

To maintain physical fidelity with speculative contacts:
1. Use Component A to find the true impact velocity relative to the next frame.
2. Apply restitution if the predicted overlap exceeds the restitution threshold.
3. Ensure the final velocity $v_{final}$ satisfies the anti-tunneling constraint: $v_{final} \ge \max(v_{bounce}, d / \Delta t)$.

---

## 3. Implementation
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

---

## 4. Results
Unlike dual-pass solvers requiring $O(2N)$ iterations, KRB operates in $O(1)$ additional time per contact.

In tests using Box2D v3 with Baumgarte stabilization, KRB eliminated the ~0.01% per-frame energy gain observed in standard SI/TGS solvers, maintaining stability over thousands of frames at $e=1.0$. Measured CPU overhead was <2% of total solver time in a "Many Pyramids" benchmark.

---

## 5. Conclusion
Kinematic Restitution Balancing provides a low-cost energy conservation correction for velocity-level impulse solvers. By decomposing the fix into force velocity compensation (Component A) and kinematic energy balancing (Component B), KRB can be applied fully or partially depending on solver configuration, enabling stable high-restitution simulations on performance-constrained platforms.