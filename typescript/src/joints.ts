import type { World } from "./world.js";
import type { Body } from "./Body.js";
import { JOINT_TYPES } from "./constants.js";
import type { CppJoint } from "./wasm-types.js";

abstract class JointBase {
	abstract readonly type: number;
	id: number;
	world: World;
	bodyA: Body;
	bodyB: Body;

	constructor(id: number, world: World, bodyA: Body, bodyB: Body) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
	}

	protected get cppJoint(): CppJoint | null {
		return this.world.world.getJoint(this.id);
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
}

export class HingeJoint extends JointBase {
	readonly type = JOINT_TYPES.HINGE;

	constructor(
		id: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
	) {
		super(id, world, bodyA, bodyB);
	}
}

export class DistanceJoint extends JointBase {
	readonly type = JOINT_TYPES.DISTANCE;

	constructor(
		id: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		length: number,
	) {
		super(id, world, bodyA, bodyB);
		this.length = length;
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
		id: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		length: number,
		frequencyHz: number,
		dampingRatio: number,
	) {
		super(id, world, bodyA, bodyB);
		this.length = length;
		this.frequencyHz = frequencyHz;
		this.dampingRatio = dampingRatio;
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

export class GearJoint {
	readonly type = JOINT_TYPES.GEAR;
	id: number;
	world: World;
	joint1: HingeJoint;
	joint2: HingeJoint;

	constructor(id: number, world: World, joint1: HingeJoint, joint2: HingeJoint, ratio: number) {
		this.id = id;
		this.world = world;
		this.joint1 = joint1;
		this.joint2 = joint2;
		this.ratio = ratio;
	}

	protected get cppJoint(): CppJoint | null {
		return this.world.world.getJoint(this.id);
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
}
