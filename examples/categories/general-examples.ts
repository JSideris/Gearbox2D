import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let impulseTimer = 0;
let mouseAnchor: any = null;
let dragJoint: any = null;
let canvas: HTMLCanvasElement | null = null;

const screenToWorld = (x: number, y: number) => {
    return {
        x: (x - gb2d.debug.offsetX) / (gb2d.debug.zoom * 100),
        y: (y - gb2d.debug.offsetY) / (gb2d.debug.zoom * 100)
    };
};

// Mouse Interactivity
let mouseDownStartTime = 0;
let mouseDownPos: {x: number, y: number} | null = null;
let isMouseDragging = false;

const onMouseDown = (e: MouseEvent, world: any) => {
    if (e.button !== 0) return; // Left click only
    
    const rect = canvas!.getBoundingClientRect();
    const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    
    mouseDownStartTime = performance.now();
    mouseDownPos = pos;
    isMouseDragging = false;

    if (startDragging(pos, world)) {
        isMouseDragging = true;
    }
};

const onMouseMove = (e: MouseEvent) => {
    const rect = canvas!.getBoundingClientRect();
    const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    moveDragging(pos);
};

const onMouseUp = (e: MouseEvent, world: any) => {
    if (e.button !== 0) return;

    const duration = performance.now() - mouseDownStartTime;
    if (!isMouseDragging && duration < 250 && mouseDownPos) {
        spawnBurst(mouseDownPos, world);
    }

    stopDragging(world);
    isMouseDragging = false;
};

const startDragging = (pos: {x: number, y: number}, world: any) => {
    const hits = world.queryPoint(pos.x, pos.y);
    if (hits.length > 0) {
        // Pick the first object hit
        const targetId = hits[0];
        const target = world.getObjectById(targetId);

        if (target && target.type !== gb2d.bodyTypes.FIXED_OBJECT) {
            // Create a temporary mouse anchor
            mouseAnchor = world.makeObject(999999, {
                x: pos.x,
                y: pos.y,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.05,
                color: "transparent",
                maskBits: 0
            });

            // Create a spring joint to drag the object
            dragJoint = world.createSpringJoint(999998, mouseAnchor, target, {
                worldAnchor: pos,
                frequencyHz: 3.0,
                dampingRatio: 1.0,
                length: 0
            });
            return true;
        }
    }
    return false;
};

const moveDragging = (pos: {x: number, y: number}) => {
    if (mouseAnchor) {
        mouseAnchor.x = pos.x;
        mouseAnchor.y = pos.y;
    }
};

const stopDragging = (world: any) => {
    if (dragJoint) {
        world.removeJoint(dragJoint.id);
        dragJoint = null;
    }
    if (mouseAnchor) {
        world.removeObject(mouseAnchor.id);
        mouseAnchor = null;
    }
};

const spawnBurst = (pos: {x: number, y: number}, world: any) => {
    const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
    for (let i = 0; i < 3; i++) {
        world.makeObject(nextId++, {
            x: pos.x + (Math.random() - 0.5) * 0.2,
            y: pos.y + (Math.random() - 0.5) * 0.2,
            shape: Math.random() > 0.5 ? gb2d.shapes.CIRCLE : gb2d.shapes.BOX,
            radius: 0.15,
            width: 0.3, height: 0.3,
            mass: 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            restitution: 0.6
        });
    }
};

// Touch Interactivity
let touchStartTime = 0;
let touchStartPos: {x: number, y: number} | null = null;
let isTouchDragging = false;

const onTouchStart = (e: TouchEvent, world: any) => {
    e.preventDefault();
    const rect = canvas!.getBoundingClientRect();
    const touch = e.touches[0];
    const pos = screenToWorld(touch.clientX - rect.left, touch.clientY - rect.top);
    
    touchStartTime = performance.now();
    touchStartPos = pos;
    isTouchDragging = false;
    
    if (startDragging(pos, world)) {
        isTouchDragging = true;
    }
};

const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const rect = canvas!.getBoundingClientRect();
    const touch = e.touches[0];
    const pos = screenToWorld(touch.clientX - rect.left, touch.clientY - rect.top);
    moveDragging(pos);
};

const onTouchEnd = (e: TouchEvent, world: any) => {
    e.preventDefault();
    const duration = performance.now() - touchStartTime;
    
    if (!isTouchDragging && duration < 250 && touchStartPos) {
        spawnBurst(touchStartPos, world);
    }
    
    stopDragging(world);
    isTouchDragging = false;
};

export const generalExamples = [
    new Example({
        name: "Interactive Sandbox",
        key: "sandbox",
        description: [
            "Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.",
            "### Features",
            "- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.",
            "- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.",
            "- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."
        ].join("\n\n"),
        onInit: (world) => {
            world.clear();
            gb2d.debug.showAabbs = false;
            nextId = 1;

            world.setGravity(0, 9.8);
            world.setHasRestitution(true);
            world.setHasFriction(true);

            // Ground
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1.0,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });

            // Walls
            world.makeObject(nextId++, { x: 0.2, y: 5, shape: gb2d.shapes.BOX, width: 0.4, height: 10, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
            world.makeObject(nextId++, { x: 9.8, y: 5, shape: gb2d.shapes.BOX, width: 0.4, height: 10, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });

            // Pile of shapes
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
            
            for (let i = 0; i < 15; i++) {
                const x = 2 + Math.random() * 6;
                const y = 2 + Math.random() * 5;
                const color = colors[i % colors.length];
                
                const commonProps = {
                    x, y,
                    mass: 1.0,
                    color,
                    linearDamping: 0.5,
                    angularDamping: 1.5
                };

                const rand = Math.random();
                if (rand < 0.45) {
                    // Circle
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.CIRCLE,
                        radius: 0.3 + Math.random() * 0.4,
                    });
                } else if (rand < 0.9) {
                    // Box
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.BOX,
                        width: 0.5 + Math.random() * 0.8,
                        height: 0.5 + Math.random() * 0.8,
                        r: Math.random() * Math.PI,
                    });
                } else {
                    // AABB (less common)
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.AABB,
                        width: 0.5 + Math.random() * 0.8,
                        height: 0.5 + Math.random() * 0.8,
                    });
                }
            }

            // Event listeners
            canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
            
            // Remove existing listeners if they exist (prevents leakage on restart/re-init)
            if ((world as any)._mouseDownHandler) canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
            if ((world as any)._mouseMoveHandler) window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
            if ((world as any)._mouseUpHandler) window.removeEventListener('mouseup', (world as any)._mouseUpHandler);
            if ((world as any)._touchStartHandler) canvas.removeEventListener('touchstart', (world as any)._touchStartHandler);
            if ((world as any)._touchMoveHandler) canvas.removeEventListener('touchmove', (world as any)._touchMoveHandler);
            if ((world as any)._touchEndHandler) canvas.removeEventListener('touchend', (world as any)._touchEndHandler);

            // We need to store bound versions to remove them later
            (world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
            (world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
            (world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);
            (world as any)._touchStartHandler = (e: TouchEvent) => onTouchStart(e, world);
            (world as any)._touchMoveHandler = (e: TouchEvent) => onTouchMove(e);
            (world as any)._touchEndHandler = (e: TouchEvent) => onTouchEnd(e, world);

            canvas.addEventListener('mousedown', (world as any)._mouseDownHandler);
            window.addEventListener('mousemove', (world as any)._mouseMoveHandler);
            window.addEventListener('mouseup', (world as any)._mouseUpHandler);
            canvas.addEventListener('touchstart', (world as any)._touchStartHandler, { passive: false });
            canvas.addEventListener('touchmove', (world as any)._touchMoveHandler, { passive: false });
            canvas.addEventListener('touchend', (world as any)._touchEndHandler, { passive: false });
        },
        onCleanup: (world) => {
            if (canvas) {
                canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
                window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
                window.removeEventListener('mouseup', (world as any)._mouseUpHandler);
                canvas.removeEventListener('touchstart', (world as any)._touchStartHandler);
                canvas.removeEventListener('touchmove', (world as any)._touchMoveHandler);
                canvas.removeEventListener('touchend', (world as any)._touchEndHandler);
                delete (world as any)._mouseDownHandler;
                delete (world as any)._mouseMoveHandler;
                delete (world as any)._mouseUpHandler;
                delete (world as any)._touchStartHandler;
                delete (world as any)._touchMoveHandler;
                delete (world as any)._touchEndHandler;
            }
        },
        onTick: (world, dt) => {
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gb2d.debug.addLabel({ text: "Click or tap to add shapes, drag to move!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
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
            world.makeObject(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.25,
                mass: 1.0,
                color: "#00f2ff",
            });

            world.makeObject(2, {
                x: 5.00,
                y: 5.00,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.5,
                mass: 10.0,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#a855f7",
            });

            world.setGravity(0, 0);
        },
        onTick: (world, dt)=>{
            const obj1 = world.getObjectById(1);
            const obj2 = world.getObjectById(2);

            if (obj1 && obj2) {
                // Apply a gravitational force
                const dx = obj2.x - obj1.x;
                const dy = obj2.y - obj1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                
                const forceMag = 100.0 / distSq;
                obj1.applyForce(forceMag * dx / dist, forceMag * dy / dist);

                gb2d.debug.clearLabels();
                gb2d.debug.addLabel({ text: "Orbiting with Forces", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
                gb2d.debug.addLabel({ text: `Force Magnitude: ${forceMag.toFixed(2)}`, x: 5, y: 1.5, fontSize: "16px Arial", color: "#888", position: "on-top" });
            }
        }
    }),

    new Example({ // Impulse
        name: "Impulse",
        key: "impulse",
        description: [
            "**Impulses** are used to apply an instantaneous change in velocity. Unlike forces, impulses do not depend on the time step.",
            "Impulses are perfect for events like jumping, explosions, or collisions where a sudden change in motion is required."
        ].join("\n\n"),
        onInit: (world)=>{
            world.makeObject(1, {
                x: 5.00,
                y: 8.00,
                shape: gb2d.shapes.BOX,
                width: 1, height: 1,
                mass: 1.0,
                color: "#00f2ff",
            });

            world.makeObject(2, {
                x: 5.00,
                y: 9.50,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
            });

            world.setGravity(0, 9.8);
            impulseTimer = 0;
        },
        onTick: (world, dt)=>{
            const obj = world.getObjectById(1);
            if (obj) {
                impulseTimer += dt;
                if (impulseTimer > 2.0) {
                    obj.applyImpulse(0, -10);
                    impulseTimer = 0;
                }

                gb2d.debug.clearLabels();
                gb2d.debug.addLabel({ text: "Instantaneous Impulses", x: 5, y: 2, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
                gb2d.debug.addLabel({ text: "Jumping every 2 seconds!", x: 5, y: 2.5, fontSize: "16px Arial", color: "#888", position: "on-top" });
            }
        }
    }),

    new Example({ // Restitution
        name: "Restitution (Bounciness)",
        key: "restitution",
        description: [
            "**Restitution** determines how 'bouncy' an object is. A restitution of `0` means no bounce (inelastic), while `1` means a perfectly elastic collision.",
            "The final bounciness of a collision is the maximum restitution of the two colliding objects."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 9.8);
            world.setHasRestitution(true);

            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.5,
                    y: 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.4,
                    mass: 1.0,
                    restitution: i * 0.25,
                    color: `hsl(${i * 60}, 70%, 60%)`,
                });
            }

            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
            });
        },
        onTick: (world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Varying Restitution", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
            for (let i = 0; i < 5; i++) {
                gb2d.debug.addLabel({ text: (i * 0.25).toFixed(2), x: 2 + i * 1.5, y: 8.5, fontSize: "14px Arial", color: "#888", position: "on-top" });
            }
        }
    }),

    new Example({ // Friction
        name: "Friction",
        key: "friction",
        description: [
            "**Friction** resists relative lateral motion between two surfaces in contact. A friction of `0` is perfectly slippery, while higher values provide more grip.",
            "In Gearbox2D, friction is applied as an impulse based on the normal force and the friction coefficient."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 9.8);
            world.setHasFriction(true);

            // Inclined plane
            world.makeObject(nextId++, {
                x: 5, y: 6,
                width: 8, height: 0.4,
                r: 0.3,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
                friction: 0.5
            });

            // Boxes with different friction
            for (let i = 0; i < 3; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.0,
                    y: 3 - i * 0.5,
                    width: 0.6, height: 0.6,
                    shape: gb2d.shapes.BOX,
                    mass: 1.0,
                    friction: i * 0.4,
                    color: `hsl(${i * 120}, 70%, 60%)`,
                    r: 0.3
                });
            }
        },
        onTick: (world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Friction on Inclined Plane", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }
    }),

    new Example({ // Damping
        name: "Damping (Air Resistance)",
        key: "damping",
        description: [
            "**Damping** simulates air resistance or fluid drag by gradually reducing an object's velocity over time.",
            "- **Linear Damping**: Reduces linear velocity.",
            "- **Angular Damping**: Reduces rotational velocity."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 0);

            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.5,
                    y: 5,
                    vx: 10,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.4,
                    mass: 1.0,
                    linearDamping: i * 0.5,
                    color: `hsl(${i * 60}, 70%, 60%)`,
                });
            }
        },
        onTick: (world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Linear Damping", x: 5, y: 2, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
            for (let i = 0; i < 5; i++) {
                gb2d.debug.addLabel({ text: (i * 0.5).toFixed(1), x: 2 + i * 1.5, y: 6, fontSize: "14px Arial", color: "#888", position: "on-top" });
            }

            // Reset positions if they go off screen
            world.iterateObjects(obj => {
                if (obj.x > 10) obj.x = 0;
            });
        }
    }),

    new Example({ // Collision Masking
        name: "Collision Filtering",
        key: "filtering",
        description: [
            "Collision filtering allows you to control which objects collide with each other using **Category Bits** and **Mask Bits**.",
            "An object will collide with another if `(objA.categoryBits & objB.maskBits) !== 0` AND `(objB.categoryBits & objA.maskBits) !== 0`."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 9.8);
            
            const CAT_RED = 0x0001;
            const CAT_BLUE = 0x0002;
            const CAT_GROUND = 0x0004;

            // Red objects only collide with red and ground
            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 2,
                    y: 2 + Math.random() * 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.3,
                    categoryBits: CAT_RED,
                    maskBits: CAT_RED | CAT_GROUND,
                    color: "#ff4444"
                });
            }

            // Blue objects only collide with blue and ground
            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 5 + Math.random() * 2,
                    y: 2 + Math.random() * 2,
                    shape: gb2d.shapes.BOX,
                    width: 0.6, height: 0.6,
                    categoryBits: CAT_BLUE,
                    maskBits: CAT_BLUE | CAT_GROUND,
                    color: "#4444ff"
                });
            }

            // Ground collides with everything
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                categoryBits: CAT_GROUND,
                maskBits: 0xFFFF,
                color: "#444"
            });
        },
        onTick: (world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Red and Blue never touch!", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }
    }),

    new Example({ // Kinematic Bodies
        name: "Kinematic vs Fixed vs Dynamic",
        key: "body-types",
        description: [
            "Gearbox2D supports three body types:",
            "- **Fixed**: Zero mass, infinite inertia. Does not move. (e.g., Ground)",
            "- **Kinematic**: Moves according to velocity but is not affected by forces or collisions. (e.g., Moving platforms)",
            "- **Dynamic**: Fully simulated physics object."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 9.8);

            // Kinematic platform
            world.makeObject(1, {
                x: 5, y: 7,
                width: 4, height: 0.5,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.KINEMATIC_OBJECT,
                color: "#ffff44",
                vx: 2
            });

            // Dynamic objects
            for (let i = 0; i < 10; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 4,
                    y: 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.3,
                    mass: 1.0,
                    color: "#00f2ff"
                });
            }

            // Ground
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });
        },
        onTick: (world, dt)=>{
            const platform = world.getObjectById(1);
            if (platform) {
                if (platform.x > 8) platform.vx = -2;
                if (platform.x < 2) platform.vx = 2;
            }

            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Kinematic Platform", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }
    }),

    new Example({ // Performance: Many Objects
        name: "Performance: 500+ Objects",
        key: "perf-many",
        description: [
            "Gearbox2D is optimized for high object counts using a **Dynamic BVH** (Bounding Volume Hierarchy) for broad-phase collisions.",
            "This allows the engine to skip checks between objects that are far apart, maintaining 60 FPS even with hundreds of active bodies."
        ].join("\n\n"),
        onInit: (world)=>{
            world.setGravity(0, 9.8);
            world.setHasRestitution(true);

            // Funnel
            world.makeObject(nextId++, { x: 2, y: 5, width: 5, height: 0.2, r: 0.8, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
            world.makeObject(nextId++, { x: 8, y: 5, width: 5, height: 0.2, r: -0.8, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });

            // Ground
            world.makeObject(nextId++, { x: 5, y: 9.5, width: 10, height: 1, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
        },
        onTick: (world, dt)=>{
            if (world.objectCount < 500 && Math.random() > 0.5) {
                world.makeObject(nextId++, {
                    x: 4.5 + Math.random(),
                    y: 0,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.1,
                    mass: 1.0,
                    restitution: 0.5,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`
                });
            }

            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: `Objects: ${world.objectCount}`, x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });

            // Remove objects that fall off
            let toRemove = [];
            world.iterateObjects(obj => {
                if (obj.y > 10 && obj.type !== gb2d.bodyTypes.FIXED_OBJECT) toRemove.push(obj.id);
            });
            toRemove.forEach(id => world.removeObject(id));
        }
    }),

    new Example({ // Advanced: Object Recycling
        name: "Advanced: Object Recycling",
        key: "recycling",
        description: [
            "In high-performance simulations, creating and destroying objects frequently can cause GC (Garbage Collection) pressure.",
            "This example demonstrates a pattern for **object recycling**, where off-screen objects are repositioned and reused instead of being deleted."
        ].join("\n\n"),
        onInit: (world) => {
            world.setGravity(0, 9.8);
            (world as any).toRemove = new Set();
            
            // Elevator platform
            (world as any).elevator = world.makeObject(nextId++, {
                x: 5, y: 8, width: 3, height: 0.4,
                shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.KINEMATIC_OBJECT,
                color: "#ffff44", vy: -1
            });

            // Pre-spawn some objects
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
            for (let i = 0; i < 30; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 4, y: Math.random() * 5,
                    shape: gb2d.shapes.CIRCLE, radius: 0.2, mass: 1.0,
                    color: colors[i % colors.length]
                });
            }
        },
        onTick: (world, dt) => {
            const elevator = (world as any).elevator;
            if (elevator) {
                if (elevator.y < 3) elevator.vy = 1;
                if (elevator.y > 8) elevator.vy = -1;
            }

            // Spawn one every now and then
            if (world.objectCount < 60 && Math.random() > 0.9) {
                const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
                const isCircle = Math.random() > 0.5;
                const x = 3 + Math.random() * 4;
                
                world.makeObject(nextId++, {
                    x, y: 0.5,
                    shape: isCircle ? gb2d.shapes.CIRCLE : gb2d.shapes.BOX,
                    radius: 0.25,
                    width: 0.5, height: 0.5,
                    mass: 0.5 + Math.random() * 1.0,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    restitution: 0.3
                });
            }

            // Cleanup recycled objects
            const toRemove = (world as any).toRemove;
            if (toRemove && toRemove.size > 0) {
                for (const id of toRemove) {
                    if (world.getObjectById(id)) {
                        world.removeObject(id);
                    }
                }
                toRemove.clear();
            }

            // Global bounds cleanup
            let outOfBounds = [];
            world.iterateObjects(obj => {
                if (obj.y > 11 || obj.y < -5 || obj.x > 11 || obj.x < -1) {
                    if (obj.type === gb2d.bodyTypes.RIGID_BODY) {
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
