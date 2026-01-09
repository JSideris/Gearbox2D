import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as m}from"./markdown-DTfqLWyu.js";const u="# Documentation Structure: GearBox2D\n\n## Getting Started\n- `introduction.md`: Introduction\n- `installation.md`: Setup\n- `core-concepts.md`: Core Concepts\n- `first-simulation.md`: First Simulation\n- `development.md`: Engine Development\n- `plan.md`: Project Roadmap\n\n## Core Architecture\n- `architecture-wasm-memory.md`: WASM & Shared Memory\n- `architecture-world.md`: World Management\n- `architecture-coordinates.md`: Coordinates & Units\n\n## Physical Objects\n- `objects-body-types.md`: Body Types\n- `objects-lifecycle.md`: Object Lifecycle\n- `objects-properties.md`: Body Properties\n- `objects-state.md`: Body State\n\n## Shapes & Geometry\n- `shapes-current.md`: Supported Shapes\n- `shapes-planned.md`: Planned Shapes\n\n## Constraints & Joints\n- `joints-overview.md`: Joints Overview\n- `joints-hinge.md`: Hinge Joints\n- `joints-distance.md`: Distance Joints\n- `joints-spring.md`: Spring Joints\n- `joints-gear.md`: Gear Joints\n\n## Collision System\n- `collision-broad-phase.md`: Broad Phase\n- `collision-narrow-phase.md`: Narrow Phase\n- `collision-filtering.md`: Collision Filtering\n- `collision-events.md`: Collision Events\n\n## Spatial Queries & Interaction\n- `interaction-queries.md`: Spatial Queries\n\n## Graphics & Debugging\n- `graphics-debug.md`: Debug Graphics\n\n## Performance & Optimization\n- `performance-tips.md`: Performance Tips\n- `performance-optimizations.md`: Optimizations\n\n## Advanced & Planned Features\n- `planned-fluid-dynamics.md`: Fluid Dynamics (Planned)\n- `planned-ai-pathfinding.md`: AI Pathfinding (Planned)\n- `planned-ccd.md`: Continuous Collision Detection (Planned)\n\n## API Reference\n- `api-reference.md`: API Reference\n\n",c=Object.freeze(Object.defineProperty({__proto__:null,default:u},Symbol.toStringTag,{value:"Module"})),g=`# API Reference
TODO

`,b=Object.freeze(Object.defineProperty({__proto__:null,default:g},Symbol.toStringTag,{value:"Module"})),y=`# Coordinate System
TODO

`,f=Object.freeze(Object.defineProperty({__proto__:null,default:y},Symbol.toStringTag,{value:"Module"})),v=`# WASM & Shared Memory
TODO

`,w=Object.freeze(Object.defineProperty({__proto__:null,default:v},Symbol.toStringTag,{value:"Module"})),j=`# World Object

The \`World\` object is the central container for all physical entities in Gearbox2D. It manages the lifecycle of physical objects and joints, orchestrates the simulation steps, and handles global physics settings like gravity and collision resolution.

## Introduction

In Gearbox2D, the \`World\` acts as the coordinator for the entire physics simulation. It maintains internal data structures (like the BVH for spatial partitioning) and provides the interface for creating, querying, and manipulating the physical environment.

Key responsibilities include:
- **Entity Management**: Creating and removing physical objects and joints.
- **Simulation Control**: Stepping the physics forward in time.
- **Global Settings**: Configuring gravity and toggleable physics features (restitution, friction, etc.).
- **Spatial Queries**: Performing point queries and broad-phase checks.

## Lifecycle and Setup

### Creating a World

A \`World\` instance is created via the main \`gb2d\` engine object. This ensures the underlying WebAssembly module is initialized before the world is constructed.

\`\`\`typescript
import gb2d from 'gearbox2d';

// Ensure the engine is initialized first
await gb2d.init();

// Create a new world instance
const world = gb2d.makeWorld();
\`\`\`

### Stepping the Simulation

The simulation progresses in discrete time intervals called "steps". Typically, you call \`world.step()\` within your application's main loop (e.g., inside \`requestAnimationFrame\`).

\`\`\`typescript
function update() {
    // Advance the simulation by one time step
    world.step();
    
    // Request the next frame
    requestAnimationFrame(update);
}
\`\`\`

By default, the engine uses a fixed time step (60Hz). You can adjust this using \`setTimeStep(dt)\`.

### Resetting the World

To remove all objects and joints and reset the simulation state, use the \`clear()\` method.

\`\`\`typescript
world.clear();
\`\`\`

This is more efficient than destroying and recreating the world object if you need to restart a level or simulation.

## Simulation Mechanics

The \`world.step()\` method executes several distinct phases to resolve physics for the current frame:

1.  **Kinematics (Integration)**: Updates positions and velocities based on current forces, gravity, and damping.
2.  **Broad Phase (BVH)**: Uses a Bounding Volume Hierarchy to quickly identify pairs of objects whose AABBs overlap.
3.  **Narrow Phase**: Performs precise collision detection for the pairs identified in the broad phase to find contact points and penetration depths.
4.  **Contact Management**: Tracks collisions over time, triggering \`onCollisionStart\` and \`onCollisionEnd\` events.
5.  **Constraint Solving**: Resolves impulses for collisions and joints using an iterative solver.

### Time Steps

Stability in physics simulations depends heavily on the consistency of the time step. Gearbox2D is optimized for a fixed time step.

\`\`\`typescript
// Set the simulation to 120Hz for higher precision
world.setTimeStep(1 / 120);
\`\`\`

## Physics Configuration

The \`World\` provides global toggles and settings that affect all objects within it.

### Gravity

Gravity is a global force applied to all dynamic objects.

\`\`\`typescript
// Set gravity (x, y)
world.setGravity(0, 9.81);
\`\`\`

### Feature Toggles

You can enable or disable specific parts of the physics solver to optimize performance or achieve specific behaviors:

- **Penetration Resolution**: \`setHasPenetrationResolution(bool)\` - Toggles whether objects should push each other out when overlapping.
- **Restitution**: \`setHasRestitution(bool)\` - Toggles bounciness calculation.
- **Friction**: \`setHasFriction(bool)\` - Toggles friction calculation.

\`\`\`typescript
world.setHasRestitution(true);
world.setHasFriction(true);
world.setHasPenetrationResolution(true);
\`\`\`

## Object and Joint Management

The \`World\` manages all entities through unique IDs. This allows for efficient lookups across the JavaScript and WebAssembly boundary.

### Physical Objects

Objects are created with a unique ID and a specification object.

\`\`\`typescript
const obj = world.makeObject(101, {
    shape: gb2d.shapes.CIRCLE,
    type: gb2d.bodyTypes.RIGID_BODY,
    x: 0,
    y: 0,
    radius: 1,
    mass: 1
});

// Remove an object by ID
world.removeObject(101);
\`\`\`

### Joints

Joints are created through factory methods on the \`World\` instance. They connect two \`PhysicalObject\` instances.

- **Hinge Joint**: \`createHingeJoint(id, bodyA, bodyB, options)\`
- **Distance Joint**: \`createDistanceJoint(id, bodyA, bodyB, options)\`
- **Spring Joint**: \`createSpringJoint(id, bodyA, bodyB, options)\`
- **Gear Joint**: \`createGearJoint(id, joint1, joint2, ratio)\`

\`\`\`typescript
const hinge = world.createHingeJoint(201, boxA, boxB, {
    worldAnchor: { x: 5, y: 5 }
});

// Remove a joint by ID
world.removeJoint(201);
\`\`\`

## Interaction and Queries

### Spatial Queries

You can query the world to find objects at specific coordinates.

\`\`\`typescript
// Find all objects at (x, y) that match a collision mask
const hits = world.queryPoint(5.5, 10.2, 0xFFFF);
hits.forEach(id => {
    const obj = world.getObjectById(id);
    console.log(\`Hit object: \${id}\`);
});
\`\`\`

### Collision Events

The \`World\` provides hooks for responding to collision events.

\`\`\`typescript
world.onCollisionStart = (idA, idB, impulse) => {
    console.log(\`Collision started between \${idA} and \${idB}\`);
};

world.onCollisionEnd = (idA, idB, impulse) => {
    console.log(\`Collision ended between \${idA} and \${idB}\`);
};
\`\`\`

## Performance: Live Data Buffers

A key architectural feature of Gearbox2D is the use of shared memory buffers for performance.

When a \`World\` is created, it exposes \`liveFloatData\` and \`liveIntData\`. These are \`TypedArrays\` (Float32Array and Int32Array) that map directly to the underlying C++ data structures in WASM memory.

Instead of calling expensive getter/setter functions for every object's position every frame, the engine updates these buffers directly. The TypeScript \`PhysicalObject\` wrappers use these buffers to provide high-performance access to object state.

\`\`\`typescript
// Accessing live data directly (via PhysicalObject)
const x = obj.x; // Reads from liveFloatData
obj.x = 10;      // Writes to liveFloatData
\`\`\`

## Multiple World Support

Gearbox2D fully supports multiple independent \`World\` instances running simultaneously. 

Each world has its own:
- Object and Joint registries.
- BVH spatial index.
- Physics settings (gravity, time step, etc.).
- Event listeners.

This is useful for scenarios like:
- **Simulating sub-scenes**: Running a separate UI or inventory physics simulation alongside the main game world.
- **Parallel simulations**: Running multiple "what-if" simulations for AI pathfinding or prediction.
- **Multi-room environments**: Managing different rooms or levels that don't interact with each other physically.

\`\`\`typescript
const gameWorld = gb2d.makeWorld();
const uiWorld = gb2d.makeWorld();

// These worlds are completely isolated
gameWorld.setGravity(0, 9.81);
uiWorld.setGravity(0, 0);

gameWorld.step();
uiWorld.step();
\`\`\`
`,_=Object.freeze(Object.defineProperty({__proto__:null,default:j},Symbol.toStringTag,{value:"Module"})),S=`# Broad Phase
TODO

`,x=Object.freeze(Object.defineProperty({__proto__:null,default:S},Symbol.toStringTag,{value:"Module"})),A=`# Collision Events
TODO

`,T=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"})),O=`# Collision Filtering
TODO

`,C=Object.freeze(Object.defineProperty({__proto__:null,default:O},Symbol.toStringTag,{value:"Module"})),B=`# Narrow Phase
TODO

`,P=Object.freeze(Object.defineProperty({__proto__:null,default:B},Symbol.toStringTag,{value:"Module"})),D=`# Core Concepts

Understanding these three fundamental concepts will help you build stable and predictable simulations in GearBox2D.

## 1. The World
The \`World\` is the heart of your simulation. It is the container for all physical objects, joints, and global settings like gravity.

\`\`\`javascript
const world = gb2d.makeWorld();
world.setGravity(0, 9.8); // Set gravity to 9.8 m/s² downwards
\`\`\`

Think of the World as the "universe" of your physics scene. It handles:
- **Collision Detection**: Finding which objects are touching.
- **Constraint Solving**: Making sure joints (like hinges) stay connected.
- **Integration**: Calculating new positions based on velocities and forces.

## 2. Steps and Ticks
Physics engines don't simulate time continuously. Instead, they move forward in small, discrete "ticks" or "steps."

\`\`\`javascript
// Progress the simulation by 1/60th of a second
world.step(1/60);
\`\`\`

### The Importance of a Fixed Timestep
For the most stable results, you should ideally step the world at a **fixed frequency** (like 60Hz). While GearBox2D can handle variable time steps (e.g., using your game loop's \`dt\`), huge spikes in time can cause objects to tunnel through walls or joints to explode.

**Pro-tip:** If your game's frame rate drops, it's better to run multiple small physics steps than one giant one.

## 3. Forces vs. Impulses
There are two primary ways to move objects manually beyond gravity and collisions.

### Forces
A **Force** is applied over a period of time. Think of it like a rocket engine firing or wind blowing.
- **Method**: \`object.applyForce(x, y)\`
- **Behavior**: It is added to the object's acceleration. You must call it every frame you want the force to persist.
- **Unit**: Newtons ($kg \\cdot m/s^2$).

### Impulses
An **Impulse** is an instantaneous change in momentum. Think of it like a hammer blow, a jump, or an explosion.
- **Method**: \`object.applyImpulse(x, y, contactX, contactY)\`
- **Behavior**: It immediately changes the object's velocity. You usually call it only once for a specific event.
- **Unit**: $kg \\cdot m/s$.

| Feature | Force | Impulse |
| :--- | :--- | :--- |
| **Duration** | Continuous (must be reapplied) | Instantaneous (one-off) |
| **Effect** | Gradual acceleration | Immediate velocity change |
| **Common Use** | Walking, flying, gravity | Jumping, collisions, firing |

### Angular Impulses
If you want to spin an object instantly without hitting a specific point, use \`applyAngularImpulse(torque)\`.

`,I=Object.freeze(Object.defineProperty({__proto__:null,default:D},Symbol.toStringTag,{value:"Module"})),k=`# Development & Contributing

Follow these instructions to build GearBox2D from source or contribute to the C++ core. If you just want to use the engine in your project, see [Installation](#installation).

## Prerequisites

To build GearBox2D, you'll need the following dependencies installed.

### Required Dependencies

1.  **Node.js and npm** (v18 or higher recommended)
    - Download from [nodejs.org](https://nodejs.org/)
    - Verify with: \`node --version\` and \`npm --version\`

2.  **Emscripten SDK** (for WebAssembly compilation)
    - Install via [emsdk](https://emscripten.org/docs/getting_started/downloads.html):
    \`\`\`bash
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    ./emsdk install latest
    ./emsdk activate latest
    source ./emsdk_env.sh  # On Windows: emsdk_env.bat
    \`\`\`
    - Verify with: \`emcc --version\`

3.  **GNU Make** (for build automation)
    - **Linux/macOS**: Usually pre-installed.
    - **Windows**: Install via WSL, MinGW, or use \`nmake\`.

4.  **C++ Compiler** (for running native tests)
    - **Linux**: \`g++\`
    - **macOS**: \`xcode-select --install\`
    - **Windows**: MinGW or WSL

5.  **Google Test** (for C++ unit tests)
    - The \`Makefile\` expects it at \`/usr/src/googletest/googletest\` by default. You can override this by setting the \`GTEST_DIR\` environment variable.

### Optional Dependencies

- **Live Server**: For running examples: \`npm install -g live-server\` or use \`npx http-server\`.

## Building from Source

1.  **Clone the repository**:
    \`\`\`bash
    git clone https://github.com/JSideris/Gearbox2D.git
    cd Gearbox2D
    \`\`\`

2.  **Install Node.js dependencies**:
    \`\`\`bash
    npm install
    \`\`\`

3.  **Build the Project**:
    You can build the entire project or individual components:
    \`\`\`bash
    # Build everything (C++ to WASM + TypeScript + Standalone)
    npm run build

    # Build WebAssembly module only
    npm run build:cpp

    # Build TypeScript interface only
    npm run build:ts
    \`\`\`

## Running Tests

GearBox2D includes both C++ and TypeScript test suites:

\`\`\`bash
# Run all tests
npm test

# Run only C++ tests
npm run test:cpp

# Run only TypeScript tests
npm run test:ts
\`\`\`

## Troubleshooting

- **Emscripten not found**: Ensure you have run \`source ./emsdk_env.sh\` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from \`file://\` URLs.
- **Build failures**: Try \`npm run clean && npm run build\` to rebuild from scratch.

`,W=Object.freeze(Object.defineProperty({__proto__:null,default:k},Symbol.toStringTag,{value:"Module"})),M=`# Your First Simulation

This guide will walk you through creating a simple physics simulation: a box falling onto a static floor.

## 1. Basic HTML Template

Create an \`index.html\` file. We will use a \`<canvas>\` element to render our simulation.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>GearBox2D Hello World</title>
    <style>
        body { margin: 0; overflow: hidden; background: #1a1a1a; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>

    <!-- OPTION A: Using the Standalone CDN (Easiest for this guide) -->
    <script src="https://unpkg.com/gearbox-2d/dist/standalone/gb2d.js"><\/script>
    <script src="main.js"><\/script>

    <!-- OPTION B: Using NPM/Bundlers (Vite, Webpack, etc.) -->
    <!-- <script type="module" src="main.js"><\/script> -->
</body>
</html>
\`\`\`

## 2. The Simulation Code

Create a \`main.js\` file. This script initializes the engine, sets up the world, and runs the simulation loop.

\`\`\`javascript
/**
 * 1. ACCESS THE ENGINE
 * 
 * If you used the CDN script tag in index.html, 'gb2d' is already 
 * available globally. If you are using NPM/Vite, uncomment the line below:
 */
// import gb2d from 'gearbox-2d';

async function start() {
    // 2. Initialize the engine
    await gb2d.init();

    // 2. Create the physics world
    const world = gb2d.makeWorld();
    world.setGravity(0, 9.8); // 9.8 m/s² downwards

    // 3. Create a static floor
    // ID: 1, Position: (5, 9), Size: 10x1
    world.makeObject(1, {
        x: 5,
        y: 9,
        width: 10,
        height: 1,
        shape: gb2d.shapes.BOX,
        type: gb2d.bodyTypes.FIXED_OBJECT,
        color: "#444"
    });

    // 4. Create a dynamic falling box
    // ID: 2, Position: (5, 2), Size: 1x1
    const box = world.makeObject(2, {
        x: 5,
        y: 2,
        width: 1,
        height: 1,
        shape: gb2d.shapes.BOX,
        color: "#ff4444"
    });

    // 5. Setup Rendering (using debug graphics)
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 6. Simulation Loop
    let lastTime = performance.now();

    function loop() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000; // Delta time in seconds
        lastTime = now;

        // Step the physics world
        // We cap dt to avoid huge jumps if the tab loses focus
        world.step(Math.min(dt, 0.1));

        // Render using debug helper
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // The debug helper draws the world in "meters"
        // We scale the context so 1 meter = 50 pixels
        ctx.save();
        ctx.scale(50, 50); 
        gb2d.debug.drawWorld(ctx, world);
        ctx.restore();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

start().catch(console.error);
\`\`\`

## Key Concepts

To build more complex simulations, it is important to understand how the engine handles time and forces.

-   **Meters, not Pixels**: GearBox2D calculates everything in meters. 
-   **The World**: The container for all your physics objects.
-   **Steps and Ticks**: How time progresses in the simulation.
-   **Forces vs. Impulses**: The different ways to move objects.

For a deep dive into these topics, see the **[Core Concepts](#core-concepts)** guide.

## Running the Example

### If using the Standalone CDN
You can simply open \`index.html\` in your browser! Because the WASM core is inlined in the standalone build, it doesn't suffer from the usual \`file://\` protocol restrictions.

### If using NPM/Bundlers
You must serve your files using a web server to allow the browser to load the \`.wasm\` file:

\`\`\`bash
npx http-server .
\`\`\`

Open your browser to \`http://localhost:8080\`, and you should see a red box fall and bounce on the floor!
`,J=Object.freeze(Object.defineProperty({__proto__:null,default:M},Symbol.toStringTag,{value:"Module"})),E=`# Debug Graphics
TODO

`,R=Object.freeze(Object.defineProperty({__proto__:null,default:E},Symbol.toStringTag,{value:"Module"})),z=`# Installation

GearBox2D is a high-performance 2D physics engine. Because it is powered by WebAssembly, there are a few specific ways to include it in your project.

## 1. Using NPM (Recommended)

If you are using a modern build tool (Vite, Webpack, esbuild, etc.), install the package via npm:

\`\`\`bash
npm install gearbox-2d
\`\`\`

### Basic Usage with a Bundler

\`\`\`typescript
import gb2d from 'gearbox-2d';

async function startPhysics() {
    // 1. Initialize the WASM core
    await gb2d.init();

    // 2. Create your physics world
    const world = gb2d.makeWorld();
    
    // ... setup simulation ...
}

startPhysics();
\`\`\`

---

## 2. Using a Script Tag (CDN / Standalone)

For simple projects, prototyping, or environments without a build step, use the **standalone** build. This version has the WebAssembly core built-in as a Base64 string, so it requires no extra files or fetch requests.

\`\`\`html
<!-- 1. Include the engine via CDN -->
<script src="https://unpkg.com/gearbox-2d/dist/standalone/gb2d.js"><\/script>

<script>
  async function init() {
    // 2. Initialize the engine (it already has the WASM inside!)
    await gb2d.init();
    
    // 3. Create your physics world
    const world = gb2d.makeWorld();
    console.log("Physics World Created:", world);
  }

  init();
<\/script>
\`\`\`

---

## 3. WebAssembly & Local Servers

**Standalone/CDN Users:** 
If you are using the \`dist/standalone/gb2d.js\` file, you can likely run your project by simply opening an \`.html\` file from your file explorer, because the WASM is inlined.

**NPM/Standard Users:**
If you are using the standard build (npm package), you **must** serve your project via a local web server because browsers block the loading of external \`.wasm\` files over the \`file://\` protocol.

If you don't have a local server, you can use \`npx\`:

\`\`\`bash
# Start a simple server in your project folder
npx http-server .
\`\`\`

---

## Next Steps

Once you have the engine installed, check out [Your First Simulation](#first-simulation) to build a falling box demo.

`,G=Object.freeze(Object.defineProperty({__proto__:null,default:z},Symbol.toStringTag,{value:"Module"})),F=`# Spatial Queries
TODO

`,H=Object.freeze(Object.defineProperty({__proto__:null,default:F},Symbol.toStringTag,{value:"Module"})),L=`# Introduction

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

## Unique Innovations

GearBox2D introduces several architectural advancements designed for modern, large-scale web applications:

*   **Novel BVH Biasing**: Our spatial partitioning engine uses **Collision Mask Biasing** and **Sleep Biasing** to dynamically restructure the Bounding Volume Hierarchy. This significantly reduces intersection tests in complex scenes where many objects occupy the same space but belong to different collision layers.
*   **Physics-Native AI Suite**: A* pathfinding, NavMeshes, and RVO/ORCA local navigation are integrated directly into the physics loop. This allows agents to navigate complex environments with full awareness of physical constraints and dynamic obstacles at native speeds.
*   **The "Big World" Solver**: Specialized handling for microscopic and galactic scales solves the precision issues common in standard engines, enabling massive-scale simulations without coordinate jitter or "big world" floating-point errors.
*   **Hybrid Soft Constraints**: Leverage per-object Baumgarte bias factors to create "squishy" interactions and soft joints without the performance penalty of a dedicated soft-body engine.
*   **Speed-Adaptive Bounding**: Bounding volume padding that scales with velocity and angular momentum, preventing "tunneling" for high-speed objects while keeping the broad-phase tight for slow-moving ones.

## Project Status
GearBox2D has been in development since 2023 and was first published to npm in January 2026. The engine is currently in **Alpha**. While the core physics solver is stable, APIs are evolving as we finalize the AI and fluid dynamics modules.

[View the Development Roadmap →](https://github.com/JSideris/Gearbox2D/blob/master/plan.md)

---

## Quick Start
1.  **[Installation Guide](#installation)** - Get the engine running in your project.
2.  **[Core Concepts](#core-concepts)** - Learn about the World, Ticks, and Forces.
3.  **[Your First Simulation](#first-simulation)** - Build a basic world in minutes.
`,q=Object.freeze(Object.defineProperty({__proto__:null,default:L},Symbol.toStringTag,{value:"Module"})),V="# Distance Joint\n\nA **Distance Joint** maintains a fixed distance between two points on two separate physical objects. It prevents the objects from moving closer together or further apart than the specified length.\n\nFor general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).\n\n## Creation\n\nTo create a distance joint, use the `world.createDistanceJoint` method.\n\n```javascript\nconst joint = world.createDistanceJoint(id, bodyA, bodyB, {\n    worldAnchorA: { x: 2, y: 5 },\n    worldAnchorB: { x: 8, y: 5 }\n});\n```\n\n### Options\n\n| Property | Type | Description |\n| :--- | :--- | :--- |\n| `worldAnchorA` | `Vec2` | World coordinate for anchor on `bodyA`. |\n| `worldAnchorB` | `Vec2` | World coordinate for anchor on `bodyB`. |\n| `anchorA` | `Vec2` | Local anchor relative to `bodyA`. |\n| `anchorB` | `Vec2` | Local anchor relative to `bodyB`. |\n| `length` | `number` | The target distance. If omitted, it's calculated from anchors at creation. |\n\n## Properties\n\nIn addition to the [common joint properties](./joints-overview.md#common-properties), the Distance Joint provides:\n\n| Property | Type | Access | Description |\n| :--- | :--- | :--- | :--- |\n| `length` | `number` | Read/Write | The current target distance for the joint. |\n| `localAnchorA` | `Vec2` | Read/Write | Local anchor point on `bodyA`. |\n| `localAnchorB` | `Vec2` | Read/Write | Local anchor point on `bodyB`. |\n\n## Example: Rigid Rod\n\n```javascript\nconst ball1 = world.makeObject(1, { x: 5, y: 5 });\nconst ball2 = world.makeObject(2, { x: 10, y: 5 });\n\n// Connect with a 5m rigid rod\nworld.createDistanceJoint(101, ball1, ball2, {\n    length: 5\n});\n```\n",N=Object.freeze(Object.defineProperty({__proto__:null,default:V},Symbol.toStringTag,{value:"Module"})),U=`# Gear Joint

A **Gear Joint** links the rotation of two physical objects by constraining their relative angles via two existing [Hinge Joints](./joints-hinge.md).

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

A gear joint requires two existing hinge joints.

\`\`\`javascript
const hinge1 = world.createHingeJoint(1, bodyA, bodyB, { ... });
const hinge2 = world.createHingeJoint(2, bodyC, bodyD, { ... });

const gear = world.createGearJoint(101, hinge1, hinge2, 2.0);
\`\`\`

### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| \`joint1\` | \`HingeJoint\` | The first hinge joint to link. |
| \`joint2\` | \`HingeJoint\` | The second hinge joint to link. |
| \`ratio\` | \`number\` | The gear ratio. |

## Mechanics

The gear joint enforces the following constraint:
\\[ \\theta_2 + \\text{ratio} \\times \\theta_1 = \\text{constant} \\]

- **Ratio**: If the ratio is \`2.0\`, then \`joint1\` rotating by 1° causes \`joint2\` to rotate by -2°.

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Gear Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| \`ratio\` | \`number\` | Read/Write | The gear ratio between the two joints. |
| \`reactionTorque\` | \`number\` | Read-only | The torque applied to maintain the gear constraint. |

## Example: Simple Gear Train

\`\`\`javascript
// Large gear
const gear1 = world.makeObject(1, { x: 5, y: 5 });
const hinge1 = world.createHingeJoint(10, staticBody, gear1, { worldAnchor: { x: 5, y: 5 } });

// Small gear
const gear2 = world.makeObject(2, { x: 7, y: 5 });
const hinge2 = world.createHingeJoint(11, staticBody, gear2, { worldAnchor: { x: 7, y: 5 } });

// Link them with a 2:1 ratio
world.createGearJoint(101, hinge1, hinge2, 2.0);
\`\`\`
`,Y=Object.freeze(Object.defineProperty({__proto__:null,default:U},Symbol.toStringTag,{value:"Module"})),$=`# Hinge Joint

A **Hinge Joint** (also known as a **Revolute Joint**) constrains two physical objects to share a common point, allowing them to rotate freely around that point. This is similar to a pin or a hinge on a door.

For general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).

## Creation

To create a hinge joint, use the \`world.createHingeJoint\` method. 

\`\`\`javascript
const joint = world.createHingeJoint(id, bodyA, bodyB, {
    worldAnchor: { x: 5, y: 5 }
});
\`\`\`

### Options

| Property | Type | Description |
| :--- | :--- | :--- |
| \`worldAnchor\` | \`Vec2\` | The point in world coordinates where the two bodies are joined. |
| \`anchorA\` | \`Vec2\` | Local anchor relative to \`bodyA\` (used if \`worldAnchor\` is not provided). |
| \`anchorB\` | \`Vec2\` | Local anchor relative to \`bodyB\` (used if \`worldAnchor\` is not provided). |

## Properties

In addition to the [common joint properties](./joints-overview.md#common-properties), the Hinge Joint provides:

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| \`localAnchorA\` | \`Vec2\` | Read/Write | The anchor point relative to \`bodyA\`. |
| \`localAnchorB\` | \`Vec2\` | Read/Write | The anchor point relative to \`bodyB\`. |
| \`reactionTorque\` | \`number\` | Read-only | Always \`0\` for basic 2D hinges (no rotational constraint). |

## Example: Creating a Pendulum

A common use for a hinge joint is creating a pendulum by connecting a dynamic object to a fixed point in the world.

\`\`\`javascript
// 1. Create a static anchor
const anchor = world.makeObject(1, {
    x: 10, y: 2,
    type: gb2d.bodyTypes.FIXED_OBJECT
});

// 2. Create a dynamic weight
const weight = world.makeObject(2, {
    x: 15, y: 2,
    width: 1, height: 1
});

// 3. Connect them with a hinge at the anchor's position
world.createHingeJoint(101, anchor, weight, {
    worldAnchor: { x: 10, y: 2 }
});
\`\`\`
`,X=Object.freeze(Object.defineProperty({__proto__:null,default:$},Symbol.toStringTag,{value:"Module"})),K=`# Joints Overview

Joints in Gearbox2D are used to constrain the movement of physical objects relative to each other or to the world. By connecting bodies with joints, you can create complex mechanisms like pendulums, ragdolls, cars, and gear trains.

## Common Features

All joints in the engine share several fundamental concepts and API patterns.

### Creation and Removal

Joints are created through the \`World\` instance and require a unique ID. 

\`\`\`javascript
// Creation pattern
const joint = world.createHingeJoint(id, bodyA, bodyB, options);

// Removal pattern
world.removeJoint(id);
\`\`\`

### The Anchor System

Most joints are defined by **Anchor Points**. These are points on the bodies where the joint is "attached."

1.  **World Anchor**: During creation, you often specify a \`worldAnchor\`. The engine automatically converts this into local coordinates for both bodies so that the joint is perfectly aligned at that moment.
2.  **Local Anchors (\`localAnchorA\`, \`localAnchorB\`)**: These define the attachment point relative to each body's center of mass. You can modify these at runtime to shift the pivot point of a joint.

### Common Properties

Every joint object provides access to the following:

| Property | Type | Description |
| :--- | :--- | :--- |
| \`id\` | \`number\` | The unique ID provided at creation. |
| \`bodyA\` | \`PhysicalObject\` | The first body connected by the joint. |
| \`bodyB\` | \`PhysicalObject\` | The second body connected by the joint. |
| \`reactionForce\` | \`Vec2\` | The force (in Newtons) being applied by the joint to maintain the constraint. |
| \`reactionTorque\` | \`number\` | The torque being applied by the joint. |

---

## Choosing a Joint

Use this table to decide which joint is best for your specific use case:

| Joint Type | Behavior | Common Use Cases |
| :--- | :--- | :--- |
| **[Hinge Joint](./joints-hinge.md)** | Constraints two points to overlap, allowing rotation. | Doors, wheels, pendulums, limbs. |
| **[Distance Joint](./joints-distance.md)** | Maintains a rigid distance between two points. | Rigid rods, elevators, simple bridges. |
| **[Spring Joint](./joints-spring.md)** | A distance joint with elastic mass-spring-damper physics. | Suspension, ropes, soft connections. |
| **[Gear Joint](./joints-gear.md)** | Links the rotation of two hinge joints via a ratio. | Mechanical gears, transmission, pullies. |

## Tips for Working with Joints

- **Waking Up**: Modifying joint properties (like \`localAnchor\` or \`length\`) will automatically "wake up" the connected bodies if they were sleeping.
- **Breakable Joints**: You can simulate breakable connections by checking the magnitude of \`reactionForce\` every frame and calling \`world.removeJoint()\` if it exceeds a threshold.
- **Static Anchors**: To anchor an object to a fixed point in space, connect it to a \`FIXED_OBJECT\` body at the desired world location.

`,Q=Object.freeze(Object.defineProperty({__proto__:null,default:K},Symbol.toStringTag,{value:"Module"})),Z="# Spring Joint\n\nA **Spring Joint** (also known as a soft distance joint) maintains a target distance between two objects while allowing for elastic movement. It simulates a physical spring-damper system.\n\nFor general information on how joints work in Gearbox2D, see the [Joints Overview](./joints-overview.md).\n\n## Creation\n\nTo create a spring joint, use the `world.createSpringJoint` method.\n\n```javascript\nconst joint = world.createSpringJoint(id, bodyA, bodyB, {\n    worldAnchorA: { x: 5, y: 2 },\n    worldAnchorB: { x: 5, y: 5 },\n    frequencyHz: 2.0,\n    dampingRatio: 0.5\n});\n```\n\n### Options\n\n| Property | Type | Default | Description |\n| :--- | :--- | :--- | :--- |\n| `frequencyHz` | `number` | `5.0` | Stiffness (Hertz). `0` makes it rigid. |\n| `dampingRatio` | `number` | `0.7` | Oscillation decay (`0` to `1+`). |\n| `length` | `number` | *auto* | Rest length of the spring. |\n| `worldAnchorA/B` | `Vec2` | - | World coordinates for anchors. |\n\n## Properties\n\nIn addition to the [common joint properties](./joints-overview.md#common-properties), the Spring Joint provides:\n\n| Property | Type | Access | Description |\n| :--- | :--- | :--- | :--- |\n| `frequencyHz` | `number` | Read/Write | Adjusts the stiffness. |\n| `dampingRatio` | `number` | Read/Write | Adjusts the oscillation decay. |\n| `length` | `number` | Read/Write | The rest length of the spring. |\n\n## Dynamics\n\n- **Frequency (`frequencyHz`)**: Higher values make the spring stiffer.\n- **Damping (`dampingRatio`)**: `0.0` is undamped (never stops), `1.0` is critically damped (stops quickly).\n\n## Example: Suspension System\n\n```javascript\nconst chassis = world.makeObject(1, { x: 10, y: 5 });\nconst wheel = world.makeObject(2, { x: 10, y: 6 });\n\n// Soft suspension\nworld.createSpringJoint(101, chassis, wheel, {\n    anchorA: { x: 0, y: 1 },\n    frequencyHz: 3.0,\n    dampingRatio: 0.5\n});\n```\n",ee=Object.freeze(Object.defineProperty({__proto__:null,default:Z},Symbol.toStringTag,{value:"Module"})),ne=`# Body Types

In Gearbox2D, every physical object has a body type that determines how it interacts with the physics world. You can set the body type when creating an object using the \`type\` property.

## Available Body Types

### Rigid Body (Dynamic)
\`gb2d.bodyTypes.RIGID_BODY\`

Dynamic bodies are fully simulated by the physics engine. They are affected by gravity, external forces, impulses, and collisions with other objects. This is the default type for most interactive objects like players, boxes, or debris.

\`\`\`typescript
world.makeObject(nextId++, {
    x: 5, y: 5,
    shape: gb2d.shapes.CIRCLE,
    radius: 0.5,
    mass: 1.0,
    type: gb2d.bodyTypes.RIGID_BODY
});
\`\`\`

### Fixed Object (Static)
\`gb2d.bodyTypes.FIXED_OBJECT\`

Fixed objects have infinite mass and are immovable by the physics simulation. They do not respond to forces or impulses. They are typically used for static environment elements like ground, walls, or platforms. While they can be moved manually by setting their position, they do not have velocity-based movement.

\`\`\`typescript
world.makeObject(nextId++, {
    x: 5, y: 9,
    width: 10, height: 1,
    shape: gb2d.shapes.AABB,
    type: gb2d.bodyTypes.FIXED_OBJECT
});
\`\`\`

### Kinematic Object
\`gb2d.bodyTypes.KINEMATIC_OBJECT\`

Kinematic objects are a hybrid between dynamic and fixed objects. Like fixed objects, they have infinite mass and are unaffected by forces or collisions. However, they can have velocity and will move based on that velocity. This makes them ideal for moving platforms, elevators, or character-controlled objects that should "push" other objects without being pushed back.

\`\`\`typescript
world.makeObject(nextId++, {
    x: 2, y: 5,
    vx: 2.0, // Moves horizontally
    width: 2, height: 0.5,
    shape: gb2d.shapes.BOX,
    type: gb2d.bodyTypes.KINEMATIC_OBJECT
});
\`\`\`

### Sensor
\`gb2d.bodyTypes.SENSOR\`

Sensors detect collisions and trigger events but do not have a physical response. They "pass through" other objects. They are useful for trigger zones, area-of-effect detection, or visibility checks. Note that sensors still require collision categories and masks to be configured to interact with specific groups.

\`\`\`typescript
world.makeObject(nextId++, {
    x: 5, y: 5,
    shape: gb2d.shapes.CIRCLE,
    radius: 2.0,
    type: gb2d.bodyTypes.SENSOR,
    wantsEvents: true // Opt-in to collision events
});
\`\`\`
`,te=Object.freeze(Object.defineProperty({__proto__:null,default:ne},Symbol.toStringTag,{value:"Module"})),oe=`# Physical Object Lifecycle

Understanding the lifecycle of a \`PhysicalObject\` is crucial for efficient simulation management. This page covers how objects are created, updated during the simulation loop, transitioned into sleep states, and eventually removed.

## Creation

Physical objects are instantiated using the \`world.makeObject()\` method. This method initializes the object in both the JavaScript wrapper and the underlying C++ engine.

\`\`\`typescript
const obj = world.makeObject(id, {
    x: 10,
    y: 20,
    shape: gb2d.shapes.CIRCLE,
    radius: 1,
    type: gb2d.bodyTypes.RIGID_BODY,
    mass: 1.0,
    // ... other properties
});
\`\`\`

Upon creation, the engine:
1. Allocates space in the **Live Data Buffers** (\`liveFloatData\` and \`liveIntData\`).
2. Computes the initial **AABB** (Axis-Aligned Bounding Box).
3. Inserts the object into the **BVH** (Bounding Volume Hierarchy) for spatial tracking.

## Simulation Step (Integration)

Each time \`world.step()\` is called, every active (awake) object undergoes a movement update:

1.  **Impulse Application**: Any impulses applied during the frame are integrated into the velocity.
2.  **Force Integration**: Forces (including gravity and damping) are converted into acceleration and added to the velocity.
3.  **Position Update**: The object's position is updated based on its current velocity and the time step ($dt$).
4.  **AABB Update**: If the object moved significantly, its AABB is recomputed and its position in the BVH is updated.

## Sleeping and Waking

To maintain high performance with large numbers of objects, Gearbox2D implements an automatic "sleep" mechanism.

### Automatic Sleeping
An object will automatically enter a sleep state if its activity remains below certain thresholds for a sustained period (default is 1 second).

- **Velocity Threshold**: Linear velocity must be below \`0.005\`.
- **Angular Velocity Threshold**: Rotational speed must be below \`0.005\`.

When an object sleeps:
- It is no longer included in the kinematics integration step.
- Its AABB is "shrink-wrapped" to its exact bounds (removing padding) to minimize unnecessary collision checks.
- It is flagged in the \`liveIntData\` buffer with the \`IS_ASLEEP\` bit.

### Waking Up
An object is "woken up" (returned to an active state) when:
- **Collisions**: It is hit by another active object.
- **External Forces**: An impulse or force is applied via \`applyForce()\` or \`applyImpulse()\`.
- **Manual Manipulation**: A property like \`x\`, \`y\`, or \`vx\` is changed via the JavaScript API.
- **Neighbor Propagation**: When an object wakes up, it automatically wakes up all objects it is currently in contact with.

You can manually wake an object using the \`wakeUp()\` method:

\`\`\`typescript
obj.wakeUp();
\`\`\`

## Removal

When an object is no longer needed, it must be removed from the world.

\`\`\`typescript
world.removeObject(obj.id);
\`\`\`

During removal, the engine:
1. Removes the object from the **BVH**.
2. Destroys any **Joints** connected to the object.
3. Clears **Contacts** from other objects' tracking lists.
4. Reorganizes the **Live Data Buffers** to fill the gap (using a swap-and-pop strategy for $O(1)$ removal).

> **Note**: After calling \`removeObject()\`, the JavaScript \`PhysicalObject\` wrapper becomes invalid and should no longer be used.

`,ie=Object.freeze(Object.defineProperty({__proto__:null,default:oe},Symbol.toStringTag,{value:"Module"})),ae=`# Object Properties
TODO

`,se=Object.freeze(Object.defineProperty({__proto__:null,default:ae},Symbol.toStringTag,{value:"Module"})),re=`# State Management
TODO

`,le=Object.freeze(Object.defineProperty({__proto__:null,default:re},Symbol.toStringTag,{value:"Module"})),ce=`# Performance Optimizations
TODO

`,de=Object.freeze(Object.defineProperty({__proto__:null,default:ce},Symbol.toStringTag,{value:"Module"})),pe=`# Performance Tips
TODO

`,he=Object.freeze(Object.defineProperty({__proto__:null,default:pe},Symbol.toStringTag,{value:"Module"})),me=`# AI & Pathfinding (Planned)
TODO

`,ue=Object.freeze(Object.defineProperty({__proto__:null,default:me},Symbol.toStringTag,{value:"Module"})),ge=`# Continuous Collision Detection (Planned)
TODO

`,be=Object.freeze(Object.defineProperty({__proto__:null,default:ge},Symbol.toStringTag,{value:"Module"})),ye=`# Fluid Dynamics (Planned)
TODO

`,fe=Object.freeze(Object.defineProperty({__proto__:null,default:ye},Symbol.toStringTag,{value:"Module"})),ve=`# Supported Shapes
TODO

`,we=Object.freeze(Object.defineProperty({__proto__:null,default:ve},Symbol.toStringTag,{value:"Module"})),je=`# Planned Shapes
TODO

`,_e=Object.freeze(Object.defineProperty({__proto__:null,default:je},Symbol.toStringTag,{value:"Module"})),Se="# Documentation Plan: GearBox2D\n\n## 1. Getting Started\n- `introduction.md`: Introduction\n- `installation.md`: Installation\n- `first-simulation.md`: First Simulation\n- `development.md`: Development\n\n## 2. Core Architecture\n- `architecture-wasm-memory.md`: WASM & Shared Memory\n- `architecture-world.md`: World Management\n- `architecture-coordinates.md`: Coordinates & Units\n\n## 3. Physical Objects (Rigid Bodies)\n- `objects-body-types.md`: Body Types\n- `objects-properties.md`: Body Properties\n- `objects-state.md`: Body State\n\n## 4. Shapes & Geometry\n- `shapes-current.md`: Supported Shapes\n- `shapes-planned.md`: Planned Shapes\n\n## 5. Constraints & Joints\n- `joints-hinge.md`: Hinge Joints\n- `joints-distance.md`: Distance Joints\n- `joints-spring.md`: Spring Joints\n- `joints-gear.md`: Gear Joints\n\n## 6. Collision System\n- `collision-broad-phase.md`: Broad Phase\n- `collision-narrow-phase.md`: Narrow Phase\n- `collision-filtering.md`: Collision Filtering\n- `collision-events.md`: Collision Events\n\n## 7. Spatial Queries & Interaction\n- `interaction-queries.md`: Spatial Queries\n\n## 8. Graphics & Debugging\n- `graphics-debug.md`: Debug Graphics\n\n## 9. Performance & Optimization\n- `performance-tips.md`: Performance Tips\n- `performance-optimizations.md`: Optimizations\n\n## 10. Advanced & Planned Features\n- `planned-fluid-dynamics.md`: Fluid Dynamics (Planned)\n- `planned-ai-pathfinding.md`: AI Pathfinding (Planned)\n- `planned-ccd.md`: Continuous Collision Detection (Planned)\n\n## 11. API Reference\n- `api-reference.md`: API Reference\n\n",xe=Object.freeze(Object.defineProperty({__proto__:null,default:Se},Symbol.toStringTag,{value:"Module"})),Ae=`# Plan:

## Shapes, Kinematics, Collisions
- [x] Setup and test Rust w/ web assembly target.
- [x] Define basic starting classes for the physics module.
	- [x] RigidBody.
	- [x] Vec2.
- [x] Contain all objects in a world. Ability to add and remove objects to/from world.
- [x] Add a world tick.
- [ ] Ability to export raw data as a byte array.
- [x] Add debug visuals.
- [x] Add a few different shapes.
	- [x] AABB.
	- [x] Box.
	- [ ] Capsule.
	- [x] Circle.
	- [ ] Concave polygons.
	- [ ] Convex polygons.
	- [ ] Ellipse.
	- [ ] Line.
	- [x] Point.
- [ ] Composite objects.
- [x] Add rotations.
- [x] Compute/track AABB for each object.
- [x] Implement VBH.
- [x] Implement broad phase collision detection using BVH.
- [ ] Implement narrow phase collision detection.
	- [x] AABB-AABB.
	- [x] Box-AABB -> Box-Box.
	- [x] Box-Box.
	- [ ] Capsule-AABB.
	- [ ] Capsule-Box.
	- [ ] Capsule-Capsule.
	- [x] Circle-AABB.
	- [ ] Circle-Box.
	- [ ] Circle-Capsule.
	- [x] Circle-Circle.
	- [ ] Convex-AABB.
	- [ ] Convex-Box.
	- [ ] Convex-Capsule.
	- [ ] Convex-Circle.
	- [ ] Convex-Convex.
	- [ ] Concave-AABB.
	- [ ] Concave-Box.
	- [ ] Concave-Capsule. 
	- [ ] Ellipse-Convex.
	- [ ] Ellipse-Ellipse.
	- [ ] Line-AABB.
	- [ ] Line-Box.
	- [ ] Line-Capsule.
	- [ ] Line-Circle.
	- [ ] Line-Concave.
	- [ ] Line-Convex.
	- [ ] Line-Ellipse.
	- [ ] Line-Line.
	- [x] Point-AABB.
	- [x] Point-Box.
	- [ ] Point-Capsule.
	- [x] Point-Circle.
	- [ ] Point-Concave.
	- [ ] Point-Convex.
	- [ ] Point-Ellipse.
	- [ ] Point-Line.
	- [x] Point-Point.
	- [ ] Convave polygons?
- [x] Collision resolvers.
	- [x] Penetration resolution.
	- [x] Collision impulse.
	- [x] Collision friction.
- [ ] Implement collision events.
- [x] Define object types.
	- [x] Sensor.
	- [x] Physical.
	- [x] Fixed.
	- [ ] Kinematic. Maybe.
- [x] Implement an applyForce on objects.
- [x] Implement an applyImpulse on objects.
- [x] Implement an applyAngularImpulse on objects.
- [x] Determine and apply impulse for rigid body collisions with basic shapes.
- [ ] Determine and apply impulse for convex polygons.
- [ ] Determine and apply impulse for concave polygons (by splitting them up into convex polygons).
- [X] Collision tracking.

## Constraints
- [x] Hinged.
- [x] Distance.
- [x] Spring.
- [x] Gear constraint.

## Interactions
- [x] Spatial picking (query BVH).

## Misc
- [x] Elasticity (restitution).
- [x] Static/dynamic friction.
- [ ] Support changing the center of mass.
- [ ] Squishy objects via per-object bias factor for Baumgarte stabilization.


## Events
- [X] Events buffer.
- [X] Opt in per object.
- [X] On collision events.
	- [ ] Return impulse.
- [X] On collision end events.
- [ ] On sleep events.
- [ ] On wake up.
- [ ] On pre-solve (optional).
- [ ] On post-solve (optional).

## Fluid Dynamics
- [ ] Wind.
- [ ] Advanced drag.
- [ ] Under water / liquid.
	- [ ]  Bouancy.

## Optimizations

### General Optimizations
- [x] Cache inverse mass.
- [ ] Cache inverse inertia.
- [ ] Cache inverse dt.
- [x] Cache exponential decay factor when dt is set.
- [x] Implement collision masks.
- [ ] Focus areas & resolution.

### Broad Phase Optimizations
- [x] Broad phase using AABBs.
- [x] Do not recompute AABB when no movement happens.
- [ ] Stagger AABB recalculation when movement is slow.
- [x] Speed-dependant bounding area padding.
- [ ] Spin-dependant bounding area padding.
- [x] Bounding volume hierarchy (BVH).
- [x] BVH sleep biasing.
- [ ] BVH particle biasing.
- [x] BVH collision mask biasing (novel).
- [ ] Rebalance BVH.
- [ ] Experimental: Caching previous broad-phase collisions.
- [ ] Experimental: Instead of reinserting on movement, consider tree traversal.
- [ ] Experimental: Consider combining the broad phase with the kinematics phase.

### Sleep Optimizations
- [x] Sleeping objects.
- [ ] Islands.
- [x] Shrinkwrap AABB on sleep.
- [ ] Experimental: Separate vectors for sleeping/awake objects.
- [ ] Experimental: Re-insert into BVH upon sleep.
- [ ] Experimental: Sleep drift (sleeping at terminal velocity).

## Advanced Features
- [ ] Smart anti-tunelling.
- [ ] Advanced drag.
- [ ] Forcefields.
- [ ] Microscopic scale.
- [ ] Galactic scales.
- [ ] Automatic handling for big world problem.
- [ ] Changing mass dynamically.
- [ ] Changing size dynamically (stretch goal)
- [ ] Snap nodes for complex objects (experimental).

## AI
- [ ] A*.
- [ ] A* biasing.
- [ ] A* advanced coordination.
- [ ] Precomputed nav mesh.
- [ ] High-performance sensors.
- [ ] Agent steering and movement.
- [ ] Local Navigation & Obsticle Avoidance (RVO/ORCA).
- [ ] Inverse Kinematics.
- [ ] Collision Prediction / Danger Maps (optional)`,Te=Object.freeze(Object.defineProperty({__proto__:null,default:Ae},Symbol.toStringTag,{value:"Module"})),Oe=Object.assign({"../docs/structure.md":c})["../docs/structure.md"].default,r=Object.assign({"../docs/api-reference.md":b,"../docs/architecture-coordinates.md":f,"../docs/architecture-wasm-memory.md":w,"../docs/architecture-world.md":_,"../docs/collision-broad-phase.md":x,"../docs/collision-events.md":T,"../docs/collision-filtering.md":C,"../docs/collision-narrow-phase.md":P,"../docs/core-concepts.md":I,"../docs/development.md":W,"../docs/first-simulation.md":J,"../docs/graphics-debug.md":R,"../docs/installation.md":G,"../docs/interaction-queries.md":H,"../docs/introduction.md":q,"../docs/joints-distance.md":N,"../docs/joints-gear.md":Y,"../docs/joints-hinge.md":X,"../docs/joints-overview.md":Q,"../docs/joints-spring.md":ee,"../docs/objects-body-types.md":te,"../docs/objects-lifecycle.md":ie,"../docs/objects-properties.md":se,"../docs/objects-state.md":le,"../docs/performance-optimizations.md":de,"../docs/performance-tips.md":he,"../docs/planned-ai-pathfinding.md":ue,"../docs/planned-ccd.md":be,"../docs/planned-fluid-dynamics.md":fe,"../docs/shapes-current.md":we,"../docs/shapes-planned.md":_e,"../docs/structure.md":c,"../docs/todo.md":xe,"../plan.md":Te});function Ce(i){const t=i.split(`
`),o=[];let e=null;for(const n of t)if(n.startsWith("##"))e={name:n.replace(/^##\s+/,"").trim(),pages:[]},o.push(e);else if(n.startsWith("-")){const a=n.match(/- `([^`]+\.md)`:\s*(.*)/);a&&e&&e.pages.push({file:a[1],title:a[2].trim().replace(/\.$/,"")})}return o}const d=Ce(Oe),l=document.getElementById("docs-list"),Be=document.getElementById("doc-title"),s=document.getElementById("doc-content");function Pe(){d.forEach(i=>{const t=document.createElement("li");t.className="section",t.textContent=i.name,l.appendChild(t),i.pages.forEach(o=>{const e=document.createElement("li"),n=document.createElement("a");n.className="sidebar-link",n.textContent=o.title,n.href=`#${o.file.replace(".md","")}`,n.dataset.file=o.file,e.appendChild(n),l.appendChild(e)})})}async function p(){const i=window.location.hash.substring(1),t=i?`${i}.md`:d[0]?.pages[0]?.file||"";if(!t)return;document.querySelectorAll(".sidebar-link").forEach(e=>{e.getAttribute("href")===`#${t.replace(".md","")}`?(e.classList.add("active"),Be.textContent=e.textContent):e.classList.remove("active")});let o=r[`../docs/${t}`]?.default;!o&&t==="plan.md"&&(o=r["../plan.md"]?.default),o?(s.innerHTML=m.parse(o),s.querySelectorAll("pre code").forEach(e=>{const n=e.parentElement,a=Array.from(e.classList).find(h=>h.startsWith("language-"));a&&n.setAttribute("data-lang",a.replace("language-","")),hljs.highlightElement(e)})):s.innerHTML=`<p>Error: Could not load documentation file "${t}".</p>`,document.getElementById("main").scrollTop=0}window.addEventListener("hashchange",p);Pe();p();const De=document.getElementById("sidebar"),Ie=document.getElementById("sidebar-toggle");Ie.addEventListener("click",()=>{De.classList.toggle("collapsed")});
