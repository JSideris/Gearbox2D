
# Setup:
To run tests, run `make test -B`. To build for wasm, run `make wasm -B`. It's configured to work in a Linux environment. It was developed in Ubuntu via WSL.

You might need a live server in order to use the example app. A really simple option is Live Server (Five Server). 

Once the code is built and the server is running, open the webpage hosted from examples/index.html.

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
	[ ] Point-Box.
	[ ] Point-Capsule.
	[ ] Point-Circle.
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
[*] Determine and apply impulse for rigid body collisions with basic shapes.
[ ] Determine and apply impulse for convex polygons.
[ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
[ ] Collision tracking.

## Constraints
[ ] Distance.
[ ] Spring.
[ ] Hinged.
[ ] Gear constraint.

## Misc
[*] Elasticity (restitution).
[*]	Static/dynamic friction.
[ ] Support changing the center of mass.
[ ] Events.

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
[ ] Implement collision masks.
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
[ ] BVH collision mask biasing.
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

## AI
[ ] A*.
[ ] A* biasing.
[ ] A* advanced coordination.
[ ] A* precomputed mesh.


# Physical Object Data

Gear2Engine is data-oriented, allowing it to be optimized for data transfer between JavaScript and WASM. Most volatile object data for `PhysicalObject`s is stored in vectors within the `World` object. At the start of a world step, the data is copied into each `PhysicalObject` for easy processing, then the data is copied back into the vectors for transfer back into the main application. 


