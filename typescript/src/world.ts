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
	fixturesById: { [key: number]: Fixture } = {};
	jointsById: { [key: number]: Joint } = {};

	interpolationAlpha: number = 1.0;
	stepCount: number = 0;
	invDt: number = 60.0;

	/** @internal */
	_wasmMemoryGetter: (() => number) | null = null;

	onCollisionStart?: (idA: number, idB: number, fixtureIdA: number, fixtureIdB: number, impulse: number) => void;
	onCollisionEnd?: (idA: number, idB: number, fixtureIdA: number, fixtureIdB: number) => void;
	onSleep?: (id: number) => void;
	onWake?: (id: number) => void;

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
		this.fixturesById = {};
		this.jointsById = {};
		this.refreshViews();
	}

	destroy() {
		if (this.world) {
			this.world.delete();
			this.world = null;
		}
		this.bodiesById = {};
		this.fixturesById = {};
		this.jointsById = {};
	}

	createBody(id: number, options: BodyOptions): Body {
		return Body.create(this, id, options);
	}

	createFixture(bodyId: number, options: FixtureOptions, fixtureId?: number): Fixture {
		const body = this.bodiesById[bodyId];
		if (!body) throw new Error(`Body with id ${bodyId} not found`);
		return Fixture.create(body, options, fixtureId);
	}

	removeObject(id: number) {
		const body = this.bodiesById[id];
		if (body) {
			for (const fixture of body.fixtures) {
				for (const sub of fixture.subFixtures) {
					delete this.fixturesById[sub.id];
				}
			}
		}
		this.world.removeObject(id);
		this.refreshViews();
		delete this.bodiesById[id];
		// Re-sync indices after swap-with-last
		this.syncIndices();
	}

	syncIndices() {
		const bodyCount = this.world.getBodyCount();
		for (let i = 0; i < bodyCount; i++) {
			const id = this.bodyInts.get(i, BODY_ID_OFFSET);
			if (this.bodiesById[id]) {
				this.bodiesById[id].index = i;
			}
		}
		const fixtureCount = this.world.getFixtureCount();
		for (let i = 0; i < fixtureCount; i++) {
			const id = this.fixtureInts.get(i, FIXTURE_ID_OFFSET);
			const fixture = this.fixturesById[id];
			if (fixture) {
				fixture.updateSubIndex(id, i);
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
			const id = this.bodyInts.get(i, BODY_ID_OFFSET);
			const body = this.bodiesById[id];
			if (body) callback(body);
		}
	}

	createHingeJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): HingeJoint {
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

		this.world.createHingeJoint(id, bodyA.id, bodyB.id, anchorA.x, anchorA.y, anchorB.x, anchorB.y);
		const joint = new HingeJoint(id, this, bodyA, bodyB, anchorA, anchorB);
		this.jointsById[id] = joint;
		return joint;
	}

	createDistanceJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): DistanceJoint {
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

		this.world.createDistanceJoint(id, bodyA.id, bodyB.id, anchorA.x, anchorA.y, anchorB.x, anchorB.y, length);
		const joint = new DistanceJoint(id, this, bodyA, bodyB, anchorA, anchorB, length);
		this.jointsById[id] = joint;
		return joint;
	}

	createSpringJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): SpringJoint {
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
			id,
			bodyA.id,
			bodyB.id,
			anchorA.x,
			anchorA.y,
			anchorB.x,
			anchorB.y,
			length,
			frequencyHz,
			dampingRatio,
		);
		const joint = new SpringJoint(id, this, bodyA, bodyB, anchorA, anchorB, length, frequencyHz, dampingRatio);
		this.jointsById[id] = joint;
		return joint;
	}

	createGearJoint(id: number, joint1: HingeJoint, joint2: HingeJoint, ratio: number): GearJoint {
		this.world.createGearJoint(id, joint1.id, joint2.id, ratio);
		const joint = new GearJoint(id, this, joint1, joint2, ratio);
		this.jointsById[id] = joint;
		return joint;
	}

	removeJoint(id: number) {
		this.world.removeJoint(id);
		delete this.jointsById[id];
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
		jsOverhead += estimateMapMemory(this.fixturesById);
		jsOverhead += estimateMapMemory(this.jointsById);

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

		// Joints
		for (const id in this.jointsById) {
			jsOverhead += this.jointsById[id].getMemoryUsage();
		}

		return wasmHeap + jsOverhead;
	}

	queryBodiesAtPoint(x: number, y: number, mask: number = 0xffffffff): number[] {
		return this.convertWasmVectorToArray(this.world.queryBodiesAtPoint(x, y, mask));
	}

	queryFixturesAtPoint(x: number, y: number, mask: number = 0xffffffff): number[] {
		return this.convertWasmVectorToArray(this.world.queryFixturesAtPoint(x, y, mask));
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
				const idA = eventData[i * 6 + 1];
				const idB = eventData[i * 6 + 2];
				const fIdA = eventData[i * 6 + 3];
				const fIdB = eventData[i * 6 + 4];
				const impulse = eventData[i * 6 + 5];

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
