# Gear Joint

A **Gear Joint** links the rotation of two bodys by constraining their relative angles via two existing [Hinge Joints](./joints-hinge.md).

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

A gear joint requires two existing hinge joints.

```javascript
const hinge1 = world.createHingeJoint(1, bodyA, bodyB, { ... });
const hinge2 = world.createHingeJoint(2, bodyC, bodyD, { ... });

const gear = world.createGearJoint(101, hinge1, hinge2, 2.0);
```

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `joint1` | `HingeJoint` | The first hinge joint to link. |
| `joint2` | `HingeJoint` | The second hinge joint to link. |
| `ratio` | `number` | The gear ratio. |

## Mechanics

The gear joint enforces the following constraint:
\[ \theta_2 + \text{ratio} \times \theta_1 = \text{constant} \]

- **Ratio**: If the ratio is `2.0`, then `joint1` rotating by 1° causes `joint2` to rotate by -2°.

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Gear Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `ratio` | `number` | Read/Write | The gear ratio between the two joints. |
| `reactionTorque` | `number` | Read-only | The torque applied to maintain the gear constraint. |

## Example: Simple Gear Train

```javascript
// Large gear
const gear1 = world.createBody({ id: 1,  x: 5, y: 5 });
gear1.createFixture({ id: 1,  shape: gearbox.shapes.CIRCLE, radius: 1.0 });
const hinge1 = world.createHingeJoint(10, staticBody, gear1, { worldAnchor: { x: 5, y: 5 } });

// Small gear
const gear2 = world.createBody({ id: 2,  x: 7, y: 5 });
gear2.createFixture({ id: 2,  shape: gearbox.shapes.CIRCLE, radius: 0.5 });
const hinge2 = world.createHingeJoint(11, staticBody, gear2, { worldAnchor: { x: 7, y: 5 } });// Link them with a 2:1 ratio
world.createGearJoint(101, hinge1, hinge2, 2.0);
```
