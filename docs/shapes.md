# Supported Shapes & Geometry

In Gearbox2D, geometry is defined using **Fixtures**. A single **Body** can have multiple fixtures attached to it, allowing you to create complex composite shapes.

## Fixtures vs. Bodies

- **Body**: Represents a physical object in the world with a position, rotation, and velocity. It handles the integration of forces and movement.
- **Fixture**: Defines the shape, density, and friction of a part of a body. A body's total mass and inertia are calculated based on all its attached fixtures.

## Shape Types

### POINT
`gearbox.shapes.POINT`
A zero-radius marker. Points are useful for simple particles or as anchors. They have very low mass and can collide with other shapes, but do not collide with other points.

```typescript
body.addFixture({
    shape: gearbox.shapes.POINT
});
```

### CIRCLE
`gearbox.shapes.CIRCLE`
An optimized circular shape defined by a radius. Circles are the most computationally efficient shape for collision detection.

```typescript
body.addFixture({
    shape: gearbox.shapes.CIRCLE,
    radius: 0.5
});
```

### AABB
`gearbox.shapes.AABB`
An Axis-Aligned Bounding Box. It is defined by a `width` and `height`. Unlike other shapes, an AABB **does not rotate** even if the parent body rotates. It always remains aligned with the world axes.

```typescript
body.addFixture({
    shape: gearbox.shapes.AABB,
    width: 2.0,
    height: 1.0
});
```

### BOX
`gearbox.shapes.BOX`
An Oriented Bounding Box (OBB). Like an AABB, it is defined by `width` and `height`, but it **rotates with the body**.

```typescript
body.addFixture({
    shape: gearbox.shapes.BOX,
    width: 2.0,
    height: 1.0
});
```

### CAPSULE
`gearbox.shapes.CAPSULE`
A pill-shaped geometry defined by a `radius` and a `height`. The total height includes the hemispherical caps at both ends. Capsules are excellent for character controllers as they slide smoothly over edges.

```typescript
body.addFixture({
    shape: gearbox.shapes.CAPSULE,
    radius: 0.25,
    height: 1.5
});
```

### POLYGON
`gearbox.shapes.POLYGON`
A polygon defined by an array of vertices. Gearbox2D supports both **convex** and **concave** polygons.

```typescript
body.addFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: [
        { x: -0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0, y: -0.5 }
    ]
});
```

#### Concave Polygons & Automatic Decomposition
Internally, the physics engine core only supports convex polygons. When you add a concave polygon in the TypeScript wrapper, Gearbox2D automatically decomposes it into multiple convex pieces using **Bayazit's algorithm**.

From the user's perspective, this remains a **single Fixture**. Property changes (like friction or restitution) made to this fixture are automatically synchronized across all internal convex parts.

## Geometry Helpers

Gearbox2D provides procedural helpers to generate vertex arrays for common shapes. These are found under the `gearbox.polygon` namespace.

### Regular Polygons
Generates vertices for an equilateral shape with N sides.

```typescript
// Create a hexagon
const hexVertices = gearbox.polygon.makeRegularPolygon(6, 0.5);

body.addFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: hexVertices
});
```

### Stars
Generates vertices for a star shape. Stars are concave and will be automatically decomposed by the engine.

```typescript
// Create a 5-pointed star
const starVertices = gearbox.polygon.makeStar(5, 0.5, 0.2);

body.addFixture({
    shape: gearbox.shapes.POLYGON,
    vertices: starVertices
});
```
