import Example from './example.js';
import gb2d from '../dist/js/gb2d.js';

let simulationTime = 0;
let nextId = 1;

export const optimizationExamples = [
    new Example({
        name: "* Sleep and Islands",
        key: "sleep-and-islands",
        description: [
            "Sleep works a little differently in Gearbox 2D.",
            "Sleep is based on movement, and is computed during the kinematics step. Objects wake up during collisions or forces. Each object tracks its own list of contacts, and wakes up its neighbours whet it wakes up. This gives us islands without having to rebuild an island data structure each tick like other engines."
        ].join("\n\n"),
        globalLines: [
            "let simulationTime = 0;",
            "let nextId = 1;"
        ],
        onInit: (world)=>{
            world.setGravity(0, 10);
            simulationTime = 3;
            nextId = 0;

            world.makeObject(nextId++, {
                x: 5,
                y: 8.50,
                width: 20,
                height: 1,
                vx: 0.0,
                vy: 0.0,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                mass: 2, 
            });
        },
        // Once collisions are a bit more stable, the number of colliding objects can be doubled.
        onTick: (world, dt)=>{
            simulationTime += dt;
            let numbSeconds = Math.floor(simulationTime / 3);
            if(numbSeconds > nextId){
                if(nextId < 10){
                    world.makeObject(nextId++, {
                        x: 5,
                        y: 0,
                        width: 6,
                        height: 0.5,
                        vx: 0,
                        vy: 0,
                        shape: gb2d.shapes.BOX,
                        type: gb2d.bodyTypes.RIGID_BODY,
                        mass: 0.2, 
                        sFriction: 10,
                        kFriction: 10,
                    });
                }
            }
        }
    }),
    new Example({
        name: "Shrink Wrap",
        key: "shrink-wrap",
        description: [
            "Objects that are put to sleep get shrink wrapped AABBs providing a slight performance boost.",
        ].join("\n\n"),
        globalLines: [
        ],
        onInit: (world)=>{

            world.makeObject(1, {
                x: 10,
                y: 10,
                radius: 1,
                vx: -5.0,
                vy: -5.0,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                mass: 0.2, 
                restitution: 0,
            });
            world.makeObject(2, {
                x: 0,
                y: 0,
                radius: 1,
                vx: 5.0,
                vy: 5.0,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                mass: 0.2, 
                restitution: 0,
            });
        },
        // Once collisions are a bit more stable, the number of colliding objects can be doubled.
        onTick: (world, dt)=>{
        }
    }),
    // BVH Biasing.
];