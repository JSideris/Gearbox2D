# Core Concepts

Understanding these three fundamental concepts will help you build stable and predictable simulations in Gearbox2D.

## 1. The World
The `World` is the heart of your simulation. It is the container for all bodys, joints, and global settings like gravity.

```javascript
const world = gearbox.createWorld();
world.setGravity(0, 9.8); // Set gravity to 9.8 m/s² downwards
```

Think of the World as the "universe" of your physics scene. It handles:
- **Collision Detection**: Finding which objects are touching.
- **Constraint Solving**: Making sure joints (like hinges) stay connected.
- **Integration**: Calculating new positions based on velocities and forces.

## 2. Steps and Ticks
Physics engines don't simulate time continuously. Instead, they move forward in small, discrete "ticks" or "steps."

```javascript
// Progress the simulation by 1/60th of a second
world.step(1/60);
```

### The Importance of a Fixed Timestep
For the most stable results, you should ideally step the world at a **fixed frequency** (like 60Hz). While Gearbox2D can handle variable time steps (e.g., using your game loop's `dt`), huge spikes in time can cause objects to tunnel through walls or joints to explode.

**Pro-tip:** If your game's frame rate drops, it's better to run multiple small physics steps than one giant one.

## 3. Forces vs. Impulses
There are two primary ways to move objects manually beyond gravity and collisions.

### Forces
A **Force** is applied over a period of time. Think of it like a rocket engine firing or wind blowing.
- **Method**: `object.applyForce(x, y)`
- **Behavior**: It is added to the object's acceleration. You must call it every frame you want the force to persist.
- **Unit**: Newtons ($kg \cdot m/s^2$).

### Impulses
An **Impulse** is an instantaneous change in momentum. Think of it like a hammer blow, a jump, or an explosion.
- **Method**: `object.applyImpulse(x, y, contactX, contactY)`
- **Behavior**: It immediately changes the object's velocity. You usually call it only once for a specific event.
- **Unit**: $kg \cdot m/s$.

| Feature | Force | Impulse |
| :--- | :--- | :--- |
| **Duration** | Continuous (must be reapplied) | Instantaneous (one-off) |
| **Effect** | Gradual acceleration | Immediate velocity change |
| **Common Use** | Walking, flying, gravity | Jumping, collisions, firing |

### Angular Impulses
If you want to spin an object instantly without hitting a specific point, use `applyAngularImpulse(torque)`.

