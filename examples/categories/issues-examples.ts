import Example from '../example.js';
import gb2d from 'gb2d';

let impulseTimer = 0;
let nextId = 1;

export const issuesExamples = [
    new Example({
        name: "TC-1 (SOLVED)",
        key: "tc-1",
        hidden: true,
        description: "Boxes colliding with other boxes go crazy.",
        onInit: (world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                // r: Math.PI,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 5,
                height: 1,
                mass: 1,
            });

            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "Boxes warp right through AABBs.",
        onInit: (world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                r: Math.PI / 2,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI / 2,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 5,
                height: 1,
                mass: 1,
            });
            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI / 2,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "This isn't bad, but could be made better. The moving object loses all of its x momentum after the collision. In an actual collision of this type, one might expect the collision to apply a bunch of angular momentum and for the moving object to continue moving.",
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 3,
                vx: 3,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "The collision in this test is somewhat puzzling since hte object seems to receive angular velocity in the wrong direction.",
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 6,
                vx: 3,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "Even the slightest rs for the moving circle causes a dramatic difference in the resulting collision response. If commenting out rs, the collision is completely linear in the diagonal direction. If setting rs to 10, the collision is the nearly identical to an rs of 0.01.\n\nThere's another weird thing going on here. Notice how both circles end up spinning in the same direction. That's noh how physics works.",
        onInit: (world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                radius: 1,
                mass: 4,
            });

            world.makeObject(id++, {
                x: 2.8,
                y: 2.0,
                vx: 3,
                vy: 3,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 1,

                // rs: 10,
                rs: 0.01,
            });
        },
        onTick: (gb2d, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-6 (SOLVED)",
        key: "tc-6",
        description: "Incorrect response impulse applied during certain box-box collisions. Likely due to an error in the contact point calculation. Reccomend doing an edge clipping technique.",
        onInit: (world)=>{
            world.setGravity(0, 10);
            world.setHasFriction(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 8,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        },
        onTick: (gb2d, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-7 (SOLVED)",
        key: "tc-7",
        description: "Friction applies an incorrect vector to certain collisions. Likely due to an incorrect normal vector. Problem doesn't happen when restitution is off, so this could be a symptom of TC-6.",
        onInit: (world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                // r: Math.PI / 8,
                r: 0.1,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                restitution: 0.0,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
                restitution: 0.0,
            });
        },
        onTick: (gb2d, world, dt)=>{
        }
    }),

    new Example({
        name: "TC-8 (SOLVED)",
        key: "tc-8",
        description: [
            "Circle collisions sometimes glitch."
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
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.bodyTypes.RIGID_BODY,
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
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "A small box resting on a long fixed box.",
        onInit: (world)=>{
            world.setGravity(0, 1);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 2,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 8,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 5,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "A circle falling on a platform. Collision resolution is crazy.",
        onInit: (world)=>{
            world.setGravity(0, 3);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                // restitution: 1
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "Circles get stuck in other shapes.",
        onInit: (world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
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
        description: "The box, under high gravity, sinks through the AABB.",
        onInit: (world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 4,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        },
        onTick: (world, dt)=>{
        }
    }),

];