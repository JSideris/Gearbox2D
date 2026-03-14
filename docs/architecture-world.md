# World Object

The `World` object is the central container for all physical entities in Gearbox2D. It manages the lifecycle of bodys and joints, orchestrates the simulation steps, and handles global physics settings like gravity and collision resolution.

## Introduction

In Gearbox2D, the `World` acts as the coordinator for the entire physics simulation. It maintains internal data structures (like the BVH for spatial partitioning) and provides the interface for creating, querying, and manipulating the physical environment.

Key responsibilities include:
- **Entity Management**: Creating and removing bodys and joints.
- **Simulation Control**: Stepping the physics forward in time.
- **Global Settings**: Configuring gravity and toggleable physics features (restitution, friction, etc.).
- **Spatial Queries**: Performing point queries and broad-phase checks.

## Engine & World Lifecycle

Understanding the lifecycle of Gearbox2D is critical for managing memory effectively and ensuring high performance, especially in long-running applications or those with multiple scenes.

### 1. Engine Initialization

Before any physics can happen, the WebAssembly module must be loaded and initialized. This should only be done **once** per page load.

```typescript
import gearbox from 'gearbox2d';

async function start() {
    // One-time initialization
    await gearbox.init();
    
    // Now you can create worlds
    const world = gearbox.makeWorld();
}
```

### 2. World Creation

`gearbox.makeWorld()` allocates a new physics world in the WebAssembly heap. While you can create multiple worlds for side-by-side simulations or isolated UI physics, each world consumes a significant block of WASM memory.

### 3. Stepping the Simulation

The simulation progresses in discrete time intervals called "steps". Typically, you call `world.step()` within your application's main loop (e.g., inside `requestAnimationFrame`).

```typescript
function update() {
    // Advance the simulation by one time step
    world.step();
    
    // Request the next frame
    requestAnimationFrame(update);
}
```

By default, the engine uses a fixed time step (60Hz). For maximum stability, it is recommended to use a fixed time step. You can adjust this using `setTimeStep(dt)`. See [The Simulation Loop](game-loop.md) for advanced implementation details.

### 4. Resetting vs. Destroying

When moving between levels or scenes, you have two options for managing world memory:

#### Option A: World Recycling (Recommended)
If you are simply restarting a level or moving to a new scene with similar requirements, use `world.clear()`.

*   **Action**: `world.clear()`
*   **Result**: Removes all bodies, fixtures, and joints but **keeps the World object and its allocated memory pool alive**.
*   **Best for**: Fast scene transitions and preventing heap fragmentation.

#### Option B: Explicit Destruction
If you are moving to a part of your application that no longer requires physics, or if you need to create a completely different world configuration, use `world.destroy()`.

*   **Action**: `world.destroy()`
*   **Result**: Calls the C++ destructor and **immediately frees the underlying WASM memory**.
*   **Best for**: Freeing resources when physics is no longer needed.

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

### Bodys

Objects are created with a unique ID and a specification object. You can attach fixtures (shapes) atomically during creation or add them later.

```typescript
// Atomic creation with multiple fixtures
const obj = world.makeBody(101, {
    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
    x: 0,
    y: 0,
    fixtures: [
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: -1 },
        { shape: gearbox.shapes.CIRCLE, radius: 1, localX: 1 }
    ]
});

// Adding a fixture at runtime
obj.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2,
    height: 1
});

// Remove an object by ID
world.removeObject(101);
```

### Joints

Joints are created through factory methods on the `World` instance. They connect two `Body` instances.

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
    const obj = world.getBodyById(id);
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

Instead of calling expensive getter/setter functions for every object's position every frame, the engine updates these buffers directly. The TypeScript `Body` wrappers use these buffers to provide high-performance access to object state.

```typescript
// Accessing live data directly (via Body)
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
const gameWorld = gearbox.makeWorld();
const uiWorld = gearbox.makeWorld();

// These worlds are completely isolated
gameWorld.setGravity(0, 9.81);
uiWorld.setGravity(0, 0);gameWorld.step();
uiWorld.step();
```

## Memory Safety and Cleanup

Gearbox2D is backed by C++, which does not have automatic garbage collection for WASM heap allocations.

*   **Never leave worlds dangling**: If you call `makeWorld()` repeatedly without calling `destroy()`, your application will eventually crash with an **Out of Memory (OOM)** error.
*   **Reference Cleanup**: When you call `world.destroy()`, ensure you also nullify any JavaScript references to that world to allow the JS garbage collector to clean up the wrapper object.
