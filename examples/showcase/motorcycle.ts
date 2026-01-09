import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let chassis = null;
let engine = null;
let frontWheel = null;
let rearWheel = null;
let terrainBoxes = [];
let keys = {};
let mouseAnchor = null;
let dragJoint = null;
let canvas = null;

const CAT_CHASSIS = 0x0001;
const CAT_WHEEL = 0x0002;
const CAT_TERRAIN = 0x0004;

const screenToWorld = (x, y) => {
    return {
        x: (x - gb2d.debug.offsetX) / (gb2d.debug.zoom * 100),
        y: (y - gb2d.debug.offsetY) / (gb2d.debug.zoom * 100)
    };
};

const onMouseDown = (e, world) => {
    if (e.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hits = world.queryPoint(pos.x, pos.y);
    if (hits.length > 0) {
        const targetId = hits[0];
        const target = world.getObjectById(targetId);
        if (target && target.type !== gb2d.bodyTypes.FIXED_OBJECT) {
            mouseAnchor = world.makeObject(999999, {
                x: pos.x, y: pos.y,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                shape: gb2d.shapes.CIRCLE, radius: 0.05,
                color: "transparent", maskBits: 0
            });
            dragJoint = world.createSpringJoint(999998, mouseAnchor, target, {
                worldAnchor: pos,
                frequencyHz: 5.0,
                dampingRatio: 1.0,
                length: 0
            });
        }
    }
};

const onMouseMove = (e) => {
    if (mouseAnchor) {
        const rect = canvas.getBoundingClientRect();
        const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        mouseAnchor.x = pos.x;
        mouseAnchor.y = pos.y;
    }
};

const onMouseUp = (e, world) => {
    if (dragJoint) {
        world.removeJoint(dragJoint.id);
        dragJoint = null;
    }
    if (mouseAnchor) {
        world.removeObject(mouseAnchor.id);
        mouseAnchor = null;
    }
};

export const motorcycleExample = new Example({
    name: "Motorcycle Trials",
    key: "motorcycle",
    description: [
        "A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.",
        "### Controls",
        "- **D / A**: Throttle / Reverse",
        "- **W / S**: Lean / Balance",
        "- **R**: Reset Simulation",
        "### Technical Features",
        "- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.",
        "- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.",
        "- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."
    ].join("\n\n"),
    onInit: (world) => {
        world.clear();
        gb2d.debug.showAabbs = false;
        nextId = 1;
        terrainBoxes = [];
        keys = {};

        const cx = 5;
        const cy = 5;
        world.setGravity(0, 9.81);
        world.setHasRestitution(true);
        world.setHasFriction(true);

        // --- 1. Motorcycle Construction ---

        // Chassis
        chassis = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gb2d.shapes.BOX,
            width: 1.2, height: 0.4,
            mass: 10.0,
            color: "#ff4444",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        chassis.angularDamping = 0.5;

        // Engine (internal spinning mass to drive wheels)
        engine = world.makeObject(nextId++, {
            x: cx, y: cy - 0.15,
            shape: gb2d.shapes.CIRCLE,
            radius: 0.25,
            mass: 5.0,
            color: "#444",
            categoryBits: 0, // No collision
            maskBits: 0
        });
        const engineHinge = world.createHingeJoint(nextId++, chassis, engine, { worldAnchor: { x: cx, y: cy - 0.15 } });

        // Rear Suspension Arm (Swingarm)
        const rearArm = world.makeObject(nextId++, {
            x: cx - 0.6, y: cy + 0.2,
            shape: gb2d.shapes.BOX,
            width: 0.6, height: 0.1,
            mass: 1.0,
            color: "#666",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        const rearArmHinge = world.createHingeJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.4, y: 0.1 },
            anchorB: { x: 0.3, y: 0 }
        });
        world.createSpringJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.6, y: -0.2 },
            anchorB: { x: -0.2, y: 0 },
            frequencyHz: 20.0,
            dampingRatio: 0.5
        });

        // Rear Wheel
        rearWheel = world.makeObject(nextId++, {
            x: cx - 0.9, y: cy + 0.2, // Aligned with arm anchor
            shape: gb2d.shapes.CIRCLE,
            radius: 0.4,
            mass: 2.0,
            color: "#333",
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        rearWheel.kineticFriction = 2.5;
        rearWheel.staticFriction = 3.0;
        const rearWheelHinge = world.createHingeJoint(nextId++, rearArm, rearWheel, {
            anchorA: { x: -0.3, y: 0 },
            anchorB: { x: 0, y: 0 }
        });

        // Drive Chain (Engine to Rear Wheel)
        world.createGearJoint(nextId++, engineHinge, rearWheelHinge, -2.0);

        // Front Suspension Arm (Forks)
        const frontArm = world.makeObject(nextId++, {
            x: cx + 0.7, y: cy + 0.2,
            shape: gb2d.shapes.BOX,
            width: 0.1, height: 0.8,
            r: 0.3,
            mass: 1.0,
            color: "#666",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        const frontArmHinge = world.createHingeJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.5, y: 0 },
            anchorB: { x: 0, y: -0.3 }
        });
        world.createSpringJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.2, y: 0.2 },
            anchorB: { x: 0, y: 0.1 },
            frequencyHz: 15.0,
            dampingRatio: 0.7
        });

        // Front Wheel
        frontWheel = world.makeObject(nextId++, {
            x: cx + 0.8, y: cy + 0.5, // Aligned with fork anchor
            shape: gb2d.shapes.CIRCLE,
            radius: 0.4,
            mass: 2.0,
            color: "#333",
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        frontWheel.kineticFriction = 2.0;
        frontWheel.staticFriction = 2.5;
        const frontWheelHinge = world.createHingeJoint(nextId++, frontArm, frontWheel, {
            anchorA: { x: 0, y: 0.4 },
            anchorB: { x: 0, y: 0 }
        });

        // --- 2. Initial Terrain ---
        const startPlatform = world.makeObject(nextId++, {
            x: cx, y: cy + 2.0,
            shape: gb2d.shapes.BOX,
            width: 20, height: 1.0,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#444",
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });
        terrainBoxes.push(startPlatform);

        // Back Hill (Steep incline to prevent backing up)
        world.makeObject(nextId++, {
            x: -7.72, y: 0.01,
            r: 1.2, // Very steep (now tilted correctly as \_)
            shape: gb2d.shapes.BOX,
            width: 15, height: 1.0,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#333",
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });

        // Input listeners
        const onKeyDown = (e) => keys[e.code] = true;
        const onKeyUp = (e) => keys[e.code] = false;

        // Mouse interaction
        canvas = document.getElementById("debug-canvas");
        const mouseDownHandler = (e) => onMouseDown(e, world);
        const mouseMoveHandler = (e) => onMouseMove(e);
        const mouseUpHandler = (e) => onMouseUp(e, world);

        // Remove existing listeners if they exist (prevents leakage on restart)
        const oldListeners = (world as any)._motorcycleListeners;
        if (oldListeners) {
            window.removeEventListener('keydown', oldListeners.onKeyDown);
            window.removeEventListener('keyup', oldListeners.onKeyUp);
            if (canvas) {
                canvas.removeEventListener('mousedown', oldListeners.mouseDownHandler);
            }
            window.removeEventListener('mousemove', oldListeners.mouseMoveHandler);
            window.removeEventListener('mouseup', oldListeners.mouseUpHandler);
        }

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        canvas.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        // Store listeners for cleanup
        (world as any)._motorcycleListeners = { 
            onKeyDown, onKeyUp, 
            mouseDownHandler, mouseMoveHandler, mouseUpHandler 
        };
    },
    onTick: (world, dt) => {
        if (!chassis) return;

        // --- 3. Controls & Engine ---
        const throttlePower = 150.0;
        const leanPower = 100.0;
        const maxEngineSpeed = 100.0; // Higher top speed

        if (keys['KeyD']) {
            if (engine.rs < maxEngineSpeed) {
                engine.applyAngularImpulse(throttlePower * dt);
            }
        }
        if (keys['KeyA']) {
            if (engine.rs > -maxEngineSpeed) {
                engine.applyAngularImpulse(-throttlePower * dt); 
            }
        }
        if (keys['KeyW']) {
            chassis.applyAngularImpulse(-leanPower * dt);
        }
        if (keys['KeyS']) {
            chassis.applyAngularImpulse(leanPower * dt);
        }
        if (keys['KeyR']) {
            motorcycleExample.init(world);
            return;
        }

        // --- 4. Camera Follow ---
        const targetX = chassis.x;
        const targetY = chassis.y;
        const canvasWidth = gb2d.debug.canvas?.width || 800;
        const canvasHeight = gb2d.debug.canvas?.height || 600;
        
        // Smoothed camera follow (accounts for zoom)
        const lerp = (a, b, t) => a + (b - a) * t;
        const zoom = gb2d.debug.zoom;
        const idealOffsetX = canvasWidth / 2 - targetX * 100 * zoom;
        const idealOffsetY = canvasHeight / 2 - targetY * 100 * zoom;
        
        gb2d.debug.offsetX = lerp(gb2d.debug.offsetX, idealOffsetX, 0.1);
        gb2d.debug.offsetY = lerp(gb2d.debug.offsetY, idealOffsetY, 0.1);

        // --- 5. Procedural Terrain ---
        const lastBox = terrainBoxes[terrainBoxes.length - 1];
        if (lastBox.x < chassis.x + 25) {
            const width = 6 + Math.random() * 8;
            const height = 1.2;
            const angle = (Math.random() - 0.5) * 0.5;
            
            // Connect middle-right of last box to middle-left of new box
            const gap = Math.random() < 0.2 ? 1.5 : 0; 
            
            // Get middle-right point of previous box in world space
            const lastMR = lastBox.localToWorld({ x: lastBox.width / 2, y: 0 });
            
            // Target position for the middle-left point of the new box
            const targetX = lastMR.x + gap;
            // Vertical variety only if there is a gap, otherwise they connect exactly
            let targetY = lastMR.y + (gap > 0 ? (Math.random() - 0.5) * 3 : 0);
            
            // Clamp targetY to keep the course playable
            targetY = Math.max(2, Math.min(8, targetY));

            // Calculate center of new box such that its middle-left (-w/2, 0) is at (targetX, targetY)
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const nextX = targetX + (width / 2) * cos;
            const nextY = targetY + (width / 2) * sin;

            const box = world.makeObject(nextId++, {
                x: nextX, y: nextY,
                r: angle,
                shape: gb2d.shapes.BOX,
                width: width, height: height,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: `hsl(${20 + Math.random() * 40}, 30%, ${30 + Math.random() * 20}%)`, // Earthy tones
                categoryBits: CAT_TERRAIN,
                maskBits: CAT_CHASSIS | CAT_WHEEL
            });
            terrainBoxes.push(box);
            
            // Limit memory/BVH by removing far away boxes (optional but good practice)
            if (terrainBoxes.length > 50) {
                const old = terrainBoxes.shift();
                world.removeObject(old.id);
            }
        }

        gb2d.debug.clearLabels();
        // Instructions pinned to world at the start
        if (chassis.x < 15) {
            gb2d.debug.addLabel({ text: "Motorcycle Trials", x: 5, y: 3, fontSize: "28px Arial", color: "#fff", position: "on-top" });
            gb2d.debug.addLabel({ text: "Use D/A to drive and W/S to balance!", x: 5, y: 3.5, fontSize: "16px Arial", color: "#aaa", position: "on-top" });
        }
    },
    onCleanup: (world) => {
        const listeners = (world as any)._motorcycleListeners;
        if (listeners) {
            window.removeEventListener('keydown', listeners.onKeyDown);
            window.removeEventListener('keyup', listeners.onKeyUp);
            if (canvas) {
                canvas.removeEventListener('mousedown', listeners.mouseDownHandler);
            }
            window.removeEventListener('mousemove', listeners.mouseMoveHandler);
            window.removeEventListener('mouseup', listeners.mouseUpHandler);
            delete (world as any)._motorcycleListeners;
        }

        if (dragJoint) {
            world.removeJoint(dragJoint.id);
            dragJoint = null;
        }
        if (mouseAnchor) {
            world.removeObject(mouseAnchor.id);
            mouseAnchor = null;
        }

        // Reset debug offset
        gb2d.debug.offsetX = 0;
        gb2d.debug.offsetY = 0;
    }
});

