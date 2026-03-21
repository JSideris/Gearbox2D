import {
	BODY_SIZE_I,
	BODY_SIZE_F,
	BODY_ID_OFFSET,
	BODY_TYPE_OFFSET,
	BODY_FLAGS_OFFSET,
	BODY_FIXTURE_COUNT_OFFSET,
	BODY_X_OFFSET,
	BODY_Y_OFFSET,
	BODY_R_OFFSET,
	BODY_VX_OFFSET,
	BODY_VY_OFFSET,
	BODY_RS_OFFSET,
	BODY_MASS_OFFSET,
	BODY_INV_MASS_OFFSET,
	BODY_G_SCALE_OFFSET,
	BODY_DAMPING_OFFSET,
	BODY_ANGULAR_DAMPING_OFFSET,
	BODY_FX_OFFSET,
	BODY_FY_OFFSET,
	BODY_IX_OFFSET,
	BODY_IY_OFFSET,
	BODY_IA_OFFSET,
	BODY_NFX_OFFSET,
	BODY_NFY_OFFSET,
	BODY_NIX_OFFSET,
	BODY_NIY_OFFSET,
	BODY_NIA_OFFSET,
	BODY_INV_INERTIA_OFFSET,
	BODY_PREV_X_OFFSET,
	BODY_PREV_Y_OFFSET,
	BODY_PREV_R_OFFSET,
	BODY_TYPES,
	WANTS_EVENTS,
	IS_SLEEPING,
} from "./constants.js";
import { RowView } from "./BufferAccessor.js";
import type { World, Joint } from "./world.js";
import { Fixture } from "./Fixture.js";
import type { BodyOptions, FixtureOptions } from "./types.js";
import { JS_OVERHEAD, estimateStringMemory, estimateArrayMemory } from "./MemoryEstimator.js";

export class Body {
	_externalId: number | undefined;
	internalId: number;
	index: number;
	world: World;
	fixtures: Fixture[] = [];
	joints: Joint[] = []; // Track joints for cleanup
	color?: string;

	private floats: RowView<Float32Array>;
	private ints: RowView<Int32Array>;

	constructor(index: number, world: World, internalId: number, externalId: number | undefined) {
		this.index = index;
		this.world = world;
		this.internalId = internalId;
		this._externalId = externalId;

		this.floats = new RowView(
			() => this.world.liveBodyFloatData,
			BODY_SIZE_F,
			() => this.index,
		);
		this.ints = new RowView(
			() => this.world.liveBodyIntData,
			BODY_SIZE_I,
			() => this.index,
		);

		// No longer setting internalId from view because it's passed in
	}

	get id() {
		return this._externalId;
	}

	/** @internal Create a new body (handles WASM object creation and initial fixtures) */
	static create(world: World, internalId: number, externalId: number | undefined, options: BodyOptions): Body {
		const { fixtures, shape, id, ...rest } = options;
		const index = world.world.createBody(internalId, rest);
		world.refreshViews();
		const body = new Body(index, world, internalId, externalId);
		body.color = options.color;

		if (fixtures) {
			for (const fOpt of fixtures) {
				Fixture.create(body, fOpt);
			}
		}
		if (shape !== undefined) {
			const { fixtureId, ...fixtureRest } = rest as any;
			Fixture.create(body, { ...fixtureRest, shape, id: fixtureId } as FixtureOptions);
		}

		return body;
	}

	private get cppBody() {
		return this.world.world.getBody(this.internalId);
	}

	createFixture(options: FixtureOptions | FixtureOptions[]): Fixture | Fixture[] {
		if (Array.isArray(options)) {
			return options.map((opt) => Fixture.create(this, opt));
		}
		return Fixture.create(this, options);
	}

	get type() {
		return this.ints.get(BODY_TYPE_OFFSET);
	}
	get flags() {
		return this.ints.get(BODY_FLAGS_OFFSET);
	}
	get isSleeping() {
		return (this.flags & IS_SLEEPING) !== 0;
	}

	get wantsEvents() {
		return (this.flags & WANTS_EVENTS) !== 0;
	}
	set wantsEvents(v: boolean) {
		if (v) {
			this.ints.set(BODY_FLAGS_OFFSET, this.ints.get(BODY_FLAGS_OFFSET) | WANTS_EVENTS);
		} else {
			this.ints.set(BODY_FLAGS_OFFSET, this.ints.get(BODY_FLAGS_OFFSET) & ~WANTS_EVENTS);
		}
	}

	get x() {
		return this.floats.get(BODY_X_OFFSET);
	}
	set x(v) {
		this.floats.set(BODY_X_OFFSET, v);
		this.wakeUp();
	}
	get y() {
		return this.floats.get(BODY_Y_OFFSET);
	}
	set y(v) {
		this.floats.set(BODY_Y_OFFSET, v);
		this.wakeUp();
	}
	get r() {
		return this.floats.get(BODY_R_OFFSET);
	}
	set r(v) {
		this.floats.set(BODY_R_OFFSET, v);
		this.wakeUp();
	}

	get vx() {
		return this.floats.get(BODY_VX_OFFSET);
	}
	set vx(v) {
		this.floats.set(BODY_VX_OFFSET, v);
		this.wakeUp();
	}
	get vy() {
		return this.floats.get(BODY_VY_OFFSET);
	}
	set vy(v) {
		this.floats.set(BODY_VY_OFFSET, v);
		this.wakeUp();
	}
	get rs() {
		return this.floats.get(BODY_RS_OFFSET);
	}
	set rs(v) {
		this.floats.set(BODY_RS_OFFSET, v);
		this.wakeUp();
	}

	get mass() {
		return this.floats.get(BODY_MASS_OFFSET);
	}
	set mass(v) {
		if (this.type !== BODY_TYPES.FIXED_OBJECT && this.type !== BODY_TYPES.KINEMATIC_OBJECT) {
			this.floats.set(BODY_MASS_OFFSET, v);
			this.floats.set(BODY_INV_MASS_OFFSET, v !== 0 ? 1 / v : 0);
		}
	}

	get gScale() {
		return this.floats.get(BODY_G_SCALE_OFFSET);
	}
	set gScale(v) {
		this.floats.set(BODY_G_SCALE_OFFSET, v);
	}

	get linearDamping() {
		return this.floats.get(BODY_DAMPING_OFFSET);
	}
	set linearDamping(v) {
		this.floats.set(BODY_DAMPING_OFFSET, v);
	}

	get angularDamping() {
		return this.floats.get(BODY_ANGULAR_DAMPING_OFFSET);
	}
	set angularDamping(v) {
		this.floats.set(BODY_ANGULAR_DAMPING_OFFSET, v);
	}

	get canSleep() {
		return this.cppBody?.canSleep ?? true;
	}
	set canSleep(v: boolean) {
		const cppObj = this.cppBody;
		if (cppObj) {
			cppObj.canSleep = v;
		}
	}

	get sleepTimeRequired() {
		return this.cppBody?.sleepTimeRequired ?? 1.0;
	}
	set sleepTimeRequired(v: number) {
		const cppObj = this.cppBody;
		if (cppObj) {
			cppObj.sleepTimeRequired = v;
		}
	}

	get prevX() {
		return this.floats.get(BODY_PREV_X_OFFSET);
	}
	get prevY() {
		return this.floats.get(BODY_PREV_Y_OFFSET);
	}
	get prevR() {
		return this.floats.get(BODY_PREV_R_OFFSET);
	}

	get fx() {
		return this.floats.get(BODY_FX_OFFSET);
	}
	get fy() {
		return this.floats.get(BODY_FY_OFFSET);
	}
	get ix() {
		return this.floats.get(BODY_IX_OFFSET);
	}
	get iy() {
		return this.floats.get(BODY_IY_OFFSET);
	}
	get nfx() {
		return this.floats.get(BODY_NFX_OFFSET);
	}
	get nfy() {
		return this.floats.get(BODY_NFY_OFFSET);
	}
	get nix() {
		return this.floats.get(BODY_NIX_OFFSET);
	}
	get niy() {
		return this.floats.get(BODY_NIY_OFFSET);
	}
	get ia() {
		return this.floats.get(BODY_IA_OFFSET);
	}
	get nia() {
		return this.floats.get(BODY_NIA_OFFSET);
	}

	recomputeMassProperties() {
		const cppObj = this.cppBody;
		if (cppObj) {
			cppObj.recomputeMassProperties();
			this.world.refreshViews();
		}
	}

	wakeUp() {
		this.cppBody?.wakeUp();
	}
	sleep() {
		this.cppBody?.sleep();
	}
	forceWakeUp() {
		this.cppBody?.forceWakeUp();
	}

	applyForce(x: number, y: number) {
		this.floats.add(BODY_NFX_OFFSET, x);
		this.floats.add(BODY_NFY_OFFSET, y);
		this.wakeUp();
	}

	applyImpulse(x: number, y: number, px = 0, py = 0) {
		this.floats.add(BODY_NIX_OFFSET, x);
		this.floats.add(BODY_NIY_OFFSET, y);
		if (px !== 0 || py !== 0) {
			const torque = x * py - y * px;
			this.applyAngularImpulse(torque);
		} else {
			this.wakeUp();
		}
	}

	applyAngularImpulse(torque: number) {
		this.floats.add(BODY_NIA_OFFSET, torque);
		this.wakeUp();
	}

	localToWorld(localPoint: { x: number; y: number }) {
		const cos = Math.cos(this.r);
		const sin = Math.sin(this.r);
		return {
			x: this.x + (localPoint.x * cos - localPoint.y * sin),
			y: this.y + (localPoint.x * sin + localPoint.y * cos),
		};
	}

	worldToLocal(worldPoint: { x: number; y: number }) {
		const dx = worldPoint.x - this.x;
		const dy = worldPoint.y - this.y;
		const cos = Math.cos(-this.r);
		const sin = Math.sin(-this.r);
		return {
			x: dx * cos - dy * sin,
			y: dx * sin + dy * cos,
		};
	}

	getMemoryUsage(): number {
		return (
			JS_OVERHEAD.OBJECT_BASE +
			estimateStringMemory(this.color) +
			estimateArrayMemory(this.fixtures) +
			JS_OVERHEAD.ROW_VIEW * 2 // floats and ints RowViews
		);
	}
}
