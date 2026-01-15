# Joints Overview

Joints in Gearbox2D are used to constrain the movement of bodys relative to each other or to the world. By connecting bodies with joints, you can create complex mechanisms like pendulums, ragdolls, cars, and gear trains.

## Common Features

All joints in the engine share several fundamental concepts and API patterns.

### Creation and Removal

Joints are created through the `World` instance and require a unique ID. 

```javascript
// Creation pattern
const joint = world.createHingeJoint(id, bodyA, bodyB, options);

// Removal pattern
world.removeJoint(id);
```

### The Anchor System

Most joints are defined by **Anchor Points**. These are points on the bodies where the joint is "attached."

1.  **World Anchor**: During creation, you often specify a `worldAnchor`. The engine automatically converts this into local coordinates for both bodies so that the joint is perfectly aligned at that moment.
2.  **Local Anchors (`localAnchorA`, `localAnchorB`)**: These define the attachment point relative to each body's center of mass. You can modify these at runtime to shift the pivot point of a joint.

### Common Properties

Every joint object provides access to the following:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | The unique ID provided at creation. |
| `bodyA` | `Body` | The first body connected by the joint. |
| `bodyB` | `Body` | The second body connected by the joint. |
| `reactionForce` | `Vec2` | The force (in Newtons) being applied by the joint to maintain the constraint. |
| `reactionTorque` | `number` | The torque being applied by the joint. |

---

## Choosing a Joint

Use this table to decide which joint is best for your specific use case:

| Joint Type | Behavior | Common Use Cases |
| :--- | :--- | :--- |
| **[Hinge Joint](./joints-hinge.md)** | Constraints two points to overlap, allowing rotation. | Doors, wheels, pendulums, limbs. |
| **[Distance Joint](./joints-distance.md)** | Maintains a rigid distance between two points. | Rigid rods, elevators, simple bridges. |
| **[Spring Joint](./joints-spring.md)** | A distance joint with elastic mass-spring-damper physics. | Suspension, ropes, soft connections. |
| **[Gear Joint](./joints-gear.md)** | Links the rotation of two hinge joints via a ratio. | Mechanical gears, transmission, pullies. |

## Tips for Working with Joints

- **Waking Up**: Modifying joint properties (like `localAnchor` or `length`) will automatically "wake up" the connected bodies if they were sleeping.
- **Breakable Joints**: You can simulate breakable connections by checking the magnitude of `reactionForce` every frame and calling `world.removeJoint()` if it exceeds a threshold.
- **Static Anchors**: To anchor an object to a fixed point in space, connect it to a `FIXED_OBJECT` body at the desired world location.

