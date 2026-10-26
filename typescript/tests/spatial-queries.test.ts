// PER-856: TS side of the spatial queries (id mapping, view re-fetching) against a mock C++ world.
// The real WASM path is covered by scripts/spatial-query-wasm-test.mjs.
import { World } from "../src/world";
import { QUERY_FLAGS } from "../src/constants";

function mockWorld() {
	const header = new Int32Array(4);
	let hits = new Int32Array(8);
	let rays = new Float32Array(20);
	let offsets = new Int32Array(4);
	let input = new Float32Array(0);
	let exclude = new Int32Array(0);
	const calls = { views: 0, queries: 0 };
	const cpp: any = {
		getLiveBodyFloatData: () => new Float32Array(1),
		getLiveBodyIntData: () => new Int32Array(1),
		getLiveFixtureFloatData: () => new Float32Array(1),
		getLiveFixtureIntData: () => new Int32Array(1),
		getQueryHeader: () => header,
		getQueryHitsView: () => (calls.views++, hits),
		getRayHitsView: () => rays,
		getBatchOffsetsView: () => offsets,
		getBatchInputView: () => input,
		getBatchExcludeView: () => exclude,
		reserveQueryBatch: (n: number) => {
			input = new Float32Array(n * 3);
			exclude = new Int32Array(n).fill(-1);
			header[0]++;
		},
		queryRadius: (_x: number, _y: number, _r: number, _m: number, flags: number) => {
			calls.queries++;
			expect(flags & QUERY_FLAGS.UNIQUE_BODIES).toBeTruthy();
			hits.set([11, 1, 12, 2]);
			return 2;
		},
		queryAABB: () => {
			// Grow the hit buffer: the generation bump must make TS re-fetch the view.
			hits = new Int32Array(64);
			hits.set([12, 2]);
			header[0]++;
			return 1;
		},
		raycast: (_a: number, _b: number, _c: number, _d: number, _m: number, flags: number, ex: number) => {
			expect(ex).toBe(7);
			if (flags & QUERY_FLAGS.RAY_ALL) {
				hits.set([11, 1, 12, 2]);
				rays.set([0.25, 1, 2, -1, 0, 0.5, 3, 4, 0, 1]);
				return 2;
			}
			hits.set([12, 2]);
			rays.set([0.5, 3, 4, 0, 1]);
			return 1;
		},
		queryRadiusBatch: (count: number) => {
			expect(Array.from(input.slice(0, 6))).toEqual([1, 2, 3, 4, 5, 6]);
			expect(Array.from(exclude.slice(0, 2))).toEqual([7, -1]);
			offsets.set([0, 1, 2].slice(0, count + 1));
			hits.set([12, 2, 11, 1]);
			return 2;
		},
	};
	return { cpp, calls };
}

describe("spatial queries (TS wrapper)", () => {
	function setup() {
		const { cpp, calls } = mockWorld();
		const world = new World(cpp);
		const a = { id: 100, internalId: 1 } as any;
		const b = { id: 200, internalId: 2 } as any;
		world.bodiesByInternalId[1] = a;
		world.bodiesByInternalId[2] = b;
		world.fixturesByInternalId[11] = { id: 1100 } as any;
		world.fixturesByInternalId[12] = { id: 1200 } as any;
		return { world, calls, a, b };
	}

	it("maps internal ids to bodies and only re-fetches views when the generation changes", () => {
		const { world, calls, a, b } = setup();
		expect(world.queryRadius(0, 0, 5)).toEqual([a, b]);
		const viewsAfterFirst = calls.views;
		expect(world.queryRadius(0, 0, 5)).toEqual([a, b]);
		expect(calls.views).toBe(viewsAfterFirst); // no extra crossings in steady state
		expect(world.queryAABB(0, 0, 1, 1)).toEqual([b]); // buffer grew
		expect(calls.views).toBe(viewsAfterFirst + 1);
		expect(world.queryHits.length).toBe(64);
	});

	it("raycast / raycastAll return hits with fraction, point and normal", () => {
		const { world, a, b } = setup();
		const shooter = { internalId: 7 } as any;
		const hit = world.raycast(0, 0, 10, 0, { exclude: shooter });
		expect(hit).toMatchObject({ body: b, fraction: 0.5, x: 3, y: 4, nx: 0, ny: 1 });
		const all = world.raycastAll(0, 0, 10, 0, { exclude: shooter });
		expect(all.map((h) => h.body)).toEqual([a, b]);
		expect(all[0].fraction).toBe(0.25);
	});

	it("queryRadiusBatch writes inputs once and splits results by offsets", () => {
		const { world, a, b } = setup();
		const res = world.queryRadiusBatch([1, 2, 3, 4, 5, 6], [{ internalId: 7 } as any, null]);
		expect(res).toEqual([[b], [a]]);
	});
});
