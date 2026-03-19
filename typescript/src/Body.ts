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
} from "./constants.js";
import type { World, FixtureOptions } from "./world.js";
import type { Fixture } from "./Fixture.js";

export class Body {
	id: number;
	index: number;
	world: World;
	fixtures: Fixture[] = [];
	color?: string;

	constructor(index: number, world: World) {
		this.index = index;
		this.world = world;
		this.id = world.liveBodyIntData[index * BODY_SIZE_I + BODY_ID_OFFSET];
	}

	createFixture(options: FixtureOptions | FixtureOptions[], id?: number): Fixture | Fixture[] {
		if (Array.isArray(options)) {
			return options.map((opt) => this.world.addFixture(this.id, opt));
		}
		return this.world.addFixture(this.id, options, id);
	}

	addFixture(options: FixtureOptions, id?: number): Fixture {
		return this.createFixture(options, id) as Fixture;
	}

	get type() {
		return this.world.liveBodyIntData[this.index * BODY_SIZE_I + BODY_TYPE_OFFSET];
	}
	get flags() {
		return this.world.liveBodyIntData[this.index * BODY_SIZE_I + BODY_FLAGS_OFFSET];
	}

	get wantsEvents() {
		return (this.flags & WANTS_EVENTS) !== 0;
	}
	set wantsEvents(v: boolean) {
		if (v) {
			this.world.liveBodyIntData[this.index * BODY_SIZE_I + BODY_FLAGS_OFFSET] |= WANTS_EVENTS;
		} else {
			this.world.liveBodyIntData[this.index * BODY_SIZE_I + BODY_FLAGS_OFFSET] &= ~WANTS_EVENTS;
		}
	}

	get x() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_X_OFFSET];
	}
	set x(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_X_OFFSET] = v;
		this.wakeUp();
	}
	get y() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_Y_OFFSET];
	}
	set y(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_Y_OFFSET] = v;
		this.wakeUp();
	}
	get r() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_R_OFFSET];
	}
	set r(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_R_OFFSET] = v;
		this.wakeUp();
	}

	get vx() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_VX_OFFSET];
	}
	set vx(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_VX_OFFSET] = v;
		this.wakeUp();
	}
	get vy() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_VY_OFFSET];
	}
	set vy(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_VY_OFFSET] = v;
		this.wakeUp();
	}
	get rs() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_RS_OFFSET];
	}
	set rs(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_RS_OFFSET] = v;
		this.wakeUp();
	}

	get mass() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_MASS_OFFSET];
	}
	set mass(v) {
		if (this.type !== BODY_TYPES.FIXED_OBJECT && this.type !== BODY_TYPES.KINEMATIC_OBJECT) {
			this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_MASS_OFFSET] = v;
			this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_INV_MASS_OFFSET] = v !== 0 ? 1 / v : 0;
		}
	}

	get gScale() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_G_SCALE_OFFSET];
	}
	set gScale(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_G_SCALE_OFFSET] = v;
	}

	get linearDamping() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_DAMPING_OFFSET];
	}
	set linearDamping(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_DAMPING_OFFSET] = v;
	}

	get angularDamping() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_ANGULAR_DAMPING_OFFSET];
	}
	set angularDamping(v) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_ANGULAR_DAMPING_OFFSET] = v;
	}

	get prevX() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_PREV_X_OFFSET];
	}
	get prevY() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_PREV_Y_OFFSET];
	}
	get prevR() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_PREV_R_OFFSET];
	}

	get fx() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_FX_OFFSET];
	}
	get fy() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_FY_OFFSET];
	}
	get ix() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_IX_OFFSET];
	}
	get iy() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_IY_OFFSET];
	}
	get nfx() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NFX_OFFSET];
	}
	get nfy() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NFY_OFFSET];
	}
	get nix() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIX_OFFSET];
	}
	get niy() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIY_OFFSET];
	}
	get ia() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_IA_OFFSET];
	}
	get nia() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIA_OFFSET];
	}
	get angularImpulse() {
		return this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_IA_OFFSET];
	}

	recomputeMassProperties() {
		const cppObj = this.world.world.getBody(this.id);
		if (cppObj) {
			cppObj.recomputeMassProperties();
			this.world.refreshViews();
		}
	}

	wakeUp() {
		const cppObj = this.world.world.getBody(this.id);
		if (cppObj) cppObj.wakeUp();
	}

	applyForce(x: number, y: number) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NFX_OFFSET] += x;
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NFY_OFFSET] += y;
		this.wakeUp();
	}

	applyImpulse(x: number, y: number, px = 0, py = 0) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIX_OFFSET] += x;
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIY_OFFSET] += y;
		if (px !== 0 || py !== 0) {
			const torque = x * py - y * px;
			this.applyAngularImpulse(torque);
		} else {
			this.wakeUp();
		}
	}

	applyAngularImpulse(torque: number) {
		this.world.liveBodyFloatData[this.index * BODY_SIZE_F + BODY_NIA_OFFSET] += torque;
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
}
