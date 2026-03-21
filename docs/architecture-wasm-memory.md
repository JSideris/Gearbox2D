# WASM & Shared Memory

Gearbox2D achieve its industry-leading performance by leveraging a hybrid memory architecture. The core physics calculations happen in highly optimized C++ compiled to WebAssembly (WASM), while the high-level API is provided in TypeScript.

## The WASM Heap

Unlike standard JavaScript objects, which are managed by a garbage collector, Gearbox2D objects live in a dedicated block of memory called the **WASM Heap**.

### Manual Allocation
When you call `world.createBody()` or `world.createJoint()`, the engine allocates space on the C++ heap. This memory **persists** even if you lose all JavaScript references to the object. 

### Manual Disposal
Because WASM cannot see JS references and JS cannot automatically free WASM memory, you must manage the lifecycle of your physics world:
*   Use `world.clear()` to empty a world.
*   Use `world.destroy()` to delete the world and its heap allocation.

## Zero-Copy State Access

The "WASM Bottleneck" in most web engines is the cost of copying data (like positions and rotations) between the WASM memory and JS objects every frame. Gearbox2D solves this with **Shared Data Buffers** and zero-copy abstractions.

### How it works:
1.  The C++ core maintains data in a **Structure-of-Arrays (SoA)** layout. Instead of an array of objects, each property (like `x`, `y`, or `vx`) has its own contiguous array within a large shared buffer.
2.  The TypeScript `World` object creates `TypedArray` views (like `liveBodyFloatData`) directly over these memory addresses.
3.  This layout is designed for **WASM SIMD** (Single Instruction, Multiple Data), allowing the engine to process 4 objects simultaneously in a single CPU instruction.
4.  When the C++ engine updates a position, it is **instantly available** to TypeScript with zero copying.

### Property Accessors
To provide a clean API while maintaining performance, Gearbox2D uses internal **RowViews**. Each `Body` and `Fixture` instance is a lightweight wrapper that points to its specific index in the shared SoA buffers.

```typescript
// Under the hood, body.x is a property getter using a RowView.
// It calculates the memory offset as (property_offset * MAX_BODIES + body_index).
const x = body.x; 
```

## Memory Access Abstractions

To prevent bugs from manual offset calculations, Gearbox2D provides two primary abstractions for shared memory access:

### 1. BufferView
A `BufferView` manages a full typed array with a **fixed stride**. In the SoA architecture, the stride is always `MAX_BODIES` (10,000) for body data and `MAX_FIXTURES` (10,000) for fixture data.

```typescript
// Accessing the 'x' position of the 5th body manually:
const x = world.bodyFloats.get(5, BODY_X_OFFSET);
```

### 2. RowView
A `RowView` is bound to a specific object and its index. It provides a localized view of the object's properties across the SoA arrays.

```typescript
// RowViews support get, set, and add operations
this.floats.add(BODY_NFX_OFFSET, forceX);
```

## Fixed Capacity & Engine Limits

To maximize SIMD performance and minimize heap fragmentation, Gearbox2D uses a **fixed-capacity** memory model.

*   **MAX_BODIES**: 10,000 per world.
*   **MAX_FIXTURES**: 10,000 per world.

These limits are pre-allocated upon world creation. If your simulation requires more objects, you may need to distribute them across multiple `World` instances.

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
