import { World } from "../src/world";
import { SHAPES } from "../src/constants";

const createMockCppWorld = () => {
	const liveBodyIntData = new Int32Array(100);
	const liveBodyFloatData = new Float32Array(100);
	const liveFixtureIntData = new Int32Array(100);
	const liveFixtureFloatData = new Float32Array(100);

	return {
		createBody: jest.fn((id, options) => {
			liveBodyIntData[0] = id;
			return 0;
		}),
		createFixture: jest.fn((bodyId, fixtureId, options) => {
			liveFixtureIntData[0] = fixtureId;
			return 0;
		}),
		createHingeJoint: jest.fn(),
		removeObject: jest.fn(),
		updateBodyId: jest.fn(),
		updateFixtureId: jest.fn(),
		updateJointId: jest.fn(),
		syncDefragmentedIds: jest.fn(),
		getLiveBodyIntData: () => liveBodyIntData,
		getLiveBodyFloatData: () => liveBodyFloatData,
		getLiveFixtureIntData: () => liveFixtureIntData,
		getLiveFixtureFloatData: () => liveFixtureFloatData,
		getEventCount: () => 0,
		getFixtureCount: () => 0,
		getBodyCount: () => 0,
		clear: jest.fn(),
	};
};

describe("ID Management and Defragmentation", () => {
	let mockCppWorld: any;
	let world: World;

	beforeEach(() => {
		mockCppWorld = createMockCppWorld();
		world = new World(mockCppWorld);
	});

	it("should handle optional external IDs correctly", () => {
		const bodyWithId = world.createBody({ id: 100 });
		const bodyWithoutId = world.createBody({});

		expect(bodyWithId.id).toBe(100);
		expect(bodyWithoutId.id).toBeUndefined();

		expect(world.getBodyById(100)).toBe(bodyWithId);
		// @ts-ignore - testing internal ID shouldn't be found in bodiesById
		expect(world.getBodyById(bodyWithoutId.internalId)).toBeUndefined();
	});

	it("should trigger defragmentation when threshold is exceeded", () => {
		world.setDefragThreshold(3);

		const b1 = world.createBody({ id: 10 }); // internal 1
		const b2 = world.createBody({ id: 20 }); // internal 2

		expect(mockCppWorld.updateBodyId).not.toHaveBeenCalled();

		// This should trigger defrag for b1, b2, and then create b3
		const b3 = world.createBody({ id: 30 }); // internal 3 >= threshold 3

		expect(mockCppWorld.updateBodyId).toHaveBeenCalledWith(1, 1);
		expect(mockCppWorld.updateBodyId).toHaveBeenCalledWith(2, 2);
		expect(mockCppWorld.syncDefragmentedIds).toHaveBeenCalled();

		expect(b1.internalId).toBe(1);
		expect(b2.internalId).toBe(2);
		expect(b3.internalId).toBe(3);
		expect(world.nextInternalBodyId).toBe(4);
	});

	it("should reassign sequential internal IDs during defragmentation", () => {
		world.setDefragThreshold(3);

		const b1 = world.createBody({ id: 1 });
		world.removeBody(b1); // nextInternalBodyId is 2

		const b2 = world.createBody({ id: 2 }); // internalId 2

		// nextInternalBodyId is 3, which matches threshold
		const b3 = world.createBody({ id: 3 });

		// b2 (old 2) should become new 1
		// b3 triggers defrag BEFORE it is created, so it isn't in defrag list.
		// It will then be assigned the NEXT ID after defrag, which is 2.
		expect(mockCppWorld.updateBodyId).toHaveBeenCalledWith(2, 1);
		expect(mockCppWorld.updateBodyId).toHaveBeenCalledTimes(1);

		expect(b2.internalId).toBe(1);
		expect(b3.internalId).toBe(2);
		expect(world.nextInternalBodyId).toBe(3);
	});

	it("should handle joints and fixtures during defragmentation", () => {
		const body = world.createBody({ id: 1 });
		const fixture = world.createFixture(body.id!, { shape: SHAPES.CIRCLE, radius: 1 });
		const joint = world.createHingeJoint(body, body, {});

		world.setDefragThreshold(2);
		// Trigger defrag by creating another body
		world.createBody({ id: 2 });

		expect(mockCppWorld.updateFixtureId).toHaveBeenCalled();
		expect(mockCppWorld.updateJointId).toHaveBeenCalled();
	});

	it("should allow duplicate external IDs to be dropped and handle lookups correctly", () => {
		const b1 = world.createBody({ id: 100 });
		const b2 = world.createBody({ id: 100 }); // Overwrites b1 in map

		expect(world.getBodyById(100)).toBe(b2);

		world.removeBody(b2);
		expect(world.getBodyById(100)).toBeUndefined(); // b1 is still alive but lost from map
	});
});
