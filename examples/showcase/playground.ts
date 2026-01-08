import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let mouseAnchor: any = null;
let dragJoint: any = null;
let canvas: HTMLCanvasElement | null = null;

const screenToWorld = (x: number, y: number) => {
    return {
        x: (x - gb2d.debug.offsetX) / (gb2d.debug.zoom * 100),
        y: (y - gb2d.debug.offsetY) / (gb2d.debug.zoom * 100)
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

export const playgroundExample = new Example({
    name: "Interactive Playground",
    key: "playground",
    description: [
        "A physics playground with various shapes. Click and drag objects to interact with them.",
        "Features:",
        "- Point Query: The engine detects which object is under the mouse using BVH and precise shape tests.",
        "- Mouse Joint: Uses a Spring Joint to pull objects toward the mouse cursor.",
        "- Collision Filtering: The mouse 'anchor' object is a sensor that doesn't collide with other objects."
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
            const shapeType = Math.floor(Math.random() * 3);

            const commonProps = {
                x, y,
                mass: 1.0,
                color,
                linearDamping: 0.5,
                angularDamping: 1.5
            };

            if (shapeType === 0) {
                // Circle
                world.makeObject(nextId++, {
                    ...commonProps,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.3 + Math.random() * 0.4,
                });
            } else if (shapeType === 1) {
                // Box
                world.makeObject(nextId++, {
                    ...commonProps,
                    shape: gb2d.shapes.BOX,
                    width: 0.5 + Math.random() * 0.8,
                    height: 0.5 + Math.random() * 0.8,
                    r: Math.random() * Math.PI,
                });
            } else {
                // AABB
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
        }
    },
    onTick: (world, dt) => {
        gb2d.debug.clearLabels();
        gb2d.debug.addLabel({ text: "Interactive Playground", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
        gb2d.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
    }
});

