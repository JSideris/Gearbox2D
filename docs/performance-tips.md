# Performance Tips

Gearbox2D is designed for high-performance physics, but how you use the engine can significantly impact your application's frame rate and stability. Follow these best practices to get the most out of the engine.

## 1. World Recycling (Scene Management)

Creating and destroying worlds is an expensive operation that involves allocating memory on the WebAssembly heap.

*   **Tip**: Instead of creating a `new gearbox.makeWorld()` every time you change a level, use `world.clear()`.
*   **Benefit**: This reuses the same memory pool and avoids the overhead of WASM memory allocation and fragmentation.

## 2. Batch State Access

Accessing object properties (like `body.x`) is fast, but doing it thousands of times per frame in a tight loop still carries some JavaScript overhead.

*   **Tip**: If you need to iterate over all bodies for custom logic or rendering, use the shared buffers directly (`world.liveBodyFloatData`).
*   **Tip**: Use `world.iterateBodies(callback)` for a cleaner but slightly slower alternative to direct buffer indexing.

## 3. Solver Iterations

The stability of your simulation depends on how many iterations the constraint solver performs.

*   **Tip**: If your simulation feels "mushy" or stacks are collapsing, increase the step frequency (e.g., `1/120`) rather than just cranking up solver iterations.
*   **Balance**: Higher iterations improve stability but increase CPU usage linearly.

## 4. Sleeping Objects

Physics engines spend most of their time checking collisions between objects that aren't even moving.

*   **Tip**: Ensure objects that have come to rest are marked as "Sleeping". Gearbox2D handles this automatically by default.
*   **Benefit**: Sleeping bodies are skipped during the most expensive parts of the physics loop, allowing for much larger worlds.

## 5. Collision Filtering

Reducing the number of collision checks is the most effective way to optimize large simulations.

*   **Tip**: Use `categoryBits` and `maskBits` to prevent collision checks between objects that you know should never interact (e.g., bullets and the player who fired them).
*   **Benefit**: This reduces the workload on both the Broad Phase (BVH) and Narrow Phase solvers.

## 6. Shape Selection

Different shapes have different performance costs:

*   **POINT**: Fastest (essentially zero cost).
*   **CIRCLE**: Very fast (simple distance check).
*   **AABB**: Fast (axis-aligned checks only).
*   **BOX**: Slower (requires full SAT or GJK/EPA resolution).

**Strategy**: Use `CIRCLE` or `AABB` fixtures for simple collision logic whenever possible, reserving `BOX` for objects where rotation-aligned collision is essential.
