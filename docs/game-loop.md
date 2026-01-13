# The Simulation Loop

For a physics engine, how you advance time is just as important as the physics calculations themselves. This guide covers the best practices for setting up a stable and smooth simulation loop in Gearbox2D.

## Why use `requestAnimationFrame`?

While you might be tempted to use `setTimeout` or `setInterval` for a "fixed" interval, `requestAnimationFrame` (rAF) is the superior choice for web-based physics:

1.  **V-Sync Alignment**: rAF is synchronized with the browser's display refresh rate. This ensures that every physics step you calculate results in a visual update that aligns perfectly with the monitor, eliminating screen tearing and micro-stutter.
2.  **Resource Management**: rAF automatically pauses or slows down when the tab is backgrounded, saving CPU cycles and battery life.
3.  **High Precision**: rAF provides a high-resolution timestamp (accurate to microseconds) as an argument to its callback, which is essential for accurate timing.

## The "Fixed Timestep with Accumulator" Pattern

Physics simulations are most stable when the time step ($dt$) is consistent. If $dt$ fluctuates (variable timestep), objects might "tunnel" through walls or joints might become unstable during frame rate drops.

The **Accumulator Pattern** allows you to maintain a fixed physics step regardless of the monitor's refresh rate or minor lag spikes.

### Implementation

```javascript
let lastTime = performance.now();
let accumulator = 0;
const physicsStep = 1/60; // 60Hz physics

function loop(now) {
    // 1. Calculate time since last frame
    let dt = (now - lastTime) / 1000; // convert to seconds
    lastTime = now;

    // 2. "Spiral of Death" Protection
    // If the browser stalls (or the user returns from a backgrounded tab),
    // we cap the delta time to prevent the loop from trying to run
    // thousands of steps in a single frame.
    if (dt > 0.25) dt = 0.25; 

    accumulator += dt;

    // 3. Consume accumulated time in fixed chunks
    while (accumulator >= physicsStep) {
        world.step(); // Uses the internal fixed step (default 1/60)
        accumulator -= physicsStep;
    }

    // 4. Render the world
    // Update the engine's interpolation value for the renderer
    world.interpolationAlpha = accumulator / physicsStep;
    render();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

## Smoothing Visuals: Interpolation vs. Extrapolation

Even with a fixed timestep, visual jitter can occur if your screen's refresh rate (e.g., 144Hz) doesn't match your physics rate (60Hz). There are two main ways to solve this:

### 1. Interpolation (Recommended)
Interpolation blends between the **previous** physics state and the **current** one. This results in perfectly smooth motion but introduces exactly one frame of visual latency (16.6ms at 60Hz).

**The Math:**
\[ \text{RenderPos} = (\text{CurrentPos} \times \alpha) + (\text{PreviousPos} \times (1 - \alpha)) \]
*Where $\alpha$ is `accumulator / physicsStep`.*

Gearbox2D supports this natively in its `DebugGraphics` and stores previous states in shared memory for zero-overhead access.

### 2. Extrapolation
Extrapolation predicts where an object **will be** in the future based on its current velocity. This has zero visual latency but can cause "jitter" or "overshoot" (e.g., an object appearing to pass through a wall for a split second before snapping back).

**The Math:**
\[ \text{RenderPos} = \text{CurrentPos} + (\text{Velocity} \times \text{remainderTime}) \]

### Which should I use?
*   **Use Interpolation** for most objects, background physics, and complex mechanical systems (like gears).
*   **Use Extrapolation** for the local player's character or projectiles in competitive shooters where minimizing input-to-pixel latency is more important than visual perfection.

## Choosing a Physics Step

By default, Gearbox2D is tuned for **60Hz** (`1/60` seconds).

*   **1/60 (Default)**: Balanced performance and stability for most games.
*   **1/120+**: Higher precision for fast-moving objects or complex joint systems.
*   **1/30**: Better performance for low-end devices, but can lead to "squishy" physics or tunneling.

### Changing the Engine Timestep

If you decide to run your physics at a different rate than 60Hz, you **must** inform the engine so it can scale internal damping and decay rates correctly:

```javascript
// Run physics at 120Hz
const hz = 120;
const dt = 1 / hz;

world.setTimeStep(dt);

// In your loop, match the accumulator consumption:
while (accumulator >= dt) {
    world.step();
    accumulator -= dt;
}
```

## Engine Specifics: Internal Damping

Gearbox2D uses a precomputed `decayMap` to ensure that velocities decay consistently regardless of the chosen timestep. When you call `world.setTimeStep(dt)`, the engine recalculates these multipliers so that "10% friction per second" feels the same at 60Hz as it does at 120Hz.
