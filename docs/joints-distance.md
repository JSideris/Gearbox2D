# Distance Joint

A **Distance Joint** maintains a fixed distance between two points on two separate bodys. It prevents the objects from moving closer together or further apart than the specified length.

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

To create a distance joint, use the `world.createDistanceJoint` method.

```javascript
const joint = world.createDistanceJoint(bodyA, bodyB, {
    id: 101, // Optional
    worldAnchorA: { x: 2, y: 5 },
    worldAnchorB: { x: 8, y: 5 }
});
```

### Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | (Optional) A unique ID for tracking and lookup. |
| `worldAnchorA` | `Vec2` | World coordinate for anchor on `bodyA`. |
| `worldAnchorB` | `Vec2` | World coordinate for anchor on `bodyB`. |
| `anchorA` | `Vec2` | Local anchor relative to `bodyA`. |
| `anchorB` | `Vec2` | Local anchor relative to `bodyB`. |
| `length` | `number` | The target distance. If omitted, it's calculated from anchors at creation. |

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Distance Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `length` | `number` | Read/Write | The current target distance for the joint. |
| `localAnchorA` | `Vec2` | Read/Write | Local anchor point on `bodyA`. |
| `localAnchorB` | `Vec2` | Read/Write | Local anchor point on `bodyB`. |

## Example: Rigid Rod

```javascript
const ball1 = world.createBody({ id: 1,  x: 5, y: 5 });
const ball2 = world.createBody({ id: 2,  x: 10, y: 5 });// Connect with a 5m rigid rod
ball1.createFixture({ id: 1,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });
ball2.createFixture({ id: 2,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });
world.createDistanceJoint(ball1, ball2, {
    id: 101,
    length: 5
});
```
