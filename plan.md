# Gearbox2D roadmap

## Active work

Measure worker overhead and prototype batching small independent islands. Compare median and p95 step times with the current single-threaded and multithreaded builds on the same browser workloads. Use the measurements to decide whether to change worker dispatch. [Issue #27](https://github.com/JSideris/Gearbox2D/issues/27)

## Completed work

The roadmap sweep covers spatial queries, runtime edits, collision and stability regressions, showcase fixes, and the browser benchmark. It also records the subsequent cradle and slab fixes. [Findings by issue](https://github.com/JSideris/Gearbox2D/blob/master/studies/roadmap-sweep.md)

## Current architecture

The C++/WASM engine uses a sequential-impulse solver with hard contacts, velocity-space springs, and Kinematic Restitution Balancing enabled by default. The broad phase pads fixture bounds for linear and angular motion. Bodies can hold multiple fixtures, and the wrapper decomposes concave polygons into convex pieces. Games can query the spatial index and batch grid A* or hierarchical path requests. See the [world guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/architecture-world.md), [shape guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/shapes.md), and [navigation guide](https://github.com/JSideris/Gearbox2D/blob/master/docs/navigation.md).

## Future directions

- **Edge or chain terrain.** Revisit when a level needs boundary behavior that existing fixtures cannot represent adequately. Use that level to define the expected contacts at segment endpoints.
- **State serialization.** A save/load or network consumer should specify which state must survive a round trip. Rendering already has access to live WASM views.
- **Aerodynamics and buoyancy.** Scope wind and velocity-dependent drag around a game workload and a measurable force response. Treat buoyancy separately when a water scene supplies an acceptance test.
- **Navigation and world scale.** Revisit navmeshes, local avoidance, inverse kinematics, or danger maps when a game demonstrates a limit of grid paths, queries, or game-side steering. Revisit world-coordinate precision when a target map establishes the required range and accuracy.
