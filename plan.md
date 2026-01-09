# Plan:

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
- [ ] Composite objects.
- [x] Add rotations.
- [x] Compute/track AABB for each object.
- [x] Implement VBH.
- [x] Implement broad phase collision detection using BVH.
- [ ] Implement narrow phase collision detection.
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
	- [ ] Convex-Box.
	- [ ] Convex-Capsule.
	- [ ] Convex-Circle.
	- [ ] Convex-Convex.
	- [ ] Concave-AABB.
	- [ ] Concave-Box.
	- [ ] Concave-Capsule. 
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
	- [x] Penetration resolution.
	- [x] Collision impulse.
	- [x] Collision friction.
- [ ] Implement collision events.
- [x] Define object types.
	- [x] Sensor.
	- [x] Physical.
	- [x] Fixed.
	- [ ] Kinematic. Maybe.
- [x] Implement an applyForce on objects.
- [x] Implement an applyImpulse on objects.
- [x] Implement an applyAngularImpulse on objects.
- [x] Determine and apply impulse for rigid body collisions with basic shapes.
- [ ] Determine and apply impulse for convex polygons.
- [ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
- [ ] Collision tracking.

## Constraints
- [x] Hinged.
- [x] Distance.
- [x] Spring.
- [x] Gear constraint.

## Interactions
- [x] Spatial picking (query BVH).

## Misc
- [x] Elasticity (restitution).
- [x] Static/dynamic friction.
- [ ] Support changing the center of mass.


## Events
- [X] Events buffer.
- [X] Opt in per object.
- [X] On collision events.
	- [ ] Return impulse.
- [X] On collision end events.
- [ ] On sleep events.
- [ ] On wake up.
- [ ] On pre-solve (optional).
- [ ] On post-solve (optional).

## Fluid Dynamics
- [ ] Wind.
- [ ] Advanced drag.
- [ ] Under water / liquid.
	- [ ]  Bouancy.

## Optimizations

### General Optimizations
- [x] Cache inverse mass.
- [ ] Cache inverse inertia.
- [ ] Cache inverse dt.
- [x] Cache exponential decay factor when dt is set.
- [x] Implement collision masks.
- [ ] Focus areas & resolution.

### Broad Phase Optimizations
- [x] Broad phase using AABBs.
- [x] Do not recompute AABB when no movement happens.
- [ ] Stagger AABB recalculation when movement is slow.
- [x] Speed-dependant bounding area padding.
- [ ] Spin-dependant bounding area padding.
- [x] Bounding volume hierarchy (BVH).
- [x] BVH sleep biasing.
- [ ] BVH particle biasing.
- [x] BVH collision mask biasing (novel).
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