# Events

Gearbox2D provides an event system to react to changes in the physics world, such as collisions and sleep state transitions.

## Enabling Events

To improve performance, events are opt-in per object. You must set `wantsEvents: true` on either a `Body` or a specific `Fixture` to receive events for it.

### Body Opt-in

If you set `wantsEvents: true` on a body, you will receive events for all collisions involving any of its fixtures.

```typescript
const obj = world.makeBody(id, {
  type: gearbox.bodyTypes.DYNAMIC_OBJECT,
  x: 5, y: 5,
  wantsEvents: true // Enable for all fixtures on this body
});
obj.addFixture({
  shape: gearbox.shapes.CIRCLE,
  radius: 1,
});
```

### Fixture Opt-in

Alternatively, you can enable events only for specific fixtures. This is useful for large objects where you only care about certain parts (e.g., a car bumper or a character's feet).

```typescript
const obj = world.makeBody(id, { x: 5, y: 5 });
obj.addFixture({
  shape: gearbox.shapes.CIRCLE,
  radius: 1,
  wantsEvents: true // Only collisions with this fixture trigger events
});
```

### Collision Logic

A collision event is generated if **any** of the participants have opted in:
- Body A OR Fixture A has `wantsEvents: true`
- OR Body B OR Fixture B has `wantsEvents: true`

### Dynamic Toggling

You can enable or disable events at any time after creation:

```typescript
obj.wantsEvents = true; // Start receiving events
fixture.wantsEvents = false; // Stop receiving events for this part
```

## Global Event Handlers

You can set global handlers on the `World` instance to listen for events from all objects that have opted in.

### Collision Events

*   `onCollisionStart(idA, idB, fIdA, fIdB, impulse)`: Fired when two fixtures begin colliding.
*   `onCollisionEnd(idA, idB, fIdA, fIdB)`: Fired when two fixtures stop colliding.

```typescript
world.onCollisionStart = (idA, idB, fIdA, fIdB, impulse) => {
  console.log(`Body ${idA} (Fixture ${fIdA}) and Body ${idB} (Fixture ${fIdB}) started colliding.`);
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

Alternatively, you can set event handlers directly on `Body` instances.

```typescript
const obj = world.makeBody(id, { x: 5, y: 5, wantsEvents: true });
obj.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 1 });

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
