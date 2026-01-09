import"./examples-styles-CjteXFi2.js";const j='# Documentation Plan: GearBox2D\n\n## 1. Introduction & Setup\n- `introduction.md`: Project overview and design philosophy.\n- `setup.md`: Installation and build instructions.\n- `first-simulation.md`: A basic "Hello World" example.\n\n## 2. Core Architecture\n- `architecture-wasm-memory.md`: Deep dive into WASM/Shared Memory.\n- `architecture-world.md`: Managing the simulation world.\n- `architecture-coordinates.md`: Coordinate system and units.\n\n## 3. Physical Objects (Rigid Bodies)\n- `objects-body-types.md`: Fixed, Physical, and Sensor bodies.\n- `objects-properties.md`: Mass, friction, restitution, etc.\n- `objects-state.md`: Position, velocity, and sleeping.\n\n## 4. Shapes & Geometry\n- `shapes-current.md`: Supported shapes (Circle, Box, AABB).\n- `shapes-planned.md`: Planned shapes (Capsules, Polygons).\n\n## 5. Constraints & Joints\n- `joints-hinge.md`: Hinge joint implementation.\n- `joints-distance.md`: Distance joint implementation.\n- `joints-spring.md`: Spring joint implementation.\n- `joints-gear.md`: Gear joint implementation.\n\n## 6. Collision System\n- `collision-broad-phase.md`: BVH and spatial partitioning.\n- `collision-narrow-phase.md`: Intersection math and impulse resolution.\n- `collision-filtering.md`: Collision masks and categories.\n- `collision-events.md`: Handling collision callbacks.\n\n## 7. Spatial Queries & Interaction\n- `interaction-queries.md`: Picking and area queries.\n\n## 8. Graphics & Debugging\n- `graphics-debug.md`: Using debug labels and visuals.\n\n## 9. Performance & Optimization\n- `performance-tips.md`: General performance advice.\n- `performance-optimizations.md`: Advanced WASM/BVH optimizations.\n\n## 10. Advanced & Planned Features\n- `planned-fluid-dynamics.md`: Buoyancy and drag.\n- `planned-ai-pathfinding.md`: Integrated A*.\n- `planned-ccd.md`: Continuous Collision Detection.\n\n## 11. API Reference\n- `api-reference.md`: Full API documentation.\n\n',_=Object.freeze(Object.defineProperty({__proto__:null,default:j},Symbol.toStringTag,{value:"Module"})),T=`# API Reference
TODO

`,P=Object.freeze(Object.defineProperty({__proto__:null,default:T},Symbol.toStringTag,{value:"Module"})),D=`# Coordinate System
TODO

`,M=Object.freeze(Object.defineProperty({__proto__:null,default:D},Symbol.toStringTag,{value:"Module"})),C=`# WASM & Shared Memory
TODO

`,w=Object.freeze(Object.defineProperty({__proto__:null,default:C},Symbol.toStringTag,{value:"Module"})),$=`# World Object
TODO

`,z=Object.freeze(Object.defineProperty({__proto__:null,default:$},Symbol.toStringTag,{value:"Module"})),A=`# Broad Phase
TODO

`,I=Object.freeze(Object.defineProperty({__proto__:null,default:A},Symbol.toStringTag,{value:"Module"})),x=`# Collision Events
TODO

`,B=Object.freeze(Object.defineProperty({__proto__:null,default:x},Symbol.toStringTag,{value:"Module"})),W=`# Collision Filtering
TODO

`,E=Object.freeze(Object.defineProperty({__proto__:null,default:W},Symbol.toStringTag,{value:"Module"})),k=`# Narrow Phase
TODO

`,q=Object.freeze(Object.defineProperty({__proto__:null,default:k},Symbol.toStringTag,{value:"Module"})),G=`# Your First Simulation
TODO

`,L=Object.freeze(Object.defineProperty({__proto__:null,default:G},Symbol.toStringTag,{value:"Module"})),H=`# Debug Graphics
TODO

`,R=Object.freeze(Object.defineProperty({__proto__:null,default:H},Symbol.toStringTag,{value:"Module"})),F=`# Spatial Queries
TODO

`,N=Object.freeze(Object.defineProperty({__proto__:null,default:F},Symbol.toStringTag,{value:"Module"})),J=`# Introduction

GearBox2D is a blazing-fast 2D physics engine written in C++ and compiled to WebAssembly, with a clean TypeScript interface. It is optimized for high-frequency simulations and applications requiring frequent updates via direct memory sharing.

## Design Philosophy

GearBox2D is designed with a data-oriented architecture, optimized for high-performance data transfer between JavaScript and WASM. Instead of copying object data on every step, the engine uses **shared memory**.

- **WASM Memory**: Volatile object data (position, velocity, etc.) is stored in contiguous buffers in C++.
- **TypedArray Views**: The TypeScript interface creates \`Float32Array\` and \`Int32Array\` views directly over these WASM memory buffers.
- **Direct Access**: When you access \`object.x\` or \`object.vx\` in TypeScript, you are reading/writing directly to the memory used by the WASM physics core.

This architecture minimizes overhead and allows for thousands of objects to be updated and rendered efficiently.

## Project Structure

The project is organized into several key directories:

- \`cpp/\`: C++ source code, including headers, implementations, and unit tests.
- \`typescript/\`: TypeScript source for the engine's public interface.
- \`examples/\`: Web-based examples and demos showcasing engine capabilities.
- \`docs/\`: In-depth documentation and guides (where you are now).
- \`studies/\`: Performance and optimization studies.
- \`dist/\`: Build output for both JavaScript and WebAssembly modules.

## Roadmap

The engine is under active development. Key focus areas include:
- Improving stability for complex constraints.
- Expanding supported shapes (Capsules, Polygons).
- Implementing Continuous Collision Detection (CCD).
- Integrating fluid dynamics and AI pathfinding.

Check the \`plan.md\` file in the repository for a detailed list of implemented features and future development goals.
`,V=Object.freeze(Object.defineProperty({__proto__:null,default:J},Symbol.toStringTag,{value:"Module"})),U=`# Distance Joint
TODO

`,Q=Object.freeze(Object.defineProperty({__proto__:null,default:U},Symbol.toStringTag,{value:"Module"})),Y=`# Gear Joint
TODO

`,K=Object.freeze(Object.defineProperty({__proto__:null,default:Y},Symbol.toStringTag,{value:"Module"})),X=`# Hinge Joint
TODO

`,Z=Object.freeze(Object.defineProperty({__proto__:null,default:X},Symbol.toStringTag,{value:"Module"})),ee=`# Spring Joint
TODO

`,ne=Object.freeze(Object.defineProperty({__proto__:null,default:ee},Symbol.toStringTag,{value:"Module"})),te=`# Body Types
TODO

`,oe=Object.freeze(Object.defineProperty({__proto__:null,default:te},Symbol.toStringTag,{value:"Module"})),ie=`# Object Properties
TODO

`,re=Object.freeze(Object.defineProperty({__proto__:null,default:ie},Symbol.toStringTag,{value:"Module"})),se=`# State Management
TODO

`,le=Object.freeze(Object.defineProperty({__proto__:null,default:se},Symbol.toStringTag,{value:"Module"})),ae=`# Performance Optimizations
TODO

`,ce=Object.freeze(Object.defineProperty({__proto__:null,default:ae},Symbol.toStringTag,{value:"Module"})),de=`# Performance Tips
TODO

`,ue=Object.freeze(Object.defineProperty({__proto__:null,default:de},Symbol.toStringTag,{value:"Module"})),pe=`# AI & Pathfinding (Planned)
TODO

`,me=Object.freeze(Object.defineProperty({__proto__:null,default:pe},Symbol.toStringTag,{value:"Module"})),ge=`# Continuous Collision Detection (Planned)
TODO

`,_e=Object.freeze(Object.defineProperty({__proto__:null,default:ge},Symbol.toStringTag,{value:"Module"})),be=`# Fluid Dynamics (Planned)
TODO

`,fe=Object.freeze(Object.defineProperty({__proto__:null,default:be},Symbol.toStringTag,{value:"Module"})),he=`# Setup & Installation

Follow these instructions to get GearBox2D up and running on your local machine.

## Prerequisites

Before you can build and run GearBox2D, you'll need the following dependencies installed.

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

## Installation

1.  **Clone the repository**:
    \`\`\`bash
    git clone https://github.com/JSideris/Gearbox2D.git
    cd Gearbox2D
    \`\`\`

2.  **Install Node.js dependencies**:
    \`\`\`bash
    npm install
    \`\`\`

## Building the Project

You can build the entire project or individual components using the following commands:

\`\`\`bash
# Build everything (C++ to WASM + TypeScript)
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

## Running Examples

1.  **Start a local server** (required for WASM loading):
    \`\`\`bash
    # Using live-server
    live-server examples/
    
    # Or using Node.js
    npx http-server examples/
    \`\`\`

2.  **Open your browser** and navigate to the provided local URL (usually \`http://localhost:8080\`).

3.  **View the examples** by opening \`examples/index.html\`.

## Troubleshooting

- **Emscripten not found**: Ensure you have run \`source ./emsdk_env.sh\` in your current terminal session.
- **WASM loading errors**: Ensure you are serving files via a web server (HTTP/HTTPS), as browsers block WASM loading from \`file://\` URLs.
- **Build failures**: Try \`npm run clean && npm run build\` to rebuild from scratch.
`,ye=Object.freeze(Object.defineProperty({__proto__:null,default:he},Symbol.toStringTag,{value:"Module"})),ve=`# Supported Shapes
TODO

`,Oe=Object.freeze(Object.defineProperty({__proto__:null,default:ve},Symbol.toStringTag,{value:"Module"})),Se=`# Planned Shapes
TODO

`,je=Object.freeze(Object.defineProperty({__proto__:null,default:Se},Symbol.toStringTag,{value:"Module"}));class Te{static parse(o){if(!o)return"";let e=o.replace(/\r\n/g,`
`).trim();const t=[];return e=e.replace(/^(\s*)```(\w+)?\n([\s\S]*?)\n\s*```/gm,(n,r,u,h)=>{const y=t.length,v=u?` class="language-${u}"`:"";let a=h.split(`
`);r&&(a=a.map(s=>s.startsWith(r)?s.substring(r.length):s));const c=a.reduce((s,p)=>{if(p.trim().length===0)return s;const m=p.match(/^(\s*)/),S=m?m[1].length:0;return Math.min(s,S)},1/0);c!==1/0&&c>0&&(a=a.map(s=>s.substring(Math.min(s.length,c))));const O=this.escapeHtml(a.join(`
`).trim());return t.push(`<pre><code${v}>${O}</code></pre>`),`${r}:::CB-ID-${y}:::`}),e=e.replace(/^---$/gm,"<hr />"),e=e.replace(/^###### (.*$)/gm,"<h6>$1</h6>"),e=e.replace(/^##### (.*$)/gm,"<h5>$1</h5>"),e=e.replace(/^#### (.*$)/gm,"<h4>$1</h4>"),e=e.replace(/^### (.*$)/gm,"<h3>$1</h3>"),e=e.replace(/^## (.*$)/gm,"<h2>$1</h2>"),e=e.replace(/^# (.*$)/gm,"<h1>$1</h1>"),e=e.replace(/^> (.*$)/gm,"<blockquote>$1</blockquote>"),e=e.replace(/(<blockquote>.*<\/blockquote>(\n<blockquote>.*<\/blockquote>)*)/g,`<blockquote>
$1
</blockquote>`),e=e.replace(/<blockquote>\n<blockquote>(.*)<\/blockquote>\n<\/blockquote>/g,"<blockquote>$1</blockquote>"),e=e.replace(/^[\-\*] (.*(?:\n[ \t]+.*)*)/gm,(n,r)=>`<li>${r.trim()}</li>`),e=e.replace(/(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g,n=>n.includes("<ul>")||n.includes("<ol>")?n:`<ul>
${n}
</ul>`),e=e.replace(/^\d+\. (.*(?:\n[ \t]+.*)*)/gm,(n,r)=>`<li>${r.trim()}</li>`),e=e.replace(new RegExp("(?<!<ul>\\n)(<li>[\\s\\S]*?<\\/li>(\\s*<li>[\\s\\S]*?<\\/li>)*)","g"),n=>n.includes("<ul>")||n.includes("<ol>")?n:`<ol>
${n}
</ol>`),e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/__(.*?)__/g,"<strong>$1</strong>"),e=e.replace(/\*(.*?)\*/g,"<em>$1</em>"),e=e.replace(/_(.*?)_/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>'),e=e.replace(/`(.*?)`/g,"<code>$1</code>"),e=e.split(/\n\n+/).map(n=>(n=n.trim(),n?n.startsWith(":::CB-ID-")&&n.endsWith(":::")||/^<(h[1-6]|ul|ol|li|hr|code|pre|blockquote)/i.test(n)?n:`<p>${n.replace(/\n/g,"<br />")}</p>`:"")).join(`
`),t.forEach((n,r)=>{e=e.split(`:::CB-ID-${r}:::`).join(n)}),e}static escapeHtml(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}}const Pe=Object.assign({"../docs/todo.md":_})["../docs/todo.md"].default,De=Object.assign({"../docs/api-reference.md":P,"../docs/architecture-coordinates.md":M,"../docs/architecture-wasm-memory.md":w,"../docs/architecture-world.md":z,"../docs/collision-broad-phase.md":I,"../docs/collision-events.md":B,"../docs/collision-filtering.md":E,"../docs/collision-narrow-phase.md":q,"../docs/first-simulation.md":L,"../docs/graphics-debug.md":R,"../docs/interaction-queries.md":N,"../docs/introduction.md":V,"../docs/joints-distance.md":Q,"../docs/joints-gear.md":K,"../docs/joints-hinge.md":Z,"../docs/joints-spring.md":ne,"../docs/objects-body-types.md":oe,"../docs/objects-properties.md":re,"../docs/objects-state.md":le,"../docs/performance-optimizations.md":ce,"../docs/performance-tips.md":ue,"../docs/planned-ai-pathfinding.md":me,"../docs/planned-ccd.md":_e,"../docs/planned-fluid-dynamics.md":fe,"../docs/setup.md":ye,"../docs/shapes-current.md":Oe,"../docs/shapes-planned.md":je,"../docs/todo.md":_});function Me(l){const o=l.split(`
`),e=[];let t=null;for(const i of o)if(i.startsWith("##"))t={name:i.replace(/^##\s+/,"").trim(),pages:[]},e.push(t);else if(i.startsWith("-")){const n=i.match(/- `([^`]+\.md)`:\s*(.*)/);n&&t&&t.pages.push({file:n[1],title:n[2].trim().replace(/\.$/,"")})}return e}const b=Me(Pe),g=document.getElementById("docs-list"),Ce=document.getElementById("doc-title"),d=document.getElementById("doc-content");function we(){b.forEach(l=>{const o=document.createElement("li");o.className="section",o.textContent=l.name,g.appendChild(o),l.pages.forEach(e=>{const t=document.createElement("li"),i=document.createElement("a");i.className="sidebar-link",i.textContent=e.title,i.href=`#${e.file.replace(".md","")}`,i.dataset.file=e.file,t.appendChild(i),g.appendChild(t)})})}async function f(){const l=window.location.hash.substring(1),o=l?`${l}.md`:b[0]?.pages[0]?.file||"";if(!o)return;document.querySelectorAll(".sidebar-link").forEach(t=>{t.getAttribute("href")===`#${o.replace(".md","")}`?(t.classList.add("active"),Ce.textContent=t.textContent):t.classList.remove("active")});const e=De[`../docs/${o}`]?.default;e?(d.innerHTML=Te.parse(e),d.querySelectorAll("pre code").forEach(t=>{const i=t.parentElement,n=Array.from(t.classList).find(r=>r.startsWith("language-"));n&&i.setAttribute("data-lang",n.replace("language-","")),hljs.highlightElement(t)})):d.innerHTML=`<p>Error: Could not load documentation file "${o}".</p>`,document.getElementById("main").scrollTop=0}window.addEventListener("hashchange",f);we();f();const $e=document.getElementById("sidebar"),ze=document.getElementById("sidebar-toggle");ze.addEventListener("click",()=>{$e.classList.toggle("collapsed")});
