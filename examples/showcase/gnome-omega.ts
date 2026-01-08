import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let engineHub = null;

export const gnomeOmegaExample = new Example({
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
            color: "#888",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The fixed crank pin (stationary throw)
        const crankPin = world.makeObject(nextId++, {
            x: cx, y: cy + crankOffset,
            shape: gb2d.shapes.CIRCLE,
            radius: 0.1,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#ff4444",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The rotating hub (crankcase)
        engineHub = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gb2d.shapes.CIRCLE,
            radius: 0.8,
            mass: 50.0, // Increased mass for stability
            color: "#aaa",
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
                    color: "#bbb",
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
                color: "#ddd",
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
                color: "#fff",
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
});

