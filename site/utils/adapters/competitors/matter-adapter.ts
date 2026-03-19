import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from "../../physics-protocol";

// --- Matter.js Adapter ---
export class MatterAdapter implements PhysicsEngineAdapter {
	private engine: any = null;
	private world: any = null;
	private Matter: any = (window as any).Matter;
	private readonly SCALE = 100;
	private bodies = new Map<number | string, any>();

	async init(): Promise<void> {
		this.Matter = (window as any).Matter;
		if (!this.Matter) throw new Error("Matter.js not loaded");
		this.engine = this.Matter.Engine.create({
			enableSleeping: false,
		});
		this.world = this.engine.world;
		// Adjust gravity to feel similar to the other engines at this scale
		this.world.gravity.y = 1.0;
	}

	step(dt: number): void {
		this.Matter.Engine.update(this.engine, dt * 1000);
	}

	getDebugFrame(): DebugFrame {
		const bodies = this.Matter.Composite.allBodies(this.world).map((body: any) => ({
			id: body.id,
			x: body.position.x / this.SCALE,
			y: body.position.y / this.SCALE,
			r: body.angle,
			isSleeping: body.isSleeping,
			fixtures: body.parts
				.filter((part: any) => part !== body)
				.map((part: any) => ({
					shape: part.circleRadius ? ShapeType.CIRCLE : ShapeType.POLYGON,
					radius: part.circleRadius ? part.circleRadius / this.SCALE : undefined,
					points: part.vertices.map((v: any) => ({
						x: (v.x - part.position.x) / this.SCALE,
						y: (v.y - part.position.y) / this.SCALE,
					})),
					localX: (part.position.x - body.position.x) / this.SCALE,
					localY: (part.position.y - body.position.y) / this.SCALE,
					localR: part.angle - body.angle,
				})),
		}));

		// Basic support for single-part bodies
		bodies.forEach((b) => {
			if (b.fixtures.length === 0) {
				const body = this.Matter.Composite.allBodies(this.world).find((mb: any) => mb.id === b.id);
				b.fixtures.push({
					shape: body.circleRadius ? ShapeType.CIRCLE : ShapeType.POLYGON,
					radius: body.circleRadius ? body.circleRadius / this.SCALE : undefined,
					points: body.vertices.map((v: any) => ({
						x: (v.x - body.position.x) / this.SCALE,
						y: (v.y - body.position.y) / this.SCALE,
					})),
					localX: 0,
					localY: 0,
					localR: 0,
				});
			}
		});

		const joints = this.Matter.Composite.allConstraints(this.world).map((c: any) => {
			const anchorA = c.pointA;
			const anchorB = c.pointB;
			const worldA = c.bodyA
				? {
						x: (c.bodyA.position.x + anchorA.x) / this.SCALE,
						y: (c.bodyA.position.y + anchorA.y) / this.SCALE,
					}
				: { x: anchorA.x / this.SCALE, y: anchorA.y / this.SCALE };
			const worldB = c.bodyB
				? {
						x: (c.bodyB.position.x + anchorB.x) / this.SCALE,
						y: (c.bodyB.position.y + anchorB.y) / this.SCALE,
					}
				: { x: anchorB.y / this.SCALE, y: anchorB.y / this.SCALE };

			return {
				id: c.id,
				type: JointType.DISTANCE,
				bodyAId: c.bodyA?.id,
				bodyBId: c.bodyB?.id,
				anchorA: worldA,
				anchorB: worldB,
			};
		});

		return { bodies, joints, interpolationAlpha: 1.0 };
	}

	clear(): void {
		this.Matter.Composite.clear(this.world, false);
		this.bodies.clear();
	}

	createBox(
		id: number | string,
		x: number,
		y: number,
		w: number,
		h: number,
		isStatic: boolean,
		options: any = {},
	): void {
		const body = this.Matter.Bodies.rectangle(x * this.SCALE, y * this.SCALE, w * this.SCALE, h * this.SCALE, {
			isStatic,
			restitution: options.restitution ?? 0,
			friction: options.sFriction ?? 0.5,
			frictionStatic: options.sFriction ?? 0.5,
			frictionAir: options.linearDamping ?? 0,
			...options,
		});
		this.Matter.Composite.add(this.world, body);
		if (options.vx !== undefined || options.vy !== undefined) {
			this.Matter.Body.setVelocity(body, {
				x: ((options.vx || 0) * this.SCALE) / 60,
				y: ((options.vy || 0) * this.SCALE) / 60,
			});
		}
		this.bodies.set(id, body);
	}

	createCircle(
		id: number | string,
		x: number,
		y: number,
		radius: number,
		isStatic: boolean,
		options: any = {},
	): void {
		const body = this.Matter.Bodies.circle(x * this.SCALE, y * this.SCALE, radius * this.SCALE, {
			isStatic,
			restitution: options.restitution ?? 0,
			friction: options.sFriction ?? 0.5,
			frictionStatic: options.sFriction ?? 0.5,
			frictionAir: options.linearDamping ?? 0,
			...options,
		});
		this.Matter.Composite.add(this.world, body);
		if (options.vx !== undefined || options.vy !== undefined) {
			this.Matter.Body.setVelocity(body, {
				x: ((options.vx || 0) * this.SCALE) / 60,
				y: ((options.vy || 0) * this.SCALE) / 60,
			});
		}
		this.bodies.set(id, body);
	}

	createDistanceJoint(
		id: number | string,
		bodyAId: number | string,
		bodyBId: number | string,
		options: any = {},
	): void {
		const bodyA = this.bodies.get(bodyAId);
		const bodyB = this.bodies.get(bodyBId);
		const constraint = this.Matter.Constraint.create({
			bodyA,
			bodyB,
			pointA: options.anchorA
				? { x: options.anchorA.x * this.SCALE, y: options.anchorA.y * this.SCALE }
				: { x: 0, y: 0 },
			pointB: options.anchorB
				? { x: options.anchorB.x * this.SCALE, y: options.anchorB.y * this.SCALE }
				: { x: 0, y: 0 },
			length: options.length !== undefined ? options.length * this.SCALE : undefined,
			stiffness: 1.0,
		});
		this.Matter.Composite.add(this.world, constraint);
	}

	createHingeJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
		const bodyA = this.bodies.get(bodyAId);
		const bodyB = this.bodies.get(bodyBId);
		if (!bodyA || !bodyB) return;

		let pointA = { x: 0, y: 0 };
		let pointB = { x: 0, y: 0 };

		if (options.worldAnchor) {
			const wx = options.worldAnchor.x * this.SCALE;
			const wy = options.worldAnchor.y * this.SCALE;

			const getLocal = (body: any, x: number, y: number) => {
				const dx = x - body.position.x;
				const dy = y - body.position.y;
				const cos = Math.cos(-body.angle);
				const sin = Math.sin(-body.angle);
				return {
					x: dx * cos - dy * sin,
					y: dx * sin + dy * cos,
				};
			};

			pointA = getLocal(bodyA, wx, wy);
			pointB = getLocal(bodyB, wx, wy);
		} else {
			if (options.localAnchorA)
				pointA = { x: options.localAnchorA.x * this.SCALE, y: options.localAnchorA.y * this.SCALE };
			if (options.localAnchorB)
				pointB = { x: options.localAnchorB.x * this.SCALE, y: options.localAnchorB.y * this.SCALE };
		}

		const constraint = this.Matter.Constraint.create({
			bodyA,
			bodyB,
			pointA,
			pointB,
			length: 0,
			stiffness: 1.0,
		});
		this.Matter.Composite.add(this.world, constraint);
	}

	createPoint(id: number | string, x: number, y: number, isStatic: boolean, options: any = {}): void {
		this.createCircle(id, x, y, 0.05, isStatic, options);
	}

	getBodyCount(): number {
		return this.Matter.Composite.allBodies(this.world).length;
	}

	getVelocity(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(id);
		if (!body) return { x: 0, y: 0 };
		return {
			x: (body.velocity.x / this.SCALE) * 60,
			y: (body.velocity.y / this.SCALE) * 60,
		};
	}

	getPosition(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(id);
		return body ? { x: body.position.x / this.SCALE, y: body.position.y / this.SCALE } : { x: 0, y: 0 };
	}

	setGravity(x: number, y: number): void {
		if (this.world) {
			this.world.gravity.x = x / 9.8;
			this.world.gravity.y = y / 9.8;
		}
	}
}
