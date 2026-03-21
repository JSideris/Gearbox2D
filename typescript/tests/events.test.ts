import { World } from "../src/world";
import { Body } from "../src/Body";
import { Fixture } from "../src/Fixture";
import {
	BODY_SIZE_I,
	BODY_FLAGS_OFFSET,
	FIXTURE_SIZE_I,
	FIXTURE_FLAGS_OFFSET,
	WANTS_EVENTS,
	FIXTURE_FLAGS,
	SHAPES,
	MAX_BODIES,
	MAX_FIXTURES,
} from "../src/constants";

// Mock the C++ world object
const createMockCppWorld = () => {
	const liveBodyIntData = new Int32Array(BODY_SIZE_I * MAX_BODIES);
	const liveBodyFloatData = new Float32Array(34 * MAX_BODIES);
	const liveFixtureIntData = new Int32Array(FIXTURE_SIZE_I * MAX_FIXTURES);
	const liveFixtureFloatData = new Float32Array(32 * MAX_FIXTURES);
	const eventData = new Float32Array(100);

	return {
		createBody: jest.fn((id, options) => {
			// Minimal mock implementation
			// SoA index: offset * MAX_CAPACITY + index
			const index = 0;
			liveBodyIntData[0 * MAX_BODIES + index] = id; // ID_OFFSET is 0
			if (options.wantsEvents) {
				liveBodyIntData[BODY_FLAGS_OFFSET * MAX_BODIES + index] |= WANTS_EVENTS;
			}
			return index;
		}),
		createFixture: jest.fn((bodyId, fixtureId, options) => {
			const fIndex = 0;
			// SoA index: offset * MAX_CAPACITY + index
			liveFixtureIntData[0 * MAX_FIXTURES + fIndex] = fixtureId || 999; // ID_OFFSET is 0
			if (options.wantsEvents) {
				liveFixtureIntData[FIXTURE_FLAGS_OFFSET * MAX_FIXTURES + fIndex] |= FIXTURE_FLAGS.WANTS_EVENTS;
			}
			return fIndex;
		}),
		getLiveBodyIntData: () => liveBodyIntData,
		getLiveBodyFloatData: () => liveBodyFloatData,
		getLiveFixtureIntData: () => liveFixtureIntData,
		getLiveFixtureFloatData: () => liveFixtureFloatData,
		getEventCount: () => 0,
		getFixtureCount: () => 1,
		getBodyCount: () => 1,
		clear: jest.fn(),
	};
};

describe("TypeScript Event Opt-in Support", () => {
	let mockCppWorld: any;
	let world: World;

	beforeEach(() => {
		mockCppWorld = createMockCppWorld();
		world = new World(mockCppWorld);
	});

	describe("Body Event Opt-in", () => {
		it("should correctly initialize wantsEvents from options in createBody", () => {
			const body = world.createBody({ id: 1, wantsEvents: true });
			expect(body.wantsEvents).toBe(true);
			const flags = world.liveBodyIntData[BODY_FLAGS_OFFSET * MAX_BODIES + body.index];
			expect(flags & WANTS_EVENTS).toBe(WANTS_EVENTS);
		});

		it("should correctly toggle wantsEvents at runtime on Body", () => {
			const body = world.createBody({ id: 1, wantsEvents: false });
			expect(body.wantsEvents).toBe(false);

			body.wantsEvents = true;
			expect(body.wantsEvents).toBe(true);
			let flags = world.liveBodyIntData[BODY_FLAGS_OFFSET * MAX_BODIES + body.index];
			expect(flags & WANTS_EVENTS).toBe(WANTS_EVENTS);

			body.wantsEvents = false;
			expect(body.wantsEvents).toBe(false);
			flags = world.liveBodyIntData[BODY_FLAGS_OFFSET * MAX_BODIES + body.index];
			expect(flags & WANTS_EVENTS).toBe(0);
		});
	});

	describe("Fixture Event Opt-in", () => {
		it("should correctly initialize wantsEvents from options in createFixture", () => {
			const body = world.createBody({ id: 1 });
			const fixture = world.createFixture(body.id, { shape: SHAPES.CIRCLE, radius: 1, wantsEvents: true });

			expect(fixture.wantsEvents).toBe(true);
			const flags = world.liveFixtureIntData[FIXTURE_FLAGS_OFFSET * MAX_FIXTURES + fixture.index];
			expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(FIXTURE_FLAGS.WANTS_EVENTS);
		});

		it("should correctly toggle wantsEvents at runtime on Fixture", () => {
			const body = world.createBody({ id: 1 });
			const fixture = world.createFixture(body.id, { shape: SHAPES.CIRCLE, radius: 1, wantsEvents: false });

			expect(fixture.wantsEvents).toBe(false);

			fixture.wantsEvents = true;
			expect(fixture.wantsEvents).toBe(true);
			let flags = world.liveFixtureIntData[FIXTURE_FLAGS_OFFSET * MAX_FIXTURES + fixture.index];
			expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(FIXTURE_FLAGS.WANTS_EVENTS);

			fixture.wantsEvents = false;
			expect(fixture.wantsEvents).toBe(false);
			flags = world.liveFixtureIntData[FIXTURE_FLAGS_OFFSET * MAX_FIXTURES + fixture.index];
			expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(0);
		});
	});
});
