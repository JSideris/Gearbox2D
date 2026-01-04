import Example from './example.js';
import gb2d from '../dist/js/gb2d.js';

export const loadTestExamples = [
    new Example({
        name: "Circles",
        // name: "Particles",
        key: "particles",
        description: "A load test featuring 2,000 circles. Note that the major bottleneck is canvas graphics.",
        // description: "A load test featuring 1,000 particles. Particles don't collide, but are inserted into the BVH. AABBs are hidden to prevent graphics from becomming a bottleneck.",
        onInit: (world)=>{

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeObject(id++, {
                x: 5,
                y: 0,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
                
            });
            world.makeObject(id++, {
                x: 5,
                y: 10,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 0,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 10,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });

            for(let i = 0; i < 2000; i++){

                world.makeObject(id++, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 1.00 - .50,
                    vy: Math.random() * 1.00 - .50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 20.00,
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    radius: .05,
                    mass: 0.5,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                    restitution: 0.5,
                });
            }
        },
        onTick: (world, dt)=>{
        }
    }),
    new Example({
        name: "Fleas",
        key: "fleas",
        description: "2000 bouncy points. Point objects don't collide with each other.",
        onInit: (world)=>{
            const nFleas = 2000;

            world.setGravity(0, 10);

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeObject(id++, {
                x: 5,
                y: 0,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
                
            });
            world.makeObject(id++, {
                x: 5,
                y: 10,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 0,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 10,
                y: 5,
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });

            for(let i = 0; i < nFleas; i++){

                world.makeObject(id++, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 10.00 - 5.0,
                    // vy: Math.random() * 1.00 - .50,
                    r: Math.PI / 2 * Math.random(),
                    shape: gb2d.shapes.POINT,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    radius: .05,
                    mass: 2,
                    linearDamping: 0.0,
                    angularDamping: 0.5,

                    restitution: 0.99,
                });
            }
        },
        onTick: (world, dt)=>{
        }
    }),
];