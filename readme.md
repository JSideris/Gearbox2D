
# GearBox2D - High-Speed 2D Physics Engine

A blazing-fast 2D physics engine written in C++ and compiled to WebAssembly, with a TypeScript interface. Perfect for high-frequency simulations and applications requiring frequent updates.

## Prerequisites

Before you can build and run GearBox2D, you'll need to install the following dependencies:

### Required Dependencies

1. **Node.js and npm** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Emscripten SDK** (for WebAssembly compilation)
   - Install via [emsdk](https://emscripten.org/docs/getting_started/downloads.html):
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh  # On Windows: emsdk_env.bat
   ```
   - Verify installation: `emcc --version`

3. **GNU Make** (for build automation)
   - **Linux/macOS**: Usually pre-installed, verify with `make --version`. If not installed, use `sudo apt install make`.
   - **Windows**: Install via WSL, MinGW, or use `nmake` (requires Visual Studio)

4. **C++ Compiler** (for running tests)
   - **Linux**: `g++` (usually pre-installed)
   - **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
   - **Windows**: Install MinGW or use WSL

5. **Google Test** (for C++ unit tests)
   - Clone to `/home/josh/googletest/googletest` (or update the path in Makefile)
   ```bash
   git clone https://github.com/google/googletest.git /home/josh/googletest
   ```

### Optional Dependencies

- **Live Server** (for running examples): Install via npm: `npm install -g live-server`

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JSideris/Gearbox2D.git
   cd Gearbox2D
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   # Build everything (C++ to WASM + TypeScript)
   npm run build
   
   # Or build components separately:
   npm run build:cpp  # Build WebAssembly module
   npm run build:ts   # Build TypeScript interface
   ```

## Usage

### Running Tests

```bash
# Run all tests (C++ and TypeScript)
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
```

### Running Examples

1. **Start a local server** (required for WASM loading):
   ```bash
   # Using live-server (if installed globally)
   live-server examples/
   
   # Or using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server examples/
   ```

2. **Open your browser** and navigate to:
   - `http://localhost:8080` (live-server default)
   - `http://localhost:8000` (Python default)
   - Or whatever port your server is using

3. **View the examples** by opening `examples/index.html`

### Development

```bash
# Watch TypeScript files for changes
npm run dev

# Clean build artifacts
npm run clean

# Rebuild everything from scratch
make clean && npm run build
```

## Project Structure

```
Gearbox2D/
├── cpp/                    # C++ source code
│   ├── include/           # Header files
│   ├── src/              # Source files
│   └── tests/            # C++ unit tests
├── typescript/           # TypeScript interface
│   └── src/
├── examples/             # Web examples and demos
├── dist/                 # Build output
│   ├── js/              # Compiled TypeScript
│   └── wasm/            # WebAssembly modules
├── Makefile             # C++ build configuration
├── package.json         # Node.js dependencies
└── tsconfig.json        # TypeScript configuration
```

## Troubleshooting

### Common Issues

1. **Emscripten not found**: Make sure you've activated the emsdk environment
2. **Google Test not found**: Verify the path in Makefile matches your installation
3. **WASM loading errors**: Ensure you're serving files via HTTP/HTTPS, not file://
4. **Build failures**: Try `make clean && npm run build` to rebuild from scratch

### Platform-Specific Notes

- **Windows**: Consider using WSL for the best development experience
- **macOS**: You may need to install Xcode Command Line Tools
- **Linux**: Most dependencies should be available via package managers
  - **Ubuntu/Debian**: If you get `libatomic.so.1` errors with Emscripten, install: `sudo apt install libatomic1`

## API Documentation

The TypeScript interface provides a clean API for creating and managing physics worlds:

```typescript
import { Gb2d } from './dist/js/gb2d.js';

// Initialize the engine
const gb2d = new Gb2d();
await gb2d.init();

// Create a world
const world = gb2d.makeWorld();

// Add objects and run simulation
// See examples/ for complete usage examples
```

# Plan:

## Shapes, Kinematics, Collisions
[*] Setup and test Rust w/ web assembly target.
[*] Define basic starting classes for the physics module.
	[*] RigidBody.
	[*] Vec2.
[*] Contain all objects in a world. Ability to add and remove objects to/from world.
[*] Add a world tick.
[ ] Ability to export raw data as a byte array.
[*] Add debug visuals.
[*] Add a few different shapes.
	[*] AABB.
	[*] Box.
	[ ] Capsule.
	[*] Circle.
	[ ] Concave polygons.
	[ ] Convex polygons.
	[ ] Ellipse.
	[ ] Line.
	[*] Point.
[ ] Composite objects.
[*] Add rotations.
[*] Compute/track AABB for each object.
[*] Implement VBH.
[*] Implement broad phase collision detection using BVH.
[ ] Implement narrow phase collision detection.
	[*] AABB-AABB.
	[*] Box-AABB -> Box-Box.
	[*] Box-Box.
	[ ] Capsule-AABB.
	[ ] Capsule-Box.
	[ ] Capsule-Capsule.
	[*] Circle-AABB.
	[ ] Circle-Box.
	[ ] Circle-Capsule.
	[*] Circle-Circle.
	[ ] Convex-AABB.
	[ ] Convex-Box.
	[ ] Convex-Capsule.
	[ ] Convex-Circle.
	[ ] Convex-Convex.
	[ ] Concave-AABB.
	[ ] Concave-Box.
	[ ] Concave-Capsule.
	[ ] Concave-Circle.
	[ ] Concave-Convex.
	[ ] Ellipse-AABB.
	[ ] Ellipse-Box.
	[ ] Ellipse-Capsule.
	[ ] Ellipse-Circle.
	[ ] Ellipse-Concave.
	[ ] Ellipse-Convex.
	[ ] Ellipse-Ellipse.
	[ ] Line-AABB.
	[ ] Line-Box.
	[ ] Line-Capsule.
	[ ] Line-Circle.
	[ ] Line-Concave.
	[ ] Line-Convex.
	[ ] Line-Ellipse.
	[ ] Line-Line.
	[*] Point-AABB.
	[*] Point-Box.
	[ ] Point-Capsule.
	[*] Point-Circle.
	[ ] Point-Concave.
	[ ] Point-Convex.
	[ ] Point-Ellipse.
	[ ] Point-Line.
	[*] Point-Point.
	Convave polygons?
[*] Collision resolvers.
	[*] Penetration resolution.
	[*] Collision impulse.
	[*] Collision friction.
[ ] Implement collision events.
[*] Define object types.
	[*] Sensor.
	[*] Physical.
	[*] Fixed.
	[ ] Kinematic. Maybe.
[*] Implement an applyForce on objects.
[*] Implement an applyImpulse on objects.
[*] Determine and apply impulse for rigid body collisions with basic shapes.
[ ] Determine and apply impulse for convex polygons.
[ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
[ ] Collision tracking.

## Constraints
[ ] Distance.
[ ] Spring.
[ ] Hinged.
[ ] Gear constraint.

## Misc
[*] Elasticity (restitution).
[*]	Static/dynamic friction.
[ ] Support changing the center of mass.
[ ] Events.

## Fluid Dynamics
[ ] Wind.
[ ] Advanced drag.
[ ] Under water / liquid.
	[ ]	 Bouancy.

## Optimizations

### General Optimizations
[*] Cache inverse mass.
[ ] Cache inverse inertia.
[ ] Cache inverse dt.
[*] Cache exponential decay factor when dt is set.
[ ] Implement collision masks.
[ ] Focus areas & resolution.

### Broad Phase Optimizations
[*] Broad phase using AABBs.
[*] Do not recompute AABB when no movement happens.
[ ] Stagger AABB recalculation when movement is slow.
[*] Speed-dependant bounding area padding.
[ ] Spin-dependant bounding area padding.
[*] Bounding volume hierarchy (BVH).
[*] BVH sleep biasing.
[ ] BVH particle biasing.
[ ] BVH collision mask biasing.
[ ] Rebalance BVH.
[ ] Experimental: Caching previous broad-phase collisions.
[ ] Experimental: Instead of reinserting on movement, consider tree traversal.
[ ] Experimental: Consider combining the broad phase with the kinematics phase.

### Sleep Optimizations
[*] Sleeping objects.
[ ] Islands.
[*] Shrinkwrap AABB on sleep.
[ ] Experimental: Separate vectors for sleeping/awake objects.
[ ] Experimental: Re-insert into BVH upon sleep.
[ ] Experimental: Sleep drift (sleeping at terminal velocity).

## Advanced Features
[ ] Smart anti-tunelling.
[ ] Advanced drag.
[ ] Forcefields.
[ ] Microscopic scale.
[ ] Galactic scales.
[ ] Automatic handling for big world problem.

## AI
[ ] A*.
[ ] A* biasing.
[ ] A* advanced coordination.
[ ] A* precomputed mesh.


# Physical Object Data

Gear2Engine is data-oriented, allowing it to be optimized for data transfer between JavaScript and WASM. Most volatile object data for `PhysicalObject`s is stored in vectors within the `World` object. At the start of a world step, the data is copied into each `PhysicalObject` for easy processing, then the data is copied back into the vectors for transfer back into the main application. 


