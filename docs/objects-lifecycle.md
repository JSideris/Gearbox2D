# Body Lifecycle

Understanding the lifecycle of a `Body` is crucial for efficient simulation management. This page covers how objects are created, updated during the simulation loop, transitioned into sleep states, and eventually removed.

## Creation

Bodies are instantiated using the `world.createBody()` method. You can create a body with an initial shape, or add fixtures later using `body.createFixture()`.

### Engine Capacity Limits

To achieve maximum performance via SoA and WASM SIMD, Gearbox2D uses a fixed-capacity memory model. Each `World` instance has the following limits:

*   **Maximum Bodies**: 10,000
*   **Maximum Fixtures**: 10,000

Attempting to create more objects than these limits will result in an error. If your application requires more objects, consider using multiple `World` instances to partition your simulation.

### Atomic Creation
You can provide an array of fixtures during body creation.

```typescript
const obj = world.createBody({ id: id, 
    x: 10,
    y: 20,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
    fixtures: [
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: -1 },
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: 1 }
    ]
});
```

### Runtime Additions
Fixtures can also be added to an existing body.

```typescript
const fixture = obj.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2,
    height: 0.5,
    restitution: 0.8
});
```

> **Note on Concave Polygons**: When you add a concave polygon fixture, Gearbox2D decomposes it into multiple convex pieces internally. However, `createFixture` will still return a **single proxy Fixture object**. This proxy manages all the internal pieces transparently.

Upon creation, the engine:
1. Allocates space in the **Live Data Buffers**.
2. Computes the initial **AABB** (Axis-Aligned Bounding Box).
3. Inserts the fixture(s) into the **BVH** (Bounding Volume Hierarchy) for spatial tracking.

## Simulation Step (Integration)

Each time `world.step()` is called, every active (awake) object undergoes a movement update:

1.  **Impulse Application**: Any impulses applied during the frame are integrated into the velocity.
2.  **Force Integration**: Forces (including gravity and damping) are converted into acceleration and added to the velocity.
3.  **Position Update**: The object's position is updated based on its current velocity and the time step ($dt$).
4.  **AABB Update**: If the object moved significantly, its AABB is recomputed and its position in the BVH is updated.

## Sleeping and Waking

To maintain high performance with large numbers of objects, Gearbox2D implements an automatic "sleep" mechanism.

### Automatic Sleeping
An object will automatically enter a sleep state if its activity remains below certain thresholds for a sustained period (default is 1 second).

- **Velocity Threshold**: Linear velocity must be below `0.005`.
- **Angular Velocity Threshold**: Rotational speed must be below `0.005`.

When an object sleeps:
- It is no longer included in the kinematics integration step.
- Its AABB is "shrink-wrapped" to its exact bounds to minimize unnecessary collision checks.
- It is flagged in the data buffer with the `IS_SLEEPING` bit.

### Waking Up
An object is "woken up" when:
- It is hit by another active object.
- An impulse or force is applied via `applyForce()` or `applyImpulse()`.
- A property like `x`, `y`, or `vx` is changed via the JavaScript API.
- When an object wakes up, it automatically wakes up all objects it is currently in contact with.

### Manual Sleep Control
While Gearbox2D handles sleeping automatically, you can also take manual control of an object's state:

- **`body.sleep()`**: Immediately puts the object to sleep, zeroing out its velocity and removing it from the active simulation loop.
- **`body.wakeUp()`**: Wakes the object up if it was sleeping.
- **`body.forceWakeUp()`**: Wakes the object up and resets its internal sleep timer to zero, ensuring it stays awake for at least another full `sleepTimeRequired` period (even if it's not moving).

### Configuration
You can fine-tune how an object sleeps using these properties:

- **`canSleep`**: Set to `false` to prevent an object from ever entering a sleep state automatically. Useful for player characters or important dynamic elements.
- **`sleepTimeRequired`**: The amount of time (in seconds) an object must stay below the movement thresholds before it falls asleep. Default is `1.0`.

## Removal

When an object is no longer needed, it must be removed from the world.

```typescript
world.removeObject(obj.id);
```

During removal, the engine:
1. Removes all associated fixtures from the **BVH**.
2. Destroys any **Joints** connected to the body.
3. Clears contact tracking state.
4. Reorganizes the **SoA (Structure-of-Arrays)** buffers using a **swap-and-pop strategy** for $O(1)$ removal. This ensures that live data remains contiguous for efficient SIMD processing.

> **Warning**: After calling `removeObject()`, any JavaScript `Body` and `Fixture` wrappers pointing to the removed object or the one that was swapped into its place are **automatically updated** by the engine. However, you should avoid storing stale references to objects you've explicitly removed.
