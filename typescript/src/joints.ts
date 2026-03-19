import type { World } from "./world.js";
import type { Body } from "./Body.js";
import { JOINT_TYPES } from "./constants.js";

export class HingeJoint {
	readonly type = JOINT_TYPES.HINGE;
	id: number;
	world: World;
	bodyA: Body;
	bodyB: Body;

	constructor(
		id: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
	) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		// We need to pass the inverse dt to get the force from the impulse
		// For now, let's just return the impulse or assume 1/60 step
		const f = cppJoint.getReactionForce(60.0);
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
	}
}

export class DistanceJoint {
	readonly type = JOINT_TYPES.DISTANCE;
	id: number;
	world: World;
	bodyA: Body;
	bodyB: Body;

	constructor(
		id: number,
		world: World,
		bodyA: Body,
		bodyB: Body,
		localAnchorA: { x: number; y: number },
		localAnchorB: { x: number; y: number },
		length: number,
	) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
		this.length = length;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		const f = cppJoint.getReactionForce(60.0);
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get length() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getLength();
	}

	set length(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLength(v);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
	}
}

export class SpringJoint {
	readonly type = JOINT_TYPES.SPRING;
	id: number;
	world: World;
	bodyA: Body;
	bodyB: Body;

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
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
		this.length = length;
		this.frequencyHz = frequencyHz;
		this.dampingRatio = dampingRatio;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		const f = cppJoint.getReactionForce(60.0);
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get length() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getLength();
	}

	set length(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLength(v);
	}

	get frequencyHz() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getFrequencyHz();
	}

	set frequencyHz(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setFrequencyHz(v);
	}

	get dampingRatio() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getDampingRatio();
	}

	set dampingRatio(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setDampingRatio(v);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number; y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
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

	get reactionForce() {
		return { x: 0, y: 0 };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get ratio() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getRatio();
	}

	set ratio(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setRatio(v);
	}
}
