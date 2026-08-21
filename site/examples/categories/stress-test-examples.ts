import Example from "../engine-wrapper.js";
import gearbox from "gearbox2d";

let nextId = 1;
let mouseAnchor: any = null;
let dragJoint: any = null;
let canvas: HTMLCanvasElement | null = null;

const CAT_WALL = 0x1;
const CAT_BALL = 0x2;

const screenToWorld = (x: number, y: number) => {
	return {
		x: (x - gearbox.debug.offsetX) / (gearbox.debug.zoom * 100),
		y: (y - gearbox.debug.offsetY) / (gearbox.debug.zoom * 100),
	};
};

const onMouseDown = (e: MouseEvent, world: any) => {
	if (e.button !== 0) return; // Left click only

	const rect = canvas!.getBoundingClientRect();
	const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

	const hits = world.queryBodiesAtPoint(pos.x, pos.y);
	if (hits.length > 0) {
		const targetId = hits[0];
		const target = world.getBodyById(targetId);

		if (target && target.type !== gearbox.bodyTypes.FIXED_OBJECT) {
			mouseAnchor = world.createBody({
				id: 999999,
				x: pos.x,
				y: pos.y,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "transparent",
			});
			mouseAnchor.createFixture({ id: 999999, shape: gearbox.shapes.CIRCLE, radius: 0.05, maskBits: 0 });

			dragJoint = world.createSpringJoint(mouseAnchor, target, {
				id: 999998,
				worldAnchor: pos,
				frequencyHz: 3.0,
				dampingRatio: 1.0,
				length: 0,
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

const setupMouseListeners = (world: any) => {
	canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;

	(world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
	(world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
	(world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);

	canvas.addEventListener("mousedown", (world as any)._mouseDownHandler);
	window.addEventListener("mousemove", (world as any)._mouseMoveHandler);
	window.addEventListener("mouseup", (world as any)._mouseUpHandler);
};

const cleanupMouseListeners = (world: any) => {
	if (canvas) {
		canvas.removeEventListener("mousedown", (world as any)._mouseDownHandler);
		window.removeEventListener("mousemove", (world as any)._mouseMoveHandler);
		window.removeEventListener("mouseup", (world as any)._mouseUpHandler);
		delete (world as any)._mouseDownHandler;
		delete (world as any)._mouseMoveHandler;
		delete (world as any)._mouseUpHandler;
	}
};

export const stressTestExamples = [
	new Example({
		name: "2000 Colliding Circles",
		key: "particles",
		description: [
			"A **Stress Test** featuring 2,000 `CIRCLE` objects with full collision resolution.",
			"This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.",
			"**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation.",
		].join("\n\n"),
		onInit: (world) => {
			(world as any)._frameCounter = 0;
			world.clear();
			let id = 1;
			let thickness = 2;
			let length = 11;

			// Walls
			world.createBody({ id: id++, x: 5, y: 0, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 0, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 10, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 0.99,
			});

			for (let i = 0; i < 2000; i++) {
				const bodyId = id++;
				world
					.createBody({
						id: bodyId,
						x: Math.random() * 8 + 1,
						y: Math.random() * 8 + 1,
						vx: Math.random() * 1.0 - 0.5,
						vy: Math.random() * 1.0 - 0.5,
						r: (Math.PI / 2) * Math.random(),
						rs: (Math.random() - 0.5) * 20.0,
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: 0.5,
						linearDamping: 0.0,
						angularDamping: 0.5,
					})
					.createFixture({
						shape: gearbox.shapes.CIRCLE,
						radius: 0.05,
						restitution: 0.5,
					});
			}
		},
		onTick: (world, dt) => {},
	}),
	new Example({
		name: "2000 Bouncy Points",
		key: "fleas",
		description: [
			"A stress test with 2,000 bouncy `POINT` objects.",
			"Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations.",
		].join("\n\n"),
		onInit: (world) => {
			world.clear();
			const nFleas = 2000;
			world.setGravity(0, 10);
			let id = 1;
			let thickness = 2;
			let length = 11;

			// Walls
			world.createBody({ id: id++, x: 5, y: 0, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 0, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 10, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});

			for (let i = 0; i < nFleas; i++) {
				const bodyId = id++;
				world
					.createBody({
						id: bodyId,
						x: Math.random() * 8 + 1,
						y: Math.random() * 8 + 1,
						vx: Math.random() * 10.0 - 5.0,
						r: (Math.PI / 2) * Math.random(),
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: 2,
						linearDamping: 0.0,
						angularDamping: 0.0,
					})
					.createFixture({
						shape: gearbox.shapes.POINT,
						radius: 0.05,
						restitution: 1.0,
						sFriction: 0,
						kFriction: 0,
					});
			}
		},
		onTick: (world, dt) => {},
	}),
	new Example({
		name: "10 Stacked Boxes",
		key: "stacked-boxes",
		description:
			"A vertical stack of 10 dynamic boxes testing the stability of the impulse solver under persistent contact.",
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			for (let i = 0; i < 10; i++) {
				world
					.createBody({ id: nextId++, x: 5, y: 8.5 - i * 0.6, mass: 1.0, color: `hsl(${i * 36}, 70%, 60%)` })
					.createFixture({
						shape: gearbox.shapes.BOX,
						width: 1,
						height: 0.5,
						restitution: 0.1,
						sFriction: 0.5,
						kFriction: 0.3,
					});
			}
		},
	}),
	new Example({
		name: "5-Level Pyramid",
		key: "pyramid",
		description: "A 5-level pyramid made of boxes. Tests multiple simultaneous contact points and stack stability.",
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			const boxWidth = 0.8;
			const boxHeight = 0.8;
			const levels = 5;

			for (let i = 0; i < levels; i++) {
				const numBoxes = levels - i;
				const startX = 5 - ((numBoxes - 1) * boxWidth) / 2;
				const y = 8.6 - i * boxHeight;

				for (let j = 0; j < numBoxes; j++) {
					world
						.createBody({
							id: nextId++,
							x: startX + j * boxWidth,
							y: y,
							mass: 1.0,
							color: `hsl(${i * 40}, 60%, 50%)`,
						})
						.createFixture({
							shape: gearbox.shapes.BOX,
							width: boxWidth * 0.95,
							height: boxHeight * 0.95,
							restitution: 0.1,
							sFriction: 0.5,
							kFriction: 0.3,
						});
				}
			}
		},
	}),
	new Example({
		name: "Mass Ratio",
		key: "mass-ratio",
		description:
			"A classic physics engine test: a very heavy object (mass 100) resting on a very light one (mass 0.1).",
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			// Light box
			world.createBody({ id: nextId++, x: 5, y: 8.5, mass: 0.1, color: "#4ade80" }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 1,
				height: 1,
			});

			// Heavy box
			world.createBody({ id: nextId++, x: 5, y: 7.0, mass: 100, color: "#f87171" }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 2,
				height: 2,
			});
		},
	}),
	new Example({
		name: "Ragdoll",
		key: "ragdoll",
		description:
			"A draggable ragdoll made of boxes and circles connected by HingeJoints. Click and drag to interact.",
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 10);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			const cx = 5,
				cy = 4;

			// Head
			const head = world.createBody({ id: nextId++, x: cx, y: cy - 1.5, mass: 1.0, color: "#fed7aa" });
			head.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.3 });

			// Torso
			const torso = world.createBody({ id: nextId++, x: cx, y: cy, mass: 2.0, color: "#93c5fd" });
			torso.createFixture({ shape: gearbox.shapes.BOX, width: 0.6, height: 1.0 });

			// Arms and Legs segments
			const createLimb = (x: number, y: number, w: number, h: number, color: string) => {
				const limb = world.createBody({ id: nextId++, x, y, mass: 0.5, color });
				limb.createFixture({ shape: gearbox.shapes.BOX, width: w, height: h });
				return limb;
			};

			const lUpperArm = createLimb(cx - 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const lLowerArm = createLimb(cx - 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const rUpperArm = createLimb(cx + 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const rLowerArm = createLimb(cx + 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa");

			const lUpperLeg = createLimb(cx - 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a");
			const lLowerLeg = createLimb(cx - 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa");
			const rUpperLeg = createLimb(cx + 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a");
			const rLowerLeg = createLimb(cx + 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa");

			// Joint them up
			world.createHingeJoint(head, torso, { id: nextId++, worldAnchor: { x: cx, y: cy - 1.0 } });

			world.createHingeJoint(torso, lUpperArm, { id: nextId++, worldAnchor: { x: cx - 0.3, y: cy - 0.3 } });
			world.createHingeJoint(lUpperArm, lLowerArm, { id: nextId++, worldAnchor: { x: cx - 0.85, y: cy - 0.3 } });

			world.createHingeJoint(torso, rUpperArm, { id: nextId++, worldAnchor: { x: cx + 0.3, y: cy - 0.3 } });
			world.createHingeJoint(rUpperArm, rLowerArm, { id: nextId++, worldAnchor: { x: cx + 0.85, y: cy - 0.3 } });

			world.createHingeJoint(torso, lUpperLeg, { id: nextId++, worldAnchor: { x: cx - 0.2, y: cy + 0.5 } });
			world.createHingeJoint(lUpperLeg, lLowerLeg, { id: nextId++, worldAnchor: { x: cx - 0.2, y: cy + 1.15 } });

			world.createHingeJoint(torso, rUpperLeg, { id: nextId++, worldAnchor: { x: cx + 0.2, y: cy + 0.5 } });
			world.createHingeJoint(rUpperLeg, rLowerLeg, { id: nextId++, worldAnchor: { x: cx + 0.2, y: cy + 1.15 } });

			setupMouseListeners(world);
		},
		onCleanup: (world) => {
			cleanupMouseListeners(world);
		},
	}),
	new Example({
		name: "Bullet Through Paper",
		key: "bullet",
		description: [
			"Tests anti-tunneling by firing many fast-moving balls at a tall, thin wall.",
			"Balls vary in **size**, **speed**, and **angle**. `speculativeMargin` helps catch collisions even at high speeds.",
			"Collision masks (`categoryBits` / `maskBits`) keep balls from colliding with each other — they only hit the wall. Each ball is removed after **5 seconds** or once it bounces out of bounds.",
		].join("\n\n"),
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 0);
			world.setSpeculativeMargin(0.5);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			const wallX = 8;
			const wallY = 5;
			const wallH = 9.5;
			world
				.createBody({ id: nextId++, x: wallX, y: wallY, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ccc" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 0.06,
					height: wallH,
					restitution: 0.85,
					categoryBits: CAT_WALL,
					maskBits: CAT_BALL,
				});

			(world as any)._bulletAges = new Map<number, number>();
			(world as any)._bulletSpawnAcc = 0;
			(world as any)._bulletWall = { x: wallX, y: wallY, halfH: wallH / 2 };
		},
		onTick: (world, dt) => {
			const ages: Map<number, number> = (world as any)._bulletAges;
			const wall = (world as any)._bulletWall;
			if (!ages || !wall) return;

			(world as any)._bulletSpawnAcc += dt;
			const spawnInterval = 0.035;
			let spawned = 0;
			while ((world as any)._bulletSpawnAcc >= spawnInterval && spawned < 8) {
				(world as any)._bulletSpawnAcc -= spawnInterval;
				spawned++;

				const radius = 0.04 + Math.random() * 0.18;
				const speed = 18 + Math.random() * 55;
				const sx = 0.4 + Math.random() * 1.2;
				const sy = 0.4 + Math.random() * 9.2;
				const hitPad = radius + 0.05;
				const targetY =
					wall.y - wall.halfH + hitPad + Math.random() * Math.max(0.01, wall.halfH * 2 - hitPad * 2);
				const dx = wall.x - sx;
				const dy = targetY - sy;
				const invLen = 1 / Math.hypot(dx, dy);
				const colors = ["#ffff44", "#ff8844", "#44ffff", "#ff44ff", "#88ff44", "#ff5555"];

				const body = world.createBody({
					id: nextId++,
					x: sx,
					y: sy,
					vx: dx * invLen * speed,
					vy: dy * invLen * speed,
					mass: Math.max(0.02, radius * radius * 8),
					color: colors[Math.floor(Math.random() * colors.length)],
					canSleep: false,
					linearDamping: 0,
					angularDamping: 0,
				});
				body.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius,
					restitution: 0.7 + Math.random() * 0.25,
					categoryBits: CAT_BALL,
					maskBits: CAT_WALL,
				});
				ages.set(body.id, 0);
			}

			const toRemove: number[] = [];
			world.iterateBodies((obj) => {
				if (obj.type !== gearbox.bodyTypes.DYNAMIC_OBJECT) return;
				const age = (ages.get(obj.id) ?? 0) + dt;
				ages.set(obj.id, age);
				const outOfBounds = obj.x < -2 || obj.x > 14 || obj.y < -2 || obj.y > 12;
				if (outOfBounds || age > 5) toRemove.push(obj.id);
			});
			for (const id of toRemove) {
				ages.delete(id);
				world.removeObject(id);
			}
		},
		onCleanup: (world) => {
			delete (world as any)._bulletAges;
			delete (world as any)._bulletSpawnAcc;
			delete (world as any)._bulletWall;
		},
	}),
	new Example({
		name: "20-Segment Chain",
		key: "chain",
		description: "A 20-segment chain suspended from a fixed point using DistanceJoints.",
		onInit: (world) => {
			world.clear();
			world.setGravity(0, 10);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			const cx = 5,
				cy = 1;
			const segments = 20;
			const segW = 0.4,
				segH = 0.15;

			const anchor = world.createBody({
				id: nextId++,
				x: cx,
				y: cy + (Math.random() - 0.5) * 0.1,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#444",
			});
			anchor.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.1 });

			let randomness = 0;
			randomness = +(Math.random() - 0.5) * 0.00001;

			let lastBody = anchor;
			for (let i = 0; i < segments; i++) {
				const body = world.createBody({
					id: nextId++,
					x: cx + randomness,
					y: cy + (i + 1) * segW,
					mass: 0.2,
					color: i % 2 === 0 ? "#60a5fa" : "#3b82f6",
				});
				body.createFixture({ shape: gearbox.shapes.BOX, width: segW, height: segH });

				world.createDistanceJoint(lastBody, body, {
					id: nextId++,
					worldAnchor: { x: cx, y: cy + i * segW + segW / 2 },
				});
				lastBody = body;
			}

			setupMouseListeners(world);
		},
		onCleanup: (world) => {
			cleanupMouseListeners(world);
		},
	}),
];
