import Example from '../example.js';
import gb2d from '../../dist/js/gb2d.js';

let nextId = 1;
let engineHub = null;

export const gearExamples = [
    new Example({ // Simple Gears
        name: "Simple Gears",
        key: "simple-gears",
        description: "Two gears connected by a gear constraint. The first gear is driven, and the second gear rotates at a different speed based on the gear ratio.",
        onInit: (world) => {
            nextId = 1;
            const cx = 5;
            const cy = 5;
            
            const staticBody = world.makeObject(nextId++, {
                x: cx, y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#333",
                maskBits: 0 // Don't collide with gears
            });

            // Gear 1 (Drive)
            const gear1 = world.makeObject(nextId++, {
                x: cx - 2, y: cy,
                shape: gb2d.shapes.BOX,
                width: 2, height: 2,
                mass: 1,
                color: "#ff8800"
            });
            const hinge1 = world.createHingeJoint(nextId++, staticBody, gear1, {
                worldAnchor: { x: cx - 2, y: cy }
            });

            // Gear 2 (Driven)
            const gear2 = world.makeObject(nextId++, {
                x: cx + 2, y: cy,
                shape: gb2d.shapes.BOX,
                width: 1, height: 1,
                mass: 0.5,
                color: "#0088ff"
            });
            const hinge2 = world.createHingeJoint(nextId++, staticBody, gear2, {
                worldAnchor: { x: cx + 2, y: cy }
            });

            // Gear ratio: if gear1 has radius 1.0 and gear2 has radius 0.5, 
            // the ratio should be 2.0 (gear2 rotates twice as fast)
            // theta2 + ratio * theta1 = const
            // w2 = -ratio * w1
            // We want gear2 to rotate in opposite direction, so ratio should be positive?
            // Wait, in my impl: w2 + ratio * w1 = 0 -> w2 = -ratio * w1.
            // If gear1 is at x-2 and gear2 is at x+2, they touch at x.
            // When gear1 rotates CW (w1 > 0), gear2 should rotate CCW (w2 < 0).
            // So ratio should be positive.
            world.createGearJoint(nextId++, hinge1, hinge2, 2.0);

            gear1.rs = 1.0;
        }
    }),

    new Example({ // Gear Train
        name: "Gear Train",
        key: "gear-train",
        description: "A sequence of gears connected together. Each gear's motion is constrained by the previous one. A drive gear at the start applies a constant low torque.",
        onInit: (world) => {
            nextId = 1;
            const startX = 2;
            const y = 5;
            const numGears = 5;
            const spacing = 1.5;
            
            const staticBody = world.makeObject(nextId++, {
                x: 5, y: 5,
                shape: gb2d.shapes.AABB,
                width: 6.2,
                height: 0.2,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#333",
                maskBits: 0 // Don't collide with gears
            });

            let prevHinge = null;
            engineHub = null; // Reuse engineHub variable for the drive gear

            for (let i = 0; i < numGears; i++) {
                const size = (i % 2 === 0) ? 1.0 : 0.5;
                const gear = world.makeObject(nextId++, {
                    x: startX + i * spacing,
                    y: y,
                    shape: gb2d.shapes.CIRCLE,
                    radius: size,
                    mass: size,
                    color: `hsl(${i * 60}, 70%, 60%)`
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
    })
];

