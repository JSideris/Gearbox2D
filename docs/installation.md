# Installation

Gearbox2D is a high-performance 2D physics engine. Because it is powered by WebAssembly, there are a few specific ways to include it in your project.

## 1. Using NPM (Recommended)

If you are using a modern build tool (Vite, Webpack, esbuild, etc.), install the package via npm:

```bash
npm install gearbox2d
```

### Basic Usage with a Bundler

```typescript
import gearbox from 'gearbox2d';

async function startPhysics() {
    // 1. Initialize the WASM core
    await gearbox.init();

    // 2. Create your physics world
    const world = gearbox.createWorld();
    
    // ... setup simulation ...
}

startPhysics();
```

---

## 2. Using a Script Tag (CDN / Standalone)

For simple projects, prototyping, or environments without a build step, use the **standalone** build. This version has the WebAssembly core built-in as a Base64 string, so it requires no extra files or fetch requests.

```html
<!-- 1. Include the engine via CDN -->
<script src="https://unpkg.com/gearbox2d/dist/standalone/gearbox.js"></script>

<script>
  async function init() {
    // 2. Initialize the engine (it already has the WASM inside!)
    await gearbox.init();
    
    // 3. Create your physics world
    const world = gearbox.createWorld();
    console.log("Physics World Created:", world);
  }

  init();
</script>
```

---

## 3. WebAssembly & Multi-Threading

Gearbox2D is compiled with **Multi-Threading** support (using SharedArrayBuffer) and **SIMD** instructions to achieve maximum performance. This requires specific browser security headers to be set on your web server.

### Required Security Headers
For the multi-threaded WASM build to function correctly, your server **must** send the following HTTP headers:

*   `Cross-Origin-Opener-Policy: same-origin`
*   `Cross-Origin-Embedder-Policy: require-corp`

These headers enable **SharedArrayBuffer**, which allows the physics engine to run its solvers across multiple CPU cores. Without these headers, the engine will fall back to a single-threaded mode, significantly reducing performance for large simulations.

### Local Development
Most modern development servers (like Vite, Webpack Dev Server, or Browsersync) provide a simple way to enable these headers.

**Vite Example (`vite.config.js`):**
```javascript
export default {
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
```

## 4. WebAssembly & Local Servers

**Standalone/CDN Users:** 
If you are using the `dist/standalone/gearbox.js` file, you can likely run your project by simply opening an `.html` file from your file explorer, because the WASM is inlined.

**NPM/Standard Users:**
If you are using the standard build (npm package), you **must** serve your project via a local web server because browsers block the loading of external `.wasm` files over the `file://` protocol.

If you don't have a local server, you can use `npx`:

```bash
# Start a simple server in your project folder
npx http-server .
```

---

## Next Steps

Once you have the engine installed, check out [Your First Simulation](#first-simulation) to build a falling box demo.

