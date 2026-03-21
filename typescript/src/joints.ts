import type { World } from "./world.js";
import type { Body } from "./Body.js";
import { JOINT_TYPES } from "./constants.js";
import type { CppJoint } from "./wasm-types.js";
import { JS_OVERHEAD } from "./MemoryEstimator.js";

abstract class JointBase {
	abstract readonly type: number;
	internalId: number;
	_externalId: number | undefined;
	world: World;
	bodyA: Body;
	bodyB: Body;

	constructor(internalId: number, world: World, bodyA: Body, bodyB: Body, externalId: number | undefined) {
		this.internalId = internalId;
		this._externalId = externalId;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;

		// Add to bodies' joints lists
		this.bodyA.joints.push(this as any);
		if (this.bodyA !== this.bodyB) {
			this.bodyB.joints.push(this as any);
		}
	}

	get id() {
		return this._externalId;
	}

	getConnectedBodies(): Body[] {
		if (this.bodyA === this.bodyB) {
			return [this.bodyA];
		}
		return [this.bodyA, this.bodyB];
	}

	protected get cppJoint(): CppJoint | null {
		return this.world.world.getJoint(this.internalId);
	}

	get reactionForce() {
		const f = this.cppJoint?.getReactionForce(this.world.invDt);
		return f ? { x: f.x, y: f.y } : { x: 0, y: 0 };
	}

	get reactionTorque() {
		return this.cppJoint?.getReactionTorque(this.world.invDt) ?? 0;
	}

	get localAnchorA() {
		return this.cppJoint?.getLocalAnchorA() ?? { x: 0, y: 0 };
	}

	set localAnchorA(v: { x: number; y: number }) {
		this.cppJoint?.setLocalAnchorA(v);
	}

	get localAnchorB() {
		return this.cppJoint?.getLocalAnchorB() ?? { x: 0, y: 0 };
	}

	set localAnchorB(v: { x: number; y: number }) {
		this.cppJoint?.setLocalAnchorB(v);
	}

	getMemoryUsage(): number {
		return JS_OVERHEAD.OBJECT_BASE;
	}
}

export class HingeJoint extends JointBase {
	readonly type = JOINT_TYPES.HINGE;

	constructor(
		internalId: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		externalId?: number,
	) {
		super(internalId, world, bodyA, bodyB, externalId);
		for (const b of this.getConnectedBodies()) {
			b.joints.push(this);
		}
	}
}

export class DistanceJoint extends JointBase {
	readonly type = JOINT_TYPES.DISTANCE;

	constructor(
		internalId: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		length: number,
		externalId?: number,
	) {
		super(internalId, world, bodyA, bodyB, externalId);
		this.length = length;
		for (const b of this.getConnectedBodies()) {
			b.joints.push(this);
		}
	}

	get length() {
		return this.cppJoint?.getLength() ?? 0;
	}

	set length(v: number) {
		this.cppJoint?.setLength(v);
	}
}

export class SpringJoint extends JointBase {
	readonly type = JOINT_TYPES.SPRING;

	constructor(
		internalId: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		length: number,
		frequencyHz: number,
		dampingRatio: number,
		externalId?: number,
	) {
		super(internalId, world, bodyA, bodyB, externalId);
		this.length = length;
		this.frequencyHz = frequencyHz;
		this.dampingRatio = dampingRatio;
		for (const b of this.getConnectedBodies()) {
			b.joints.push(this);
		}
	}

	get length() {
		return this.cppJoint?.getLength() ?? 0;
	}

	set length(v: number) {
		this.cppJoint?.setLength(v);
	}

	get frequencyHz() {
		return this.cppJoint?.getFrequencyHz() ?? 0;
	}

	set frequencyHz(v: number) {
		this.cppJoint?.setFrequencyHz(v);
	}

	get dampingRatio() {
		return this.cppJoint?.getDampingRatio() ?? 0;
	}

	set dampingRatio(v: number) {
		this.cppJoint?.setDampingRatio(v);
	}
}

export class GearJoint extends JointBase {
	readonly type = JOINT_TYPES.GEAR;
	joint1: HingeJoint;
	joint2: HingeJoint;

	constructor(
		internalId: number,
		world: World,
		joint1: HingeJoint,
		joint2: HingeJoint,
		ratio: number,
		externalId?: number,
	) {
		super(internalId, world, joint1.bodyB, joint2.bodyB, externalId);
		this.joint1 = joint1;
		this.joint2 = joint2;
		this.ratio = ratio;
		for (const b of this.getConnectedBodies()) {
			b.joints.push(this);
		}
	}

	getConnectedBodies(): Body[] {
		return [...new Set([this.joint1.bodyA, this.joint1.bodyB, this.joint2.bodyA, this.joint2.bodyB])];
	}

	get reactionForce() {
		return { x: 0, y: 0 };
	}

	get reactionTorque() {
		return this.cppJoint?.getReactionTorque(this.world.invDt) ?? 0;
	}

	get ratio() {
		return this.cppJoint?.getRatio() ?? 0;
	}

	set ratio(v: number) {
		this.cppJoint?.setRatio(v);
	}

	getMemoryUsage(): number {
		return JS_OVERHEAD.OBJECT_BASE;
	}
}
