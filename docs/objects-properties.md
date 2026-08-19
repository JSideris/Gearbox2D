# Object Properties

This page provides a detailed reference for the properties you can set on **Bodies** and **Fixtures** in Gearbox2D.

## Body Properties

Body properties define the state and movement of an object in the world.

### Position & Rotation
- `x`, `y`: The current position of the body's center of mass.
- `r`: The current rotation of the body in radians.

### Velocity
- `vx`, `vy`: Linear velocity in world units per second.
- `vr`: Angular velocity in radians per second.

### Mass & Inertia
- `mass`: Total mass of the body (sum of all fixture masses).
- `inertia`: The body's resistance to rotational acceleration.

### Damping
- `linearDamping`: Simulates air resistance or drag (0.0 to 1.0).
- `angularDamping`: Simulates rotational friction (0.0 to 1.0).

### Sleep Configuration
- `canSleep` (boolean): Whether the body can automatically go to sleep when inactive.
- `isSleeping` (boolean, read-only): Returns `true` if the body is currently in a sleep state.
- `sleepTimeRequired` (number): The number of seconds of inactivity required before the body sleeps. Default is `1.0`.

---

## Fixture Properties

Fixture properties define the physical behavior of a body's shape.

### Restitution (Bounciness)
`restitution`: A value typically between `0.0` and `1.0`.
- `0.0`: Perfectly inelastic collision (no bounce).
- `1.0`: Perfectly elastic collision (full bounce).
- Values greater than `1.0` are possible and will result in objects gaining energy during collisions.

### Friction
- `staticFriction`: Resistance to starting motion between two surfaces.
- `kineticFriction`: Resistance to maintaining motion between two surfaces.

Friction is typically set between `0.0` (perfectly slippery) and `1.0` (high friction). When two fixtures collide, each coefficient is mixed independently using the geometric mean of the two fixture values: mixed static friction is `sqrt(staticFriction_A × staticFriction_B)`, and mixed kinetic friction is `sqrt(kineticFriction_A × kineticFriction_B)`.

### Density
`density`: Used for automatic mass and inertia calculations.
The mass of a fixture is calculated as `density * area`. A density of `1.0` is recommended for standard objects.

### Sensor Mode
`isSensor`: A boolean property.
If `true`, the fixture will still trigger collision events but will **not** produce a physical response (objects will pass through it).

```typescript
const fixture = body.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5,
    isSensor: true,
    restitution: 0.5,
    density: 1.0
});
```

---

## Property Synchronization for Concave Polygons

When a concave polygon is added to a body, it is internally decomposed into multiple convex sub-fixtures. To ensure a consistent user experience, Gearbox2D automatically synchronizes properties across all these sub-fixtures.

When you modify a property on a proxy fixture (the `Fixture` object returned by `createFixture` for a concave polygon), the engine:
1.  **Iterates** through all internal sub-fixtures.
2.  **Updates** the corresponding property in the Live Data Buffers for each sub-fixture.
3.  **Refreshes** internal C++ state if necessary (e.g., updating the sensor flag in the core engine).

This ensures that the entire concave shape behaves as a single cohesive unit, with uniform friction, restitution, and density across all its parts.

### Example: Updating a Concave Shape
```typescript
const star = world.createBody({ id: nextId++,  x: 0, y: 0 });
const starFixture = star.createFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: gearbox.polygon.makeStar(5, 1.0, 0.4)
});

// Setting restitution on the proxy fixture updates all internal pieces
starFixture.restitution = 0.8;
starFixture.staticFriction = 0.5;
```

## Common Options

When creating a **Body**, **Fixture**, or **Joint**, you can pass an optional `id` property within the configuration object.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | (Optional) A unique ID for tracking, lookups, and identifying objects in event handlers. |

For more information on how IDs are managed, see [ID Management in the World Object](architecture-world.md#id-management).
