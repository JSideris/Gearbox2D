# Introduction

**Gearbox2D** is a high-performance 2D physics and AI engine written in C++, compiled to WebAssembly, and designed for the modern web. 

Unlike traditional ports of physics libraries, Gearbox2D is engineered specifically for the performance characteristics and architectural requirements of the browser, eliminating the performance bottlenecks of the JS-WASM bridge.

## Why Gearbox2D?

*   **Zero-Copy Interop**: Access physical state (position, rotation) with O(1) overhead. The TypeScript wrapper reads directly from WASM memory buffers.
*   **Integrated Intelligence**: Queue path requests for multiple agents and advance them together with a per-tick search budget.
*   **Authoritative Synchronization**: Native support for real-time state updates and rollback, optimized for multiplayer architectures.

## Core Features

### Performance
- **Data-Oriented Architecture**: Optimized for CPU caches and massive object counts.
- **BVH Spatial Partitioning**: Sub-millisecond queries for raycasting and area checks.
- **Shared Memory Model**: No serialization or copying across the WASM-JS bridge.

### AI and Robotics
- **Grid navigation**: Choose grid A*, hierarchical A*, or a hierarchical corridor search. Track fixtures to update the grid as obstacles move.
- **Local steering**: Games can use batched radius queries to find nearby agents and apply their own avoidance rules.
- **Agent Perception**: High-efficiency raycast and area sensor queries.

### Constraints and Joints
- Stable implementations of Hinge, Distance, Spring, and Gear joints for complex mechanical systems.

## Unique Innovations

Gearbox2D introduces several architectural advancements designed for modern, large-scale web applications:

*   **Novel BVH Biasing**: Our spatial partitioning engine uses **Collision Mask Biasing** and **Sleep Biasing** to dynamically restructure the Bounding Volume Hierarchy. This significantly reduces intersection tests in complex scenes where many objects occupy the same space but belong to different collision layers.
*   **Soft springs** use frequency and damping ratio to control how quickly a joint returns to its rest length.
*   **Speed-adaptive bounds** expand broad-phase candidates along a body's predicted motion so the narrow phase can consider fast-moving pairs.
*   **Kinematic Restitution Balancing (KRB)** is enabled by default. For bouncing contacts, it accounts for velocity added by external forces during the step and adjusts rebound speed for the displacement expected from position correction.

## Project Status
Gearbox2D has been in development since 2023 and was first published to npm in January 2026. The engine is currently in **Beta**. The public API is evolving. Grid navigation is available and fluid dynamics is planned.

[View the Development Roadmap →](#plan)

---

## Quick Start
1.  **[Installation Guide](#installation)** - Get the engine running in your project.
2.  **[Core Concepts](#core-concepts)** - Learn about the World, Ticks, and Forces.
3.  **[Your First Simulation](#first-simulation)** - Build a basic world in minutes.
