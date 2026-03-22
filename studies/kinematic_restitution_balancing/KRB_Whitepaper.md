**Author:** Joshua Sideris  
**Date:** January 17, 2026 (Updated March 22, 2026)  
**Subject:** Eliminating Artificial Energy Gain in Single-Pass Impulse Solvers via Kinematic Restitution Balancing

# Kinematic Restitution Balancing (KRB)
**A Low-Cost Analytical Fix for Energy Gain in Velocity-Level Impulse Solvers**

## Abstract
In discrete physics simulations using velocity-level impulse solvers (Sequential Impulse / Projected Gauss-Seidel), energy gain is a common numerical artifact. This paper introduces **Kinematic Restitution Balancing (KRB)**, a unified framework for eliminating energy gain in both unilateral constraints (collisions) and bilateral constraints (joints). By analytically compensating for force-induced velocity drift (Component A) and properly auditing potential energy shifts during position correction (Component B), KRB achieves energy conservation comparable to dual-pass solvers at a fraction of the computational cost.

---

## 1. The Problem: Artificial Energy Sources
In a standard velocity-level impulse solver, two sources contribute to artificial mechanical energy gain during constraint resolution:

### 1.1 External Force Integration Drift
Most engines use Symplectic Euler integration where velocity is updated before constraint resolution:

$$v_{solver} = v_{t} + a_{ext} \cdot \Delta t$$

Restitution and joint logic see $v_{solver}$ instead of the true relative velocity $v_{impact}$. For a perfect bounce ($e=1.0$), the launch velocity becomes $-(v_{t} + a_{ext} \cdot \Delta t)$, gaining $a_{ext} \cdot \Delta t$ extra speed per frame. For a joint at rest, the solver sees a non-zero velocity induced by gravity and applies an impulse to cancel it, effectively "fighting" gravity every frame at the velocity level, which can lead to artificial stiffness or damping artifacts.

### 1.2 Potential Energy Shift from Position Correction
Overlap and joint error resolution (Baumgarte stabilization, soft constraints) displaces objects by $\Delta h$ to resolve penetration or joint drift. This displacement increases potential energy ($mgh$) without reducing kinetic energy. The added PE converts to KE on subsequent frames, causing runaway energy growth, which manifests as bouncing after a collision or runaway jitter in long joint chains.

---

## 2. The Solution: Kinematic Restitution Balancing
KRB performs an energy audit during constraint resolution via two independent corrections.

### 2.1 Component A: Force Velocity Compensation
We track the velocity increment from external forces during integration ($v_{force} = a_{ext} \cdot \Delta t$) and compute the true relative velocity:

$$v_{impact} = v_{relative} - (v_{force,B} - v_{force,A})$$

This correction applies to **all constraints** whenever Symplectic Euler integration is used, independent of the bias method. It calculates the constraint's corrective impulses relative to the force-induced velocity field.

### 2.2 Component B: Kinematic Energy Balancing
We adjust the launch velocity to account for work done by external forces over the correction displacement $\Delta h$. We conceptually rewind the object to the surface to find the true surface velocity, and then apply the lossy restitution bounce:

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

---

## 3. Constraint-Specific Application

### 3.1 Unilateral Constraints (Collisions & Speculative)
For physical collisions, both **Component A and Component B** are required to balance the energy injected by the positional correction.

Speculative contacts, however, are created *before* overlap occurs to prevent high-speed objects from tunneling. In these cases, the penetration $d$ is negative ($d < 0$), representing a gap. Because the objects are not yet touching, **Component B is not required** ($\Delta h = 0$), as there is no position correction work to balance. However, **Component A remains critical**. Without it, speculative contacts would "see" gravity-induced velocity as part of the impact speed, causing objects to bounce off "thin air".

### 3.2 Bilateral Constraints (Joints) & The Zero-Velocity Paradox
Bilateral constraints (joints) aim to maintain a target relative velocity of zero. 

**Crucially, Component B (Kinematic Energy Balancing) cannot be applied to bilateral constraints.**

In a joint, the positional bias $v_{bias} = \frac{\beta}{\Delta t} C(\mathbf{x})$ is proportional to the geometric error $C$. Therefore, the quadratic term $v_{bias}^2$ is $O(C^2)$. The energy tax term $2 (\mathbf{a}_{ext} \cdot \mathbf{n}) (\beta C)$ is $O(C)$. 

For any small geometric error $C$, the linear tax term is mathematically guaranteed to be larger than the quadratic correction energy ($v_{bias}^2$). Applying the Component B square-root formula ($\sqrt{v^2 - tax}$) to a zero-velocity constraint results in a negative value inside the square root, which is clamped to zero. This creates a **numerical dead zone** where the joint is paralyzed and ignores small errors because it "cannot afford the energy tax" to fix them.

Therefore, for bilateral constraints where the target relative velocity is zero, **Component B is satisfied implicitly by Component A**, as the position correction $\beta C$ is a kinematic displacement and not a physical restitution. Applying a quadratic energy tax to a zero-velocity constraint is a theoretical error. Joints *only* require Component A (Force-Neutral Joint Solving) to eliminate gravity drift and achieve stability.

---

## 4. Implementation

### 4.1 Collisions (Component A + B)
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

### 4.2 Distance Joints (Component A Only)
For joints, we calculate the bias using only Component A.

```cpp
// Component A: Force Velocity Compensation (Extract the gravity drift)
float forceVn = (bodyB->forceVelocity - bodyA->forceVelocity).dot(normal);

// The actual relative velocity to correct against
float Cdot = v_relative.dot(normal);
float relative_vn = Cdot - forceVn;

// Calculate the Baumgarte bias normally, without Component B
float C = dMag - length;
float bias = beta * C / dt;

// The lambda solved for will naturally account for the force-neutral state
float lambda = -mass * (relative_vn + bias);
```

---

## 5. Results
Applying the unified KRB framework yields significant improvements across the engine:

1.  **Stable Collisions:** In tests using Box2D v3 with Baumgarte stabilization, KRB eliminated the ~0.01% per-frame energy gain observed in standard SI/TGS solvers, maintaining stability over thousands of frames at $e=1.0$. Measured CPU overhead was <2% of total solver time in a "Many Pyramids" benchmark.
2.  **Zero-G Jitter Elimination in Joints:** Joint chains at rest remain perfectly stationary regardless of solver iterations, as no spurious force drift must be corrected at the velocity level.
3.  **Stiffness without Damping:** High-frequency oscillations in stiff springs are preserved rather than numerically damped by force-integration drift.

---

## 6. Conclusion
Kinematic Restitution Balancing is a universal correction for discrete physics solvers. By decomposing the fix into force velocity compensation (Component A) and kinematic energy balancing (Component B), KRB can be applied accurately to both unilateral and bilateral constraints. It provides a level of stability and energy conservation previously reserved for expensive dual-pass solvers or specialized reduced-coordinate formulations, all while maintaining the performance profile of a standard Sequential Impulse solver.
