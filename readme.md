


# Plan:

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
[ ] Add arbitrary polygons.
[ ] Objects can be made up of one or more shapes.
[*] Add rotations.
[*] Compute/track AABB for each object.
[*] Implement VBH.
[ ] Implement broad phase collision detection using VBH.
[ ] Implement narrow phase collision detection.
[ ] Implement collision events.
[ ] Implement collision masks.
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
[ ] Implement objects at rest as an optimization.






