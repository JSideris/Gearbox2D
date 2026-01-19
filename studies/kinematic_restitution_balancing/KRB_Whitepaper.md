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

$$v_{launch}^2 = (e \cdot v_{impact})^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h$$

Yielding:

$$v_{final} = \sqrt{\max(0, (e \cdot v_{impact})^2 + 2 (\mathbf{a}_{ext} \cdot \mathbf{n}) \Delta h)}$$

The equation is symmetric: ground collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} < 0$) tax the launch velocity to pay for increased PE, while ceiling collisions ($\mathbf{a}_{ext} \cdot \mathbf{n} > 0$) boost it to account for work done against external forces.

This correction applies to bias methods that produce physical displacement (Baumgarte, soft constraints). Methods that decouple position correction from velocity (split impulse, speculative contacts) do not require Component B, though Component A remains applicable.

---

## 3. Implementation
The implementation requires storing $v_{force} = a_{ext} \cdot \Delta t$ per body during integration, then applying the correction during solver setup:

```
// Component A: True impact velocity
v_impact = v_relative - (v_force_B - v_force_A)

// Component B: Energy-balanced launch velocity  
v_final = sqrt(max(0, (e * v_impact)² + 2 * dot(a_ext, n) * Δh))
```

---

## 4. Results
Unlike dual-pass solvers requiring $O(2N)$ iterations, KRB operates in $O(1)$ additional time per contact.

In tests using Box2D v3 with Baumgarte stabilization, KRB eliminated the ~0.01% per-frame energy gain observed in standard SI/TGS solvers, maintaining stability over thousands of frames at $e=1.0$. Measured CPU overhead was <2% of total solver time in a "Many Pyramids" benchmark.

---

## 5. Conclusion
Kinematic Restitution Balancing provides a low-cost energy conservation correction for velocity-level impulse solvers. By decomposing the fix into force velocity compensation (Component A) and kinematic energy balancing (Component B), KRB can be applied fully or partially depending on solver configuration, enabling stable high-restitution simulations on performance-constrained platforms.