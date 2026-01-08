import Example from '../example.ts';
import gb2d from 'gb2d';

let nextId = 1;
let drum = null;

export const distanceExamples = [
    new Example({ // Washing Machine
        name: "Washing Machine",
        key: "washing-machine",
        description: "A rotating drum with multiple triple-link chains hanging from its outer edge.",
        onInit: (world) => {
            gb2d.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const drumRadius = 4;

            // The Drum Hub (fixed rotation center)
            const hub = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.5,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff0000"
            });

            // The rotating drum (structure only)
            drum = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: drumRadius,
                mass: 100,
                color: "rgba(255, 255, 255, 0.05)",
                maskBits: 0,
                angularDamping: 0.5 // Add some damping to stabilize
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
                const shape1 = world.makeObject(nextId++, {
                    x: shape1X,
                    y: shape1Y,
                    shape: i % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 60%)`
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
                const shape2 = world.makeObject(nextId++, {
                    x: shape2X,
                    y: shape2Y,
                    shape: (i + 1) % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 50%)`
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
                const shape3 = world.makeObject(nextId++, {
                    x: shape3X,
                    y: shape3Y,
                    shape: (i + 2) % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: `hsl(${(i * 360) / numChains}, 70%, 40%)`
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
    })
];

