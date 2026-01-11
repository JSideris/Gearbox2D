# World Object

The `World` object is the central container for all physical entities in Gearbox2D. It manages the lifecycle of physical objects and joints, orchestrates the simulation steps, and handles global physics settings like gravity and collision resolution.

## Introduction

In Gearbox2D, the `World` acts as the coordinator for the entire physics simulation. It maintains internal data structures (like the BVH for spatial partitioning) and provides the interface for creating, querying, and manipulating the physical environment.

Key responsibilities include:
- **Entity Management**: Creating and removing physical objects and joints.
- **Simulation Control**: Stepping the physics forward in time.
- **Global Settings**: Configuring gravity and toggleable physics features (restitution, friction, etc.).
- **Spatial Queries**: Performing point queries and broad-phase checks.

## Lifecycle and Setup

### Creating a World

A `World` instance is created via the main `gb2d` engine object. This ensures the underlying WebAssembly module is initialized before the world is constructed.

```typescript
import gb2d from 'gearbox2d';

// Ensure the engine is initialized first
await gb2d.init();

// Create a new world instance
const world = gb2d.makeWorld();
```

### Stepping the Simulation

The simulation progresses in discrete time intervals called "steps". Typically, you call `world.step()` within your application's main loop (e.g., inside `requestAnimationFrame`).

```typescript
function update() {
    // Advance the simulation by one time step
    world.step();
    
    // Request the next frame
    requestAnimationFrame(update);
}
```

By default, the engine uses a fixed time step (60Hz). You can adjust this using `setTimeStep(dt)`.

### Resetting the World

To remove all objects and joints and reset the simulation state, use the `clear()` method.

```typescript
world.clear();
```

This is more efficient than destroying and recreating the world object if you need to restart a level or simulation.

## Simulation Mechanics

The `world.step()` method executes several distinct phases to resolve physics for the current frame:

1.  **Kinematics (Integration)**: Updates positions and velocities based on current forces, gravity, and damping.
2.  **Broad Phase (BVH)**: Uses a Bounding Volume Hierarchy to quickly identify pairs of objects whose AABBs overlap.
3.  **Narrow Phase**: Performs precise collision detection for the pairs identified in the broad phase to find contact points and penetration depths.
4.  **Contact Management**: Tracks collisions over time, triggering `onCollisionStart` and `onCollisionEnd` events.
5.  **Constraint Solving**: Resolves impulses for collisions and joints using an iterative solver.

### Time Steps

Stability in physics simulations depends heavily on the consistency of the time step. Gearbox2D is optimized for a fixed time step.

```typescript
// Set the simulation to 120Hz for higher precision
world.setTimeStep(1 / 120);
```

## Physics Configuration

The `World` provides global toggles and settings that affect all objects within it.

### Gravity

Gravity is a global force applied to all dynamic objects.

```typescript
// Set gravity (x, y)
world.setGravity(0, 9.81);
```

### Feature Toggles

You can enable or disable specific parts of the physics solver to optimize performance or achieve specific behaviors:

- **Penetration Resolution**: `setHasPenetrationResolution(bool)` - Toggles whether objects should push each other out when overlapping.
- **Restitution**: `setHasRestitution(bool)` - Toggles bounciness calculation.
- **Friction**: `setHasFriction(bool)` - Toggles friction calculation.

```typescript
world.setHasRestitution(true);
world.setHasFriction(true);
world.setHasPenetrationResolution(true);
```

## Object and Joint Management

The `World` manages all entities through unique IDs. This allows for efficient lookups across the JavaScript and WebAssembly boundary.

### Physical Objects

Objects are created with a unique ID and a specification object.

```typescript
const obj = world.makeObject(101, {
    shape: gb2d.shapes.CIRCLE,
    type: gb2d.bodyTypes.RIGID_BODY,
    x: 0,
    y: 0,
    radius: 1,
    mass: 1
});

// Remove an object by ID
world.removeObject(101);
```

### Joints

Joints are created through factory methods on the `World` instance. They connect two `PhysicalObject` instances.

- **Hinge Joint**: `createHingeJoint(id, bodyA, bodyB, options)`
- **Distance Joint**: `createDistanceJoint(id, bodyA, bodyB, options)`
- **Spring Joint**: `createSpringJoint(id, bodyA, bodyB, options)`
- **Gear Joint**: `createGearJoint(id, joint1, joint2, ratio)`

```typescript
const hinge = world.createHingeJoint(201, boxA, boxB, {
    worldAnchor: { x: 5, y: 5 }
});

// Remove a joint by ID
world.removeJoint(201);
```

## Interaction and Queries

### Spatial Queries

You can query the world to find objects at specific coordinates.

```typescript
// Find all objects at (x, y) that match a collision mask
const hits = world.queryPoint(5.5, 10.2, 0xFFFF);
hits.forEach(id => {
    const obj = world.getObjectById(id);
    console.log(`Hit object: ${id}`);
});
```

### Collision Events

The `World` provides hooks for responding to collision events.

```typescript
world.onCollisionStart = (idA, idB, impulse) => {
    console.log(`Collision started between ${idA} and ${idB}`);
};

world.onCollisionEnd = (idA, idB, impulse) => {
    console.log(`Collision ended between ${idA} and ${idB}`);
};
```

## Performance: Live Data Buffers

A key architectural feature of Gearbox2D is the use of shared memory buffers for performance.

When a `World` is created, it exposes `liveFloatData` and `liveIntData`. These are `TypedArrays` (Float32Array and Int32Array) that map directly to the underlying C++ data structures in WASM memory.

Instead of calling expensive getter/setter functions for every object's position every frame, the engine updates these buffers directly. The TypeScript `PhysicalObject` wrappers use these buffers to provide high-performance access to object state.

```typescript
// Accessing live data directly (via PhysicalObject)
const x = obj.x; // Reads from liveFloatData
obj.x = 10;      // Writes to liveFloatData
```

## Multiple World Support

Gearbox2D fully supports multiple independent `World` instances running simultaneously. 

Each world has its own:
- Object and Joint registries.
- BVH spatial index.
- Physics settings (gravity, time step, etc.).
- Event listeners.

This is useful for scenarios like:
- **Simulating sub-scenes**: Running a separate UI or inventory physics simulation alongside the main game world.
- **Parallel simulations**: Running multiple "what-if" simulations for AI pathfinding or prediction.
- **Multi-room environments**: Managing different rooms or levels that don't interact with each other physically.

```typescript
const gameWorld = gb2d.makeWorld();
const uiWorld = gb2d.makeWorld();

// These worlds are completely isolated
gameWorld.setGravity(0, 9.81);
uiWorld.setGravity(0, 0);gameWorld.step();
uiWorld.step();
```
