# Events

Gearbox2D provides an event system to react to changes in the physics world, such as collisions and sleep state transitions.

## Enabling Events

To improve performance, events are opt-in per object. You must set `wantsEvents: true` when creating an object to receive events for it.

```typescript
const obj = world.makeObject({
  shape: gearbox.SHAPES.CIRCLE,
  radius: 1,
  wantsEvents: true // Enable events for this object
});
```

## Global Event Handlers

You can set global handlers on the `World` instance to listen for events from all objects that have opted in.

### Collision Events

*   `onCollisionStart(idA, idB, impulse)`: Fired when two objects begin colliding.
*   `onCollisionEnd(idA, idB, impulse)`: Fired when two objects stop colliding.

```typescript
world.onCollisionStart = (idA, idB, impulse) => {
  console.log(`Objects ${idA} and ${idB} started colliding with impulse ${impulse}`);
};
```

### Sleep and Wake Events

*   `onSleep(id)`: Fired when an object enters the sleeping state.
*   `onWake(id)`: Fired when an object wakes up from the sleeping state.

```typescript
world.onSleep = (id) => {
  console.log(`Object ${id} is now sleeping.`);
};

world.onWake = (id) => {
  console.log(`Object ${id} has woken up.`);
};
```

## Per-Object Event Handlers

Alternatively, you can set event handlers directly on `PhysicalObject` instances.

```typescript
const obj = world.makeObject({ /* ... */, wantsEvents: true });

obj.onSleep = () => {
  console.log("I am going to sleep!");
};

obj.onWake = () => {
  console.log("I am waking up!");
};
```

## Events vs. Polling

While you can always check the `isSleeping` state of an object by reading its properties, using events is generally more efficient and easier for reactive logic:

1.  **Efficiency**: Events are only fired when a transition occurs, avoiding the need to poll every frame.
2.  **Timing**: `onSleep` and `onWake` are fired at the exact moment the state change is detected within the physics step.
3.  **Integration**: Events fit well into reactive UI frameworks or state management systems.

Note: Reading `obj.isSleeping` is still useful for logic that needs to know the current state at any time without tracking transitions.
