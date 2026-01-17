
import { World } from '../src/world';
import { Body } from '../src/Body';
import { Fixture } from '../src/Fixture';
import { 
    BODY_SIZE_I, BODY_FLAGS_OFFSET, 
    FIXTURE_SIZE_I, FIXTURE_FLAGS_OFFSET,
    WANTS_EVENTS, FIXTURE_FLAGS, SHAPES
} from '../src/constants';

// Mock the C++ world object
const createMockCppWorld = () => {
    const liveBodyIntData = new Int32Array(100);
    const liveBodyFloatData = new Float32Array(100);
    const liveFixtureIntData = new Int32Array(100);
    const liveFixtureFloatData = new Float32Array(100);
    const eventData = new Float32Array(100);

    return {
        makeBody: jest.fn((id, options) => {
            // Minimal mock implementation
            liveBodyIntData[0 * BODY_SIZE_I + 0] = id; // ID
            if (options.wantsEvents) {
                liveBodyIntData[0 * BODY_SIZE_I + BODY_FLAGS_OFFSET] |= WANTS_EVENTS;
            }
            return 0; // index
        }),
        addFixture: jest.fn((bodyId, fixtureId, options) => {
            const fIndex = 0;
            liveFixtureIntData[fIndex * FIXTURE_SIZE_I + 0] = fixtureId || 999;
            if (options.wantsEvents) {
                liveFixtureIntData[fIndex * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET] |= FIXTURE_FLAGS.WANTS_EVENTS;
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

describe('TypeScript Event Opt-in Support', () => {
    let mockCppWorld: any;
    let world: World;

    beforeEach(() => {
        mockCppWorld = createMockCppWorld();
        world = new World(mockCppWorld);
    });

    describe('Body Event Opt-in', () => {
        it('should correctly initialize wantsEvents from options in makeBody', () => {
            const body = world.makeBody(1, { wantsEvents: true });
            expect(body.wantsEvents).toBe(true);
            const flags = world.liveBodyIntData[body.index * BODY_SIZE_I + BODY_FLAGS_OFFSET];
            expect(flags & WANTS_EVENTS).toBe(WANTS_EVENTS);
        });

        it('should correctly toggle wantsEvents at runtime on Body', () => {
            const body = world.makeBody(1, { wantsEvents: false });
            expect(body.wantsEvents).toBe(false);

            body.wantsEvents = true;
            expect(body.wantsEvents).toBe(true);
            let flags = world.liveBodyIntData[body.index * BODY_SIZE_I + BODY_FLAGS_OFFSET];
            expect(flags & WANTS_EVENTS).toBe(WANTS_EVENTS);

            body.wantsEvents = false;
            expect(body.wantsEvents).toBe(false);
            flags = world.liveBodyIntData[body.index * BODY_SIZE_I + BODY_FLAGS_OFFSET];
            expect(flags & WANTS_EVENTS).toBe(0);
        });
    });

    describe('Fixture Event Opt-in', () => {
        it('should correctly initialize wantsEvents from options in addFixture', () => {
            const body = world.makeBody(1, {});
            const fixture = world.addFixture(body.id, { shape: SHAPES.CIRCLE, radius: 1, wantsEvents: true });
            
            expect(fixture.wantsEvents).toBe(true);
            const flags = world.liveFixtureIntData[fixture.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET];
            expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(FIXTURE_FLAGS.WANTS_EVENTS);
        });

        it('should correctly toggle wantsEvents at runtime on Fixture', () => {
            const body = world.makeBody(1, {});
            const fixture = world.addFixture(body.id, { shape: SHAPES.CIRCLE, radius: 1, wantsEvents: false });
            
            expect(fixture.wantsEvents).toBe(false);

            fixture.wantsEvents = true;
            expect(fixture.wantsEvents).toBe(true);
            let flags = world.liveFixtureIntData[fixture.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET];
            expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(FIXTURE_FLAGS.WANTS_EVENTS);

            fixture.wantsEvents = false;
            expect(fixture.wantsEvents).toBe(false);
            flags = world.liveFixtureIntData[fixture.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET];
            expect(flags & FIXTURE_FLAGS.WANTS_EVENTS).toBe(0);
        });
    });
});
