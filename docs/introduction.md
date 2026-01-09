# Introduction

**GearBox2D** is a next-generation, web-first 2D physics and AI engine. It is written in C++, compiled to WebAssembly (WASM), and exposed through a high-level TypeScript interface. Unlike traditional ports of physics libraries, GearBox2D is engineered specifically for the performance characteristics and architectural requirements of the modern web.

## The GearBox2D Mission

Our goal is to provide a unified foundation for high-performance web applications—ranging from complex games to advanced robotics simulations. We believe that physics engines in the browser should not just be "fast enough," but should empower developers to build experiences that were previously only possible in native desktop environments.

### Core Pillars:

1.  **Zero-Overhead Interop**: Minimizing the "bridge cost" between JavaScript and the physics core.
2.  **Authoritative Synchronization**: Native support for real-time state updates from external sources (servers, sensors).
3.  **Integrated Intelligence**: Built-in AI navigation and obstacle avoidance running at native speeds.

## Architecture: Data-Oriented & Web-First

GearBox2D is designed with a data-oriented architecture (DOA), optimized for modern CPU caches and efficient data transfer between the WASM linear memory and the JavaScript main thread.

### The Shared Memory Model

Traditional physics engines on the web often suffer from the overhead of copying object data (positions, rotations, velocities) back and forth across the WASM-JS bridge. GearBox2D eliminates this bottleneck:

-   **Native Memory**: All physical state is stored in contiguous, cache-friendly buffers within C++.
-   **Direct Views**: The TypeScript wrapper creates `Float32Array` and `Int32Array` views that point *directly* to the same memory addresses used by the WASM core.
-   **O(1) Access**: When you access `object.x` in TypeScript, you are performing a direct memory read from the WASM buffer. There is no serialization, no copying, and zero overhead.

## AI & Robotics Foundations

GearBox2D goes beyond simple collision detection. We are building a suite of integrated AI tools that live inside the physics loop, allowing for high-performance agent behavior:

-   **Precomputed NavMeshes**: Rapid pathfinding through complex environments.
-   **Local Navigation (RVO/ORCA)**: High-performance, collision-free movement for hundreds of autonomous agents.
-   **High-Frequency Sensors**: Efficient raycasting and area queries for agent perception.

## Project Status: Alpha (WIP)

GearBox2D is currently in **Alpha**. The core physics solver and joint system are stable, but APIs are evolving quickly as we implement the AI and fluid dynamics modules. We encourage developers to experiment, report issues, and help shape the future of web-based physics.

## Roadmap

The engine is under active development. Key focus areas include:
- Improving stability for complex constraints.
- Expanding supported shapes (Capsules, Polygons).
- Implementing Continuous Collision Detection (CCD).
- Integrating fluid dynamics and AI pathfinding.

Check the [plan.md](https://github.com/JSideris/Gearbox2D/blob/master/plan.md) file in the repository for a detailed list of implemented features and future development goals.

## Getting Started

Ready to try it out? Head over to the [Installation Guide](installation.md) or dive straight into [Your First Simulation](first-simulation.md).
