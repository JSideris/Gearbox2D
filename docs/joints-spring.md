# Spring Joint

A **Spring Joint** (also known as a soft distance joint) maintains a target distance between two objects while allowing for elastic movement. It simulates a physical spring-damper system.

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

To create a spring joint, use the `world.createSpringJoint` method.

```javascript
const joint = world.createSpringJoint(id, bodyA, bodyB, {
    worldAnchorA: { x: 5, y: 2 },
    worldAnchorB: { x: 5, y: 5 },
    frequencyHz: 2.0,
    dampingRatio: 0.5
});
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `frequencyHz` | `number` | `5.0` | Stiffness (Hertz). `0` makes it rigid. |
| `dampingRatio` | `number` | `0.7` | Oscillation decay (`0` to `1+`). |
| `length` | `number` | *auto* | Rest length of the spring. |
| `worldAnchorA/B` | `Vec2` | - | World coordinates for anchors. |

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Spring Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `frequencyHz` | `number` | Read/Write | Adjusts the stiffness. |
| `dampingRatio` | `number` | Read/Write | Adjusts the oscillation decay. |
| `length` | `number` | Read/Write | The rest length of the spring. |

## Dynamics

- **Frequency (`frequencyHz`)**: Higher values make the spring stiffer.
- **Damping (`dampingRatio`)**: `0.0` is undamped (never stops), `1.0` is critically damped (stops quickly).

## Example: Suspension System

```javascript
const chassis = world.makeObject(1, { x: 10, y: 5 });
const wheel = world.makeObject(2, { x: 10, y: 6 });

// Soft suspension
world.createSpringJoint(101, chassis, wheel, {
    anchorA: { x: 0, y: 1 },
    frequencyHz: 3.0,
    dampingRatio: 0.5
});
```
