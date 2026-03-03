import Example from '../engine-wrapper.js';
import gearbox from 'gearbox2d';

export const newtonsCradleExample = new Example({
    name: "Newton's Cradle",
    key: "newtons-cradle",
    description: [
        "A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.",
        "### Features",
        "- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.",
        "- **Bifilar Suspension**: Each sphere is suspended by two `DistanceJoint` constraints in a 'V' shape, providing maximum stability and preventing unintended rotation.",
        "- **Low Friction**: Friction is minimized to allow the pendulum motion to persist for a long duration.",
        "The first ball is released from a 45-degree angle to initiate the chain reaction. Click **Reset** to restart the sequence."
    ].join("\n\n"),
    onInit: (world) => {
        world.clear();
        world.setGravity(0, 9.81);
        
        // Hide AABBs for a cleaner look
        gearbox.debug.showAabbs = false;

        const cx = 5;
        const cy = 2;
        const numBalls = 5;
        const ballRadius = 0.45;
        const stringLength = 4.0;
        const beamWidth = (numBalls + 1) * ballRadius * 2;
        
        let nextId = 1;

        // Collision categories
        const CAT_BEAM = 0x0001;
        const CAT_BALL = 0x0002;

        // The stationary overhead beam
        const beamId = nextId++;
        const beam = world.makeBody(beamId, {
            x: cx, y: cy,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#444",
        });
        beam.addFixture(beamId, {
            shape: gearbox.shapes.BOX,
            width: beamWidth,
            height: 0.3,
            categoryBits: CAT_BEAM,
            maskBits: 0, // Collide with nothing
        });

        for (let i = 0; i < numBalls; i++) {
            // Horizontal offset from center of beam
            const xOffset = (i - (numBalls - 1) / 2) * (ballRadius * 2);
            const ballX = cx + xOffset;
            const targetBallY = cy + stringLength;
            
            const isFirst = i === 0;
            let initialX = ballX;
            let initialY = targetBallY;

            if (isFirst) {
                // Lift the first ball (45 degree angle)
                const angle = -Math.PI / 4;
                initialX = cx + xOffset + Math.sin(angle) * stringLength;
                initialY = cy + Math.cos(angle) * stringLength;
            }

            const ballId = nextId++;
            const ball = world.makeBody(ballId, {
                x: initialX, y: initialY,
                mass: 1.0,
                color: isFirst ? "#ff4444" : "#cccccc",
                linearDamping: 0.005,
                angularDamping: 0.01,
            });

            ball.addFixture(ballId, {
                shape: gearbox.shapes.CIRCLE,
                radius: ballRadius,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
                categoryBits: CAT_BALL,
                maskBits: CAT_BALL, // Only collide with other balls
            });

            // Bifilar suspension (two strings for stability)
            const anchorSpacing = 0.1;
            
            // Left string
            world.createDistanceJoint(nextId++, beam, ball, {
                anchorA: { x: xOffset - anchorSpacing, y: 0 },
                anchorB: { x: 0, y: 0 },
                length: Math.sqrt(stringLength * stringLength + anchorSpacing * anchorSpacing),
            });
            
            // Right string
            world.createDistanceJoint(nextId++, beam, ball, {
                anchorA: { x: xOffset + anchorSpacing, y: 0 },
                anchorB: { x: 0, y: 0 },
                length: Math.sqrt(stringLength * stringLength + anchorSpacing * anchorSpacing),
            });
        }
    }
});
