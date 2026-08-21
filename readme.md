# Gearbox2D - High-Speed 2D Physics Engine

**⚠️ WORK IN PROGRESS (Beta)** - *Gearbox2D is currently in active development. APIs are subject to change.*

Gearbox2D is a blazing-fast, **web-first** 2D physics engine engineered from the ground up for the modern browser. Built in C++ and compiled to WebAssembly (WASM), it provides a high-performance core with a developer-friendly TypeScript wrapper.

## Why Gearbox2D?

1.  **Web-First Performance**: Zero-copy memory sharing between WASM and JavaScript via shared buffers.
2.  **Authoritative Synchronization**: Designed for real-time multiplayer with stable state injection.
3.  **Integrated AI**: Built-in support for NavMeshes, RVO/ORCA, and pathfinding at native speeds.

## Getting Started

### 1. Installation

#### Via NPM
```bash
npm install gearbox2d
```

#### From Source (for Development)
If you want to build the engine from source, ensure you clone with submodules:
```bash
git clone --recursive https://github.com/JSideris/Gearbox2D.git
```

For more ways to install (including CDN usage), see the [Installation Guide](docs/installation.md).

### 2. Quick Start

```typescript
import gearbox from 'gearbox2d';

async function init() {
    await gearbox.init();
    const world = gearbox.createWorld();
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

Gearbox2D is currently in **Beta**. It's performant and stable, and ready for production use, but is still a WIP and will be receiving considerable updates over coming months to get it to something I am willing to refer to as "v1". Check the [plan.md](plan.md) file for a detailed list of implemented features and future goals.

## Contributing

We welcome contributions! If you want to build the engine from source or modify the C++ core, please follow the [Development & Contributing Guide](docs/development.md).

## Research builds (KRB ablation)

For **benchmarking and research only** (not a supported product build), you can compile a native binary with Kinematic Restitution Balancing (KRB) disabled:

```bash
make test GEARBOX_DISABLE_KRB=1
make benchmark GEARBOX_DISABLE_KRB=1
make log-energy
make log-energy GEARBOX_DISABLE_KRB=1
./logEnergy --out studies/kinematic_restitution_balancing/data --seconds 600
./logEnergy-nokrb --out studies/kinematic_restitution_balancing/data --seconds 600
```

`make log-energy` writes `logEnergy` (KRB on) or `logEnergy-nokrb` (flag set). It does not run the gtest suite. Default builds (`npm run build`, `make wasm`, `make test` without the flag) always ship with KRB enabled. The no-KRB test binary skips KRB energy gtests; full test green is required on the default build only.

## License

ISC
