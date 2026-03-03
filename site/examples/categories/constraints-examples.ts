import Example from '../engine-wrapper.js';
import gearbox from 'gearbox2d';

let nextId = 1;
let bridgeJoints = [];
let breakableJoint = null;
let massObject = null;
let engineHub = null;
let drum = null;
let rotator = null;
let currentImpulse = 0;
let impulseTimer = 0;

export const constraintsExamples = [
    new Example({ // Simple Hinge
        name: "Simple Hinge",
        key: "simple-hinge",
        description: [
            "A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.",
            "The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."
        ].join("\n\n"),
        onInit: (world) => {
            nextId = 1;
            const anchorId = nextId++;
            const anchor = world.makeBody(anchorId, {
                x: 5,
                y: 3,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            anchor.addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });

            const pendulumId = nextId++;
            const pendulum = world.makeBody(pendulumId, {
                x: 8,
                y: 3,
                mass: 0.1,
                color: "#44ff44"
            });
            pendulum.addFixture({
                shape: gearbox.shapes.BOX,
                width: 4,
                height: 0.5,
            });

            world.createHingeJoint(nextId++, anchor, pendulum, {
                worldAnchor: { x: 5, y: 3 }
            });

            world.setGravity(0, 9.81);
        }
    }),

    new Example({ // Breakable Joint
        name: "Breakable Joint",
        key: "breakable-joint",
        description: [
            "This demo showcases **Joint Reaction Forces** and dynamic joint removal.",
            "1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.",
            "2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.",
            "You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."
        ].join("\n\n"),
        onInit: (world) => {
            nextId = 1;
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = true;

            world.setGravity(0, 10);
            bridgeJoints = [];
            breakableJoint = null;
            massObject = null;

            // 1. Suspension System (higher up and smaller)
            const anchorId = nextId++;
            const anchor = world.makeBody(anchorId, {
                x: 5,
                y: 1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            anchor.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.2,
            });

            const massObjectId = nextId++;
            massObject = world.makeBody(massObjectId, {
                x: 5,
                y: 2.5,
                mass: 0.05,
                color: "#888888"
            });
            massObject.addFixture(massObjectId, {
                shape: gearbox.shapes.CIRCLE,
                radius: 0.4,
            });

            breakableJoint = world.createHingeJoint(nextId++, anchor, massObject, {
                worldAnchor: { x: 5, y: 1 }
            });

            // 2. Spring Bridge
            const startX = 2;
            const endX = 8;
            const bridgeY = 6;
            const segments = 12;
            const segmentWidth = (endX - startX) / segments;
            const segmentHeight = 0.2;

            const bridgeAnchorLeftId = nextId++;
            const bridgeAnchorLeft = world.makeBody(bridgeAnchorLeftId, {
                x: startX - segmentWidth / 2,
                y: bridgeY,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            bridgeAnchorLeft.addFixture({
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
            });

            const bridgeAnchorRightId = nextId++;
            const bridgeAnchorRight = world.makeBody(bridgeAnchorRightId, {
                x: endX + segmentWidth / 2,
                y: bridgeY,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            bridgeAnchorRight.addFixture({
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
            });

            let prevBody = bridgeAnchorLeft;
            for (let i = 0; i < segments; i++) {
                const segmentBodyId = nextId++;
                const segmentBody = world.makeBody(segmentBodyId, {
                    x: startX + i * segmentWidth + segmentWidth / 2,
                    y: bridgeY,
                    mass: 0.2, // Slightly heavier for stability
                    color: "#cd853f",
                });
                segmentBody.addFixture({
                    shape: gearbox.shapes.BOX,
                    width: segmentWidth * 0.9,
                    height: segmentHeight,
                    categoryBits: 0x0004,
                    maskBits: ~0x0004 // Don't collide with other bridge segments
                });

                const sj = world.createSpringJoint(nextId++, prevBody, segmentBody, {
                    worldAnchor: { x: startX + i * segmentWidth, y: bridgeY },
                    frequencyHz: 4.0,   // More lax/stretchy
                    dampingRatio: 1.0   // High damping to eliminate jitter
                });
                bridgeJoints.push(sj);
                prevBody = segmentBody;
            }

            const lastSj = world.createSpringJoint(nextId++, prevBody, bridgeAnchorRight, {
                worldAnchor: { x: endX, y: bridgeY },
                frequencyHz: 4.0,
                dampingRatio: 1.0
            });
            bridgeJoints.push(lastSj);
            
            // Apply a side force to make it swing
            massObject.applyImpulse(0.2, 0);
        },
        onTick: (world, dt) => {
            // 1. Increase mass
            if (massObject) {
                massObject.mass += dt * 3.0; // Increase mass over time
                
                gearbox.debug.removeObjectLabels(massObject.id);
                gearbox.debug.addLabel({
                    text: `Mass: ${massObject.mass.toFixed(2)}kg`,
                    objectId: massObject.id,
                    position: 'above',
                    color: '#fff'
                });
            }

            // 2. Break suspension joint
            if (breakableJoint) {
                const f = breakableJoint.reactionForce;
                const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);
                
                if (forceMag > 150) {
                    world.removeJoint(breakableJoint.id);
                    breakableJoint = null;
                }
            }

            // 3. Break bridge joints
            if (bridgeJoints.length > 0) {
                for (let i = bridgeJoints.length - 1; i >= 0; i--) {
                    const sj = bridgeJoints[i];
                    const f = sj.reactionForce;
                    const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);
                    
                    if (forceMag > 600) { 
                        world.removeJoint(sj.id);
                        bridgeJoints.splice(i, 1);
                    }
                }
            }
        }
    }),

    new Example({ // Gear Train
        name: "Gear Train",
        key: "gear-train",
        description: [
            "A sequence of gears connected using the `GearJoint` constraint.",
            "Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).",
            "A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."
        ].join("\n\n"),
        onInit: (world) => {
            nextId = 1;
            const startX = 2;
            const y = 5;
            const numGears = 5;
            const spacing = 1.5;
            
            const staticBodyId = nextId++;
            const staticBody = world.makeBody(staticBodyId, {
                x: 5, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#888",
            });
            staticBody.addFixture({
                shape: gearbox.shapes.AABB,
                width: 6.2,
                height: 0.2,
                maskBits: 0 // Don't collide with gears
            });

            let prevHinge = null;
            engineHub = null; // Reuse engineHub variable for the drive gear

            for (let i = 0; i < numGears; i++) {
                const size = (i % 2 === 0) ? 1.0 : 0.5;
                const gearId = nextId++;
                const gear = world.makeBody(gearId, {
                    x: startX + i * spacing,
                    y: y,
                    mass: size,
                    color: `hsl(${i * 60}, 70%, 60%)`
                });
                gear.addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: size,
                });

                const hinge = world.createHingeJoint(nextId++, staticBody, gear, {
                    worldAnchor: { x: startX + i * spacing, y: y }
                });

                if (i === 0) {
                    engineHub = gear; // Mark the first gear as the driver
                } else {
                    // Ratio is based on the sizes: size_prev / size_curr
                    const prevSize = ((i - 1) % 2 === 0) ? 1.0 : 0.5;
                    const ratio = prevSize / size;
                    world.createGearJoint(nextId++, prevHinge, hinge, ratio);
                }
                prevHinge = hinge;
            }
        },
        onTick: (world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }
    }),

    new Example({ // Distance Ropes
        name: "Distance Ropes",
        key: "distance-ropes",
        description: [
            "Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.",
            "A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."
        ].join("\n\n"),
        onInit: (world) => {
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const drumRadius = 4;

            // The Drum Hub (fixed rotation center)
            const hubId = nextId++;
            const hub = world.makeBody(hubId, {
                x: cx,
                y: cy,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            hub.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
            });

            // The rotating drum (structure only)
            const drumId = nextId++;
            drum = world.makeBody(drumId, {
                x: cx,
                y: cy,
                mass: 100,
                color: "rgba(255, 255, 255, 0.05)",
                angularDamping: 0.5 // Add some damping to stabilize
            });
            drum.addFixture(drumId, {
                shape: gearbox.shapes.CIRCLE,
                radius: drumRadius,
                maskBits: 0,
            });

            world.createHingeJoint(nextId++, hub, drum, {
                worldAnchor: { x: cx, y: cy }
            });

            // Add hanging chain triplets
            const numChains = 8;
            const pinRadius = 3.8;
            const linkDist = 0.8; // Slightly shorter links for 3 shapes

            const getRandomAnchor = () => ({
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3
            });

            for (let i = 0; i < numChains; i++) {
                const angle = (i / numChains) * Math.PI * 2;
                
                // Pin location on drum
                const pinX = cx + Math.cos(angle) * pinRadius;
                const pinY = cy + Math.sin(angle) * pinRadius;

                // First link (pointing towards center)
                const shape1X = pinX - Math.cos(angle) * 0.5;
                const shape1Y = pinY - Math.sin(angle) * 0.5;
                const shape1Id = nextId++;
                const shape1 = world.makeBody(shape1Id, {
                    x: shape1X,
                    y: shape1Y,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 60%)`
                });
                shape1.addFixture({
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 1: Drum to Shape 1
                const localAnchorOnDrum = drum.worldToLocal({ x: pinX, y: pinY });
                world.createDistanceJoint(nextId++, drum, shape1, {
                    anchorA: localAnchorOnDrum,
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });

                // Second link (pointing further towards center)
                const shape2X = shape1X - Math.cos(angle) * linkDist;
                const shape2Y = shape1Y - Math.sin(angle) * linkDist;
                const shape2Id = nextId++;
                const shape2 = world.makeBody(shape2Id, {
                    x: shape2X,
                    y: shape2Y,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 50%)`
                });
                shape2.addFixture({
                    shape: (i + 1) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 2: Shape 1 to Shape 2
                world.createDistanceJoint(nextId++, shape1, shape2, {
                    anchorA: getRandomAnchor(),
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });

                // Third link (pointing even further towards center)
                const shape3X = shape2X - Math.cos(angle) * linkDist;
                const shape3Y = shape2Y - Math.sin(angle) * linkDist;
                const shape3Id = nextId++;
                const shape3 = world.makeBody(shape3Id, {
                    x: shape3X,
                    y: shape3Y,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 40%)`
                });
                shape3.addFixture({
                    shape: (i + 2) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 3: Shape 2 to Shape 3
                world.createDistanceJoint(nextId++, shape2, shape3, {
                    anchorA: getRandomAnchor(),
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });
            }

            world.setGravity(0, 9.81);
            drum.rs = 0.2; // Slower initial start
        },
        onTick: (world, dt) => {
            if (drum) {
                const time = Date.now() / 1000;
                // Create a variable speed cycle (agitate phase)
                // We oscillate the target speed and direction periodically
                const cycleTime = time % 12; // 12 second full cycle
                let targetSpeed = 0;
                let strength = 2;

                if (cycleTime < 4) {
                    // Phase 1: Spin clockwise
                    targetSpeed = 1.2;
                    strength = 4;
                } else if (cycleTime < 6) {
                    // Phase 2: Slow down / Pause
                    targetSpeed = 0;
                    strength = 1;
                } else if (cycleTime < 10) {
                    // Phase 3: Agitate (fast back and forth)
                    targetSpeed = Math.sin(time * 4) * 2.0;
                    strength = 8;
                } else {
                    // Phase 4: Pause
                    targetSpeed = 0;
                }

                const speedDiff = targetSpeed - drum.rs;
                if (Math.abs(speedDiff) > 0.05) {
                    drum.applyAngularImpulse(speedDiff * strength);
                }
            }
        }
    }),

    new Example({ // Spring Belt
        name: "Spring Belt",
        key: "spring-belt",
        description: [
            "A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.",
            "The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."
        ].join("\n\n"),
        onInit: (world) => {
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const innerRadius = 2.5;
            const outerRadius = 3.5;

            // Hub (fixed center)
            const hubId = nextId++;
            const hub = world.makeBody(hubId, {
                x: cx,
                y: cy,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#666666",
            });
            hub.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
                maskBits: 0,
            });

            // Central rotating body (Pulley)
            const rotatorId = nextId++;
            rotator = world.makeBody(rotatorId, {
                x: cx,
                y: cy,
                rs: 2.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 10,
                color: "#888888",
                angularDamping: 0.1
            });
            rotator.addFixture(rotatorId, {
                shape: gearbox.shapes.CIRCLE,
                radius: innerRadius,
                sFriction: 1.0,
                kFriction: 1.0,
            });

            world.createHingeJoint(nextId++, hub, rotator, {
                worldAnchor: { x: cx, y: cy }
            });

            const numShapes = 16;
            const shapes = [];
            for (let i = 0; i < numShapes; i++) {
                const angle = (i / numShapes) * Math.PI * 2;
                const sx = cx + Math.cos(angle) * outerRadius;
                const sy = cy + Math.sin(angle) * outerRadius;

                const shapeId = nextId++;
                const shape = world.makeBody(shapeId, {
                    x: sx,
                    y: sy,
                    mass: 1.5, // Heavier for more stretch
                    color: `hsl(${(i * 360) / numShapes}, 70%, 60%)`,
                });
                shape.addFixture({
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.6,
                    height: 0.6,
                    radius: 0.3,
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
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }
    }),

    new Example({ // Soft Body Ball
        name: "Soft Body Ball",
        key: "soft-body",
        description: [
            "A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.",
            "The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.",
            "Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."
        ].join("\n\n"),
        onInit: (world) => {
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const radius = 2.0;
            const segments = 12;
            const points = [];
            const axelRadius = 0.2;

            // Center point (Axel)
            const centerId = nextId++;
            const center = world.makeBody(centerId, {
                x: cx,
                y: cy,
                mass: 2.0, // Heavier axel for more stability
                color: "#ff8888",
            });
            center.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: axelRadius,
                sFriction: 0.9,
                kFriction: 0.9,
            });
            rotator = center;
            currentImpulse = 0;
            impulseTimer = -30; // 0.5s delay at 60fps to let it hit the ground before spinning up

            // Outer ring
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const px = cx + Math.cos(angle) * radius;
                const py = cy + Math.sin(angle) * radius;

                const pId = nextId++;
                const p = world.makeBody(pId, {
                    x: px,
                    y: py,
                    mass: 0.5,
                    color: "#8888ff",
                });
                p.addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: 0.2,
                    sFriction: 0.9,
                    kFriction: 0.9,
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
            const groundId = nextId++;
            world.makeBody(groundId, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa",
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 15,
                height: 2,
                sFriction: 0.9,
                kFriction: 0.9,
            });

            // Barriers to keep the ball from rolling off - taller and thicker
            const barrier1Id = nextId++;
            world.makeBody(barrier1Id, {
                x: -3.5,
                y: 4.25,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
            });
            const barrier2Id = nextId++;
            world.makeBody(barrier2Id, {
                x: 13.5,
                y: 4.25,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
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

