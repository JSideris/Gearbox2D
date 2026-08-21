# Plan:

## Solvers & Physics Loop
- [x] High-level physics loop implementation (`step`).
	- [x] Substepping (Velocity Substeps).
	- [x] Velocity Integration.
	- [x] Position Integration.
- [x] **Collision Solver** (Geometric Narrow Phase).
	- [x] Geometric intersection tests.
	- [x] Contact manifold generation (Point, Normal, Depth).
- [x] **Velocity Solver** (Sequential Impulse).
	- [x] Iterative solver for contact constraints.
	- [x] Friction resolution (Static & Kinetic).
	- [x] Warmstarting.
- [x] **Position Solver** (Non-linear Gauss-Seidel).
	- [x] Iterative penetration resolution.
	- [x] Baumgarte stabilization (with multi-fixture scaling).
- [x] **Joint Solver**.
	- [x] Pre-solve and solve phases.
	- [x] Integration with global iterative solver.

## Shapes, Kinematics, Collisions
- [x] Setup and test Rust w/ web assembly target.
- [x] Define basic starting classes for the physics module.
	- [x] RigidBody.
	- [x] Vec2.
- [x] Contain all objects in a world. Ability to add and remove objects to/from world.
- [x] Add a world tick.
- [ ] Ability to export raw data as a byte array.
- [x] Add debug visuals.
- [x] Add a few different shapes.
	- [x] AABB.
	- [x] Box.
	- [x] Capsule.
	- [x] Circle.
	- [x] Convex polygons.
	- [X] Concave polygons.
	- [ ] Edge (optional).
	- [x] Point.
- [x] Composite objects (Multi-fixture bodies).
- [x] Add rotations.
- [x] Compute/track AABB for each object.
- [x] Implement BVH.
- [x] Implement broad phase collision detection using BVH.
- [x] Implement narrow phase collision detection.
	- [x] AABB-AABB.
	- [x] Box-AABB -> Box-Box.
	- [x] Box-Box.
	- [x] Capsule-AABB.
	- [x] Capsule-Box.
	- [x] Capsule-Capsule.
	- [x] Circle-AABB.
	- [x] Circle-Box.
	- [x] Circle-Capsule.
	- [x] Circle-Circle.
	- [x] Polygon-AABB.
	- [x] Polygon-Box.
	- [x] Polygon-Capsule.
	- [x] Polygon-Circle.
	- [x] Polygon-Polygon.
	- [ ] Edge-AABB.
	- [ ] Edge-Box.
	- [ ] Edge-Capsule.
	- [ ] Edge-Circle.
	- [ ] Edge-Convex.
	- [ ] Edge-Edge.
	- [x] Point-AABB.
	- [x] Point-Box.
	- [x] Point-Capsule.
	- [x] Point-Circle.
	- [x] Polygon-Point.
	- [ ] Point-Edge.
	- [x] Point-Point.
- [x] Collision resolvers.
	- [x] **Collision Solver** (Geometric Narrow Phase).
		- [x] Geometric intersection tests.
		- [x] Contact manifold generation (Point, Normal, Depth).
	- [x] **Velocity Solver** (Sequential Impulse).
		- [x] Iterative solver for contact constraints.
		- [x] Friction resolution (Static & Kinetic).
		- [x] Warmstarting.
	- [x] **Position Solver** (Non-linear Gauss-Seidel).
		- [x] Iterative penetration resolution.
		- [x] Baumgarte stabilization (with multi-fixture scaling).
	- [x] **Joint Solver**.
		- [x] Pre-solve and solve phases.
		- [x] Integration with global iterative solver.
- [x] Implement collision events.
	- [X] Body-body collision events.
	- [X] Fixture-fixture collision events.
- [x] Define object types.
	- [x] Sensor.
	- [x] Physical.
	- [x] Fixed.
	- [X] Kinematic.
- [x] Implement an applyForce on objects.
- [x] Implement an applyImpulse on objects.
- [x] Implement an applyAngularImpulse on objects.
- [x] Determine and apply impulse for rigid body collisions with basic shapes.
- [X] Collision tracking.

## Constraints
- [x] Hinged.
- [x] Distance.
- [x] Spring.
- [x] Gear constraint.
	- [ ] Mechanical friction (optional).


## Interactions
- [x] Spatial picking (query BVH).
- [ ] Raycasting (planned).
- [ ] AABB queries (planned).

## Misc
- [x] Elasticity (restitution).
- [x] Static/dynamic friction.
- [x] Support changing the center of mass.
- [x] Live data buffers (Direct Wasm/TS memory mapping).
- [x] Per-fixture material properties (Friction, Restitution, Density).
- [ ] Squishy objects via per-object bias factor for Baumgarte stabilization (optional).


## Events
- [X] Events buffer.
- [X] Opt in per object.
- [X] On collision events.
	- [X] Return impulse.
- [X] On collision end events.
- [X] On sleep events.
- [X] On wake up.
- [ ] On pre-solve (optional).
- [ ] On post-solve (optional).

## Fluid Dynamics
- [X] Simple linear dampening.
- [X] Simple rotational dampening.
- [ ] Wind.
- [ ] Advanced drag.
- [ ] Under water / liquid.
	- [ ]  Bouancy.

## Optimizations

### General Optimizations
- [x] Cache inverse mass.
- [x] Cache inverse inertia.
- [x] Cache inverse dt.
- [x] Cache exponential decay factor when dt is set.
- [x] Implement collision masks.
- [X] Warmstarting.
- [ ] Focus areas & resolution.

### High-Fidelity Optimizations
- [X] Kinematic restitution balancing (novel).

### Broad Phase Optimizations
- [x] Broad phase using AABBs.
- [x] Do not recompute AABB when no movement happens.
- [ ] Stagger AABB recalculation when movement is slow.
- [x] Speed-dependant bounding area padding.
- [ ] Spin-dependant bounding area padding (optional).
- [x] Bounding volume hierarchy (BVH).
- [X] BVH heuristic biasing.
	- [x] BVH sleep biasing.
	- [x] BVH collision mask biasing (novel).
	- [X] BVH particle biasing.
	- [X] Static island biasing.
	- [X] Same-body biasing.
	- [X] Velocity biasing.
	- [X] Sensor biasing.
	- [ ] Experimentally fine-tune BVH biases.
- [ ] Rebalance BVH.
- [ ] Experimental: Caching previous broad-phase collisions.
- [ ] Experimental: Instead of reinserting on movement, consider tree traversal.
- [ ] Experimental: Consider combining the broad phase with the kinematics phase.

### Sleep Optimizations
- [x] Sleeping objects.
- [x] Islands.
- [x] Shrinkwrap AABB on sleep.
- [ ] Experimental: Separate vectors for sleeping/awake objects.
- [ ] Experimental: Re-insert into BVH upon sleep.
- [ ] Experimental: Sleep drift (sleeping at terminal velocity).

### Parallelization
#### SIMD Vectorization (WASM SIMD128)
- [x] SIMD-accelerated math library (2D dot, cross, rotate, etc.).
- [x] Vectorized global integrators (4-way SoA processing).
- [x] SIMD narrow-phase solvers (Circle-Circle, Box-Box, etc.).
- [x] SIMD BVH traversal (4/8-way bounding box tests).
- [x] SIMD constraint and joint solvers (batched solving).
- [x] Bulk world-data synchronization (vectorized vertex transforms).

#### Multi-threading
- [x] Persistent thread pool system.
- [x] Parallel island solver (concurrent independent islands).
- [x] Parallel narrow-phase detection (multi-threaded collision pairs).
- [ ] Parallel global integrators (gravity and motion updates).

## Advanced Features
- [x] Smart anti-tunelling (Speculative Contacts).
- [ ] Advanced drag.
- [ ] Forcefields.
- [ ] Microscopic scale.
- [ ] Galactic scales.
- [ ] Automatic handling for big world problem.
- [ ] Changing mass dynamically.
- [ ] Changing size dynamically (stretch goal)
- [ ] Snap nodes for complex objects (experimental).

## AI
- [ ] A*.
- [ ] A* biasing.
- [ ] A* advanced coordination.
- [ ] Precomputed nav mesh.
- [ ] High-performance sensors.
- [ ] Agent steering and movement.
- [ ] Local Navigation & Obsticle Avoidance (RVO/ORCA).
- [ ] Inverse Kinematics.
- [ ] Collision Prediction / Danger Maps (optional)

## Known Issues
- Spring joints can't be adjusted at runtime - see the commented-out spring test case.
- Bullet through paper is somewhat unreliable. Also affects the high-energy bounce benchmark, which is broken for Gearbox2d.
- Motorcycle example shows several issues. Back wheel sinks into the ground, and others. Likely a problem with KRB. Joints are also unstable.
- 20-Segment-Chain jitters automatically.
- Engine seems to have better performance in ST mode. Worth looking into this to re-evaluate whether MT is worth it.
- Slight jitter visible in the stacks benchmark. Might be possible to fix by making slight tweaks to some of the engine's constants.
- In the chain belt example, we can observe clipping and violent jitter. This was a regression likely introduced in mid Februrary 2026 while debugging other stability issues.