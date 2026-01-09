# Physical Object Lifecycle

Understanding the lifecycle of a `PhysicalObject` is crucial for efficient simulation management. This page covers how objects are created, updated during the simulation loop, transitioned into sleep states, and eventually removed.

## Creation

Physical objects are instantiated using the `world.makeObject()` method. This method initializes the object in both the JavaScript wrapper and the underlying C++ engine.

```typescript
const obj = world.makeObject(id, {
    x: 10,
    y: 20,
    shape: gb2d.shapes.CIRCLE,
    radius: 1,
    type: gb2d.bodyTypes.RIGID_BODY,
    mass: 1.0,
    // ... other properties
});
```

Upon creation, the engine:
1. Allocates space in the **Live Data Buffers** (`liveFloatData` and `liveIntData`).
2. Computes the initial **AABB** (Axis-Aligned Bounding Box).
3. Inserts the object into the **BVH** (Bounding Volume Hierarchy) for spatial tracking.

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
- Its AABB is "shrink-wrapped" to its exact bounds (removing padding) to minimize unnecessary collision checks.
- It is flagged in the `liveIntData` buffer with the `IS_ASLEEP` bit.

### Waking Up
An object is "woken up" (returned to an active state) when:
- **Collisions**: It is hit by another active object.
- **External Forces**: An impulse or force is applied via `applyForce()` or `applyImpulse()`.
- **Manual Manipulation**: A property like `x`, `y`, or `vx` is changed via the JavaScript API.
- **Neighbor Propagation**: When an object wakes up, it automatically wakes up all objects it is currently in contact with.

You can manually wake an object using the `wakeUp()` method:

```typescript
obj.wakeUp();
```

## Removal

When an object is no longer needed, it must be removed from the world.

```typescript
world.removeObject(obj.id);
```

During removal, the engine:
1. Removes the object from the **BVH**.
2. Destroys any **Joints** connected to the object.
3. Clears **Contacts** from other objects' tracking lists.
4. Reorganizes the **Live Data Buffers** to fill the gap (using a swap-and-pop strategy for $O(1)$ removal).

> **Note**: After calling `removeObject()`, the JavaScript `PhysicalObject` wrapper becomes invalid and should no longer be used.

