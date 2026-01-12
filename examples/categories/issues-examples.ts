import Example from '../example.js';
import gearbox from 'gearbox2d';

let impulseTimer = 0;
let nextId = 1;

export const issuesExamples = [
    new Example({
        name: "TC-1 (SOLVED)",
        key: "tc-1",
        hidden: true,
        description: [
            "**Test Case 1**: Verifies stability during box-on-box collisions.",
            "Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 5,
                height: 1,
                mass: 1,
            });

            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 5,
                height: 1,
                mass: 1,
            });
        },
        onTick: (world, dt)=>{
        }
    }),
    
    new Example({
        name: "TC-2 (SOLVED)",
        key: "tc-2",
        hidden: true,
        description: [
            "**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.",
            "This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                r: Math.PI / 2,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 5,
                height: 1,
                mass: 1,
            });
            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 5,
                height: 1,
                mass: 1,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

    new Example({
        name: "TC-3 (SOLVED)",
        key: "tc-3",
        description: [
            "**Test Case 3**: Momentum preservation and angular transfer.",
            "Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 3,
                vx: 3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 1,
                height: 5,
                mass: 1,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

    new Example({
        name: "TC-4 (SOLVED)",
        key: "tc-4",
        hidden: true,
        description: [
            "**Test Case 4**: Correctness of angular velocity direction.",
            "Ensures that objects receive torque in the physically correct direction based on the contact point and normal."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 6,
                vx: 3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 1,
                height: 5,
                mass: 1,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

    new Example({
        name: "TC-5 (SOLVED)",
        key: "tc-5",
        hidden: true,
        description: [
            "**Test Case 5**: Sensitivity to initial rotation.",
            "Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 1,
                mass: 4,
            });

            world.makeObject(id++, {
                x: 2.8,
                y: 2.0,
                vx: 3,
                vy: 3,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 1,

                // rs: 10,
                rs: 0.01,
            });
        },
        onTick: (gearbox, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-6 (SOLVED)",
        key: "tc-6",
        description: [
            "**Test Case 6**: Contact point calculation accuracy.",
            "Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);
            world.setHasFriction(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 8,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        },
        onTick: (gearbox, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-7 (SOLVED)",
        key: "tc-7",
        description: [
            "**Test Case 7**: Friction normal vector correctness.",
            "Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                // r: Math.PI / 8,
                r: 0.1,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                restitution: 0.0,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
                restitution: 0.0,
            });
        },
        onTick: (gearbox, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-8 (SOLVED)",
        key: "tc-8",
        description: [
            "**Test Case 8**: Stability of high-frequency circle collisions.",
            "Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."
        ].join("\n\n"),
        globalLines: ["let nextId = 1;"],
        onInit: (world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        },
        // Once collisions are a bit more stable, the number of colliding objects can be doubled.
        onTick: (world, dt)=>{
            impulseTimer++;
            if(impulseTimer % 60 == 0){
                let m = .1 + Math.random() * .4;
                let r = .2 + m*m * .8;
                world.makeObject(nextId++, {
                    x: 0,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * 1,
                    vy: -6.00 - Math.random() * 1.00,
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    radius: r,
                    mass: m, 
                });

                m = .1 + Math.random() * .4;
                r = .2 + m*m * .8;
                world.makeObject(nextId++, {
                    x: 10,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * -1,
                    vy: -6.00 - Math.random() * 1.00,
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    radius: r,
                    mass: m, 
                });

                // Scan for objects that are out of bounds and remove them.
                // Another way to do this would be to use collision events.
                let objectCount = world.objectCount;
                let toRemove = [];

                world.iterateObjects(obj=>{
                    
                    if(obj.y > 10.50){
                        // Don't remove stuff in the middle of the loop!!!
                        toRemove.push(obj);
                    }
                });

                // Now remove everything we found that's out of bounds.
                for(let obj of toRemove){
                    world.removeObject(obj.id);
                }
            }
        }
    }),

    new Example({
        name: "TC-9 (SOLVED)",
        key: "tc-9",
        description: [
            "**Test Case 9**: Resting stability.",
            "A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 1);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 8,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 5,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

    new Example({
        name: "TC-10 (SOLVED)",
        key: "tc-10",
        description: [
            "**Test Case 10**: Circle-AABB penetration resolution.",
            "Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 3);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                // restitution: 1
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 1,
                mass: 0.2,
                restitution: 1,
                rs: -0.1,
            });
        },
        onTick: (world, dt)=>{
        }
    }),
    new Example({
        name: "TC-11 (SOLVED)",
        key: "tc-11",
        description: [
            "**Test Case 11**: Stuck objects and overlap logic.",
            "Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."
        ].join("\n\n"),
        onInit: (world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.1,
                mass: 0.2,
                restitution: 0.5,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

    new Example({
        name: "TC-12 (SOLVED)",
        key: "tc-12",
        description: [
            "**Test Case 12**: Sinking prevention under high gravity.",
            "Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 4,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        },
        onTick: (world, dt)=>{
        }
    }),


    new Example({
        name: "TC-13 (SOLVED)",
        key: "tc-13",
        description: [
            "**Test Case 13**: Stuck objects and overlap logic.",
            "Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."
        ].join("\n\n"),
        onInit: (world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.1,
                mass: 0.2,
                restitution: 0.5,
            });
        },
        onTick: (world, dt)=>{
        }
    }),
];