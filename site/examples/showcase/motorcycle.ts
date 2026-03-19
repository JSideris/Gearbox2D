import Example from "../engine-wrapper.js";
import gearbox from "gearbox2d";

let nextId = 1;
let chassis = null;
let engine = null;
let frontWheel = null;
let rearWheel = null;
let frontArm = null;
let rearArm = null;
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
		x: (x - gearbox.debug.offsetX) / (gearbox.debug.zoom * 100),
		y: (y - gearbox.debug.offsetY) / (gearbox.debug.zoom * 100),
	};
};

const onMouseDown = (e, world) => {
	if (e.button !== 0) return;
	const rect = canvas.getBoundingClientRect();
	const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
	const hits = world.queryBodiesAtPoint(pos.x, pos.y);
	if (hits.length > 0) {
		const targetId = hits[0];
		const target = world.getBodyById(targetId);
		if (target && target.type !== gearbox.bodyTypes.FIXED_OBJECT) {
			mouseAnchor = world.createBody(999999, {
				x: pos.x,
				y: pos.y,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "transparent",
			});
			mouseAnchor.createFixture(999999, {
				shape: gearbox.shapes.CIRCLE,
				radius: 0.05,
				maskBits: 0,
			});
			dragJoint = world.createSpringJoint(999998, mouseAnchor, target, {
				worldAnchor: pos,
				frequencyHz: 5.0,
				dampingRatio: 1.0,
				length: 0,
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
		"- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance).",
	].join("\n\n"),
	onInit: (world) => {
		world.clear();
		gearbox.debug.showAabbs = false;
		gearbox.debug.showForceVectors = false;
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
		const chassisId = nextId++;
		chassis = world.createBody(chassisId, {
			x: cx,
			y: cy,
			mass: 10.0,
			color: "#ff4444",
		});
		chassis.createFixture(chassisId, {
			shape: gearbox.shapes.BOX,
			width: 1.2,
			height: 0.4,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		chassis.angularDamping = 1.0;

		// Engine (internal spinning mass to drive wheels)
		const engineId = nextId++;
		engine = world.createBody(engineId, {
			x: cx,
			y: cy - 0.15,
			mass: 5.0,
			color: "#444",
		});
		engine.createFixture(engineId, {
			shape: gearbox.shapes.CIRCLE,
			radius: 0.25,
			categoryBits: 0, // No collision
			maskBits: 0,
		});
		const engineHinge = world.createHingeJoint(nextId++, chassis, engine, { worldAnchor: { x: cx, y: cy - 0.15 } });

		// Rear Suspension Arm (Swingarm)
		const rearArmId = nextId++;
		rearArm = world.createBody(rearArmId, {
			x: cx - 0.6,
			y: cy + 0.2,
			mass: 1.0,
			color: "#666",
		});
		rearArm.createFixture({
			shape: gearbox.shapes.BOX,
			width: 0.6,
			height: 0.1,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		rearArm.angularDamping = 1.0;
		const rearArmHinge = world.createHingeJoint(nextId++, chassis, rearArm, {
			anchorA: { x: -0.4, y: 0.1 },
			anchorB: { x: 0.3, y: 0 },
		});
		world.createSpringJoint(nextId++, chassis, rearArm, {
			anchorA: { x: -0.7, y: -0.2 },
			anchorB: { x: -0.3, y: 0 },
			frequencyHz: 25.0,
			dampingRatio: 0.8,
		});

		// Rear Wheel
		const rearWheelId = nextId++;
		rearWheel = world.createBody(rearWheelId, {
			x: cx - 0.9,
			y: cy + 0.2, // Aligned with arm anchor
			mass: 2.0,
			color: "#333",
		});
		rearWheel.createFixture(rearWheelId, {
			shape: gearbox.shapes.CIRCLE,
			radius: 0.4,
			categoryBits: CAT_WHEEL,
			maskBits: CAT_TERRAIN,
		});
		rearWheel.fixtures[0].kineticFriction = 2.5;
		rearWheel.fixtures[0].staticFriction = 3.0;
		rearWheel.angularDamping = 0.5;
		const rearWheelHinge = world.createHingeJoint(nextId++, rearArm, rearWheel, {
			anchorA: { x: -0.3, y: 0 },
			anchorB: { x: 0, y: 0 },
		});

		// Drive Chain (Engine to Rear Wheel)
		world.createGearJoint(nextId++, engineHinge, rearWheelHinge, 2.0);

		// Front Suspension Arm (Forks)
		const frontArmId = nextId++;
		frontArm = world.createBody(frontArmId, {
			x: cx + 0.7,
			y: cy + 0.2,
			r: 0.3,
			mass: 1.0,
			color: "#666",
		});
		frontArm.createFixture({
			shape: gearbox.shapes.BOX,
			width: 0.1,
			height: 0.8,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		frontArm.angularDamping = 1.0;
		const frontArmHinge = world.createHingeJoint(nextId++, chassis, frontArm, {
			anchorA: { x: 0.5, y: 0 },
			anchorB: { x: 0, y: -0.3 },
		});
		world.createSpringJoint(nextId++, chassis, frontArm, {
			anchorA: { x: 0.2, y: 0.2 },
			anchorB: { x: 0, y: 0.3 },
			frequencyHz: 20.0,
			dampingRatio: 0.9,
		});

		// Front Wheel
		const frontWheelId = nextId++;
		frontWheel = world.createBody(frontWheelId, {
			x: cx + 0.8,
			y: cy + 0.5, // Aligned with fork anchor
			mass: 2.0,
			color: "#333",
		});
		frontWheel.createFixture(frontWheelId, {
			shape: gearbox.shapes.CIRCLE,
			radius: 0.4,
			categoryBits: CAT_WHEEL,
			maskBits: CAT_TERRAIN,
		});
		frontWheel.fixtures[0].kineticFriction = 2.0;
		frontWheel.fixtures[0].staticFriction = 2.5;
		frontWheel.angularDamping = 0.5;
		const frontWheelHinge = world.createHingeJoint(nextId++, frontArm, frontWheel, {
			anchorA: { x: 0, y: 0.4 },
			anchorB: { x: 0, y: 0 },
		});

		// --- 2. Initial Terrain ---
		const startPlatformId = nextId++;
		const startPlatform = world.createBody(startPlatformId, {
			x: cx,
			y: cy + 2.0,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#444",
		});
		startPlatform.createFixture({
			shape: gearbox.shapes.BOX,
			width: 20,
			height: 1.0,
			categoryBits: CAT_TERRAIN,
			maskBits: CAT_CHASSIS | CAT_WHEEL,
		});
		terrainBoxes.push(startPlatform);

		// Back Hill (Steep incline to prevent backing up)
		const backHillId = nextId++;
		world
			.createBody(backHillId, {
				x: -7.72,
				y: 0.01,
				r: 1.2, // Very steep (now tilted correctly as \_)
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#333",
			})
			.createFixture({
				shape: gearbox.shapes.BOX,
				width: 15,
				height: 1.0,
				categoryBits: CAT_TERRAIN,
				maskBits: CAT_CHASSIS | CAT_WHEEL,
			});

		// Input listeners
		const onKeyDown = (e) => (keys[e.code] = true);
		const onKeyUp = (e) => (keys[e.code] = false);

		// Mouse interaction
		canvas = document.getElementById("debug-canvas");
		const mouseDownHandler = (e) => onMouseDown(e, world);
		const mouseMoveHandler = (e) => onMouseMove(e);
		const mouseUpHandler = (e) => onMouseUp(e, world);

		// Remove existing listeners if they exist (prevents leakage on restart)
		const oldListeners = (world as any)._motorcycleListeners;
		if (oldListeners) {
			window.removeEventListener("keydown", oldListeners.onKeyDown);
			window.removeEventListener("keyup", oldListeners.onKeyUp);
			if (canvas) {
				canvas.removeEventListener("mousedown", oldListeners.mouseDownHandler);
			}
			window.removeEventListener("mousemove", oldListeners.mouseMoveHandler);
			window.removeEventListener("mouseup", oldListeners.mouseUpHandler);
		}

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		canvas.addEventListener("mousedown", mouseDownHandler);
		window.addEventListener("mousemove", mouseMoveHandler);
		window.addEventListener("mouseup", mouseUpHandler);

		// Store listeners for cleanup
		(world as any)._motorcycleListeners = {
			onKeyDown,
			onKeyUp,
			mouseDownHandler,
			mouseMoveHandler,
			mouseUpHandler,
		};
	},
	onTick: (world, dt) => {
		if (!chassis) return;

		// --- 3. Controls & Engine ---
		const throttlePower = 75.0;
		const leanPower = 100.0;
		const maxEngineSpeed = 100.0; // Higher top speed

		// Stability Enhancement: Hard limits for suspension travel to prevent "flipping into chassis"
		if (rearArm) {
			let relAngle = rearArm.r - chassis.r;
			while (relAngle > Math.PI) relAngle -= Math.PI * 2;
			while (relAngle < -Math.PI) relAngle += Math.PI * 2;

			const min = -0.6;
			const max = 0.6;
			if (relAngle < min) {
				rearArm.r = chassis.r + min;
				if (rearArm.rs < chassis.rs) rearArm.rs = chassis.rs;
			} else if (relAngle > max) {
				rearArm.r = chassis.r + max;
				if (rearArm.rs > chassis.rs) rearArm.rs = chassis.rs;
			}
		}

		if (frontArm) {
			let relAngle = frontArm.r - chassis.r;
			while (relAngle > Math.PI) relAngle -= Math.PI * 2;
			while (relAngle < -Math.PI) relAngle += Math.PI * 2;

			const min = -0.1;
			const max = 0.8;
			if (relAngle < min) {
				frontArm.r = chassis.r + min;
				if (frontArm.rs < chassis.rs) frontArm.rs = chassis.rs;
			} else if (relAngle > max) {
				frontArm.r = chassis.r + max;
				if (frontArm.rs > chassis.rs) frontArm.rs = chassis.rs;
			}
		}

		if (keys["KeyD"]) {
			if (engine.rs < maxEngineSpeed) {
				engine.applyAngularImpulse(-throttlePower * dt);
			}
		}
		if (keys["KeyA"]) {
			if (engine.rs > -maxEngineSpeed) {
				engine.applyAngularImpulse(throttlePower * dt);
			}
		}
		if (keys["KeyW"]) {
			chassis.applyAngularImpulse(-leanPower * dt);
		}
		if (keys["KeyS"]) {
			chassis.applyAngularImpulse(leanPower * dt);
		}
		if (keys["KeyR"]) {
			motorcycleExample.init(world);
			return;
		}

		// --- 4. Procedural Terrain ---
		const lastBox = terrainBoxes[terrainBoxes.length - 1];
		if (lastBox.x < chassis.x + 25) {
			const width = 6 + Math.random() * 8;
			const height = 1.2;
			const angle = (Math.random() - 0.5) * 0.5;

			// Connect top-right of last box to top-left of new box
			const gap = Math.random() < 0.2 ? 1.5 : 0;

			// Get top-right point of previous box in world space
			const lastTR = lastBox.localToWorld({
				x: lastBox.fixtures[0].width / 2,
				y: -lastBox.fixtures[0].height / 2,
			});

			// Target position for the top-left point of the new box
			const targetX = lastTR.x + gap;
			// Vertical variety only if there is a gap, otherwise they connect exactly
			let targetY = lastTR.y + (gap > 0 ? (Math.random() - 0.5) * 3 : 0);

			// Clamp targetY to keep the course playable
			targetY = Math.max(2, Math.min(8, targetY));

			// Calculate center of new box such that its top-left (-w/2, -h/2) is at (targetX, targetY)
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);
			const nextX = targetX + (width / 2) * cos - (height / 2) * sin;
			const nextY = targetY + (width / 2) * sin + (height / 2) * cos;

			const boxId = nextId++;
			const box = world.createBody(boxId, {
				x: nextX,
				y: nextY,
				r: angle,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: `hsl(${20 + Math.random() * 40}, 30%, ${30 + Math.random() * 20}%)`, // Earthy tones
			});
			box.createFixture({
				shape: gearbox.shapes.BOX,
				width: width,
				height: height,
				categoryBits: CAT_TERRAIN,
				maskBits: CAT_CHASSIS | CAT_WHEEL,
			});
			terrainBoxes.push(box);

			// Limit memory/BVH by removing far away boxes (optional but good practice)
			if (terrainBoxes.length > 50) {
				const old = terrainBoxes.shift();
				world.removeObject(old.id);
			}
		}

		gearbox.debug.clearLabels();
		// Instructions pinned to world at the start
		if (chassis.x < 15) {
			gearbox.debug.addLabel({
				text: "Motorcycle Trials",
				x: 5,
				y: 3,
				fontSize: "28px Arial",
				color: "#fff",
				position: "on-top",
			});
			gearbox.debug.addLabel({
				text: "Use D/A to drive and W/S to balance!",
				x: 5,
				y: 3.5,
				fontSize: "16px Arial",
				color: "#aaa",
				position: "on-top",
			});
		}
	},
	onRender: (world) => {
		if (!chassis) return;

		// Use interpolated positions for the camera to match the rendering of the bodies
		const alpha = world.interpolationAlpha;
		const targetX = chassis.x * alpha + chassis.prevX * (1 - alpha);
		const targetY = chassis.y * alpha + chassis.prevY * (1 - alpha);

		const canvasWidth = gearbox.debug.canvas?.width || 800;
		const canvasHeight = gearbox.debug.canvas?.height || 600;
		const zoom = gearbox.debug.zoom;

		const idealOffsetX = canvasWidth / 2 - targetX * 100 * zoom;
		const idealOffsetY = canvasHeight / 2 - targetY * 100 * zoom;

		// Smoothly move the camera offset.
		// Note: Using a fixed factor like 0.1 per frame is simple for a quick fix.
		gearbox.debug.offsetX += (idealOffsetX - gearbox.debug.offsetX) * 0.1;
		gearbox.debug.offsetY += (idealOffsetY - gearbox.debug.offsetY) * 0.1;
	},
	onCleanup: (world) => {
		const listeners = (world as any)._motorcycleListeners;
		if (listeners) {
			window.removeEventListener("keydown", listeners.onKeyDown);
			window.removeEventListener("keyup", listeners.onKeyUp);
			if (canvas) {
				canvas.removeEventListener("mousedown", listeners.mouseDownHandler);
			}
			window.removeEventListener("mousemove", listeners.mouseMoveHandler);
			window.removeEventListener("mouseup", listeners.mouseUpHandler);
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
		gearbox.debug.offsetX = 0;
		gearbox.debug.offsetY = 0;
	},
});
