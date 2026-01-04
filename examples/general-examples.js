import Example from './example.js';
import gb2d from '../dist/js/gb2d.js';

let nextId = 1;
let impulseTimer = 0;

export const generalExamples = [
    new Example({ // Hello World
        name: "Hello World",
        key: "hello-world",
        description: "A very simple demo showing how to set up a simulation, add an object, and rotate it.\n\nIt's best to imagine all values in SI units. But ultimately, it's arbitrary.",
        onInit: (world)=>{
            // The first (and only required) argument is the ID.
            // All objects must have a unique ID.
            world.makeObject(1337, {
                x: 5, // X position.
                y: 5, // Y position.
                r: 0, // Rotation in radians.
                shape: gb2d.shapes.BOX, // shape.
                width: 3, // Box width of 3 m when rotated at 0.
                height: 2, // Box height of 2 m when rotated at 0.

                // This is the preferred way to have a perminently rotating object.
                rs: 1, // Rotation speed in radians per second.
                rotationalDamping: 0.0 // Rotational damping. Set to 0 to disable.
            });
        },
        onTick: (world, dt)=>{
            // The rotation can also be set directly as follows.

            // Get the object with ID 1337 and rotate it.
            // world.objectsById[1337].r += dt / 20;
        }
    }),

    new Example({ // Shapes
        name: "Shapes",
        key: "shapes",
        description: "A simple example featuring a few supported shapes: circle, box, point, AABB.",
        onInit: (world)=>{
            let id = 1;
            let spacing = 2;

            world.makeObject(id++, {
                x: (id-1) * spacing,
                y: (id-1) * spacing,
                r: Math.PI / 4,
                shape: gb2d.shapes.CIRCLE,
                radius: .5,
            });

            world.makeObject(id++, {
                x: (id-1) * spacing,
                y: (id-1) * spacing,
                r: Math.PI / 4,
                shape: gb2d.shapes.BOX,
                width: .80,
                height: .95,
            });

            world.makeObject(id++, {
                x: (id-1) * spacing,
                y: (id-1) * spacing,
                shape: gb2d.shapes.POINT,
            });
            
            // Note that the rotation (r) doesn't do anything for AABBs.
            world.makeObject(id++, {
                x: (id-1) * spacing,
                y: (id-1) * spacing,
                r: Math.PI / 4,
                shape: gb2d.shapes.AABB,
                width: 1.00,
                height: .75,
            });
        }
    }),

    new Example({ // Force
        name: "Force",
        key: "force",
        description: "Forces are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset. Persistant forces must be reapplied on each fixed update.\n\nIt's important to note that the change in velocity will be a function of the force vector, the object's mass, and the time step. If you need a specific instantaneous change in velocity, use an impulse instead.",
        onInit: (world)=>{

            // This small circle will orbit the bigger one.
            world.makeObject(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                mass: 0.1, // 100g
                shape: gb2d.shapes.CIRCLE,
                radius: .30,
                angularDamping: 0.0, 
                linearDamping: 0.0 // Set to 0 to prevent the orbit from slowing down.
            });

            // For decoration, let's add a shape in the middle.
            world.makeObject(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: .1,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.SENSOR, // Sensors don't collide with other objects.
                radius: 1.00,
                angularDamping: 0.0, 
            });
        },

        onTick: (world, dt)=>{
            let obj = world.objectsById[1];
            let center = world.objectsById[2];

            // Calculate the vector from the object to the center.
            let dx = center.x - obj.x;
            let dy = center.y - obj.y;

            // Calculate the magnitude of the vector.
            let magnitude = Math.sqrt(dx * dx + dy * dy);

            // Normalize the vector.
            dx /= magnitude;
            dy /= magnitude;

            // Define the fixed magnitude of the force.
            const forceMagnitude = 2.00;

            // Apply a force to the object.
            obj.applyForce(dx * forceMagnitude, dy * forceMagnitude);
        }
    }),

    new Example({ // Impulse
        name: "Impulse",
        key: "impulse",
        description: "Impulses are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity instantaneously, rather than acting as a persistant push. Momentum is defined as the product of velocity and mass. So the change in velocity is the impulse vector divided by the object's mass.\n\nImpulse is used for things like explosions, bullets, and other sudden changes in velocity. This is different from forces, which are typically applied over long periods of time.\n\nIn this example we have a heavy object and a light object, and we apply the same impulses to both on an interval.",
        
        globalLines: [
            "let impulseTimer = 0;",
        ],

        onInit: (world)=>{

            // This small circle will orbit the bigger one.
            world.makeObject(1, {
                x: 2.50,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                shape: gb2d.shapes.CIRCLE,
                radius: .30,
                mass: 1,
                damping: 0.1
            });

            world.makeObject(2, {
                x: 7.50,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                shape: gb2d.shapes.CIRCLE,
                radius: .60,
                mass: 2,
                damping: 0.02
            });
        },

        onTick: (world, dt)=>{

            let obj1 = world.objectsById[1];
            let obj2 = world.objectsById[2];

            let oldTimer = impulseTimer;
            impulseTimer += dt * 5;

            let t1 = Math.floor(oldTimer) ;
            let t2 = Math.floor(impulseTimer);
            if(t1 != t2 && t2 % 2 == 0){
                let impulse = (5.00 - obj1.y) * .20;
                if(impulse < .050 && impulse > -.050) impulse = 2.000;

                obj1.applyImpulse(0, impulse);
                obj2.applyImpulse(0, impulse);
            }
            
        }
    }),

    new Example({ // Gravity
        name: "Gravity",
        key: "gravity",
        description: "Gravity is a 2D acceleration vector that can be set on World objects. Gravity is automatically applied as a force to all objects in the world.\n\nOne of the cool things about this example in particular is that you can also see the influence of damping on the net force.",
        globalLines: ["let nextId = 1;"],
        onInit: (world)=>{
            // Mind you that while we like to think of things in terms of SI units, the scale is arbitrary.
            // In this case, the canvas is 1000x1000 units. So it won't be very exciting to just apply a 10 m/s^2 gravity.
            world.setGravity(0, 10);

            // Objects will be created in the tick function.
        },
        onTick: (world, dt)=>{
            if(Math.random() < 0.05){
                let m = .1 + Math.random() * .4;
                world.makeObject(nextId++, {
                    x: 0,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: 1.00 + Math.random() * 5.00,
                    vy: -8.00 - Math.random() * 8.00,
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.SENSOR,
                    radius: .2 + m * .2,

                    // Remember, gravity is an acceleration vector. So it affects all masses equally. 
                    // This mass was selected to make the force vectors look good for the demo.
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

    new Example({ // Bounce
        name: "Bounce",
        key: "bounce",
        description: "",
        onInit: (world)=>{
            // Gravity
            world.setGravity(0, 10);

            // Walls
            world.makeObject(1, {
                x: 5,
                y: 0,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 11,
                height: 2,
                
            });
            world.makeObject(2, {
                x: 5,
                y: 10,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 11,
                height: 2,
            });
            world.makeObject(3, {
                x: 0,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 2,
                height: 11,
            });
            world.makeObject(4, {
                x: 10,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 2,
                height: 11,
            });

            // Bouncy Ball
            world.makeObject(5, {
                x: 5,
                y: 2,
                vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5), 
                r: Math.PI / 2 * Math.random(),
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                radius: .75,
                mass: 0.5,
                linearDamping: 0.0,
                rs: -2 + Math.random() * 4,

                // The most important part. 100% bouncy.
                restitution: 1,
            });
        },
        onTick: (world, dt)=>{
            // The engine does all the work. Nothing to do here!
        },
    }),
    
    new Example({ // Collisions
        name: "Collisions",
        key: "collisions",
        description: [
            "Collisions are enabled for objects whose type is set to RIGID_BODY. In this example we can see collisions between all of the different supported shape types.",
        ].join("\n\n"),
        globalLines: ["let nextId = 1;"],
        onInit: (world)=>{
            world.setGravity(0, 10);

            // Objects will be created in the tick function.
        },
        // Once collisions are a bit more stable, the number of colliding objects can be doubled.
        onTick: (world, dt)=>{
            if(Math.random() < 0.08){
                let m = .1 + Math.random() * .4;
                let dir = 1;
                if(Math.random() < 0.5) dir = -1;

                let r = .2 + m*m * .8;
                let h = 0.1 + Math.random() * (r - 0.1);
                let w = r * r / h;
                
                let shapeType = Math.random();
                let shape;
                let mass = m;

                if (shapeType < 0.1) {
                    shape = gb2d.shapes.POINT;
                    mass = 0.01; // Points have very small mass
                } else if (shapeType < 0.2) {
                    shape = gb2d.shapes.AABB;
                } else if (shapeType < 0.6) {
                    shape = gb2d.shapes.BOX;
                } else {
                    shape = gb2d.shapes.CIRCLE;
                }

                world.makeObject(nextId++, {
                    x: 5.00 - dir * 5.00,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * dir,
                    vy: -8.00 - Math.random() * 2.00,
                    shape: shape,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    radius: (shape === gb2d.shapes.BOX || shape === gb2d.shapes.AABB) ? w : r,
                    // width: isBox ? r * 2 : 0,
                    height: (shape === gb2d.shapes.BOX || shape === gb2d.shapes.AABB) ? h : 0,
                    mass: mass, 
                    linearDamping: 0,
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

    new Example({ // Friction
        name: "Friction",
        key: "friction",
        description: [
            "Friction is applied as the last step of collision resolution. It deals with static and dynamic friction, applied as impulses at the point of contact, given the relative tangential velocity at that point. Take note of the blue impulse vector on the platforms wich are present when dynamic friction is being applied.",
            "Line 1: A circle spinning counterclockwise angular momentum switches to clockwise due to friction, then continues to roll.",
            "Line 2: A spinning circle with no linear momentum transfers momentum from angular to lienar due to friciton, then continues to roll.",
            "Line 3: A box slides across the platform and grinds to a halt due to friction.",
            "Line 4: Two boxes slide down a ramp. The left box has a high static friction, and eventually stops. The right box has no static friction and continues to slide as dynamic friction and gravitational forces dominate.",
        ].join("\n\n"),
        onInit: (world)=>{

            world.setGravity(0, 10);

            let id = 1;
            const platformSummaries = [
                "Linear to angular momentum transfer.",
                "Angular to linear momentum transfer.",
                "Slide to halt."
            ];
            // Platforms.
            for(; id <= 3; id++){
                world.makeObject(id, {
                    x: 4.5,
                    y: 2.5 * id - 0.5,
                    shape: gb2d.shapes.AABB,
                    type: gb2d.bodyTypes.FIXED_OBJECT,
                    width: 9.0,
                    height: 1,
                    mass: 1,
                });

                gb2d.debug.addLabel({
                    text: platformSummaries[id - 1],
                    x: 4.5,
                    y: 2.5 * id - 1.2,
                    fontSize: '20px Arial',
                    color: 'blue',
                    position: 'above'
                });
            }

            // One more (tilted) platform for static friction.
            const tiltedPlatformId = id++;
            world.makeObject(tiltedPlatformId, {
                x: 4.5,
                y: 9.7,
                r: 0.1,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: 9.0,
                height: 1,
                    mass: 1,
            });

            gb2d.debug.addLabel({
                text: "High static vs no static friction.",
                x: 4.5,
                y: 9.0,
                fontSize: '20px Arial',
                color: 'blue',
                position: 'above'
            });

            // Linear to angular rolling object.
            const rollingObj1Id = id++;
            world.makeObject(rollingObj1Id, {
                x: 0,
                y: 1.0,
                vx: 5,
                rs: -8,
                kFriction: 0.8,
                sFriction: 0.5,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 0.5
            });

            gb2d.debug.addLabel({
                text: "Reverse",
                objectId: rollingObj1Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Angular to linear rolling object.
            const rollingObj2Id = id++;
            world.makeObject(rollingObj2Id, {
                x: 0.5,
                y: 3.5,
                rs: 15,
                kFriction: 0.2,
                sFriction: 0.5,
                shape: gb2d.shapes.CIRCLE,
                type: gb2d.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 0.5
            });

            gb2d.debug.addLabel({
                text: "Forward",
                objectId: rollingObj2Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box slows down.
            const slidingBoxId = id++;
            world.makeObject(slidingBoxId, {
                x: 0.5,
                y: 6,
                vx: 7,
                kFriction: 1.2,
                sFriction: 0.5,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.5
            });

            gb2d.debug.addLabel({
                text: "Slide",
                objectId: slidingBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box stops due to static friction.
            const staticBoxId = id++;
            world.makeObject(staticBoxId, {
                x: 0.5,
                y: 8.0,
                vx: 0.5,
                kFriction: 0.7,
                sFriction: 0.7,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: .5,
                mass: 0.5
            });

            gb2d.debug.addLabel({
                text: "Static",
                objectId: staticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Another sliding box but with no static friction.
            const kineticBoxId = id++;
            world.makeObject(kineticBoxId, {
                x: 1.6,
                y: 8.0,
                vx: 0.5,
                kFriction: 0.01,
                sFriction: 0.0,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.RIGID_BODY,
                width: 1,
                height: .5,
                mass: 0.5
            });

            gb2d.debug.addLabel({
                text: "Kinetic",
                objectId: kineticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });
        },
        onTick: (world, dt)=>{

        }
    }),

    new Example({ // Collision Masks
        name: "Collision Masks",
        key: "collision-masks",
        description: [
            "Collision masks allow you to selectively enable or disable collisions between different groups of objects.",
            "In this example, there are three types of objects and three platforms:",
            "1. Blue objects only collide with blue platforms and each other.",
            "2. Red objects only collide with red platforms and each other.",
            "3. Green objects collide with everything (including each other).",
            "Bitmasks are used to implement this logic: Blue (Category 1), Red (Category 2), Green (Category 4). Platforms are configured to collide with their respective categories."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);
            gb2d.debug.showForceVectors = false;
            
            // Platform Categories: 0x1 (Blue), 0x2 (Red), 0x4 (Green)
            
            // Blue Platform (Collides with category 1 and 4)
            const bluePlatId = nextId++;
            world.makeObject(bluePlatId, {
                x: 2.5, y: 8,
                width: 4, height: 0.5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x1,
                maskBits: 0x1 | 0x4,
                color: 'blue'
            });
            gb2d.debug.addLabel({ text: "Collides with Blue & Green", objectId: bluePlatId, color: 'blue', position: 'below' });

            // Red Platform (Collides with category 2 and 4)
            const redPlatId = nextId++;
            world.makeObject(redPlatId, {
                x: 7.5, y: 8,
                width: 4, height: 0.5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x2,
                maskBits: 0x2 | 0x4,
                color: 'red'
            });
            gb2d.debug.addLabel({ text: "Collides with Red & Green", objectId: redPlatId, color: 'red', position: 'below' });

            // Universal Platform (Collides with everything: 0x1 | 0x2 | 0x4)
            const universalPlatId = nextId++;
            world.makeObject(universalPlatId, {
                x: 5, y: 4,
                width: 2, height: 0.5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x4,
                maskBits: 0x7, // 1 | 2 | 4
                color: 'green'
            });
            gb2d.debug.addLabel({ text: "Collides with All", objectId: universalPlatId, color: 'green', position: 'below' });
        },
        onTick: (world, dt)=>{
            if(Math.random() < 0.05){
                const id = nextId++;
                const type = Math.floor(Math.random() * 3);
                let color, cat, mask;
                
                if(type === 0) { // Blue
                    color = 'blue'; cat = 0x1; mask = 0x1 | 0x4;
                } else if(type === 1) { // Red
                    color = 'red'; cat = 0x2; mask = 0x2 | 0x4;
                } else { // Green
                    color = 'green'; cat = 0x4; mask = 0x7;
                }

                const obj = world.makeObject(id, {
                    x: 2 + Math.random() * 6,
                    y: 0,
                    radius: 0.3,
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    mass: 1,
                    categoryBits: cat,
                    maskBits: mask,
                    color: color
                });
                
                gb2d.debug.addLabel({
                    text: `Cat:0x${cat.toString(16)} Mask:0x${mask.toString(16)}`,
                    objectId: id,
                    color: color,
                    position: 'above',
                    fontSize: '10px Arial'
                });
            }

            // Cleanup
            let toRemove = [];
            world.iterateObjects(o=>{
                if(o.y > 11) toRemove.push(o);
            });
            for(let o of toRemove) world.removeObject(o.id);
        }
    }),
];