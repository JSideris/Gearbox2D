# WASM & Shared Memory

Gearbox2D achieve its industry-leading performance by leveraging a hybrid memory architecture. The core physics calculations happen in highly optimized C++ compiled to WebAssembly (WASM), while the high-level API is provided in TypeScript.

## The WASM Heap

Unlike standard JavaScript objects, which are managed by a garbage collector, Gearbox2D objects live in a dedicated block of memory called the **WASM Heap**.

### Manual Allocation
When you call `world.makeBody()` or `world.createJoint()`, the engine allocates space on the C++ heap. This memory **persists** even if you lose all JavaScript references to the object. 

### Manual Disposal
Because WASM cannot see JS references and JS cannot automatically free WASM memory, you must manage the lifecycle of your physics world:
*   Use `world.clear()` to empty a world.
*   Use `world.destroy()` to delete the world and its heap allocation.

## Zero-Copy State Access

The "WASM Bottleneck" in most web engines is the cost of copying data (like positions and rotations) between the WASM memory and JS objects every frame. Gearbox2D solves this with **Shared Data Buffers**.

### How it works:
1.  The C++ core maintains a contiguous array of body data.
2.  The TypeScript `World` object creates a `Float32Array` view (`liveBodyFloatData`) directly over that same memory address.
3.  When the C++ engine updates a position, it is **instantly available** in the JS typed array without any function calls or memory copies.

```typescript
// Under the hood, body.x is just an index into a shared buffer
const x = world.liveBodyFloatData[bodyIndex * BODY_SIZE + X_OFFSET];
```

## Direct Buffer Access

For advanced users, you can access these buffers directly via the `World` instance:

*   `world.liveBodyFloatData`: Contains `x`, `y`, `r`, `vx`, `vy`, etc.
*   `world.liveBodyIntData`: Contains `flags`, `type`, and ID mappings.
*   `world.liveFixtureFloatData`: Contains shape dimensions and local offsets.

### Performance Tip
If you are building a custom high-performance renderer (e.g., using WebGL), you can upload `world.liveBodyFloatData` directly to a GPU vertex buffer to render thousands of objects with zero CPU overhead per-object.

## Memory Safety Best Practices

1.  **Don't "New" in Loops**: Avoid creating worlds inside frequent events or animation frames.
2.  **Recycle IDs**: Use a consistent ID mapping strategy to avoid confusion when bodies are removed and added.
3.  **Check Heap Growth**: Be aware that as the number of objects grows, the WASM heap may resize. Gearbox2D handles this internally, but frequent resizing can cause small performance hitches.
