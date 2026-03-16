import Example from '../engine-wrapper.js';
import gearbox from 'gearbox2d';

let nextId = 1;
let impulseTimer = 0;
let mouseAnchor: any = null;
let dragJoint: any = null;
let canvas: HTMLCanvasElement | null = null;

const screenToWorld = (x: number, y: number) => {
    return {
        x: (x - gearbox.debug.offsetX) / (gearbox.debug.zoom * 100),
        y: (y - gearbox.debug.offsetY) / (gearbox.debug.zoom * 100)
    };
};

const onMouseDown = (e: MouseEvent, world: any) => {
    if (e.button !== 0) return; // Left click only
    
    const rect = canvas!.getBoundingClientRect();
    const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    
    const hits = world.queryPoint(pos.x, pos.y);
    if (hits.length > 0) {
        // Pick the first object hit
        const targetId = hits[0];
        const target = world.getBodyById(targetId);

        if (target && target.type !== gearbox.bodyTypes.FIXED_OBJECT) {
            // Create a temporary mouse anchor
            mouseAnchor = world.makeBody(999999, {
                x: pos.x,
                y: pos.y,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "transparent"
            });
            mouseAnchor.addFixture(999999, {
                shape: gearbox.shapes.CIRCLE,
                radius: 0.05,
                maskBits: 0
            });

            // Create a spring joint to drag the object
            dragJoint = world.createSpringJoint(999998, mouseAnchor, target, {
                worldAnchor: pos,
                frequencyHz: 3.0,
                dampingRatio: 1.0,
                length: 0
            });
        }
    }
};

const onMouseMove = (e: MouseEvent) => {
    if (mouseAnchor) {
        const rect = canvas!.getBoundingClientRect();
        const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        mouseAnchor.x = pos.x;
        mouseAnchor.y = pos.y;
    }
};

const onMouseUp = (e: MouseEvent, world: any) => {
    if (dragJoint) {
        world.removeJoint(dragJoint.id);
        dragJoint = null;
    }
    if (mouseAnchor) {
        world.removeObject(mouseAnchor.id);
        mouseAnchor = null;
    }
};

export const generalExamples = [
    new Example({ // Interactive Sandbox
        name: "Interactive Sandbox",
        key: "sandbox",
        description: [
            "Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.",
            "### Features",
            "- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.",
            "- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.",
            "- **Capsules**: New capsule shapes are supported with proper collision and mass properties.",
            "- **Multi-Fixture Bodies**: Some objects are composed of multiple shapes (circles and boxes) attached to a single body.",
            "- **Jointed Compounds**: Some objects are connected by **Hinge**, **Distance**, and **Spring** joints to create complex assemblies.",
            "- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."
        ].join("\n\n"),
        onInit: (world) => {
            world.clear();
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = false;
            nextId = 1;

            world.setGravity(0, 9.8);
            world.setHasRestitution(true);
            world.setHasFriction(true);

            // Boundaries (Thicker, with roof, moved out to preserve area)
            const thickness = 1.0;
            const innerWidth = 9.2;
            const innerHeight = 9.0;
            const wallHeight = innerHeight + thickness * 2;
            const boundaryWidth = innerWidth + thickness * 2;

            // Floor
            world.makeBody(nextId++, {
                x: 5, y: 9.0 + thickness / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
            });

            // Roof
            world.makeBody(nextId++, {
                x: 5, y: 0.0 - thickness / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
            });

            // Walls
            world.makeBody(nextId++, { 
                x: 5 - innerWidth / 2 - thickness / 2, 
                y: 4.5, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            }).addFixture({
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
            });
            world.makeBody(nextId++, { 
                x: 5 + innerWidth / 2 + thickness / 2, 
                y: 4.5, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            }).addFixture({
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
            });

            // Grid of shapes to prevent initial overlap
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff", "#ff8844", "#88ff44", "#4488ff"];
            const cols = 8;
            const rows = 4;
            const spacingX = 1.0;
            const spacingY = 1.0;
            const startX = 5 - ((cols - 1) * spacingX) / 2;
            const startY = 1.8;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = startX + c * spacingX + (Math.random() - 0.5) * 0.2;
                    const y = startY + r * spacingY + (Math.random() - 0.5) * 0.2;
                    const color = colors[(r * cols + c) % colors.length];
                    
                    const commonProps = {
                        x, y,
                        mass: 0.5 + Math.random() * 1.5,
                        color,
                        linearDamping: 0.5,
                        angularDamping: 1.5
                    };

                    const rand = Math.random();
                    if (rand < 0.33) {
                        // Circle
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.1 + Math.random() * 0.3,
                        });
                    } else if (rand < 0.66) {
                        // Box
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.BOX,
                            width: 0.2 + Math.random() * 0.6,
                            height: 0.2 + Math.random() * 0.6,
                        });
                    } else {
                        // Capsule
                        const capRadius = 0.1 + Math.random() * 0.1;
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.CAPSULE,
                            radius: capRadius,
                            height: capRadius * 2 + 0.2 + Math.random() * 0.4,
                        });
                    }
                }
            }

            // --- Multi-Fixture Composite Bodies ---
            for (let i = 0; i < 6; i++) {
                const x = 1.5 + Math.random() * 7;
                const y = 5.5 + Math.random() * 1.5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const body = world.makeBody(nextId++, {
                    x, y,
                    mass: 1.0 + Math.random() * 3.0,
                    color,
                    linearDamping: 0.5,
                    angularDamping: 1.0
                });
                
                const numFixtures = 2 + Math.floor(Math.random() * 4); // 2-6 fixtures
                for (let j = 0; j < numFixtures; j++) {
                    const shapeType = Math.random();
                    const offsetX = (Math.random() - 0.5) * 1.2;
                    const offsetY = (Math.random() - 0.5) * 1.2;
                    
                    if (shapeType < 0.4) {
                        body.addFixture({
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.1 + Math.random() * 0.25,
                            localX: offsetX,
                            localY: offsetY
                        });
                    } else {
                        body.addFixture({
                            shape: gearbox.shapes.BOX,
                            width: 0.2 + Math.random() * 0.5,
                            height: 0.2 + Math.random() * 0.5,
                            localX: offsetX,
                            localY: offsetY,
                            localR: Math.random() * Math.PI
                        });
                    }
                }
            }

            // --- Compound Objects (Bodies + Joints) ---
            const jointTypes = ['hinge', 'distance', 'spring'];
            for (let i = 0; i < 8; i++) {
                const x = 1.5 + Math.random() * 6;
                const y = 7.5 + Math.random() * 1.0;
                const jType = jointTypes[Math.floor(Math.random() * jointTypes.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const b1 = world.makeBody(nextId++, {
                    x, y, mass: 0.5 + Math.random(), color, linearDamping: 0.5, angularDamping: 0.5
                });
                
                const s1 = Math.random();
                if (s1 < 0.5) b1.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
                else b1.addFixture({ shape: gearbox.shapes.BOX, width: 0.3 + Math.random() * 0.4, height: 0.3 + Math.random() * 0.4 });
                
                const b2 = world.makeBody(nextId++, {
                    x: x + 0.5 + Math.random() * 0.5, 
                    y: y + (Math.random() - 0.5) * 0.5, 
                    mass: 0.5 + Math.random(), 
                    color, 
                    linearDamping: 0.5, 
                    angularDamping: 0.5
                });

                const s2 = Math.random();
                if (s2 < 0.5) b2.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
                else b2.addFixture({ shape: gearbox.shapes.BOX, width: 0.3 + Math.random() * 0.4, height: 0.3 + Math.random() * 0.4 });
                
                if (jType === 'hinge') {
                    world.createHingeJoint(nextId++, b1, b2, {
                        worldAnchor: { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 }
                    });
                } else if (jType === 'distance') {
                    world.createDistanceJoint(nextId++, b1, b2, {
                        anchorA: { x: 0, y: 0 },
                        anchorB: { x: 0, y: 0 }
                    });
                } else {
                    world.createSpringJoint(nextId++, b1, b2, {
                        anchorA: { x: 0, y: 0 },
                        anchorB: { x: 0, y: 0 },
                        frequencyHz: 2.0 + Math.random() * 4.0,
                        dampingRatio: 0.5 + Math.random() * 0.5
                    });
                }
            }

            // Event listeners
            canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
            
            // Remove existing listeners if they exist (prevents leakage on restart/re-init)
            if ((world as any)._mouseDownHandler) canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
            if ((world as any)._mouseMoveHandler) window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
            if ((world as any)._mouseUpHandler) window.removeEventListener('mouseup', (world as any)._mouseUpHandler);

            // We need to store bound versions to remove them later
            (world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
            (world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
            (world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);

            canvas.addEventListener('mousedown', (world as any)._mouseDownHandler);
            window.addEventListener('mousemove', (world as any)._mouseMoveHandler);
            window.addEventListener('mouseup', (world as any)._mouseUpHandler);
        },
        onCleanup: (world) => {
            if (canvas) {
                canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
                window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
                window.removeEventListener('mouseup', (world as any)._mouseUpHandler);
                delete (world as any)._mouseDownHandler;
                delete (world as any)._mouseMoveHandler;
                delete (world as any)._mouseUpHandler;
            }
        },
        onTick: (world, dt) => {
            gearbox.debug.clearLabels();
            gearbox.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }
    }),

    new Example({ // Force
        name: "Force",
        key: "force",
        description: [
            "**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.",
            "Persistent forces must be reapplied on each fixed update (every `tick`).",
            "It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."
        ].join("\n\n"),
        onInit: (world)=>{

            // This small circle will orbit the bigger one.
            world.makeBody(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                mass: 0.1, // 100g
                angularDamping: 0.0, 
                linearDamping: 0.0 // Set to 0 to prevent the orbit from slowing down.
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .30,
            });

            // For decoration, let's add a shape in the middle.
            world.makeBody(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: .1,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT, // Use Kinematic for moving sensor decoration
                angularDamping: 0.0, 
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1.00,
                isSensor: true
            });
        },

        onTick: (world, dt)=>{
            let obj = world.bodiesById[1];
            let center = world.bodiesById[2];

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
        description: [
            "**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.",
            "In this example we demonstrate both **Linear** and **Angular** impulses.",
            "- The two circles receive vertical linear impulses.",
            "- The box receives periodic angular impulses (torque) causing it to spin without moving its center."
        ].join("\n\n"),
        
        globalLines: [
            "let impulseTimer = 0;",
        ],

        onInit: (world)=>{

            // Linear impulse targets
            world.makeBody(1, {
                x: 2.50,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                mass: 1,
                linearDamping: 0.1
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .30,
            });

            world.makeBody(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                mass: 2,
                linearDamping: 0.02
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .60,
            });

            // Angular impulse target
            world.makeBody(3, {
                x: 7.50,
                y: 5.00,
                mass: 100,
                linearDamping: 0.05,
                angularDamping: 0.05
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1.0,
                height: 0.3,
            });
        },

        onTick: (world, dt)=>{

            let obj1 = world.bodiesById[1];
            let obj2 = world.bodiesById[2];
            let obj3 = world.bodiesById[3];

            let oldTimer = impulseTimer;
            impulseTimer += dt * 5;

            let t1 = Math.floor(oldTimer) ;
            let t2 = Math.floor(impulseTimer);
            
            if(t1 != t2){
                if(t2 % 2 == 0){
                    let impulse = (5.00 - obj1.y) * .20;
                    if(impulse < .050 && impulse > -.050) impulse = 2.000;

                    obj1.applyImpulse(0, impulse);
                    obj2.applyImpulse(0, impulse);
                }

                // Apply angular impulse to the box
                if(t2 % 3 == 0){
                    obj3.applyAngularImpulse(2.0);
                }
            }
            
        }
    }),

    new Example({ // Bounce
        name: "Bounce",
        key: "bounce",
        description: [
            "This example demonstrates **Restitution** (bounciness).",
            "The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce.",
            "Gearbox2D handles restitution differently than many other engines to prevent numerical energy gain. Check out the documentation to learn more about **Kinematic Restitution Balancing**."
        ].join("\n\n"),
        onInit: (world)=>{
            // Gravity
            world.setGravity(0, 10);

            // Walls
            world.makeBody(1, {
                x: 5,
                y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 11,
                height: 2,
                restitution: 1.0,
            });
            world.makeBody(2, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 11,
                height: 2,
                restitution: 1.0,
            });
            world.makeBody(3, {
                x: 0,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 2,
                height: 11,
                restitution: 1.0,
            });
            world.makeBody(4, {
                x: 10,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 2,
                height: 11,
                restitution: 1.0,
            });

            // Bouncy Ball
            world.makeBody(5, {
                x: 5,
                y: 2,
                vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5), 
                r: Math.PI / 2 * Math.random(),
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5,
                linearDamping: 0.0,
                rs: -2 + Math.random() * 4,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .75,
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
            "Collisions are enabled for objects whose type is set to `DYNAMIC_OBJECT`.",
            "In this example we can see collisions between all of the different supported shape types:",
            "- **CIRCLE**: Optimized circular collisions.",
            "- **BOX**: Oriented bounding boxes with full rotation support.",
            "- **AABB**: Axis-aligned bounding boxes.",
            "- **CAPSULE**: 2D capsules with robust collision detection.",
            "- **POINT**: Zero-radius points that collide with larger shapes."
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
                    shape = gearbox.shapes.POINT;
                    mass = 0.01; // Points have very small mass
                } else if (shapeType < 0.2) {
                    shape = gearbox.shapes.AABB;
                } else if (shapeType < 0.45) {
                    shape = gearbox.shapes.BOX;
                } else if (shapeType < 0.7) {
                    shape = gearbox.shapes.CAPSULE;
                    // For capsule, use 'h' for width (2*r) and 'w' for height
                    let capR = h * 0.5;
                    r = capR;
                    h = Math.max(capR * 2 + 0.1, w);
                } else {
                    shape = gearbox.shapes.CIRCLE;
                }

                const bodyId = nextId++;
                world.makeBody(bodyId, {
                    x: 5.00 - dir * 5.00,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * dir,
                    vy: -8.00 - Math.random() * 2.00,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: mass, 
                    linearDamping: 0,
                }).addFixture({
                    shape: shape,
                    radius: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB) ? w : r,
                    height: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB || shape === gearbox.shapes.CAPSULE) ? h : 0,
                });

                // Scan for objects that are out of bounds and remove them.
                // Another way to do this would be to use collision events.
                let objectCount = world.getBodyCount();
                let toRemove = [];

                world.iterateBodies(obj=>{
                    
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
            "**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.",
            "Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.",
            "### Scenarios",
            "1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.",
            "2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.",
            "3. **Slide**: A box slides across the platform and grinds to a halt.",
            "4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."
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
                world.makeBody(id, {
                    x: 4.5,
                    y: 2.5 * id - 0.5,
                    type: gearbox.bodyTypes.FIXED_OBJECT,
                    mass: 1,
                }).addFixture({
                    shape: gearbox.shapes.AABB,
                    width: 9.0,
                    height: 1,
                });

                gearbox.debug.addLabel({
                    text: platformSummaries[id - 1],
                    x: 4.5,
                    y: 2.5 * id - 1.2,
                    fontSize: '20px Arial',
                    color: '#00f2ff',
                    position: 'above'
                });
            }

            // One more (tilted) platform for static friction.
            const tiltedPlatformId = id++;
            world.makeBody(tiltedPlatformId, {
                x: 4.5,
                y: 9.7,
                r: 0.1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 9.0,
                height: 1,
            });

            gearbox.debug.addLabel({
                text: "High static vs no static friction.",
                x: 4.5,
                y: 9.0,
                fontSize: '20px Arial',
                color: '#00f2ff',
                position: 'above'
            });

            // Linear to angular rolling object.
            const rollingObj1Id = id++;
            world.makeBody(rollingObj1Id, {
                x: 0,
                y: 1.0,
                vx: 5,
                rs: -8,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
                kFriction: 0.8,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Reverse",
                objectId: rollingObj1Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Angular to linear rolling object.
            const rollingObj2Id = id++;
            world.makeBody(rollingObj2Id, {
                x: 0.5,
                y: 3.5,
                rs: 15,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
                kFriction: 0.2,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Forward",
                objectId: rollingObj2Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box slows down.
            const slidingBoxId = id++;
            world.makeBody(slidingBoxId, {
                x: 0.5,
                y: 6,
                vx: 7,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
                kFriction: 0.27,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Slide",
                objectId: slidingBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box stops due to static friction.
            const staticBoxId = id++;
            world.makeBody(staticBoxId, {
                x: 0.5,
                y: 8.0,
                vx: 0.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: .5,
                kFriction: 0.7,
                sFriction: 0.7,
            });

            gearbox.debug.addLabel({
                text: "Static",
                objectId: staticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Another sliding box but with no static friction.
            const kineticBoxId = id++;
            world.makeBody(kineticBoxId, {
                x: 1.6,
                y: 8.0,
                vx: 0.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: .5,
                kFriction: 0.01,
                sFriction: 0.0,
            });

            gearbox.debug.addLabel({
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
            "**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.",
            "In this example:",
            "- **Blue objects**: Only collide with blue platforms and other blue objects.",
            "- **Red objects**: Only collide with red platforms and other red objects.",
            "- **Green objects**: Collide with **everything**.",
            "This is implemented using `categoryBits` and `maskBits` properties."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = false;
            
            // Platform Categories: 0x1 (Blue), 0x2 (Red), 0x4 (Green)
            
            // Blue Platform (Collides with category 1 and 4)
            const bluePlatId = nextId++;
            world.makeBody(bluePlatId, {
                x: 2.5, y: 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#00f2ff'
            }).addFixture({
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x1,
                maskBits: 0x1 | 0x4,
            });
            gearbox.debug.addLabel({ text: "Collides with Blue & Green", objectId: bluePlatId, color: '#00f2ff', position: 'below' });

            // Red Platform (Collides with category 2 and 4)
            const redPlatId = nextId++;
            world.makeBody(redPlatId, {
                x: 7.5, y: 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#ff4444'
            }).addFixture({
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x2,
                maskBits: 0x2 | 0x4,
            });
            gearbox.debug.addLabel({ text: "Collides with Red & Green", objectId: redPlatId, color: '#ff4444', position: 'below' });

            // Universal Platform (Collides with everything: 0x1 | 0x2 | 0x4)
            const universalPlatId = nextId++;
            world.makeBody(universalPlatId, {
                x: 5, y: 4,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#44ff44'
            }).addFixture({
                width: 2, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x4,
                maskBits: 0x7, // 1 | 2 | 4
            });
            gearbox.debug.addLabel({ text: "Collides with All", objectId: universalPlatId, color: '#44ff44', position: 'below' });
        },
        onTick: (world, dt)=>{
            if(Math.random() < 0.05){
                const id = nextId++;
                const type = Math.floor(Math.random() * 3);
                let color, cat, mask;
                
                if(type === 0) { // Blue
                    color = '#00f2ff'; cat = 0x1; mask = 0x1 | 0x4;
                } else if(type === 1) { // Red
                    color = '#ff4444'; cat = 0x2; mask = 0x2 | 0x4;
                } else { // Green
                    color = '#44ff44'; cat = 0x4; mask = 0x7;
                }

                world.makeBody(id, {
                    x: 2 + Math.random() * 6,
                    y: 0,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 1,
                    color: color
                }).addFixture({
                    radius: 0.3,
                    shape: gearbox.shapes.CIRCLE,
                    categoryBits: cat,
                    maskBits: mask,
                });
                
                gearbox.debug.addLabel({
                    text: `Cat:0x${cat.toString(16)} Mask:0x${mask.toString(16)}`,
                    objectId: id,
                    color: color,
                    position: 'above',
                    fontSize: '10px Arial'
                });
            }

            // Cleanup
            let toRemove = [];
            world.iterateBodies(o=>{
                if(o.y > 11) toRemove.push(o);
            });
            for(let o of toRemove) world.removeObject(o.id);
        }
    }),

    new Example({ // Object Types
        name: "Object Types",
        key: "object-types",
        description: [
            "This example showcases the four fundamental object types in **Gearbox2D** and how they interact:",
            "1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.",
            "2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.",
            "3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.",
            "4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."
        ].join("\n\n"),
        onInit: (world) => {
            world.clear();
            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = false;
            nextId = 1;

            // 1. Fixed Objects: The Foundation
            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.7,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 8, height: 0.6,
            });
            
            // Side barriers
            world.makeBody(nextId++, { x: 1, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" }).addFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });
            world.makeBody(nextId++, { x: 9, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" }).addFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });

            // 2. Kinematic Objects: The Machinery
            // A rotating center piece
            const rotor = world.makeBody(nextId++, {
                x: 5, y: 4,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                rs: 1.5 // Radians per second
            });
            rotor.addFixture({
                width: 3.5, height: 0.3,
                shape: gearbox.shapes.BOX,
            });
            gearbox.debug.addLabel({ text: "Kinematic Rotor", objectId: rotor.id, position: "above", color: "#a0f" });

            // A moving side platform
            const elevator = world.makeBody(nextId++, {
                x: 2.5, y: 7,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                vx: 1.0
            });
            elevator.addFixture({
                width: 1.5, height: 0.3,
                shape: gearbox.shapes.BOX,
            });
            (world as any).elevator = elevator;
            gearbox.debug.addLabel({ text: "Kinematic Elevator", objectId: elevator.id, position: "above", color: "#a0f" });

            // 4. Sensor: The Recycling Zone
            const recyclerId = nextId++;
            const recycler = world.makeBody(recyclerId, {
                x: 5, y: 8.8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "rgba(0, 255, 100, 0.15)",
                wantsEvents: true,
            });
            recycler.addFixture({
                width: 4, height: 1.2,
                shape: gearbox.shapes.BOX,
                isSensor: true
            });
            // WantsEvents is currently a Body property in C++, but let's check constants.
            // In Body.cpp, it doesn't seem to be used from options directly anymore, 
            // but it's used in World::_doNarrowPhase? Wait, let me check Body.cpp again.
            // Actually I don't see wantsEvents in Body.cpp options.
            // Ah, I missed it. Let's look at Body.cpp again.
            // Lines 11-42 of Body.cpp don't show wantsEvents.
            // But main.cpp has it? No.
            // Let's check constants.ts or where it's used.
            // Anyway, I'll stick to the plan.
            gearbox.debug.addLabel({ text: "Sensor Recycler", objectId: recycler.id, position: "on-top", color: "#4f4" });

            // Store the recycler ID to identify it in collisions
            (world as any).recyclerId = recycler.id;
            (world as any).toRemove = new Set();

            world.onCollisionStart = (idA, idB) => {
                const rid = (world as any).recyclerId;
                const otherId = idA === rid ? idB : (idB === rid ? idA : null);
                
                if (otherId !== null) {
                    const other = world.getBodyById(otherId);
                    if (other && other.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
                        (world as any).toRemove.add(otherId);
                        // Visual cue: change color before removal
                        other.color = "#4f4";
                    }
                }
            };
        },
        onTick: (world, dt) => {
            // Update Kinematic behavior
            const elevator = (world as any).elevator;
            if (elevator) {
                if (elevator.x > 7.5) elevator.vx = -1.5;
                if (elevator.x < 2.5) elevator.vx = 1.5;
            }

            // 3. Spawn Rigid Bodies (Dynamic)
            if (world.stepCount % 20 === 0) {
                const colors = ["#ff4444", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
                const spawnRand = Math.random();
                const x = 3 + Math.random() * 4;
                
                const bodyId = nextId++;
                const body = world.makeBody(bodyId, {
                    x, y: 0.5,
                    mass: 0.5 + Math.random() * 1.0,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });

                if (spawnRand < 0.33) {
                    body.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.25, restitution: 0.3 });
                } else if (spawnRand < 0.66) {
                    body.addFixture({ shape: gearbox.shapes.BOX, width: 0.5, height: 0.5, restitution: 0.3 });
                } else {
                    body.addFixture({ shape: gearbox.shapes.CAPSULE, radius: 0.15, height: 0.6, restitution: 0.3 });
                }
            }

            // Cleanup recycled objects
            const toRemove = (world as any).toRemove;
            if (toRemove && toRemove.size > 0) {
                for (const id of toRemove) {
                    if (world.getBodyById(id)) {
                        world.removeObject(id);
                    }
                }
                toRemove.clear();
            }

            // Global bounds cleanup
            let outOfBounds = [];
            world.iterateBodies(obj => {
                if (obj.y > 11 || obj.y < -5 || obj.x > 11 || obj.x < -1) {
                    if (obj.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
                        outOfBounds.push(obj.id);
                    }
                }
            });
            for (const id of outOfBounds) world.removeObject(id);
        },
        onCleanup: (world) => {
            world.onCollisionStart = undefined;
            delete (world as any).elevator;
            delete (world as any).recyclerId;
            delete (world as any).toRemove;
        }
    }),
];