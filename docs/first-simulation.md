# Your First Simulation

This guide will walk you through creating a simple physics simulation: a box falling onto a static floor.

## 1. Basic HTML Template

Create an `index.html` file. We will use a `<canvas>` element to render our simulation. For this example, we'll use the built-in `debug` graphics for simplicity.

```html
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
    <script type="module" src="main.js"></script>
</body>
</html>
```

## 2. The Simulation Code

Create a `main.js` file. This script initializes the engine, sets up the world, and runs the simulation loop.

```javascript
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
```

## Key Concepts

-   **Meters, not Pixels**: GearBox2D calculates everything in meters. In the example above, we scaled our canvas by 50x so that a 1-meter box appears 50 pixels wide.
-   **Static vs. Dynamic**: By default, objects are "physical" (dynamic) and respond to gravity. Setting `type: gb2d.bodyTypes.FIXED_OBJECT` makes them immovable.
-   **Direct Memory Access**: When you access `box.x` or `box.y` in your loop, you are reading directly from the WASM memory buffer—no expensive copying required!

## Running the Example

Remember to serve these files using a web server:

```bash
npx http-server .
```

Open your browser to `http://localhost:8080`, and you should see a red box fall and bounce on the floor!
