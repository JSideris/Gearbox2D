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
	- [ ] Capsule.
	- [x] Circle.
	- [ ] Concave polygons.
	- [ ] Convex polygons.
	- [ ] Ellipse.
	- [ ] Line.
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
	- [ ] Capsule-AABB.
	- [ ] Capsule-Box.
	- [ ] Capsule-Capsule.
	- [x] Circle-AABB.
	- [ ] Circle-Box.
	- [ ] Circle-Capsule.
	- [x] Circle-Circle.
	- [ ] Convex-AABB.
	- [ ] Ellipse-Convex.
	- [ ] Ellipse-Ellipse.
	- [ ] Line-AABB.
	- [ ] Line-Box.
	- [ ] Line-Capsule.
	- [ ] Line-Circle.
	- [ ] Line-Concave.
	- [ ] Line-Convex.
	- [ ] Line-Ellipse.
	- [ ] Line-Line.
	- [x] Point-AABB.
	- [x] Point-Box.
	- [ ] Point-Capsule.
	- [x] Point-Circle.
	- [ ] Point-Concave.
	- [ ] Point-Convex.
	- [ ] Point-Ellipse.
	- [ ] Point-Line.
	- [x] Point-Point.
	- [ ] Convave polygons?
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
- [ ] Determine and apply impulse for convex polygons.
- [ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
- [X] Collision tracking.

## Constraints
- [x] Hinged.
- [x] Distance.
- [x] Spring.
- [x] Gear constraint.
	- [ ] Mechanical friction (optional).


## Interactions
- [x] Spatial picking (query BVH).

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
- [ ] Spin-dependant bounding area padding.
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
- [ ] Islands.
- [x] Shrinkwrap AABB on sleep.
- [ ] Experimental: Separate vectors for sleeping/awake objects.
- [ ] Experimental: Re-insert into BVH upon sleep.
- [ ] Experimental: Sleep drift (sleeping at terminal velocity).

### Parallelization (Do Last)
- [ ] Find opportunities to optimize using SIMD.
- [ ] Find opportunities to optimize using multi-threading.

## Advanced Features
- [ ] Smart anti-tunelling.
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
- Piles of objects don't go to sleep as easily as they should (regression).
- Spring joints can't be adjusted at runtime - see the commented-out spring test case.