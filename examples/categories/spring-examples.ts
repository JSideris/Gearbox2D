import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let rotator = null;
let currentImpulse = 0;
let impulseTimer = 0;

export const springExamples = [
    new Example({ // Spring Belt
        name: "Spring Belt",
        key: "spring-belt",
        description: "A chain of shapes connected by stretchy springs, forming a belt around a rotating high-friction pulley.",
        onInit: (world) => {
            gb2d.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const innerRadius = 2.5;
            const outerRadius = 3.5;

            // Central rotating body (Pulley)
            rotator = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: innerRadius,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#888888",
                sFriction: 1.0,
                kFriction: 1.0
            });

            const numShapes = 16;
            const shapes = [];
            for (let i = 0; i < numShapes; i++) {
                const angle = (i / numShapes) * Math.PI * 2;
                const sx = cx + Math.cos(angle) * outerRadius;
                const sy = cy + Math.sin(angle) * outerRadius;

                const shape = world.makeObject(nextId++, {
                    x: sx,
                    y: sy,
                    shape: i % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
                    width: 0.6,
                    height: 0.6,
                    radius: 0.3,
                    mass: 1.5, // Heavier for more stretch
                    color: `hsl(${(i * 360) / numShapes}, 70%, 60%)`,
                    sFriction: 0.999,
                    kFriction: 0.99
                });
                shapes.push(shape);
            }

            // Connect shapes to each other to form a belt
            for (let i = 0; i < numShapes; i++) {
                const shapeA = shapes[i];
                const shapeB = shapes[(i + 1) % numShapes];
                
                // Calculate distance between centers for slack
                const dx = shapeB.x - shapeA.x;
                const dy = shapeB.y - shapeA.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                world.createSpringJoint(nextId++, shapeA, shapeB, {
                    length: dist * 1.1, // 10% slack
                    frequencyHz: 5.0,   // Very stretchy
                    dampingRatio: 0.2   // Bouncy
                });
            }

            world.setGravity(0, 9.81);
        },
        onTick: (world, dt) => {
            if (rotator) {
                rotator.rs = 2.4; // Set angular velocity so friction solver can see the motion (2.4 rad/s = 0.04 rad/tick)
            }
        }
    }),

    new Example({ // Soft Body Ball
        name: "Soft Body Ball",
        key: "soft-body",
        description: "A collection of circles connected by springs to form a squishy, deformable ball. Watch it move as persistent random impulses are applied to its core!",
        onInit: (world) => {
            gb2d.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const radius = 2.0;
            const segments = 12;
            const points = [];
            const axelRadius = 0.2;

            // Center point (Axel)
            const center = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: axelRadius,
                mass: 2.0, // Heavier axel for more stability
                color: "#ff8888",
                sFriction: 0.9,
                kFriction: 0.9
            });
            rotator = center;
            currentImpulse = 0;
            impulseTimer = -30; // 0.5s delay at 60fps to let it hit the ground before spinning up

            // Outer ring
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const px = cx + Math.cos(angle) * radius;
                const py = cy + Math.sin(angle) * radius;

                const p = world.makeObject(nextId++, {
                    x: px,
                    y: py,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.2,
                    mass: 0.5,
                    color: "#8888ff",
                    sFriction: 0.9,
                    kFriction: 0.9
                });
                points.push(p);

                // Connect to center - Offset to the edge of the axel
                world.createSpringJoint(nextId++, center, p, {
                    anchorA: { x: Math.cos(angle) * axelRadius, y: Math.sin(angle) * axelRadius },
                    length: radius - axelRadius,
                    frequencyHz: 4.0,
                    dampingRatio: 0.5
                });

                // Connect to neighbors
                if (i > 0) {
                    world.createSpringJoint(nextId++, points[i-1], p, {
                        length: (2 * radius * Math.sin(Math.PI / segments)),
                        frequencyHz: 4.0,
                        dampingRatio: 0.5
                    });
                }
            }
            
            // Close the ring
            world.createSpringJoint(nextId++, points[segments-1], points[0], {
                length: (2 * radius * Math.sin(Math.PI / segments)),
                frequencyHz: 4.0,
                dampingRatio: 0.5
            });

            // Ground - made wider to accommodate movement
            world.makeObject(nextId++, {
                x: 5,
                y: 10,
                shape: gb2d.shapes.BOX,
                width: 15,
                height: 2,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa",
                sFriction: 0.9,
                kFriction: 0.9
            });

            // Barriers to keep the ball from rolling off - taller and thicker
            world.makeObject(nextId++, {
                x: -3.5,
                y: 4.25,
                shape: gb2d.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            world.makeObject(nextId++, {
                x: 13.5,
                y: 4.25,
                shape: gb2d.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            world.setGravity(0, 9.81);
        },
        onTick: (world, dt) => {
            if (rotator) {
                if (impulseTimer <= 0) {
                    // Start a new impulse period randomly
                    if (Math.random() < 0.02) {
                        currentImpulse = (Math.random() - 0.5) * 3; // Reduced impulse range for more control
                        impulseTimer = 40 + Math.random() * 80; // 40-120 ticks
                    } else {
                        currentImpulse = 0;
                    }
                }

                if (impulseTimer > 0) {
                    // Apply persistent impulse
                    rotator.applyAngularImpulse(currentImpulse);
                    
                    // Add a directional nudge based on rotation
                    rotator.applyImpulse(currentImpulse * 0.1, 0);
                    
                    impulseTimer--;
                }
            }
        }
    })
];

