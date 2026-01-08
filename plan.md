# Plan:

## Shapes, Kinematics, Collisions
[*] Setup and test Rust w/ web assembly target.
[*] Define basic starting classes for the physics module.
	[*] RigidBody.
	[*] Vec2.
[*] Contain all objects in a world. Ability to add and remove objects to/from world.
[*] Add a world tick.
[ ] Ability to export raw data as a byte array.
[*] Add debug visuals.
[*] Add a few different shapes.
	[*] AABB.
	[*] Box.
	[ ] Capsule.
	[*] Circle.
	[ ] Concave polygons.
	[ ] Convex polygons.
	[ ] Ellipse.
	[ ] Line.
	[*] Point.
[ ] Composite objects.
[*] Add rotations.
[*] Compute/track AABB for each object.
[*] Implement VBH.
[*] Implement broad phase collision detection using BVH.
[ ] Implement narrow phase collision detection.
	[*] AABB-AABB.
	[*] Box-AABB -> Box-Box.
	[*] Box-Box.
	[ ] Capsule-AABB.
	[ ] Capsule-Box.
	[ ] Capsule-Capsule.
	[*] Circle-AABB.
	[ ] Circle-Box.
	[ ] Circle-Capsule.
	[*] Circle-Circle.
	[ ] Convex-AABB.
	[ ] Convex-Box.
	[ ] Convex-Capsule.
	[ ] Convex-Circle.
	[ ] Convex-Convex.
	[ ] Concave-AABB.
	[ ] Concave-Box.
	[ ] Concave-Capsule.
	[ ] Concave-Circle.
	[ ] Concave-Convex.
	[ ] Ellipse-AABB.
	[ ] Ellipse-Box.
	[ ] Ellipse-Capsule.
	[ ] Ellipse-Circle.
	[ ] Ellipse-Concave.
	[ ] Ellipse-Convex.
	[ ] Ellipse-Ellipse.
	[ ] Line-AABB.
	[ ] Line-Box.
	[ ] Line-Capsule.
	[ ] Line-Circle.
	[ ] Line-Concave.
	[ ] Line-Convex.
	[ ] Line-Ellipse.
	[ ] Line-Line.
	[*] Point-AABB.
	[*] Point-Box.
	[ ] Point-Capsule.
	[*] Point-Circle.
	[ ] Point-Concave.
	[ ] Point-Convex.
	[ ] Point-Ellipse.
	[ ] Point-Line.
	[*] Point-Point.
	Convave polygons?
[*] Collision resolvers.
	[*] Penetration resolution.
	[*] Collision impulse.
	[*] Collision friction.
[ ] Implement collision events.
[*] Define object types.
	[*] Sensor.
	[*] Physical.
	[*] Fixed.
	[ ] Kinematic. Maybe.
[*] Implement an applyForce on objects.
[*] Implement an applyImpulse on objects.
[*] Implement an applyAngularImpulse on objects.
[*] Determine and apply impulse for rigid body collisions with basic shapes.
[ ] Determine and apply impulse for convex polygons.
[ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
[ ] Collision tracking.

## Constraints
[*] Hinged.
[*] Distance.
[*] Spring.
[*] Gear constraint.

## Interactions
[*] Spatial picking (query BVH).

## Misc
[*] Elasticity (restitution).
[*]	Static/dynamic friction.
[ ] Support changing the center of mass.


## Events
[ ] Events buffer.
[ ] Opt in per object.
[ ] On collision events.
	[ ] Return impulse.
[ ] On collision end events.
[ ] On sleep events.
[ ] On wake up.
[ ] On pre-solve (optional).
[ ] On post-solve (optional).

## Fluid Dynamics
[ ] Wind.
[ ] Advanced drag.
[ ] Under water / liquid.
	[ ]	 Bouancy.

## Optimizations

### General Optimizations
[*] Cache inverse mass.
[ ] Cache inverse inertia.
[ ] Cache inverse dt.
[*] Cache exponential decay factor when dt is set.
[*] Implement collision masks.
[ ] Focus areas & resolution.

### Broad Phase Optimizations
[*] Broad phase using AABBs.
[*] Do not recompute AABB when no movement happens.
[ ] Stagger AABB recalculation when movement is slow.
[*] Speed-dependant bounding area padding.
[ ] Spin-dependant bounding area padding.
[*] Bounding volume hierarchy (BVH).
[*] BVH sleep biasing.
[ ] BVH particle biasing.
[*] BVH collision mask biasing (novel).
[ ] Rebalance BVH.
[ ] Experimental: Caching previous broad-phase collisions.
[ ] Experimental: Instead of reinserting on movement, consider tree traversal.
[ ] Experimental: Consider combining the broad phase with the kinematics phase.

### Sleep Optimizations
[*] Sleeping objects.
[ ] Islands.
[*] Shrinkwrap AABB on sleep.
[ ] Experimental: Separate vectors for sleeping/awake objects.
[ ] Experimental: Re-insert into BVH upon sleep.
[ ] Experimental: Sleep drift (sleeping at terminal velocity).

## Advanced Features
[ ] Smart anti-tunelling.
[ ] Advanced drag.
[ ] Forcefields.
[ ] Microscopic scale.
[ ] Galactic scales.
[ ] Automatic handling for big world problem.
[ ] Changing mass dynamically.
[ ] Changing size dynamically (stretch goal)

## AI
[ ] A*.
[ ] A* biasing.
[ ] A* advanced coordination.
[ ] A* precomputed mesh.

