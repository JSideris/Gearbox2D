// PER-871: TS side of native pathfinding (request staging, view re-fetching, result decoding) against a
// mock C++ world. The real WASM path, and parity with the g3e-ai JS planner, is scripts/nav-parity-test.mjs.
import { World } from "../src/world";
import { NAV_MODE } from "../src/nav";

function mockWorld() {
	const header = new Int32Array(8);
	let req = new Float64Array(16);
	let discs = new Float64Array(6);
	const out = new Float64Array(64);
	const base = new Uint8Array(12);
	const blocked = new Uint8Array(12);
	const log: any[] = [];
	const cpp: any = {
		getLiveBodyFloatData: () => new Float32Array(1),
		getLiveBodyIntData: () => new Int32Array(1),
		getLiveFixtureFloatData: () => new Float32Array(1),
		getLiveFixtureIntData: () => new Int32Array(1),
		navCreate: (...a: number[]) => log.push(["create", ...a]),
		navCols: () => 4,
		navRows: () => 3,
		navGetHeader: () => header,
		navGetRequestView: () => req,
		navGetDiscView: () => discs,
		navGetOutView: () => out,
		navGetBaseView: () => base,
		navGetBlockedView: () => blocked,
		navReserve: (r: number, d: number) => {
			if (r) req = new Float64Array(r * 8);
			if (d) discs = new Float64Array(d * 3);
			header[0]++;
		},
		navCommitBase: (...a: number[]) => log.push(["commit", ...a]),
		navSetDynamic: (n: number) => log.push(["set", n, ...discs.slice(0, n * 3)]),
		findPaths: (budget: number, minSlice: number, n: number) => {
			log.push(["findPaths", budget, minSlice, n, ...req.slice(0, n * 8), ...discs.slice(0, 3)]);
			// two results: id 7 with two points, id 9 with none
			out.set([2, 7, 1, 40, 5, 2, 1, 2, 4, 3, 9, 0, 12, 0, 0]);
			return 2;
		},
		navFindPath: (...a: number[]) => {
			log.push(["findPath", ...a]);
			out.set([1, -1, 1, 3, 1.5, 1, 0.5, 0.5]);
			return 1;
		},
	};
	return { cpp, log, header };
}

describe("native nav (TS wrapper)", () => {
	it("maps options to flags and stages requests in WASM memory until findPaths", () => {
		const { cpp, log } = mockWorld();
		const world = new World(cpp);
		const nav = world.createNav(
			{ minX: 0, minY: 0, maxX: 4, maxY: 3 },
			{ clearance: 2, rasterize: "centers", atGoal: "empty", nearestFreeOutside: "point", astarTies: "heap" },
		);
		expect(log[0]).toEqual(["create", 0, 0, 4, 3, 1, 2, 1 | 4 | 8 | 16]);
		expect([nav.cols, nav.rows]).toEqual([4, 3]);
		expect(nav.indexOf({ x: 1.5, y: 2.5 })).toBe(9);
		expect(nav.indexOf({ x: -0.1, y: 0 })).toBe(-1);

		nav.request(7, { x: 0.5, y: 0.5 }, { x: 3.5, y: 2.5 }, { discs: [{ x: 2, y: 2, r: 1 }] });
		nav.request(9, { x: 1, y: 1 }, { x: 1, y: 1 }, { mode: NAV_MODE.HPA, maxExpanded: 50 }); // grows the buffer
		expect(log.length).toBe(1); // nothing crossed yet
		const res = world.findPaths(500, 10);
		expect(log[1]).toEqual(
			["findPaths", 500, 10, 2]
				.concat([7, 0.5, 0.5, 3.5, 2.5, 0, 0, 1])
				.concat([9, 1, 1, 1, 1, 1, 50, 0])
				.concat([2, 2, 1]),
		);
		expect(res).toEqual([
			{
				id: 7,
				status: 1,
				expanded: 40,
				length: 5,
				points: [
					{ x: 1, y: 2 },
					{ x: 4, y: 3 },
				],
			},
			{ id: 9, status: 0, expanded: 12, length: 0, points: [] },
		]);
		// the next batch starts at slot 0 again
		nav.request(3, { x: 0, y: 0 }, { x: 1, y: 1 });
		nav.findPathsRaw(Infinity);
		expect(log[2].slice(0, 5)).toEqual(["findPaths", Infinity, 0, 1, 3]);
	});

	it("one-shot findPath, static mask and moving obstacles", () => {
		const { cpp, log } = mockWorld();
		const world = new World(cpp);
		const nav = world.createNav({ minX: 0, minY: 0, maxX: 4, maxY: 3 });
		expect(nav.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })).toEqual({
			id: -1,
			status: 1,
			expanded: 3,
			length: 1.5,
			points: [{ x: 0.5, y: 0.5 }],
		});
		expect(log[1]).toEqual(["findPath", 0, 0, 1, 1, NAV_MODE.GRID, 0]);
		const mask = new Uint8Array(12);
		mask[5] = 1;
		nav.setStaticMask(mask);
		expect(nav.base[5]).toBe(1);
		expect(log[2]).toEqual(["commit", -1, -1, -1, -1]);
		expect(() => nav.setStaticMask(new Uint8Array(3))).toThrow();
		nav.setDynamicObstacles([
			{ x: 1, y: 1, r: 0.5 },
			{ x: 2, y: 2, r: 0.25 },
			{ x: 3, y: 1, r: 1 },
		]); // 3 discs: grows the disc buffer first
		expect(log[3]).toEqual(["set", 3, 1, 1, 0.5, 2, 2, 0.25, 3, 1, 1]);
		nav.request(1, { x: 0, y: 0 }, { x: 1, y: 1 }, { discs: [{ x: 0, y: 0, r: 1 }] });
		expect(() => nav.setDynamicObstacles([])).toThrow(/before findPaths/);
	});
});
