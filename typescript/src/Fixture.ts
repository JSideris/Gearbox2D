import {
	FIXTURE_SIZE_I,
	FIXTURE_SIZE_F,
	FIXTURE_ID_OFFSET,
	FIXTURE_BODY_INDEX_OFFSET,
	FIXTURE_SHAPE_OFFSET,
	FIXTURE_CATEGORY_BITS_OFFSET,
	FIXTURE_MASK_BITS_OFFSET,
	FIXTURE_FLAGS_OFFSET,
	FIXTURE_LOCAL_X_OFFSET,
	FIXTURE_LOCAL_Y_OFFSET,
	FIXTURE_LOCAL_R_OFFSET,
	FIXTURE_RADIUS_OFFSET,
	FIXTURE_WIDTH_OFFSET,
	FIXTURE_HEIGHT_OFFSET,
	FIXTURE_RESTITUTION_OFFSET,
	FIXTURE_S_FRICTION_OFFSET,
	FIXTURE_K_FRICTION_OFFSET,
	FIXTURE_AX1_OFFSET,
	FIXTURE_AY1_OFFSET,
	FIXTURE_AX2_OFFSET,
	FIXTURE_AY2_OFFSET,
	FIXTURE_MAX_EXTENT_OFFSET,
	FIXTURE_DENSITY_OFFSET,
	FIXTURE_VERTEX_COUNT_OFFSET,
	FIXTURE_VERTEX_START_OFFSET,
	FIXTURE_FLAGS,
	SHAPES,
} from "./constants.js";
import { RowView } from "./BufferAccessor.js";
import type { Body } from "./Body.js";
import { isConcave, decompose } from "./polygon-utils.js";
import type { FixtureOptions } from "./types.js";

export class Fixture {
	body: Body;
	/** @internal Internal sub-fixtures for concave polygons */
	subFixtures: { id: number; index: number }[] = [];

	private floats: RowView<Float32Array>;
	private ints: RowView<Int32Array>;

	constructor(index: number, body: Body, id?: number) {
		this.body = body;

		// Initialize subFixtures with the initial index so that this.index (and thus RowView) works
		this.subFixtures.push({ id: id ?? 0, index });

		this.floats = new RowView(
			() => this.body.world.liveFixtureFloatData,
			FIXTURE_SIZE_F,
			() => this.index,
		);
		this.ints = new RowView(
			() => this.body.world.liveFixtureIntData,
			FIXTURE_SIZE_I,
			() => this.index,
		);

		if (id === undefined) {
			this.subFixtures[0].id = this.ints.get(FIXTURE_ID_OFFSET);
		}
	}

	/** @internal Create a new fixture (handles decomposition and WASM object creation) */
	static create(body: Body, options: FixtureOptions, fixtureId?: number): Fixture {
		const world = body.world;

		if (options.shape === SHAPES.POLYGON && options.vertices && isConcave(options.vertices)) {
			const pieces = decompose(options.vertices);
			let firstProxy: Fixture | null = null;

			for (const piece of pieces) {
				const pieceOptions = { ...options, vertices: piece };
				const fIndex = world.world.addFixture(body.id, 0, pieceOptions, false);
				world.refreshViews();
				const id = world.fixtureInts.get(fIndex, FIXTURE_ID_OFFSET);

				if (!firstProxy) {
					firstProxy = new Fixture(fIndex, body, id);
				} else {
					firstProxy.subFixtures.push({ id, index: fIndex });
				}
				world.fixturesById[id] = firstProxy;
			}
			body.recomputeMassProperties();
			body.fixtures.push(firstProxy!);
			return firstProxy!;
		}

		const fIndex = world.world.addFixture(body.id, fixtureId || 0, options, true);
		world.refreshViews();
		const fixture = new Fixture(fIndex, body);
		world.fixturesById[fixture.id] = fixture;
		body.fixtures.push(fixture);

		return fixture;
	}

	/** The primary sub-fixture ID (used as the user-facing ID) */
	get id() {
		return this.subFixtures[0].id;
	}
	/** The primary sub-fixture index in the data buffers */
	get index() {
		return this.subFixtures[0].index;
	}

	/** @internal Updates the index of a specific sub-fixture */
	updateSubIndex(id: number, index: number) {
		for (const sub of this.subFixtures) {
			if (sub.id === id) {
				sub.index = index;
				return;
			}
		}
	}

	private forEachSubFixture(callback: (sub: { id: number; index: number }, cppObj: any) => void) {
		for (const sub of this.subFixtures) {
			const cppObj = this.body.world.world.getFixture(sub.id);
			callback(sub, cppObj);
		}
	}

	private setAllFloats(offset: number, value: number) {
		for (const sub of this.subFixtures) {
			this.body.world.fixtureFloats.set(sub.index, offset, value);
		}
	}

	get shape() {
		return this.ints.get(FIXTURE_SHAPE_OFFSET);
	}
	get categoryBits() {
		return this.ints.get(FIXTURE_CATEGORY_BITS_OFFSET);
	}
	get maskBits() {
		return this.ints.get(FIXTURE_MASK_BITS_OFFSET);
	}
	get flags() {
		return this.ints.get(FIXTURE_FLAGS_OFFSET);
	}

	get isSensor() {
		return (this.flags & FIXTURE_FLAGS.IS_SENSOR) !== 0;
	}
	set isSensor(v: boolean) {
		this.forEachSubFixture((_, cppObj) => cppObj?.setSensor(v));
		this.body.world.refreshViews();
	}

	get wantsEvents() {
		return (this.flags & FIXTURE_FLAGS.WANTS_EVENTS) !== 0;
	}
	set wantsEvents(v: boolean) {
		for (const sub of this.subFixtures) {
			const current = this.body.world.fixtureInts.get(sub.index, FIXTURE_FLAGS_OFFSET);
			const next = v ? current | FIXTURE_FLAGS.WANTS_EVENTS : current & ~FIXTURE_FLAGS.WANTS_EVENTS;
			this.body.world.fixtureInts.set(sub.index, FIXTURE_FLAGS_OFFSET, next);
		}
	}

	get localX() {
		return this.floats.get(FIXTURE_LOCAL_X_OFFSET);
	}
	get localY() {
		return this.floats.get(FIXTURE_LOCAL_Y_OFFSET);
	}
	get localR() {
		return this.floats.get(FIXTURE_LOCAL_R_OFFSET);
	}

	get radius() {
		return this.floats.get(FIXTURE_RADIUS_OFFSET);
	}
	set radius(v) {
		this.setAllFloats(FIXTURE_RADIUS_OFFSET, v);
	}

	get width() {
		return this.floats.get(FIXTURE_WIDTH_OFFSET);
	}
	set width(v) {
		this.setAllFloats(FIXTURE_WIDTH_OFFSET, v);
	}

	get height() {
		return this.floats.get(FIXTURE_HEIGHT_OFFSET);
	}
	set height(v) {
		this.setAllFloats(FIXTURE_HEIGHT_OFFSET, v);
	}

	get restitution() {
		return this.floats.get(FIXTURE_RESTITUTION_OFFSET);
	}
	set restitution(v) {
		this.setAllFloats(FIXTURE_RESTITUTION_OFFSET, v);
	}

	get staticFriction() {
		return this.floats.get(FIXTURE_S_FRICTION_OFFSET);
	}
	set staticFriction(v) {
		this.setAllFloats(FIXTURE_S_FRICTION_OFFSET, v);
	}

	get kineticFriction() {
		return this.floats.get(FIXTURE_K_FRICTION_OFFSET);
	}
	set kineticFriction(v) {
		this.setAllFloats(FIXTURE_K_FRICTION_OFFSET, v);
	}

	get ax1() {
		return this.floats.get(FIXTURE_AX1_OFFSET);
	}
	get ay1() {
		return this.floats.get(FIXTURE_AY1_OFFSET);
	}
	get ax2() {
		return this.floats.get(FIXTURE_AX2_OFFSET);
	}
	get ay2() {
		return this.floats.get(FIXTURE_AY2_OFFSET);
	}
	get maxExtent() {
		return this.floats.get(FIXTURE_MAX_EXTENT_OFFSET);
	}

	get density() {
		return this.floats.get(FIXTURE_DENSITY_OFFSET);
	}
	set density(v) {
		this.forEachSubFixture((sub, cppObj) => {
			this.body.world.fixtureFloats.set(sub.index, FIXTURE_DENSITY_OFFSET, v);
			cppObj?.setDensity(v);
		});
		this.body.world.refreshViews();
	}

	/** @internal Returns vertices for all internal sub-fixtures for debugging/rendering */
	get debugVertices(): { x: number; y: number }[][] {
		return this.subFixtures.map((sub) => {
			const count = this.body.world.fixtureFloats.get(sub.index, FIXTURE_VERTEX_COUNT_OFFSET);
			const verts: { x: number; y: number }[] = [];
			const startOffset = FIXTURE_VERTEX_START_OFFSET;
			for (let i = 0; i < count; i++) {
				verts.push({
					x: this.body.world.fixtureFloats.get(sub.index, startOffset + i * 2),
					y: this.body.world.fixtureFloats.get(sub.index, startOffset + i * 2 + 1),
				});
			}
			return verts;
		});
	}

	get vertexCount() {
		return this.floats.get(FIXTURE_VERTEX_COUNT_OFFSET);
	}
	get vertices() {
		const count = this.vertexCount;
		const verts: { x: number; y: number }[] = [];
		const startOffset = FIXTURE_VERTEX_START_OFFSET;
		for (let i = 0; i < count; i++) {
			verts.push({
				x: this.floats.get(startOffset + i * 2),
				y: this.floats.get(startOffset + i * 2 + 1),
			});
		}
		return verts;
	}
}
