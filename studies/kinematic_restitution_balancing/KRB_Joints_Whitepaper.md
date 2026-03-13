**Author:** Joshua Sideris  
**Date:** March 13, 2026  
**Subject:** Extending Kinematic Restitution Balancing (KRB) to Bilateral Constraints (Joints)

# KRB for Joints: Eliminating Jitter and Stretching in Joint Chains
**A Low-Cost Analytical Fix for Energy Gain in Joint Constraints**

## 1. Introduction
While Kinematic Restitution Balancing (KRB) was originally derived for unilateral constraints (collisions), its principles apply equally to bilateral constraints (joints). In joint chains, numerical energy gain manifests as "jitter," "spaghetti-like" stretching, and instability in high-mass-ratio or high-gravity scenarios. This paper extends KRB to Distance and Hinge joints, offering a unified energy-conserving solver architecture.

---

## 2. The Problem: Energy Leaks in Joints

### 2.1 Force Integration Drift (Velocity Level)
In a Symplectic Euler solver, external forces (gravity) are integrated before joint resolution. For a joint at rest, the solver sees a non-zero velocity induced by gravity and applies an impulse to cancel it.
$$\mathbf{v}_{solver} = \mathbf{v}_t + \mathbf{a}_{ext} \Delta t$$
The joint constraint $\mathbf{J}\mathbf{v} = 0$ is solved against $\mathbf{v}_{solver}$, effectively "fighting" gravity every frame at the velocity level, which can lead to artificial stiffness or damping artifacts.

### 2.2 Potential Energy Injection (Position Level)
Joint drift (e.g., a hinge pulling apart) is typically resolved using Baumgarte stabilization:
$$v_{bias} = \frac{\beta}{\Delta t} C(\mathbf{x})$$
When the solver moves two bodies closer to resolve a gap $C$, it may move them against gravity, increasing the system's potential energy. Without a corresponding reduction in kinetic energy, this "free" energy converts to motion in subsequent frames, causing runaway jitter in long chains.

---

## 3. The Solution: KRB for Joints

### 3.1 Component A: Force-Neutral Joint Solving
We calculate the joint's corrective impulses relative to the force-induced velocity field. Instead of solving for $\dot{C} = 0$ where $\dot{C}$ is derived from $\mathbf{v}_{solver}$, we solve for a "force-neutral" state:
$$\dot{C}_{target} = \dot{C}_{impact} = \mathbf{J} (\mathbf{v}_{solver} - \mathbf{v}_{force})$$
where $\mathbf{v}_{force} = \mathbf{a}_{ext} \Delta t$. For a Distance Joint with normal $\mathbf{n}$, the scalar "force-neutral" velocity $v_{impact}$ is:
$$v_{impact} = (\mathbf{v}_B + \boldsymbol{\omega}_B \times \mathbf{r}_B - (\mathbf{v}_A + \boldsymbol{\omega}_A \times \mathbf{r}_A)) \cdot \mathbf{n} - (\mathbf{v}_{force,B} - \mathbf{v}_{force,A}) \cdot \mathbf{n}$$

### 3.2 Component B: Kinematic Energy Balancing (The "Joint Tax")
For joints utilizing Baumgarte stabilization, we apply the KRB energy audit. We "tax" the corrective impulse to pay for the work done over the displacement $\Delta h$. In joint constraints, $\Delta h$ corresponds to the geometric correction $\beta C$.

For a Distance Joint, the "balanced" bias velocity $v_{bias, balanced}$ replaces the standard Baumgarte term:
$$v_{bias, balanced} = \text{sgn}(C) \sqrt{\max(0, v_{bias}^2 - 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) (\beta C))}$$

This ensures that the energy injected by the position correction is perfectly balanced by a reduction in kinetic energy, preventing the "artificial heating" of the system.

---

## 4. Implementation in Gearbox2D

### 4.1 Distance Joint
```cpp
// Component A: Force Velocity Compensation
float forceVn = (bodyB->forceVelocity - bodyA->forceVelocity).dot(normal);

// Component B: Kinematic Energy Balancing
float beta = 0.2f;
float vB = beta * C / dt;
float accVn = forceVn / dt;
float vB_balanced_sq = vB * vB - 2.0f * accVn * (beta * C);
bias = (C > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vB_balanced_sq));
```

### 4.2 Hinge Joint (2D)
For multi-dimensional constraints like the Hinge Joint, the correction is applied component-wise to the bias vector by considering the work done along each axis.
```cpp
Vec2 forceVelDiff = bodyB->forceVelocity - bodyA->forceVelocity;
Vec2 accExt = forceVelDiff / dt;
float beta = 0.2f;
Vec2 vB = C * (beta / dt);
float vBx_balanced_sq = vB.x * vB.x - 2.0f * accExt.x * (beta * C.x);
float vBy_balanced_sq = vB.y * vB.y - 2.0f * accExt.y * (beta * C.y);
bias.x = (C.x > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vBx_balanced_sq));
bias.y = (C.y > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vBy_balanced_sq));
```

---

## 5. Results
Applying KRB to joint chains (e.g., a 10-link pendulum) results in:
1.  **Zero-G Jitter Elimination**: Chains at rest remain perfectly stationary regardless of solver iterations, as no spurious energy is injected during position correction.
2.  **Stiffness without Damping**: High-frequency oscillations in stiff springs are preserved rather than numerically damped by the force-integration drift.
3.  **Stability in High-Mass-Ratios**: KRB prevents the "spaghetti" stretching seen when a heavy body is hung from a light body, as the energy audit prevents geometric corrections from injecting runaway energy.

---

## 6. Conclusion
Kinematic Restitution Balancing is a universal correction for discrete physics solvers. By extending KRB to bilateral constraints, we achieve a level of stability and energy conservation previously reserved for expensive dual-pass solvers or specialized reduced-coordinate formulations, all while maintaining the performance profile of a standard Sequential Impulse solver.
