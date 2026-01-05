import Example from './example.js';
import gb2d from '../dist/js/gb2d.js';

let nextId = 1;
let dropTimer = 0;
let breakableJoint = null;
let engineHub = null;

export const constraintsExamples = [
    new Example({ // Simple Hinge
        name: "Simple Hinge",
        key: "simple-hinge",
        description: "A single BOX object attached to a FIXED_OBJECT by a hinge constraint. The box will swing like a pendulum.",
        onInit: (world) => {
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 3,
                shape: gb2d.shapes.BOX,
                width: 1,
                height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff0000"
            });

            const pendulum = world.makeObject(nextId++, {
                x: 8,
                y: 3,
                shape: gb2d.shapes.BOX,
                width: 4,
                height: 0.5,
                mass: 0.1,
                color: "#00ff00"
            });

            world.createHingeJoint(nextId++, anchor, pendulum, {
                worldAnchor: { x: 5, y: 3 }
            });

            world.setGravity(0, 9.81);
        }
    }),

    new Example({ // Hinge Bridge
        name: "Hinge Bridge",
        key: "hinge-bridge",
        description: "A bridge made of several BOX segments connected by hinges, anchored to static objects at both ends. Watch it react as objects are dropped onto it.",
        onInit: (world) => {
            const startX = 2;
            const endX = 8;
            const y = 5;
            const segments = 10;
            const segmentWidth = (endX - startX) / segments;
            const segmentHeight = 0.4;

            const anchorLeft = world.makeObject(nextId++, {
                x: startX - segmentWidth / 2,
                y: y,
                shape: gb2d.shapes.BOX,
                width: segmentWidth,
                height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#888888"
            });

            const anchorRight = world.makeObject(nextId++, {
                x: endX + segmentWidth / 2,
                y: y,
                shape: gb2d.shapes.BOX,
                width: segmentWidth,
                height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#888888"
            });

            let prevBody = anchorLeft;
            for (let i = 0; i < segments; i++) {
                const segmentBody = world.makeObject(nextId++, {
                    x: startX + i * segmentWidth + segmentWidth / 2,
                    y: y,
                    shape: gb2d.shapes.BOX,
                    width: segmentWidth * 0.9, // Small gap for visual clarity
                    height: segmentHeight,
                    mass: 0.1,
                    color: "#A0522D"
                });

                world.createHingeJoint(nextId++, prevBody, segmentBody, {
                    worldAnchor: { x: startX + i * segmentWidth, y: y }
                });

                prevBody = segmentBody;
            }

            world.createHingeJoint(nextId++, prevBody, anchorRight, {
                worldAnchor: { x: endX, y: y }
            });

            world.setGravity(0, 10);

            dropTimer = 0;
        },
        onTick: (world, dt) => {
            dropTimer += dt;

            if (dropTimer > 1.5) {
                dropTimer = 0;
                const x = 2 + Math.random() * 6;
                const shapeType = Math.random() > 0.5 ? gb2d.shapes.CIRCLE : gb2d.shapes.BOX;
                
                world.makeObject(nextId++, {
                    x: x,
                    y: 0,
                    shape: shapeType,
                    radius: 0.5 + Math.random() * 0.5,
                    width: 0.8 + Math.random() * 0.8,
                    height: 0.8 + Math.random() * 0.8,
                    mass: 0.2 + Math.random() * 0.5,
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                });
            }
        }
    }),

    new Example({ // Breakable Joint
        name: "Breakable Joint",
        key: "breakable-joint",
        description: "A heavy ball is suspended by a hinge. The hinge will break if the reaction force exceeds a certain threshold.",
        onInit: (world) => {
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 2,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.5,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff0000"
            });

            const ball = world.makeObject(nextId++, {
                x: 5,
                y: 6,
                shape: gb2d.shapes.CIRCLE,
                radius: 1.5,
                mass: 2,
                color: "#444444"
            });

            breakableJoint = world.createHingeJoint(nextId++, anchor, ball, {
                worldAnchor: { x: 5, y: 2 }
            });

            world.setGravity(0, 10);
            gb2d.debug.showForceVectors = true;
            
            // Apply a side force to make it swing
            ball.applyImpulse(5, 0);
        },
        onTick: (world, dt) => {
            if (breakableJoint) {
                const f = breakableJoint.reactionForce;
                const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);
                
                // Expose force for debugging/UI
                gb2d.debug.removeObjectLabels(breakableJoint.bodyB.id);
                gb2d.debug.addLabel({
                    text: `Force: ${forceMag.toFixed(1)}`,
                    objectId: breakableJoint.bodyB.id,
                    position: 'above',
                    color: forceMag > 120 ? 'red' : 'black'
                });

                if (forceMag > 150) {
                    world.removeJoint(breakableJoint.id);
                    gb2d.debug.removeObjectLabels(breakableJoint.bodyB.id);
                    breakableJoint = null;
                    console.log("Joint BROKE!");
                }
            }
        }
    }),

    new Example({ // Gnome Omega Engine
        name: "Gnome Omega Engine",
        key: "gnome-omega",
        description: [
            "A simulation of a Gnome Omega rotary engine. This is a type of radial engine where the crankshaft is stationary and the entire cylinder block rotates around it.",
            "Features:",
            "- Stationary Crankshaft (fixed red point offset from center)",
            "- Rotating Crankcase (the grey hub)",
            "- 7 Cylinders with walls 'welded' to the hub using multiple hinges",
            "- Pistons and Connecting Rods connected via Hinge Joints",
            "- Collision Masks ensuring pistons only collide with their own cylinder walls.",
            "Click 'Reset' if the simulation becomes unstable."
        ].join("\n\n"),
        onInit: (world) => {
            world.clear();
            gb2d.debug.showAabbs = false;
            nextId = 1;
            engineHub = null;

            const cx = 5;
            const cy = 4.5;
            const crankOffset = 0.8;
            const numCylinders = 7;
            const rodLength = 2.5;
            
            // Dedicated collision categories to prevent unintended interactions
            const CAT_FIXED = 0x100;
            const CAT_HUB = 0x200;
            const CAT_CYLINDER = 0x400;
            const CAT_PISTON = 0x800;
            const CAT_ROD = 0x1000;

            // Stationary center of the rotation
            const hubAnchor = world.makeObject(nextId++, {
                x: cx, y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.15,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#333",
                categoryBits: CAT_FIXED,
                maskBits: 0 // Collide with nothing
            });

            // The fixed crank pin (stationary throw)
            const crankPin = world.makeObject(nextId++, {
                x: cx, y: cy + crankOffset,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#f00",
                categoryBits: CAT_FIXED,
                maskBits: 0 // Collide with nothing
            });

            // The rotating hub (crankcase)
            engineHub = world.makeObject(nextId++, {
                x: cx, y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.8,
                mass: 50.0, // Increased mass for stability
                color: "#666",
                categoryBits: CAT_HUB,
                maskBits: 0, // Collide with nothing
                restitution: 0
            });

            world.createHingeJoint(nextId++, hubAnchor, engineHub, {
                worldAnchor: { x: cx, y: cy }
            });

            for (let i = 0; i < numCylinders; i++) {
                const angle = (i / numCylinders) * Math.PI * 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                // Gearbox2D Box rotation: 0 rad means Y-axis is (0, 1). 
                // To point Y-axis along (cos, sin), we need r = angle - PI/2.
                const orientation = angle - Math.PI / 2;

                // Cylinder Walls
                const wallDist = 2.6;
                const wallWidth = 0.28;
                const wallHeight = 2.5;
                const wallGap = 1.0; // Distance between wall CENTERS
                // Inner gap = wallGap - wallWidth = 1.0 - 0.2 = 0.8
                
                const createWall = (side) => {
                    const wallX = cx + cos * wallDist + (-sin) * (side * wallGap / 2);
                    const wallY = cy + sin * wallDist + (cos) * (side * wallGap / 2);
                    
                    const wall = world.makeObject(nextId++, {
                        x: wallX, y: wallY,
                        r: orientation,
                        shape: gb2d.shapes.BOX,
                        width: wallWidth, height: wallHeight,
                        mass: 1.0,
                        color: "#444",
                        categoryBits: CAT_CYLINDER,
                        maskBits: CAT_PISTON, // Only collide with pistons
                        restitution: 0,
                        sFriction: 0,
                        kFriction: 0
                    });
                    
                    // Weld wall to hub using one hinge and one distance joint.
                    // Using a distance joint instead of a second hinge avoids over-constraining the system,
                    // which significantly improves stability.
                    const wAnchor1 = wall.localToWorld({ x: 0, y: -wallHeight/2 });
                    const wAnchor2 = wall.localToWorld({ x: 0, y: wallHeight/2 });
                    world.createHingeJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor1 });
                    world.createDistanceJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor2 });
                };

                createWall(-1);
                createWall(1);
                
                // Precise piston distance calculation for stable start
                const pistonDist = crankOffset * Math.sin(angle) + Math.sqrt(rodLength * rodLength - Math.pow(crankOffset * Math.cos(angle), 2));

                const pistonX = cx + cos * pistonDist;
                const pistonY = cy + sin * pistonDist;
                const piston = world.makeObject(nextId++, {
                    x: pistonX, y: pistonY,
                    r: orientation,
                    shape: gb2d.shapes.BOX,
                    width: 0.7, height: 1.0, // Piston width (0.7) is now less than inner gap (0.8)
                    mass: 0.5,
                    color: "#999",
                    categoryBits: CAT_PISTON,
                    maskBits: CAT_CYLINDER, // Only collide with cylinder walls
                    restitution: 0,
                    sFriction: 0,
                    kFriction: 0
                });

                const rodX = (cx + pistonX) / 2;
                const rodY = (cy + crankOffset + pistonY) / 2;
                // Rotate rod to point from crank pin to piston
                const rodAngle = Math.atan2(pistonY - (cy + crankOffset), pistonX - cx) - Math.PI / 2;
                
                const rod = world.makeObject(nextId++, {
                    x: rodX, y: rodY,
                    r: rodAngle,
                    shape: gb2d.shapes.BOX,
                    width: 0.15, height: rodLength,
                    mass: 0.2,
                    color: "#bbb",
                    categoryBits: CAT_ROD,
                    maskBits: 0, // Rods are non-colliding
                    restitution: 0
                });

                // Hinge: Rod to Crank Pin
                world.createHingeJoint(nextId++, rod, crankPin, {
                    anchorA: { x: 0, y: -rodLength/2 },
                    anchorB: { x: 0, y: 0 }
                });

                // Hinge: Rod to Piston
                world.createHingeJoint(nextId++, rod, piston, {
                    anchorA: { x: 0, y: rodLength/2 },
                    anchorB: { x: 0, y: 0 }
                });
            }

            world.setGravity(0, 0);
            engineHub.rs = 2.0; // Start with a gentle initial rotation
        },
        onTick: (world, dt) => {
            if (engineHub) {
                // Apply a gentle impulse to maintain rotation
                if (Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(5);
                }
            }
        }
    })
];

