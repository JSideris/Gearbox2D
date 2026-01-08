import Example from '../example.js';
import gb2d from '../../dist/js/gb2d.js';

let nextId = 1;
let dropTimer = 0;
let breakableJoint = null;

export const hingeExamples = [
    new Example({ // Simple Hinge
        name: "Simple Hinge",
        key: "simple-hinge",
        description: "A single BOX object attached to a FIXED_OBJECT by a hinge constraint. The box will swing like a pendulum.",
        onInit: (world) => {
            nextId = 1;
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
            nextId = 1;
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
            nextId = 1;
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
    })
];

