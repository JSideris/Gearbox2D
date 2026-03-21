import gearbox from "gearbox2d";
import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from "../physics-protocol";

export class GearboxAdapter implements PhysicsEngineAdapter {
	private world: any = null;
	private idMap = new Map<string | number, number>();
	private bodies = new Map<number, any>();
	private nextId = 1000;

	constructor(existingWorld?: any) {
		if (existingWorld) {
			this.world = existingWorld;
		}
	}

	private getInternalId(id: string | number): number {
		if (typeof id === "number") return id;
		if (this.idMap.has(id)) return this.idMap.get(id)!;
		const newId = this.nextId++;
		this.idMap.set(id, newId);
		return newId;
	}

	async init(): Promise<void> {
		if (!this.world) {
			await gearbox.init();
			this.world = gearbox.createWorld();
		}
		this.world.setGravity(0, 9.8);
		this.world.setHasRestitution(true);
		this.world.setHasFriction(true);
		this.world.setHasPenetrationResolution(true);
	}

	step(dt: number): void {
		if (!this.world) return;
		this.world.step();
	}

	getDebugFrame(): DebugFrame {
		const bodies: any[] = [];
		const joints: any[] = [];

		if (!this.world) return { bodies, joints, interpolationAlpha: 1.0 };

		this.world.iterateBodies((body: any) => {
			const fixtures = body.fixtures.map((f: any) => ({
				shape: this.mapShape(f.shape),
				radius: f.radius,
				width: f.width,
				height: f.height,
				localX: f.localX,
				localY: f.localY,
				localR: f.localR,
				points: f.shape === 6 ? f.vertices : undefined, // POLYGON is 6
			}));

			bodies.push({
				id: body.id,
				x: body.x,
				y: body.y,
				r: body.r,
				color: body.color,
				isSleeping: body.isSleeping,
				fixtures,
			});
		});

		for (const id in this.world.jointsById) {
			const joint = this.world.jointsById[id];
			joints.push({
				id: joint.id,
				type: this.mapJointType(joint.type),
				bodyAId: joint.bodyA.id,
				bodyBId: joint.bodyB.id,
				anchorA: this.getJointWorldPoint(joint.bodyA, joint.localAnchorA),
				anchorB: this.getJointWorldPoint(joint.bodyB, joint.localAnchorB),
			});
		}

		return {
			bodies,
			joints,
			interpolationAlpha: this.world.interpolationAlpha,
		};
	}

	private mapShape(shape: number): ShapeType {
		switch (shape) {
			case 0:
				return ShapeType.POINT;
			case 1:
				return ShapeType.CIRCLE;
			case 2:
				return ShapeType.AABB;
			case 3:
				return ShapeType.BOX;
			case 4:
				return ShapeType.ELLIPSE;
			case 5:
				return ShapeType.CAPSULE;
			case 6:
				return ShapeType.POLYGON;
			default:
				return ShapeType.BOX;
		}
	}

	private mapJointType(type: number): JointType {
		switch (type) {
			case 0:
				return JointType.HINGE;
			case 1:
				return JointType.DISTANCE;
			case 2:
				return JointType.SPRING;
			case 3:
				return JointType.GEAR;
			default:
				return JointType.DISTANCE;
		}
	}

	private getJointWorldPoint(body: any, localPoint: { x: number; y: number }) {
		const cos = Math.cos(body.r);
		const sin = Math.sin(body.r);
		return {
			x: body.x + (localPoint.x * cos - localPoint.y * sin),
			y: body.y + (localPoint.x * sin + localPoint.y * cos),
		};
	}

	clear(): void {
		if (this.world) this.world.clear();
		this.idMap.clear();
		this.bodies.clear();
		this.nextId = 1000;
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
		const internalId = this.getInternalId(id);
		const body = this.world.createBody({
			id: internalId,
			x,
			y,
			type: isStatic ? gearbox.bodyTypes.FIXED_OBJECT : gearbox.bodyTypes.DYNAMIC_OBJECT,
			mass: options.mass || 1.0,
			vx: options.vx,
			vy: options.vy,
			rs: options.rs,
			gscale: options.gscale,
			color: options.color,
			linearDamping: options.linearDamping,
			angularDamping: options.angularDamping,
		});
		body.createFixture({
			shape: gearbox.shapes.BOX,
			width: w,
			height: h,
			restitution: options.restitution ?? 0.1,
			sFriction: options.sFriction ?? 0.5,
			kFriction: options.kFriction ?? 0.3,
		});
		this.bodies.set(internalId, body);
	}

	createCircle(
		id: number | string,
		x: number,
		y: number,
		radius: number,
		isStatic: boolean,
		options: any = {},
	): void {
		const internalId = this.getInternalId(id);
		const body = this.world.createBody({
			id: internalId,
			x,
			y,
			type: isStatic ? gearbox.bodyTypes.FIXED_OBJECT : gearbox.bodyTypes.DYNAMIC_OBJECT,
			mass: options.mass || 1.0,
			vx: options.vx,
			vy: options.vy,
			rs: options.rs,
			gscale: options.gscale,
			color: options.color,
			linearDamping: options.linearDamping,
			angularDamping: options.angularDamping,
		});
		body.createFixture({
			shape: gearbox.shapes.CIRCLE,
			radius,
			restitution: options.restitution ?? 0.1,
			sFriction: options.sFriction ?? 0.5,
			kFriction: options.kFriction ?? 0.3,
		});
		this.bodies.set(internalId, body);
	}

	createDistanceJoint(
		id: number | string,
		bodyAId: number | string,
		bodyBId: number | string,
		options: any = {},
	): void {
		const internalId = this.getInternalId(id);
		const bodyA = this.bodies.get(this.getInternalId(bodyAId));
		const bodyB = this.bodies.get(this.getInternalId(bodyBId));
		if (bodyA && bodyB) {
			this.world.createDistanceJoint(bodyA, bodyB, { ...options, id: internalId });
		}
	}

	createHingeJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
		const internalId = this.getInternalId(id);
		const bodyA = this.bodies.get(this.getInternalId(bodyAId));
		const bodyB = this.bodies.get(this.getInternalId(bodyBId));
		if (bodyA && bodyB) {
			this.world.createHingeJoint(bodyA, bodyB, { ...options, id: internalId });
		}
	}

	createPoint(id: number | string, x: number, y: number, isStatic: boolean, options: any = {}): void {
		const internalId = this.getInternalId(id);
		const body = this.world.createBody({
			id: internalId,
			x,
			y,
			type: isStatic ? gearbox.bodyTypes.FIXED_OBJECT : gearbox.bodyTypes.DYNAMIC_OBJECT,
			mass: options.mass || 1.0,
			vx: options.vx,
			vy: options.vy,
			rs: options.rs,
			gscale: options.gscale,
			color: options.color,
			linearDamping: options.linearDamping,
			angularDamping: options.angularDamping,
		});
		body.createFixture({
			shape: gearbox.shapes.POINT,
			restitution: options.restitution ?? 0.1,
			sFriction: options.sFriction ?? 0.5,
			kFriction: options.kFriction ?? 0.3,
		});
		this.bodies.set(internalId, body);
	}

	getMemoryUsage(): number {
		return this.world ? this.world.getMemoryUsage() : 0;
	}

	getBodyCount(): number {
		return this.world ? this.world.getBodyCount() : 0;
	}

	getVelocity(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(this.getInternalId(id));
		return body ? { x: body.vx, y: body.vy } : { x: 0, y: 0 };
	}

	getPosition(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(this.getInternalId(id));
		return body ? { x: body.x, y: body.y } : { x: 0, y: 0 };
	}

	setGravity(x: number, y: number): void {
		if (this.world) this.world.setGravity(x, y);
	}
}
