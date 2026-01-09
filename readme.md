# GearBox2D - High-Speed 2D Physics Engine

**⚠️ WORK IN PROGRESS (Alpha)** - *Gearbox2D is currently in active development. APIs are subject to change.*

Gearbox2D is a blazing-fast, **web-first** 2D physics engine engineered from the ground up for the modern browser. Built in C++ and compiled to WebAssembly (WASM), it provides a high-performance core with a developer-friendly TypeScript wrapper.

## Why GearBox2D?

1.  **Web-First Performance**: Zero-copy memory sharing between WASM and JavaScript via shared buffers.
2.  **Authoritative Synchronization**: Designed for real-time multiplayer with stable state injection.
3.  **Integrated AI**: Built-in support for NavMeshes, RVO/ORCA, and pathfinding at native speeds.

## Getting Started

### 1. Installation

```bash
npm install gearbox-2d
```

For more ways to install (including CDN usage), see the [Installation Guide](docs/installation.md).

### 2. Quick Start

```typescript
import gb2d from 'gearbox-2d';

async function init() {
    await gb2d.init();
    const world = gb2d.makeWorld();
    world.setGravity(0, 9.8);
    
    // ... setup world ...
    
    function loop() {
        world.step(1/60);
        requestAnimationFrame(loop);
    }
    loop();
}
```

Check out [Your First Simulation](docs/first-simulation.md) for a full, copy-pasteable example.

## Documentation

- [Introduction](docs/introduction.md) - Core pillars and architecture.
- [Installation](docs/installation.md) - NPM, CDN, and WebAssembly requirements.
- [Your First Simulation](docs/first-simulation.md) - Build a falling box demo.
- [API Reference](docs/api-reference.md) - Detailed class and method documentation.
- [Development Guide](docs/development.md) - How to build from source and contribute.

## Project Status & Roadmap

GearBox2D is currently in **Alpha**. The core physics solver and joint system are stable, but APIs are evolving. Check the [plan.md](plan.md) file for a detailed list of implemented features and future goals.

## Contributing

We welcome contributions! If you want to build the engine from source or modify the C++ core, please follow the [Development & Contributing Guide](docs/development.md).

## License

ISC
