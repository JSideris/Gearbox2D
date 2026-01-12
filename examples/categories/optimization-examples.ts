import Example from '../example.js';
import gearbox from 'gearbox2d';

let simulationTime = 0;
let nextId = 1;

export const optimizationExamples = [
    new Example({
        name: "Sleep and Islands",
        key: "sleep-and-islands",
        description: [
            "**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.",
            "Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.",
            "This provides the performance benefits of **Islands** with significantly lower overhead."
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
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 2, 
            });
        },
        // Once collisions are a bit more stable, the number of colliding objects can be doubled.
        onTick: (world, dt)=>{
            const nObjects = 10;
            simulationTime += dt*2;
            let numbSeconds = Math.floor(simulationTime / 3);
            if(numbSeconds > nextId){
                if(nextId < nObjects){
                    world.makeObject(nextId++, {
                        x: 5,
                        y: 0,
                        r: (Math.random() - 0.5) * 0.1, // Add small random rotation
                        width: 6,
                        height: 0.5,
                        vx: 0,
                        vy: 0,
                        shape: gearbox.shapes.BOX,
                        type: gearbox.bodyTypes.RIGID_BODY,
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
            "Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.",
            "This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."
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
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                mass: 0.2, 
                restitution: 0,
            });
            world.makeObject(2, {
                x: 0,
                y: 0,
                radius: 1,
                vx: 5.0,
                vy: 5.0,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
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