# Body Types

In Gearbox2D, every physical object has a body type that determines how it interacts with the physics world. You can set the body type when creating an object using the `type` property.

## Available Body Types

### Rigid Body (Dynamic)
`gb2d.bodyTypes.RIGID_BODY`

Dynamic bodies are fully simulated by the physics engine. They are affected by gravity, external forces, impulses, and collisions with other objects. This is the default type for most interactive objects like players, boxes, or debris.

```typescript
world.makeObject(nextId++, {
    x: 5, y: 5,
    shape: gb2d.shapes.CIRCLE,
    radius: 0.5,
    mass: 1.0,
    type: gb2d.bodyTypes.RIGID_BODY
});
```

### Fixed Object (Static)
`gb2d.bodyTypes.FIXED_OBJECT`

Fixed objects have infinite mass and are immovable by the physics simulation. They do not respond to forces or impulses. They are typically used for static environment elements like ground, walls, or platforms. While they can be moved manually by setting their position, they do not have velocity-based movement.

```typescript
world.makeObject(nextId++, {
    x: 5, y: 9,
    width: 10, height: 1,
    shape: gb2d.shapes.AABB,
    type: gb2d.bodyTypes.FIXED_OBJECT
});
```

### Kinematic Object
`gb2d.bodyTypes.KINEMATIC_OBJECT`

Kinematic objects are a hybrid between dynamic and fixed objects. Like fixed objects, they have infinite mass and are unaffected by forces or collisions. However, they can have velocity and will move based on that velocity. This makes them ideal for moving platforms, elevators, or character-controlled objects that should "push" other objects without being pushed back.

```typescript
world.makeObject(nextId++, {
    x: 2, y: 5,
    vx: 2.0, // Moves horizontally
    width: 2, height: 0.5,
    shape: gb2d.shapes.BOX,
    type: gb2d.bodyTypes.KINEMATIC_OBJECT
});
```

### Sensor
`gb2d.bodyTypes.SENSOR`

Sensors detect collisions and trigger events but do not have a physical response. They "pass through" other objects. They are useful for trigger zones, area-of-effect detection, or visibility checks. Note that sensors still require collision categories and masks to be configured to interact with specific groups.

```typescript
world.makeObject(nextId++, {
    x: 5, y: 5,
    shape: gb2d.shapes.CIRCLE,
    radius: 2.0,
    type: gb2d.bodyTypes.SENSOR,
    wantsEvents: true // Opt-in to collision events
});
```
