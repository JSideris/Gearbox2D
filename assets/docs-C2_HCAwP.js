import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        */const j='# Documentation Plan: GearBox2D\n\n## 1. Getting Started\n- `introduction.md`: Project overview and design philosophy.\n- `installation.md`: How to install via NPM or CDN.\n- `first-simulation.md`: A basic "Hello World" example.\n- `development.md`: Build instructions for engine contributors.\n\n## 2. Core Architecture\n- `architecture-wasm-memory.md`: Deep dive into WASM/Shared Memory.\n- `architecture-world.md`: Managing the simulation world.\n- `architecture-coordinates.md`: Coordinate system and units.\n\n## 3. Physical Objects (Rigid Bodies)\n- `objects-body-types.md`: Fixed, Physical, and Sensor bodies.\n- `objects-properties.md`: Mass, friction, restitution, etc.\n- `objects-state.md`: Position, velocity, and sleeping.\n\n## 4. Shapes & Geometry\n- `shapes-current.md`: Supported shapes (Circle, Box, AABB).\n- `shapes-planned.md`: Planned shapes (Capsules, Polygons).\n\n## 5. Constraints & Joints\n- `joints-hinge.md`: Hinge joint implementation.\n- `joints-distance.md`: Distance joint implementation.\n- `joints-spring.md`: Spring joint implementation.\n- `joints-gear.md`: Gear joint implementation.\n\n## 6. Collision System\n- `collision-broad-phase.md`: BVH and spatial partitioning.\n- `collision-narrow-phase.md`: Intersection math and impulse resolution.\n- `collision-filtering.md`: Collision masks and categories.\n- `collision-events.md`: Handling collision callbacks.\n\n## 7. Spatial Queries & Interaction\n- `interaction-queries.md`: Picking and area queries.\n\n## 8. Graphics & Debugging\n- `graphics-debug.md`: Using debug labels and visuals.\n\n## 9. Performance & Optimization\n- `performance-tips.md`: General performance advice.\n- `performance-optimizations.md`: Advanced WASM/BVH optimizations.\n\n## 10. Advanced & Planned Features\n- `planned-fluid-dynamics.md`: Buoyancy and drag.\n- `planned-ai-pathfinding.md`: Integrated A*.\n- `planned-ccd.md`: Continuous Collision Detection.\n\n## 11. API Reference\n- `api-reference.md`: Full API documentation.\n\n',h=Object.freeze(Object.defineProperty({__proto__:null,default:j},Symbol.toStringTag,{value:"Module"})),T=`# API Reference
TODO

`,w=Object.freeze(Object.defineProperty({__proto__:null,default:T},Symbol.toStringTag,{value:"Module"})),x=`# Coordinate System
TODO

`,D=Object.freeze(Object.defineProperty({__proto__:null,default:x},Symbol.toStringTag,{value:"Module"})),P=`# WASM & Shared Memory
TODO

`,M=Object.freeze(Object.defineProperty({__proto__:null,default:P},Symbol.toStringTag,{value:"Module"})),C=`# World Object
TODO

`,I=Object.freeze(Object.defineProperty({__proto__:null,default:C},Symbol.toStringTag,{value:"Module"})),A=`# Broad Phase
TODO

`,W=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"})),B=`# Collision Events
TODO

`,z=Object.freeze(Object.defineProperty({__proto__:null,default:B},Symbol.toStringTag,{value:"Module"})),k=`# Collision Filtering
TODO

`,$=Object.freeze(Object.defineProperty({__proto__:null,default:k},Symbol.toStringTag,{value:"Module"})),E=`# Narrow Phase
TODO

`,G=Object.freeze(Object.defineProperty({__proto__:null,default:E},Symbol.toStringTag,{value:"Module"})),q=`# Development & Contributing

Follow these instructions to build GearBox2D from source or contribute to the C++ core. If you just want to use the engine in your project, see [Installation](installation.md).

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

`,R=Object.freeze(Object.defineProperty({__proto__:null,default:q},Symbol.toStringTag,{value:"Module"})),F=`# Your First Simulation

This guide will walk you through creating a simple physics simulation: a box falling onto a static floor.

## 1. Basic HTML Template

Create an \`index.html\` file. We will use a \`<canvas>\` element to render our simulation. For this example, we'll use the built-in \`debug\` graphics for simplicity.

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
    <script type="module" src="main.js"><\/script>
</body>
</html>
\`\`\`

## 2. The Simulation Code

Create a \`main.js\` file. This script initializes the engine, sets up the world, and runs the simulation loop.

\`\`\`javascript
import gb2d from 'gearbox-2d'; // Or use the CDN URL

async function start() {
    // 1. Initialize the engine
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

-   **Meters, not Pixels**: GearBox2D calculates everything in meters. In the example above, we scaled our canvas by 50x so that a 1-meter box appears 50 pixels wide.
-   **Static vs. Dynamic**: By default, objects are "physical" (dynamic) and respond to gravity. Setting \`type: gb2d.bodyTypes.FIXED_OBJECT\` makes them immovable.
-   **Direct Memory Access**: When you access \`box.x\` or \`box.y\` in your loop, you are reading directly from the WASM memory buffer—no expensive copying required!

## Running the Example

Remember to serve these files using a web server:

\`\`\`bash
npx http-server .
\`\`\`

Open your browser to \`http://localhost:8080\`, and you should see a red box fall and bounce on the floor!
`,H=Object.freeze(Object.defineProperty({__proto__:null,default:F},Symbol.toStringTag,{value:"Module"})),L=`# Debug Graphics
TODO

`,N=Object.freeze(Object.defineProperty({__proto__:null,default:L},Symbol.toStringTag,{value:"Module"})),J=`# Installation

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

Once you have the engine installed, check out [Your First Simulation](first-simulation.md) to build a falling box demo.

`,U=Object.freeze(Object.defineProperty({__proto__:null,default:J},Symbol.toStringTag,{value:"Module"})),V=`# Spatial Queries
TODO

`,Y=Object.freeze(Object.defineProperty({__proto__:null,default:V},Symbol.toStringTag,{value:"Module"})),X=`# Introduction

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
-   **Direct Views**: The TypeScript wrapper creates \`Float32Array\` and \`Int32Array\` views that point *directly* to the same memory addresses used by the WASM core.
-   **O(1) Access**: When you access \`object.x\` in TypeScript, you are performing a direct memory read from the WASM buffer. There is no serialization, no copying, and zero overhead.

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
`,K=Object.freeze(Object.defineProperty({__proto__:null,default:X},Symbol.toStringTag,{value:"Module"})),Q=`# Distance Joint
TODO

`,Z=Object.freeze(Object.defineProperty({__proto__:null,default:Q},Symbol.toStringTag,{value:"Module"})),ee=`# Gear Joint
TODO

`,ne=Object.freeze(Object.defineProperty({__proto__:null,default:ee},Symbol.toStringTag,{value:"Module"})),te=`# Hinge Joint
TODO

`,oe=Object.freeze(Object.defineProperty({__proto__:null,default:te},Symbol.toStringTag,{value:"Module"})),ie=`# Spring Joint
TODO

`,re=Object.freeze(Object.defineProperty({__proto__:null,default:ie},Symbol.toStringTag,{value:"Module"})),se=`# Body Types
TODO

`,ae=Object.freeze(Object.defineProperty({__proto__:null,default:se},Symbol.toStringTag,{value:"Module"})),le=`# Object Properties
TODO

`,ce=Object.freeze(Object.defineProperty({__proto__:null,default:le},Symbol.toStringTag,{value:"Module"})),de=`# State Management
TODO

`,ue=Object.freeze(Object.defineProperty({__proto__:null,default:de},Symbol.toStringTag,{value:"Module"})),pe=`# Performance Optimizations
TODO

`,me=Object.freeze(Object.defineProperty({__proto__:null,default:pe},Symbol.toStringTag,{value:"Module"})),ge=`# Performance Tips
TODO

`,he=Object.freeze(Object.defineProperty({__proto__:null,default:ge},Symbol.toStringTag,{value:"Module"})),be=`# AI & Pathfinding (Planned)
TODO

`,fe=Object.freeze(Object.defineProperty({__proto__:null,default:be},Symbol.toStringTag,{value:"Module"})),_e=`# Continuous Collision Detection (Planned)
TODO

`,ye=Object.freeze(Object.defineProperty({__proto__:null,default:_e},Symbol.toStringTag,{value:"Module"})),ve=`# Fluid Dynamics (Planned)
TODO

`,Se=Object.freeze(Object.defineProperty({__proto__:null,default:ve},Symbol.toStringTag,{value:"Module"})),Oe=`# Supported Shapes
TODO

`,je=Object.freeze(Object.defineProperty({__proto__:null,default:Oe},Symbol.toStringTag,{value:"Module"})),Te=`# Planned Shapes
TODO

`,we=Object.freeze(Object.defineProperty({__proto__:null,default:Te},Symbol.toStringTag,{value:"Module"}));class xe{static parse(o){if(!o)return"";let e=o.replace(/\r\n/g,`
`).trim();const t=[];return e=e.replace(/^(\s*)```(\w+)?\n([\s\S]*?)\n\s*```/gm,(n,r,u,_)=>{const y=t.length,v=u?` class="language-${u}"`:"";let l=_.split(`
`);r&&(l=l.map(s=>s.startsWith(r)?s.substring(r.length):s));const c=l.reduce((s,p)=>{if(p.trim().length===0)return s;const m=p.match(/^(\s*)/),O=m?m[1].length:0;return Math.min(s,O)},1/0);c!==1/0&&c>0&&(l=l.map(s=>s.substring(Math.min(s.length,c))));const S=this.escapeHtml(l.join(`
`).trim());return t.push(`<pre><code${v}>${S}</code></pre>`),`${r}:::CB-ID-${y}:::`}),e=e.replace(/^---$/gm,"<hr />"),e=e.replace(/^###### (.*$)/gm,"<h6>$1</h6>"),e=e.replace(/^##### (.*$)/gm,"<h5>$1</h5>"),e=e.replace(/^#### (.*$)/gm,"<h4>$1</h4>"),e=e.replace(/^### (.*$)/gm,"<h3>$1</h3>"),e=e.replace(/^## (.*$)/gm,"<h2>$1</h2>"),e=e.replace(/^# (.*$)/gm,"<h1>$1</h1>"),e=e.replace(/^> (.*$)/gm,"<blockquote>$1</blockquote>"),e=e.replace(/(<blockquote>.*<\/blockquote>(\n<blockquote>.*<\/blockquote>)*)/g,`<blockquote>
$1
</blockquote>`),e=e.replace(/<blockquote>\n<blockquote>(.*)<\/blockquote>\n<\/blockquote>/g,"<blockquote>$1</blockquote>"),e=e.replace(/^[\-\*] (.*(?:\n[ \t]+.*)*)/gm,(n,r)=>`<li>${r.trim()}</li>`),e=e.replace(/(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g,n=>n.includes("<ul>")||n.includes("<ol>")?n:`<ul>
${n}
</ul>`),e=e.replace(/^\d+\. (.*(?:\n[ \t]+.*)*)/gm,(n,r)=>`<li>${r.trim()}</li>`),e=e.replace(new RegExp("(?<!<ul>\\n)(<li>[\\s\\S]*?<\\/li>(\\s*<li>[\\s\\S]*?<\\/li>)*)","g"),n=>n.includes("<ul>")||n.includes("<ol>")?n:`<ol>
${n}
</ol>`),e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/__(.*?)__/g,"<strong>$1</strong>"),e=e.replace(/\*(.*?)\*/g,"<em>$1</em>"),e=e.replace(/_(.*?)_/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>'),e=e.replace(/`(.*?)`/g,"<code>$1</code>"),e=e.split(/\n\n+/).map(n=>(n=n.trim(),n?n.startsWith(":::CB-ID-")&&n.endsWith(":::")||/^<(h[1-6]|ul|ol|li|hr|code|pre|blockquote)/i.test(n)?n:`<p>${n.replace(/\n/g,"<br />")}</p>`:"")).join(`
`),t.forEach((n,r)=>{e=e.split(`:::CB-ID-${r}:::`).join(n)}),e}static escapeHtml(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}}const De=Object.assign({"../docs/todo.md":h})["../docs/todo.md"].default,Pe=Object.assign({"../docs/api-reference.md":w,"../docs/architecture-coordinates.md":D,"../docs/architecture-wasm-memory.md":M,"../docs/architecture-world.md":I,"../docs/collision-broad-phase.md":W,"../docs/collision-events.md":z,"../docs/collision-filtering.md":$,"../docs/collision-narrow-phase.md":G,"../docs/development.md":R,"../docs/first-simulation.md":H,"../docs/graphics-debug.md":N,"../docs/installation.md":U,"../docs/interaction-queries.md":Y,"../docs/introduction.md":K,"../docs/joints-distance.md":Z,"../docs/joints-gear.md":ne,"../docs/joints-hinge.md":oe,"../docs/joints-spring.md":re,"../docs/objects-body-types.md":ae,"../docs/objects-properties.md":ce,"../docs/objects-state.md":ue,"../docs/performance-optimizations.md":me,"../docs/performance-tips.md":he,"../docs/planned-ai-pathfinding.md":fe,"../docs/planned-ccd.md":ye,"../docs/planned-fluid-dynamics.md":Se,"../docs/shapes-current.md":je,"../docs/shapes-planned.md":we,"../docs/todo.md":h});function Me(a){const o=a.split(`
`),e=[];let t=null;for(const i of o)if(i.startsWith("##"))t={name:i.replace(/^##\s+/,"").trim(),pages:[]},e.push(t);else if(i.startsWith("-")){const n=i.match(/- `([^`]+\.md)`:\s*(.*)/);n&&t&&t.pages.push({file:n[1],title:n[2].trim().replace(/\.$/,"")})}return e}const b=Me(De),g=document.getElementById("docs-list"),Ce=document.getElementById("doc-title"),d=document.getElementById("doc-content");function Ie(){b.forEach(a=>{const o=document.createElement("li");o.className="section",o.textContent=a.name,g.appendChild(o),a.pages.forEach(e=>{const t=document.createElement("li"),i=document.createElement("a");i.className="sidebar-link",i.textContent=e.title,i.href=`#${e.file.replace(".md","")}`,i.dataset.file=e.file,t.appendChild(i),g.appendChild(t)})})}async function f(){const a=window.location.hash.substring(1),o=a?`${a}.md`:b[0]?.pages[0]?.file||"";if(!o)return;document.querySelectorAll(".sidebar-link").forEach(t=>{t.getAttribute("href")===`#${o.replace(".md","")}`?(t.classList.add("active"),Ce.textContent=t.textContent):t.classList.remove("active")});const e=Pe[`../docs/${o}`]?.default;e?(d.innerHTML=xe.parse(e),d.querySelectorAll("pre code").forEach(t=>{const i=t.parentElement,n=Array.from(t.classList).find(r=>r.startsWith("language-"));n&&i.setAttribute("data-lang",n.replace("language-","")),hljs.highlightElement(t)})):d.innerHTML=`<p>Error: Could not load documentation file "${o}".</p>`,document.getElementById("main").scrollTop=0}window.addEventListener("hashchange",f);Ie();f();const Ae=document.getElementById("sidebar"),We=document.getElementById("sidebar-toggle");We.addEventListener("click",()=>{Ae.classList.toggle("collapsed")});
