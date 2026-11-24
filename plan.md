# Gearbox2D roadmap

## Active work, in priority order

1. **Make spatial queries see a teleport immediately.** After JavaScript changes `body.x`, `body.y`, or `body.r`, queries should use the new pose before the next `world.step()`. Cover radius, box, ray, and batched queries through the public API, including a rotated body with an offset fixture. Measure the cost of repeated writes and queries. Run `npm run test:wasm` and `npm run test:wasm:nav` in CI after building the WASM core and TypeScript wrapper. [Issue #5](https://github.com/JSideris/Gearbox2D/issues/5)
2. **Verify runtime spring and mass edits.** Change a loaded spring's rest length, frequency, and damping through the public API and check how its motion responds. For mass, the JavaScript setter writes mass and inverse mass, while the native setter also updates inertia and the mass-override flag. Define how an explicit mass interacts with later fixture density changes, then test linear and angular response through both paths.
3. **Reproduce the remaining collision and stability reports.** Recheck bullet-through-paper and high-energy bounce at a fixed timestep alongside the existing slit, corner, and wall regressions. For chain jitter, chain-belt clipping, stack drift, or motorcycle wheel penetration, isolate any engine failure in a minimal native test. Check scalar/SIMD parity for solver changes. Keep showcase calibration in the example.
4. **Measure when browser multithreading pays off.** Compare single-threaded and multithreaded builds on the same mostly sleeping scene, dense pile, and set of independent islands. Vary body count and report median and p95 step times with browser and hardware details. Record broad-phase candidate counts and tree updates to identify the bottleneck. Use the results to decide whether to change tree maintenance, awake-body storage, or parallel integration.

## Current architecture

The C++/WASM engine uses a sequential-impulse solver with hard contacts, velocity-space springs, and Kinematic Restitution Balancing enabled by default. The broad phase pads fixture bounds for linear and angular motion. Bodies can hold multiple fixtures, and the wrapper decomposes concave polygons into convex pieces. Games can query the spatial index and batch grid A* or hierarchical path requests. See the [world guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/architecture-world.md), [shape guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/shapes.md), and [navigation guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/navigation.md).

## Future directions

- **Edge or chain terrain.** Revisit when a level needs boundary behavior that existing fixtures cannot represent adequately. Use that level to define the expected contacts at segment endpoints.
- **State serialization.** A save/load or network consumer should specify which state must survive a round trip. Rendering already has access to live WASM views.
- **Aerodynamics and buoyancy.** Scope wind and velocity-dependent drag around a game workload and a measurable force response. Treat buoyancy separately when a water scene supplies an acceptance test.
- **Navigation and world scale.** Revisit navmeshes, local avoidance, inverse kinematics, or danger maps when a game demonstrates a limit of grid paths, queries, or game-side steering. Revisit world-coordinate precision when a target map establishes the required range and accuracy.
