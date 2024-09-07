
# Setup:
To run tests, run `make test -B`. To build for wasm, run `make wasm -B`. It's configured to work in a Linux environment. It was developed in Ubuntu via WSL.

You might need a live server in order to use the example app. A really simple option is Live Server (Five Server). 

Once the code is built and the server is running, open the webpage hosted from examples/index.html.

# Plan:

## Phase 1
[*] Setup and test Rust w/ web assembly target.
[*] Define basic starting classes for the physics module.
	[*] RigidBody.
	[*] Vec2.
[*] Contain all objects in a world. Ability to add and remove objects to/from world.
[*] Add a world tick.
[ ] Ability to export raw data as a byte array.
[*] Add debug visuals.
[*] Add a few different shapes.
	[*] Point (default / no shape).
	[*] Circle.
	[ ] Ellipse?
	[*] AABB.
	[*] Box.
	[ ] Capsule?
	[ ] Convex polygons.
	[ ] Concave polygons / decomposition.
[ ] Objects can be made up of one or more shapes.
[*] Add rotations.
[*] Compute/track AABB for each object.
[*] Implement VBH.
[*] Implement broad phase collision detection using VBH.
[ ] Implement narrow phase collision detection.
	[*] Circle-Circle.
	[ ] AABB-AABB.
	[ ] Circle-AABB
	[ ] Circle-Box
	[ ] Box-Box
[ ] Collision resolvers.
[ ] Implement collision events.
[*] Define object types.
	[*] Sensor.
	[*] Physical.
	[*] Fixed.
[*] Implement an applyForce on objects.
[*] Implement an applyImpulse on objects.
[ ] Determine and apply impulse for rigid body collisions with basic shapes.
[ ] Determine and apply impulse for convex polygons.
[ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
[ ] Add constraints.
	[ ] Distance.
	[ ] Spring.
	[ ] Hinged.

## Misc
[ ] Elasticity.
[ ]	Static/dynamic friction.
[ ] Advanced drag?
[ ] Forcefields?

## Optimizations
[ ] Implement collision masks.
[ ] Sleeping objects.
[ ] Caching previous broad-phase collisions.
[ ] Consider combining the broad phase with the kinematics phase.
[ ] Instead of reinserting on movement, consider tree traversal. This requires experimentation.

## AI
[ ] Implement A* directly into the engine.


# Physical Object Data

Gear2Engine is data-oriented, allowing it to be optimized for data transfer between JavaScript and WASM. Most volatile object data for `PhysicalObject`s is stored in vectors within the `World` object. At the start of a world step, the data is copied into each `PhysicalObject` for easy processing, then the data is copied back into the vectors for transfer back into the main application. 




Update?
	Contains Point?
	remove?
		removeNode call?
			Removing node.
		ok
		deallocateNode call?
		ok
	ok
	Insert?
	Done.
ok

Update?
	Contains Point?
	remove call?
		removeNode call?
			Removing node.
			inside grandParent != nullptr else (grandParent == nullptr)
			deallocateNode call?
			ok
		ok
		deallocateNode call?
		ok
	ok
	Insert?
	Done.
ok

Update?
	Contains Point?
	remove call?
		removeNode call?
			Removing node.
			inside grandParent != nullptr if