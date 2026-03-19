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

The "WASM Bottleneck" in most web engines is the cost of copying data (like positions and rotations) between the WASM memory and JS objects every frame. Gearbox2D solves this with **Shared Data Buffers** and zero-copy abstractions.

### How it works:
1.  The C++ core maintains a contiguous array of body data.
2.  The TypeScript `World` object creates a `Float32Array` view (`liveBodyFloatData`) directly over that same memory address.
3.  When the C++ engine updates a position, it is **instantly available** to TypeScript.

### Property Accessors
To provide a clean API while maintaining performance, Gearbox2D uses internal **RowViews**. Each `Body` and `Fixture` instance is a lightweight wrapper that points to a specific index in the shared buffer.

```typescript
// Under the hood, body.x is a property getter using a RowView
// No manual offset math is required by the user.
const x = body.x; 

// Internally, this translates to:
// return this.floats.get(BODY_X_OFFSET);
```

## Memory Access Abstractions

To prevent bugs from manual offset calculations, Gearbox2D provides two primary abstractions for shared memory access:

### 1. BufferView
A `BufferView` manages a full typed array (e.g., all body float data) with a fixed stride. It is used primarily by the `World` for global operations like syncing indices.

```typescript
const x = world.bodyFloats.get(index, BODY_X_OFFSET);
```

### 2. RowView
A `RowView` is bound to a specific object and its index. It provides a localized view of the object's memory. Both `Body` and `Fixture` use internal `RowViews` to implement their property getters and setters.

```typescript
// RowViews support get, set, and add operations
this.floats.add(BODY_NFX_OFFSET, forceX);
```

## Direct Buffer Access

For advanced users or performance-critical tasks, you can access both the new views and the underlying raw buffers via the `World` instance:

### Structured Views (Recommended)
*   `world.bodyFloats`: `BufferView<Float32Array>` for body state.
*   `world.bodyInts`: `BufferView<Int32Array>` for flags and IDs.
*   `world.fixtureFloats`: `BufferView<Float32Array>` for shape data.
*   `world.fixtureInts`: `BufferView<Int32Array>` for shape properties.

### Raw Data Buffers
*   `world.liveBodyFloatData`
*   `world.liveBodyIntData`
*   `world.liveFixtureFloatData`
*   `world.liveFixtureIntData`

### Performance Tip: GPU Uploads
If you are building a custom high-performance renderer (e.g., using WebGL or WebGPU), you can upload the underlying raw buffers (like `world.liveBodyFloatData`) directly to the GPU. This allows you to render thousands of objects with zero CPU overhead per-object.

## Memory Safety Best Practices

1.  **Don't "New" in Loops**: Avoid creating worlds inside frequent events or animation frames.
2.  **Recycle IDs**: Use a consistent ID mapping strategy to avoid confusion when bodies are removed and added.
3.  **Check Heap Growth**: Be aware that as the number of objects grows, the WASM heap may resize. Gearbox2D handles this internally, but frequent resizing can cause small performance hitches.
