# Hinge Joint

A **Hinge Joint** (also known as a **Revolute Joint**) constrains two bodys to share a common point, allowing them to rotate freely around that point. This is similar to a pin or a hinge on a door.

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

To create a hinge joint, use the `world.createHingeJoint` method. 

```javascript
const joint = world.createHingeJoint(id, bodyA, bodyB, {
    worldAnchor: { x: 5, y: 5 }
});
```

### Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `worldAnchor` | `Vec2` | The point in world coordinates where the two bodies are joined. |
| `anchorA` | `Vec2` | Local anchor relative to `bodyA` (used if `worldAnchor` is not provided). |
| `anchorB` | `Vec2` | Local anchor relative to `bodyB` (used if `worldAnchor` is not provided). |

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Hinge Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `localAnchorA` | `Vec2` | Read/Write | The anchor point relative to `bodyA`. |
| `localAnchorB` | `Vec2` | Read/Write | The anchor point relative to `bodyB`. |
| `reactionTorque` | `number` | Read-only | Always `0` for basic 2D hinges (no rotational constraint). |

## Example: Creating a Pendulum

A common use for a hinge joint is creating a pendulum by connecting a dynamic object to a fixed point in the world.

```javascript
// 1. Create a static anchor
const anchor = world.createBody(1, {
    x: 10, y: 2,
    type: gearbox.bodyTypes.FIXED_OBJECT
});
anchor.createFixture(1, { shape: gearbox.shapes.CIRCLE, radius: 0.2 });

// 2. Create a dynamic weight
const weight = world.createBody(2, {
    x: 15, y: 2,
});
weight.createFixture(2, { shape: gearbox.shapes.BOX, width: 1, height: 1 });// 3. Connect them with a hinge at the anchor's position
world.createHingeJoint(101, anchor, weight, {
    worldAnchor: { x: 10, y: 2 }
});
```
