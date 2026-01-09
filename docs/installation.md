# Installation

GearBox2D is a high-performance 2D physics engine. Because it is powered by WebAssembly, there are a few specific ways to include it in your project.

## 1. Using NPM (Recommended)

If you are using a modern build tool (Vite, Webpack, esbuild, etc.), install the package via npm:

```bash
npm install gearbox-2d
```

### Basic Usage with a Bundler

```typescript
import gb2d from 'gearbox-2d';

async function startPhysics() {
    // 1. Initialize the WASM core
    await gb2d.init();

    // 2. Create your physics world
    const world = gb2d.makeWorld();
    
    // ... setup simulation ...
}

startPhysics();
```

---

## 2. Using a Script Tag (CDN / Standalone)

For simple projects, prototyping, or environments without a build step, use the **standalone** build. This version has the WebAssembly core built-in as a Base64 string, so it requires no extra files or fetch requests.

```html
<!-- 1. Include the engine via CDN -->
<script src="https://unpkg.com/gearbox-2d/dist/standalone/gb2d.js"></script>

<script>
  async function init() {
    // 2. Initialize the engine (it already has the WASM inside!)
    await gb2d.init();
    
    // 3. Create your physics world
    const world = gb2d.makeWorld();
    console.log("Physics World Created:", world);
  }

  init();
</script>
```

---

## 3. WebAssembly & Local Servers

**Standalone/CDN Users:** 
If you are using the `dist/standalone/gb2d.js` file, you can likely run your project by simply opening an `.html` file from your file explorer, because the WASM is inlined.

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

