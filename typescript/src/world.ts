import {
	BODY_SIZE_F,
	BODY_SIZE_I,
	FIXTURE_SIZE_F,
	FIXTURE_SIZE_I,
	BODY_ID_OFFSET,
	FIXTURE_ID_OFFSET,
} from "./constants.js";
import { BufferView } from "./BufferAccessor.js";
import { Body } from "./Body.js";
import { Fixture } from "./Fixture.js";
import { HingeJoint, DistanceJoint, SpringJoint, GearJoint } from "./joints.js";
import type { BodyOptions, FixtureOptions, JointOptions } from "./types.js";
import type { CppWorld, WasmVector } from "./wasm-types.js";
import { JS_OVERHEAD, estimateMapMemory } from "./MemoryEstimator.js";

export type Joint = HingeJoint | DistanceJoint | SpringJoint | GearJoint;

export class World {
	world: CppWorld;
	liveBodyFloatData: Float32Array;
	liveBodyIntData: Int32Array;
	liveFixtureFloatData: Float32Array;
	liveFixtureIntData: Int32Array;

	bodyFloats: BufferView<Float32Array>;
	bodyInts: BufferView<Int32Array>;
	fixtureFloats: BufferView<Float32Array>;
	fixtureInts: BufferView<Int32Array>;

	bodiesById: { [key: number]: Body } = {};
	bodiesByInternalId: { [key: number]: Body } = {};
	fixturesById: { [key: number]: Fixture } = {};
	fixturesByInternalId: { [key: number]: Fixture } = {};
	jointsById: { [key: number]: Joint } = {};
	jointsByInternalId: { [key: number]: Joint } = {};

	nextInternalBodyId: number = 1;
	nextInternalFixtureId: number = 1;
	nextInternalJointId: number = 1;
	maxInternalIdThreshold: number = 0x7fffffff - 100000;

	interpolationAlpha: number = 1.0;
	stepCount: number = 0;
	invDt: number = 60.0;

	/** @internal */
	_wasmMemoryGetter: (() => number) | null = null;

	onCollisionStart?: (
		idA: number | undefined,
		idB: number | undefined,
		fixtureIdA: number | undefined,
		fixtureIdB: number | undefined,
		impulse: number,
	) => void;
	onCollisionEnd?: (
		idA: number | undefined,
		idB: number | undefined,
		fixtureIdA: number | undefined,
		fixtureIdB: number | undefined,
	) => void;
	onSleep?: (id: number | undefined) => void;
	onWake?: (id: number | undefined) => void;

	constructor(world: CppWorld) {
		this.world = world;
		this.refreshViews();
	}

	refreshViews() {
		this.liveBodyFloatData = this.world.getLiveBodyFloatData();
		this.liveBodyIntData = this.world.getLiveBodyIntData();
		this.liveFixtureFloatData = this.world.getLiveFixtureFloatData();
		this.liveFixtureIntData = this.world.getLiveFixtureIntData();

		this.bodyFloats = new BufferView(this.liveBodyFloatData, BODY_SIZE_F);
		this.bodyInts = new BufferView(this.liveBodyIntData, BODY_SIZE_I);
		this.fixtureFloats = new BufferView(this.liveFixtureFloatData, FIXTURE_SIZE_F);
		this.fixtureInts = new BufferView(this.liveFixtureIntData, FIXTURE_SIZE_I);
	}

	clear() {
		this.world.clear();
		this.bodiesById = {};
		this.bodiesByInternalId = {};
		this.fixturesById = {};
		this.fixturesByInternalId = {};
		this.jointsById = {};
		this.jointsByInternalId = {};
		this.nextInternalBodyId = 1;
		this.nextInternalFixtureId = 1;
		this.nextInternalJointId = 1;
		this.refreshViews();
	}

	destroy() {
		if (this.world) {
			this.world.delete();
			(this as any).world = null;
		}
		this.bodiesById = {};
		this.bodiesByInternalId = {};
		this.fixturesById = {};
		this.fixturesByInternalId = {};
		this.jointsById = {};
		this.jointsByInternalId = {};
	}

	setDefragThreshold(threshold: number) {
		this.maxInternalIdThreshold = threshold;
	}

	/** @internal */
	getNextInternalBodyId(): number {
		if (this.nextInternalBodyId >= this.maxInternalIdThreshold) {
			this.defragmentInternalIds();
		}
		return this.nextInternalBodyId++;
	}

	/** @internal */
	getNextInternalFixtureId(): number {
		if (this.nextInternalFixtureId >= this.maxInternalIdThreshold) {
			this.defragmentInternalIds();
		}
		return this.nextInternalFixtureId++;
	}

	/** @internal */
	getNextInternalJointId(): number {
		if (this.nextInternalJointId >= this.maxInternalIdThreshold) {
			this.defragmentInternalIds();
		}
		return this.nextInternalJointId++;
	}

	defragmentInternalIds() {
		const oldBodies = Object.values(this.bodiesByInternalId);
		const oldFixtures = Object.values(this.fixturesByInternalId);
		const oldJoints = Object.values(this.jointsByInternalId);

		this.bodiesByInternalId = {};
		this.fixturesByInternalId = {};
		this.jointsByInternalId = {};

		let nextBodyId = 1;
		for (const body of oldBodies) {
			const oldId = body.internalId;
			const newId = nextBodyId++;
			this.world.updateBodyId(oldId, newId);
			body.internalId = newId;
			this.bodiesByInternalId[newId] = body;
		}

		let nextFixtureId = 1;
		const uniqueFixtures = new Set(oldFixtures);
		for (const fixture of uniqueFixtures) {
			for (const sub of fixture.subFixtures) {
				const oldId = sub.id;
				const newId = nextFixtureId++;
				this.world.updateFixtureId(oldId, newId);
				sub.id = newId;
				this.fixturesByInternalId[newId] = fixture;
			}
		}

		let nextJointId = 1;
		for (const joint of oldJoints) {
			const oldId = joint.internalId;
			const newId = nextJointId++;
			this.world.updateJointId(oldId, newId);
			joint.internalId = newId;
			this.jointsByInternalId[newId] = joint;
		}

		this.world.syncDefragmentedIds();

		this.nextInternalBodyId = nextBodyId;
		this.nextInternalFixtureId = nextFixtureId;
		this.nextInternalJointId = nextJointId;
	}

	createBody(options: BodyOptions): Body {
		const internalId = this.getNextInternalBodyId();
		const externalId = options.id;
		const body = Body.create(this, internalId, externalId, options);
		this.bodiesByInternalId[internalId] = body;
		if (externalId !== undefined) {
			this.bodiesById[externalId] = body;
		}

		return body;
	}

	createFixture(bodyId: number, options: FixtureOptions): Fixture {
		const body = this.bodiesById[bodyId];
		if (!body) throw new Error(`Body with id ${bodyId} not found`);
		return Fixture.create(body, options);
	}

	removeBody(body: Body) {
		for (const fixture of body.fixtures) {
			if (fixture.id !== undefined) {
				delete this.fixturesById[fixture.id];
			}
			for (const sub of fixture.subFixtures) {
				delete this.fixturesByInternalId[sub.id];
			}
		}
		// Clean up joints connected to this body
		for (const joint of [...body.joints]) {
			this.removeJointInternal(joint);
		}
		this.world.removeObject(body.internalId);
		delete this.bodiesByInternalId[body.internalId];
		if (body.id !== undefined) {
			delete this.bodiesById[body.id];
		}
		this.refreshViews();
		this.syncIndices();
	}

	removeObject(id: number) {
		const body = this.bodiesById[id];
		if (body) {
			this.removeBody(body);
		}
	}

	private removeJointInternal(joint: Joint) {
		// Remove from world maps
		delete this.jointsByInternalId[joint.internalId];
		if (joint._externalId !== undefined) {
			delete this.jointsById[joint._externalId];
		}
		// Remove from bodies' joints lists
		const bodies = joint.getConnectedBodies();
		for (const b of bodies) {
			const idx = b.joints.indexOf(joint);
			if (idx !== -1) b.joints.splice(idx, 1);
		}
	}

	syncIndices() {
		const bodyCount = this.world.getBodyCount();
		for (let i = 0; i < bodyCount; i++) {
			const internalId = this.bodyInts.get(i, BODY_ID_OFFSET);
			if (this.bodiesByInternalId[internalId]) {
				this.bodiesByInternalId[internalId].index = i;
			}
		}
		const fixtureCount = this.world.getFixtureCount();
		for (let i = 0; i < fixtureCount; i++) {
			const internalId = this.fixtureInts.get(i, FIXTURE_ID_OFFSET);
			const fixture = this.fixturesByInternalId[internalId];
			if (fixture) {
				fixture.updateSubIndex(internalId, i);
			}
		}
	}

	getBodyById(id: number): Body | undefined {
		return this.bodiesById[id];
	}

	getBodyCount(): number {
		return this.world.getBodyCount();
	}

	iterateBodies(callback: (body: Body) => void) {
		const count = this.world.getBodyCount();
		for (let i = 0; i < count; i++) {
			const internalId = this.bodyInts.get(i, BODY_ID_OFFSET);
			const body = this.bodiesByInternalId[internalId];
			if (body) callback(body);
		}
	}

	createHingeJoint(bodyA: Body, bodyB: Body, options: JointOptions): HingeJoint {
		const internalId = this.getNextInternalJointId();
		const externalId = options.id;

		const anchorA = options.anchorA || { x: 0, y: 0 };
		const anchorB = options.anchorB || { x: 0, y: 0 };

		if (options.worldAnchor) {
			const worldAnchor = options.worldAnchor;
			const cosA = Math.cos(-bodyA.r),
				sinA = Math.sin(-bodyA.r);
			const ax = worldAnchor.x - bodyA.x,
				ay = worldAnchor.y - bodyA.y;
			anchorA.x = ax * cosA - ay * sinA;
			anchorA.y = ax * sinA + ay * cosA;

			const cosB = Math.cos(-bodyB.r),
				sinB = Math.sin(-bodyB.r);
			const bx = worldAnchor.x - bodyB.x,
				by = worldAnchor.y - bodyB.y;
			anchorB.x = bx * cosB - by * sinB;
			anchorB.y = bx * sinB + by * cosB;
		}

		this.world.createHingeJoint(
			internalId,
			bodyA.internalId,
			bodyB.internalId,
			anchorA.x,
			anchorA.y,
			anchorB.x,
			anchorB.y,
		);
		const joint = new HingeJoint(internalId, this, bodyA, bodyB, anchorA, anchorB, externalId);
		this.jointsByInternalId[internalId] = joint;
		if (externalId !== undefined) {
			this.jointsById[externalId] = joint;
		}
		return joint;
	}

	createDistanceJoint(bodyA: Body, bodyB: Body, options: JointOptions): DistanceJoint {
		const internalId = this.getNextInternalJointId();
		const externalId = options.id;

		const anchorA = options.anchorA || { x: 0, y: 0 };
		const anchorB = options.anchorB || { x: 0, y: 0 };

		if (options.worldAnchor) {
			const worldAnchor = options.worldAnchor;
			const cosA = Math.cos(-bodyA.r),
				sinA = Math.sin(-bodyA.r);
			const ax = worldAnchor.x - bodyA.x,
				ay = worldAnchor.y - bodyA.y;
			anchorA.x = ax * cosA - ay * sinA;
			anchorA.y = ax * sinA + ay * cosA;

			const cosB = Math.cos(-bodyB.r),
				sinB = Math.sin(-bodyB.r);
			const bx = worldAnchor.x - bodyB.x,
				by = worldAnchor.y - bodyB.y;
			anchorB.x = bx * cosB - by * sinB;
			anchorB.y = bx * sinB + by * cosB;
		}

		let length = options.length;
		if (length === undefined) {
			const wa = bodyA.localToWorld(anchorA);
			const wb = bodyB.localToWorld(anchorB);
			const dx = wb.x - wa.x,
				dy = wb.y - wa.y;
			length = Math.sqrt(dx * dx + dy * dy);
		}

		this.world.createDistanceJoint(
			internalId,
			bodyA.internalId,
			bodyB.internalId,
			anchorA.x,
			anchorA.y,
			anchorB.x,
			anchorB.y,
			length,
		);
		const joint = new DistanceJoint(internalId, this, bodyA, bodyB, anchorA, anchorB, length, externalId);
		this.jointsByInternalId[internalId] = joint;
		if (externalId !== undefined) {
			this.jointsById[externalId] = joint;
		}
		return joint;
	}

	createSpringJoint(bodyA: Body, bodyB: Body, options: JointOptions): SpringJoint {
		const internalId = this.getNextInternalJointId();
		const externalId = options.id;

		const anchorA = options.anchorA || { x: 0, y: 0 };
		const anchorB = options.anchorB || { x: 0, y: 0 };
		const frequencyHz = options.frequencyHz !== undefined ? options.frequencyHz : 5.0;
		const dampingRatio = options.dampingRatio !== undefined ? options.dampingRatio : 0.7;

		if (options.worldAnchor) {
			const worldAnchor = options.worldAnchor;
			const cosA = Math.cos(-bodyA.r),
				sinA = Math.sin(-bodyA.r);
			const ax = worldAnchor.x - bodyA.x,
				ay = worldAnchor.y - bodyA.y;
			anchorA.x = ax * cosA - ay * sinA;
			anchorA.y = ax * sinA + ay * cosA;

			const cosB = Math.cos(-bodyB.r),
				sinB = Math.sin(-bodyB.r);
			const bx = worldAnchor.x - bodyB.x,
				by = worldAnchor.y - bodyB.y;
			anchorB.x = bx * cosB - by * sinB;
			anchorB.y = bx * sinB + by * cosB;
		}

		let length = options.length;
		if (length === undefined) {
			const wa = bodyA.localToWorld(anchorA);
			const wb = bodyB.localToWorld(anchorB);
			const dx = wb.x - wa.x,
				dy = wb.y - wa.y;
			length = Math.sqrt(dx * dx + dy * dy);
		}

		this.world.createSpringJoint(
			internalId,
			bodyA.internalId,
			bodyB.internalId,
			anchorA.x,
			anchorA.y,
			anchorB.x,
			anchorB.y,
			length,
			frequencyHz,
			dampingRatio,
		);
		const joint = new SpringJoint(
			internalId,
			this,
			bodyA,
			bodyB,
			anchorA,
			anchorB,
			length,
			frequencyHz,
			dampingRatio,
			externalId,
		);
		this.jointsByInternalId[internalId] = joint;
		if (externalId !== undefined) {
			this.jointsById[externalId] = joint;
		}
		return joint;
	}

	createGearJoint(joint1: HingeJoint, joint2: HingeJoint, options: JointOptions): GearJoint {
		const internalId = this.getNextInternalJointId();
		const externalId = options.id;
		const ratio = options.ratio !== undefined ? options.ratio : 1.0;

		this.world.createGearJoint(internalId, joint1.internalId, joint2.internalId, ratio);
		const joint = new GearJoint(internalId, this, joint1, joint2, ratio, externalId);
		this.jointsByInternalId[internalId] = joint;
		if (externalId !== undefined) {
			this.jointsById[externalId] = joint;
		}
		return joint;
	}

	removeJoint(id: number) {
		const joint = this.jointsById[id] || this.jointsByInternalId[id];
		if (joint) {
			this.world.removeJoint(joint.internalId);
			this.removeJointInternal(joint);
		}
	}

	getJointById(id: number): Joint | undefined {
		return this.jointsById[id];
	}

	setTimeStep(dt: number) {
		this.world.setTimeStep(dt);
		this.invDt = dt > 0 ? 1.0 / dt : 0;
	}

	setGravity(x: number, y: number) {
		this.world.setGravity(x, y);
	}

	setHasPenetrationResolution(v: boolean) {
		this.world.setHasPenetrationResolution(v);
	}

	setHasRestitution(v: boolean) {
		this.world.setHasRestitution(v);
	}

	setHasFriction(v: boolean) {
		this.world.setHasFriction(v);
	}

	setSpeculativeMargin(v: number) {
		this.world.setSpeculativeMargin(v);
	}

	getSpeculativeMargin(): number {
		return this.world.getSpeculativeMargin();
	}

	getMemoryUsage(): number {
		// 1. WASM Heap (C++ objects and buffers)
		const wasmHeap = this._wasmMemoryGetter?.() || 0;

		// 2. JS Wrapper Estimates
		let jsOverhead = JS_OVERHEAD.OBJECT_BASE; // World object itself

		// Internal Maps (Registry overhead)
		jsOverhead += estimateMapMemory(this.bodiesById);
		jsOverhead += estimateMapMemory(this.bodiesByInternalId);
		jsOverhead += estimateMapMemory(this.fixturesById);
		jsOverhead += estimateMapMemory(this.fixturesByInternalId);
		jsOverhead += estimateMapMemory(this.jointsById);
		jsOverhead += estimateMapMemory(this.jointsByInternalId);

		// BufferViews
		jsOverhead += JS_OVERHEAD.BUFFER_VIEW * 4;

		// Bodies
		for (const id in this.bodiesById) {
			jsOverhead += this.bodiesById[id].getMemoryUsage();
		}

		// Fixtures (avoiding double-counting multi-ID fixtures)
		const uniqueFixtures = new Set<Fixture>();
		for (const id in this.fixturesById) {
			uniqueFixtures.add(this.fixturesById[id]);
		}
		for (const fixture of uniqueFixtures) {
			jsOverhead += fixture.getMemoryUsage();
		}

		// Joints (avoiding double-counting multi-ID joints)
		const uniqueJoints = new Set<Joint>();
		for (const id in this.jointsById) {
			uniqueJoints.add(this.jointsById[id]);
		}
		for (const id in this.jointsByInternalId) {
			uniqueJoints.add(this.jointsByInternalId[id]);
		}
		for (const joint of uniqueJoints) {
			jsOverhead += joint.getMemoryUsage();
		}

		return wasmHeap + jsOverhead;
	}

	queryBodiesAtPoint(x: number, y: number, mask: number = 0xffffffff): number[] {
		const hits = this.convertWasmVectorToArray(this.world.queryBodiesAtPoint(x, y, mask));
		return hits
			.map((internalId) => this.bodiesByInternalId[internalId]?.id)
			.filter((id) => id !== undefined) as number[];
	}

	queryFixturesAtPoint(x: number, y: number, mask: number = 0xffffffff): number[] {
		const hits = this.convertWasmVectorToArray(this.world.queryFixturesAtPoint(x, y, mask));
		return hits
			.map((internalId) => this.fixturesByInternalId[internalId]?.id)
			.filter((id) => id !== undefined) as number[];
	}

	step() {
		this.world.step();
		this.stepCount++;

		// Always refresh views after step because eventData growth might have triggered heap growth or vector reallocation
		this.refreshViews();

		// Process events
		const eventCount = this.world.getEventCount();
		if (eventCount > 0) {
			const eventData = this.world.getEventData();
			for (let i = 0; i < eventCount; i++) {
				const type = eventData[i * 6];
				const internalIdA = eventData[i * 6 + 1];
				const internalIdB = eventData[i * 6 + 2];
				const internalFIdA = eventData[i * 6 + 3];
				const internalFIdB = eventData[i * 6 + 4];
				const impulse = eventData[i * 6 + 5];

				const bodyA = this.bodiesByInternalId[internalIdA];
				const bodyB = this.bodiesByInternalId[internalIdB];
				const fixtureA = this.fixturesByInternalId[internalFIdA];
				const fixtureB = this.fixturesByInternalId[internalFIdB];

				if (!bodyA || (internalIdB !== 0 && !bodyB)) continue;

				const idA = bodyA.id;
				const idB = bodyB?.id;
				const fIdA = fixtureA?.id;
				const fIdB = fixtureB?.id;

				if (type === 0 && this.onCollisionStart) this.onCollisionStart(idA, idB, fIdA, fIdB, impulse);
				else if (type === 1 && this.onCollisionEnd) this.onCollisionEnd(idA, idB, fIdA, fIdB);
				else if (type === 2 && this.onSleep) this.onSleep(idA);
				else if (type === 3 && this.onWake) this.onWake(idA);
			}
		}
	}

	private convertWasmVectorToArray(hits: WasmVector): number[] {
		const results: number[] = [];
		for (let i = 0; i < hits.size(); i++) {
			results.push(hits.get(i));
		}
		hits.delete();
		return results;
	}
}
