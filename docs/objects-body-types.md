# Body Types

In Gearbox2D, every body has a body type that determines how it interacts with the physics world. You can set the body type when creating an object using the `type` property.

## Available Body Types

### Rigid Body (Dynamic)
`gearbox.bodyTypes.DYNAMIC_OBJECT`

Dynamic bodies are fully simulated by the physics engine. They are affected by gravity, external forces, impulses, and collisions with other objects. This is the default type for most interactive objects like players, boxes, or debris.

```typescript
const bodyId = nextId++;
const body = world.createBody(bodyId, {
    x: 5, y: 5,
    mass: 1.0,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});
```

### Fixed Object (Static)
`gearbox.bodyTypes.FIXED_OBJECT`

Fixed objects have infinite mass and are immovable by the physics simulation. They do not respond to forces or impulses. They are typically used for static environment elements like ground, walls, or platforms. While they can be moved manually by setting their position, they do not have velocity-based movement.

```typescript
const bodyId = nextId++;
const body = world.createBody(bodyId, {
    x: 5, y: 9,
    type: gearbox.bodyTypes.FIXED_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.AABB,
    width: 10, height: 1
});
```

### Kinematic Object
`gearbox.bodyTypes.KINEMATIC_OBJECT`

Kinematic objects are a hybrid between dynamic and fixed objects. Like fixed objects, they have infinite mass and are unaffected by forces or collisions. However, they can have velocity and will move based on that velocity. This makes them ideal for moving platforms, elevators, or character-controlled objects that should "push" other objects without being pushed back.

```typescript
const bodyId = nextId++;
const body = world.createBody(bodyId, {
    x: 2, y: 5,
    vx: 2.0, // Moves horizontally
    type: gearbox.bodyTypes.KINEMATIC_OBJECT
});

body.createFixture({
    shape: gearbox.shapes.BOX,
    width: 2, height: 0.5
});
```

## Sensors vs. Body Types

It is important to distinguish between **Body Types** (which define movement behavior) and **Sensors** (which define collision response).

A **Sensor** is a property of a **Fixture**, not a body type. This allows you to attach sensors to any type of body:
- **Static Sensor:** A fixed trigger zone (Fixed Body).
- **Moving Sensor:** An elevator or platform trigger (Kinematic Body).
- **Attached Sensor:** A vision cone or proximity alert attached to a player (Dynamic Body).

To create a sensor, set the `isSensor` property to `true` on the fixture options.

### Example: Static Trigger Zone
```typescript
const bodyId = nextId++;
world.createBody(bodyId, {
    x: 5, y: 5,
    type: gearbox.bodyTypes.FIXED_OBJECT,
}).createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 2.0,
    isSensor: true // This fixture will trigger events but not block movement
});
```

### Example: Attached Vision Cone
```typescript
const player = world.createBody(nextId++, {
    x: 5, y: 5,
    type: gearbox.bodyTypes.DYNAMIC_OBJECT
});

// Physical body
player.createFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});

// Vision cone (sensor)
player.createFixture({
    shape: gearbox.shapes.BOX,
    width: 4, height: 2,
    localX: 2.5, // Positioned in front of the player
    isSensor: true
});
```
