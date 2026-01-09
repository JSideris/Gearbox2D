# Documentation Plan: GearBox2D

## 1. Getting Started
- `introduction.md`: Project overview and design philosophy.
- `installation.md`: How to install via NPM or CDN.
- `first-simulation.md`: A basic "Hello World" example.
- `development.md`: Build instructions for engine contributors.

## 2. Core Architecture
- `architecture-wasm-memory.md`: Deep dive into WASM/Shared Memory.
- `architecture-world.md`: Managing the simulation world.
- `architecture-coordinates.md`: Coordinate system and units.

## 3. Physical Objects (Rigid Bodies)
- `objects-body-types.md`: Fixed, Physical, and Sensor bodies.
- `objects-properties.md`: Mass, friction, restitution, etc.
- `objects-state.md`: Position, velocity, and sleeping.

## 4. Shapes & Geometry
- `shapes-current.md`: Supported shapes (Circle, Box, AABB).
- `shapes-planned.md`: Planned shapes (Capsules, Polygons).

## 5. Constraints & Joints
- `joints-hinge.md`: Hinge joint implementation.
- `joints-distance.md`: Distance joint implementation.
- `joints-spring.md`: Spring joint implementation.
- `joints-gear.md`: Gear joint implementation.

## 6. Collision System
- `collision-broad-phase.md`: BVH and spatial partitioning.
- `collision-narrow-phase.md`: Intersection math and impulse resolution.
- `collision-filtering.md`: Collision masks and categories.
- `collision-events.md`: Handling collision callbacks.

## 7. Spatial Queries & Interaction
- `interaction-queries.md`: Picking and area queries.

## 8. Graphics & Debugging
- `graphics-debug.md`: Using debug labels and visuals.

## 9. Performance & Optimization
- `performance-tips.md`: General performance advice.
- `performance-optimizations.md`: Advanced WASM/BVH optimizations.

## 10. Advanced & Planned Features
- `planned-fluid-dynamics.md`: Buoyancy and drag.
- `planned-ai-pathfinding.md`: Integrated A*.
- `planned-ccd.md`: Continuous Collision Detection.

## 11. API Reference
- `api-reference.md`: Full API documentation.

