# Introduction

**GearBox2D** is a high-performance 2D physics and AI engine written in C++, compiled to WebAssembly, and designed for the modern web. 

Unlike traditional ports of physics libraries, GearBox2D is engineered specifically for the performance characteristics and architectural requirements of the browser, eliminating the performance bottlenecks of the JS-WASM bridge.

## Why GearBox2D?

*   **Zero-Copy Interop**: Access physical state (position, rotation) with O(1) overhead. The TypeScript wrapper reads directly from WASM memory buffers.
*   **Integrated Intelligence**: Pathfinding, RVO/ORCA obstacle avoidance, and high-frequency sensors run natively inside the physics loop.
*   **Authoritative Synchronization**: Native support for real-time state updates and rollback, optimized for multiplayer architectures.

## Core Features

### Performance
- **Data-Oriented Architecture**: Optimized for CPU caches and massive object counts.
- **BVH Spatial Partitioning**: Sub-millisecond queries for raycasting and area checks.
- **Shared Memory Model**: No serialization or copying across the WASM-JS bridge.

### AI and Robotics
- **NavMeshes**: Rapid pathfinding through complex environments.
- **Local Navigation**: Collision-free movement for hundreds of agents using ORCA/RVO.
- **Agent Perception**: High-efficiency raycast and area sensor queries.

### Constraints and Joints
- Stable implementations of Hinge, Distance, Spring, and Gear joints for complex mechanical systems.

## Project Status
GearBox2D has been in development since 2023 and was first published to npm in January 2026. The engine is currently in **Alpha**. While the core physics solver is stable, APIs are evolving as we finalize the AI and fluid dynamics modules.

[View the Development Roadmap →](https://github.com/JSideris/Gearbox2D/blob/master/plan.md)

---

## Quick Start
1.  **[Installation Guide](#installation)** - Get the engine running in your project.
2.  **[Your First Simulation](#first-simulation)** - Build a basic world in minutes.
