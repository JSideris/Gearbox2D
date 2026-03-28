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

Early revisions of KRB suggested entirely omitting Component B for joints to prevent a "numerical dead zone" (the Zero-Velocity Paradox) where a joint "cannot afford the energy tax" to fix small position errors if the objects are at rest.

However, completely omitting Component B creates a subtle but persistent **energy leak**. When the positional solver (Baumgarte) performs work against gravity to correct joint stretch, doing so without a corresponding reduction in kinetic energy injects artificial energy into the system every frame. In oscillatory setups like a Newton's Cradle, this manifests as accumulated sway and instability.

To preserve perfect energy conservation, **Component B must be applied to joints**, but capped to avoid completely paralyzing the joint. The ideal correction velocity $v_{bias} = \frac{\beta}{\Delta t} C(\mathbf{x})$ demands a kinetic energy cost of $v_{bias}^2$. If the work term implies we are fighting gravity, we must audit the energy:

$$v_{bias\_actual} = \sqrt{\max(0, v_{bias}^2 - 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) (\beta C))}$$

If the available kinetic energy cannot pay the potential energy tax, the joint allows a microscopic amount of "Baumgarte sag." This prioritizes perfect global energy conservation over infinite stiffness at rest—which is physically accurate, as a resting pendulum requires tension and a tiny amount of stretch to hang.

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

### 4.2 Distance Joints (Component A + B)
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
bias = (v_bias_ideal > 0 ? v_bias_actual : -v_bias_actual) - forceVn;

float relative_vn = v_relative.dot(normal) - forceVn;
float lambda = -mass * (relative_vn + bias);
```

---

## 5. Results
Applying the unified KRB framework yields significant improvements across the engine:

1.  **Stable Collisions:** In tests using Box2D v3 with Baumgarte stabilization, KRB eliminated the ~0.01% per-frame energy gain observed in standard SI/TGS solvers, maintaining stability over thousands of frames at $e=1.0$. Measured CPU overhead was <2% of total solver time in a "Many Pyramids" benchmark.
2.  **Zero-G Jitter Elimination in Joints:** Joint chains at rest remain perfectly stationary regardless of solver iterations, as no spurious force drift must be corrected at the velocity level.
3.  **Stiffness without Damping:** High-frequency oscillations in stiff springs are preserved rather than numerically damped by force-integration drift.

---

## 6. Known Limitations
KRB currently audits energy on a per-constraint basis. In scenarios where resolving one constraint (e.g., a horizontal collision) forces a secondary constraint to perform work against gravity (e.g., a pendulum joint pulling an object upward), the isolated audit may fail to account for the total systemic change in potential energy, resulting in minor energy leaks. This represents an area for future research into coupled-constraint energy auditing.

---

## 7. Conclusion
Kinematic Restitution Balancing is a universal correction for discrete physics solvers. By decomposing the fix into force velocity compensation (Component A) and kinematic energy balancing (Component B), KRB can be applied accurately to both unilateral and bilateral constraints. It provides a level of stability and energy conservation previously reserved for expensive dual-pass solvers or specialized reduced-coordinate formulations, all while maintaining the performance profile of a standard Sequential Impulse solver.
