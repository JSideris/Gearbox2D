# Engine & World Lifecycle

Understanding the lifecycle of Gearbox2D is critical for managing memory effectively and ensuring high performance, especially in long-running applications or those with multiple scenes.

## The High-Level Flow

A typical Gearbox2D application follows these lifecycle stages:

1.  **Initialization**: One-time setup of the WebAssembly environment.
2.  **World Creation**: Allocating a physics container.
3.  **Simulation Loop**: Repeatedly stepping the physics forward.
4.  **Scene Transitions**: Choosing between resetting or destroying worlds.
5.  **Final Cleanup**: Explicitly freeing resources.

---

## 1. Initialization

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

## 2. World Creation

`gearbox.makeWorld()` allocates a new physics world in the WebAssembly heap. While you can create multiple worlds for side-by-side simulations or isolated UI physics, each world consumes a significant block of WASM memory.

## 3. Simulation Loop

The simulation progresses using `world.step()`. For maximum stability, it is recommended to use a fixed time step.

```typescript
const physicsStep = 1 / 60;

function loop() {
    // Advance the world
    world.step();
    
    // ... rendering logic ...
    requestAnimationFrame(loop);
}
```

## 4. Resetting vs. Destroying

When moving between levels or scenes, you have two options for managing world memory:

### Option A: World Recycling (Recommended)
If you are simply restarting a level or moving to a new scene with similar requirements, use `world.clear()`.

*   **Action**: `world.clear()`
*   **Result**: Removes all bodies, fixtures, and joints but **keeps the World object and its allocated memory pool alive**.
*   **Best for**: Fast scene transitions and preventing heap fragmentation.

### Option B: Explicit Destruction
If you are moving to a part of your application that no longer requires physics, or if you need to create a completely different world configuration, use `world.destroy()`.

*   **Action**: `world.destroy()`
*   **Result**: Calls the C++ destructor and **immediately frees the underlying WASM memory**.
*   **Best for**: Freeing resources when physics is no longer needed.

## 5. Memory Safety Warnings

Gearbox2D is backed by C++, which does not have automatic garbage collection.

*   **Never leave worlds dangling**: If you call `makeWorld()` repeatedly without calling `destroy()`, your application will eventually crash with an **Out of Memory (OOM)** error.
*   **Reference Cleanup**: When you call `world.destroy()`, ensure you also nullify any JavaScript references to that world to allow the JS garbage collector to clean up the wrapper object.
