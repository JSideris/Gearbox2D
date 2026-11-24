// PER-871: the native planner (WASM) against the gear3engine g3e-ai JS planner on the same grids and seeds.
// Requires dist/ from `npm run build`. Run: npm run test:wasm:nav
//
// Checks, over seeded worlds that mix cell sizes, clearances, both rasterize modes, both tie rules,
// atGoal / nearestFreeOutside options and cluster sizes:
//  - native rasterisation of boxes and discs gives the same static cells as NavGrid;
//  - moving obstacles (set / push / pop) give the same cells;
//  - grid A* (findPath): identical points and length, with and without moving obstacles;
//  - HPA (walls only and corridor): identical routes; any difference must stay within the HPA
//    tolerance (same cost within 1e-9 relative) and is reported;
//  - per-request detour discs == JS push / findPath / pop;
//  - findPaths in small budgets (carried over across calls) == the one-shot answers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gearbox, { NAV_MODE } from "../dist/js/gearbox.js";
import { loadReference } from "./nav-reference/load.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = new Uint8Array(fs.readFileSync(path.join(root, "dist/wasm/gearbox-module-st.wasm")));
await gearbox.init({ mode: "st", wasmBinary: bin, instantiateWasm: (imports, done) => { WebAssembly.instantiate(bin, imports).then((r) => done(r.instance)); return {}; } });
const { NavGrid, NavHierarchy } = await loadReference();

let failures = 0;
const fail = (msg) => { failures++; if (failures <= 40) console.error("FAIL:", msg); };
let seed = 871;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const range = (a, b) => a + (b - a) * rnd();

const stats = { worlds: 0, cellsCompared: 0, staticMismatch: 0, dynMismatch: 0, grid: 0, gridExact: 0, hpa: 0, hpaExact: 0, hpaCostOnly: 0, corridor: 0, corridorExact: 0, detour: 0, detourExact: 0, batch: 0, batchExact: 0, rebuilt: 0, rebuiltExact: 0, nulls: 0 };

const samePath = (a, b) => {
	if (!a || !b) return !a && !b;
	if (a.length !== b.length || a.points.length !== b.points.length) return false;
	for (let i = 0; i < a.points.length; i++) if (a.points[i].x !== b.points[i].x || a.points[i].y !== b.points[i].y) return false;
	return true;
};
const asJs = (r) => (r.status === 1 ? { points: r.points, length: r.length } : null);
const fmt = (p) => (p ? `${p.points.length} pts, len ${p.length}` : "null");

const configs = [
	{ cell: 1, clearance: 2, opts: { rasterize: "centers", atGoal: "empty", nearestFreeOutside: "point", astarTies: "heap" }, cluster: 16 }, // saucers
	{ cell: 1, clearance: 0, opts: {}, cluster: 8 },
	{ cell: 0.75, clearance: 1, opts: { astarTies: "heap" }, cluster: 7 },
	{ cell: 2, clearance: 1.5, opts: { rasterize: "centers", blockEdges: false }, cluster: 4 },
	{ cell: 1, clearance: 1, opts: { atGoal: "empty" }, cluster: 16 },
];

for (let w = 0; w < 30; w++) {
	const cfg = configs[w % configs.length];
	const half = range(30, 70);
	const bounds = { minX: -half, minY: -half * 0.8, maxX: half, maxY: half * 0.8 };
	const boxes = [], discs = [], rocks = [];
	const nb = 10 + Math.floor(rnd() * 30), nd = 5 + Math.floor(rnd() * 15), nr = Math.floor(rnd() * 30);
	for (let i = 0; i < nb; i++) boxes.push({ x: range(-half, half), y: range(-half, half) * 0.8, w: range(2, half * 0.6), h: range(0.2, 3), angle: rnd() < 0.3 ? 0 : range(-3.2, 3.2) });
	for (let i = 0; i < nd; i++) discs.push({ x: range(-half, half), y: range(-half, half) * 0.8, r: range(0.3, 4), keepOut: rnd() < 0.3 ? range(0, 2) : undefined, blocksSight: false });
	for (let i = 0; i < nr; i++) rocks.push({ x: range(-half, half), y: range(-half, half) * 0.8, r: range(0.4, 2.5) });
	const options = { cell: cfg.cell, clearance: cfg.clearance, ...cfg.opts };
	const js = new NavGrid(bounds, { boxes, discs }, options);

	// Native grid A: rasterised natively.
	const world = gearbox.createWorld();
	const nav = world.createNav(bounds, options);
	if (nav.cols !== js.cols || nav.rows !== js.rows) fail(`world ${w}: size ${nav.cols}x${nav.rows} vs ${js.cols}x${js.rows}`);
	for (const b of boxes) nav.addBox(b);
	for (const d of discs) nav.addDisc(d);
	nav.syncStatic();
	let mism = 0;
	const nb2 = nav.blocked;
	for (let i = 0; i < js.size; i++) if (nb2[i] !== js.blocked[i]) mism++;
	stats.cellsCompared += js.size;
	stats.staticMismatch += mism;
	if (mism) fail(`world ${w}: ${mism} static cells differ from NavGrid rasterisation`);
	// Native grid B: JS mask imported (what an opt-in backend mirrors), used for paths even if A matched.
	const world2 = gearbox.createWorld();
	const nav2 = world2.createNav(bounds, options);
	nav2.setStaticMask(js.blocked);
	nav2.syncStatic();
	for (const [nv] of [[nav], [nav2]]) {
		nv.buildHierarchy({ cluster: cfg.cluster });
	}
	const hpa = new NavHierarchy(js, { cluster: cfg.cluster });
	for (const nv of [nav, nav2]) {
		const hs = nv.hierarchyStats;
		if (hs.nodes !== hpa.nodeCount || hs.edges !== hpa.edgeCount) fail(`world ${w}: hierarchy ${hs.nodes}/${hs.edges} vs ${hpa.nodeCount}/${hpa.edgeCount}`);
	}
	stats.worlds++;

	const routes = [];
	for (let k = 0; k < 40; k++) {
		const out = rnd() < 0.05 ? 1.1 : 1;
		routes.push([{ x: range(bounds.minX, bounds.maxX) * out, y: range(bounds.minY, bounds.maxY) * out }, { x: range(bounds.minX, bounds.maxX), y: range(bounds.minY, bounds.maxY) }]);
	}
	routes.push([{ x: 0.3, y: 0.3 }, { x: 0.31, y: 0.32 }]); // same cell

	const phase = (label, withRocks) => {
		if (withRocks) { js.setDynamicObstacles(rocks); nav.setDynamicObstacles(rocks); nav2.setDynamicObstacles(rocks); }
		else { js.setDynamicObstacles([]); nav.setDynamicObstacles([]); nav2.setDynamicObstacles([]); }
		const jsDyn = js["dynamicMask"], nDyn = world2.world.navGetDynamicView();
		let dm = 0;
		for (let i = 0; i < js.size; i++) if (nDyn[i] !== jsDyn[i]) dm++;
		stats.dynMismatch += dm;
		if (dm) fail(`world ${w} ${label}: ${dm} dynamic cells differ`);
		const navs = mism === 0 ? [nav, nav2] : [nav2];
		for (const [a, b] of routes) {
			const want = js.findPath(a, b);
			if (!want) stats.nulls++;
			for (const nv of navs) {
				stats.grid++;
				const got = asJs(nv.findPath(a, b, { mode: NAV_MODE.GRID }));
				if (samePath(got, want)) stats.gridExact++;
				else fail(`world ${w} ${label} grid: ${fmt(got)} vs ${fmt(want)} (${JSON.stringify([a, b])})`);
			}
			for (const [mode, q, key] of [[NAV_MODE.HPA, {}, "hpa"], [NAV_MODE.HPA_CORRIDOR, { dynamic: "corridor" }, "corridor"]]) {
				const wantH = hpa.findPath(a, b, q);
				for (const nv of navs) {
					stats[key]++;
					const got = asJs(nv.findPath(a, b, { mode }));
					if (samePath(got, wantH)) stats[key + "Exact"]++;
					else if (got && wantH && Math.abs(got.length - wantH.length) <= 1e-9 * wantH.length) stats.hpaCostOnly++;
					else fail(`world ${w} ${label} ${key}: ${fmt(got)} vs ${fmt(wantH)} (${JSON.stringify([a, b])})`);
				}
			}
		}
	};
	phase("walls", false);
	phase("walls+rocks", true);

	// A static change: native addBox (partial rebuild at the next sync) vs JS blocked cells + hpa.rebuild(area).
	{
		const box = { x: range(-half, half) * 0.5, y: range(-half, half) * 0.4, w: range(4, 15), h: range(0.5, 2), angle: range(-1, 1) };
		nav2.addBox(box);
		nav2.syncStatic();
		const nbk = nav2.blocked;
		let c0 = Infinity, r0 = Infinity, c1 = -1, r1 = -1;
		for (let i = 0; i < js.size; i++) {
			if (nbk[i] !== js.blocked[i]) {
				js.blocked[i] = nbk[i];
				const c = i % js.cols, r = (i / js.cols) | 0;
				c0 = Math.min(c0, c); r0 = Math.min(r0, r); c1 = Math.max(c1, c); r1 = Math.max(r1, r);
			}
		}
		if (c1 >= 0) {
			hpa.rebuild({ minX: bounds.minX + (c0 + 0.5) * cfg.cell, minY: bounds.minY + (r0 + 0.5) * cfg.cell, maxX: bounds.minX + (c1 + 0.5) * cfg.cell, maxY: bounds.minY + (r1 + 0.5) * cfg.cell });
			const hs = nav2.hierarchyStats;
			const scratch = new NavHierarchy(js, { cluster: cfg.cluster });
			if (process.env.DEBUG_REBUILD) console.log(`world ${w}: native ${hs.nodes}/${hs.edges} js-partial ${hpa.nodeCount}/${hpa.edgeCount} js-scratch ${scratch.nodeCount}/${scratch.edgeCount}`);
			if (hs.nodes !== hpa.nodeCount || hs.edges !== hpa.edgeCount) fail(`world ${w}: rebuilt hierarchy ${hs.nodes}/${hs.edges} vs ${hpa.nodeCount}/${hpa.edgeCount}`);
			for (const [a, b] of routes) {
				for (const [mode, q] of [[NAV_MODE.GRID, null], [NAV_MODE.HPA, {}], [NAV_MODE.HPA_CORRIDOR, { dynamic: "corridor" }]]) {
					const want = q ? hpa.findPath(a, b, q) : js.findPath(a, b);
					stats.rebuilt++;
					const got = asJs(nav2.findPath(a, b, { mode }));
					if (samePath(got, want)) stats.rebuiltExact++;
					else fail(`world ${w} after rebuild mode ${mode}: ${fmt(got)} vs ${fmt(want)}`);
				}
			}
		}
	}

	// Per-request detour discs vs JS push / findPath / pop, through one batched findPaths call.
	const detours = routes.slice(0, 12).map(([a, b], i) => ({ a, b, discs: [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: range(1, 4) }, { x: range(bounds.minX, bounds.maxX), y: range(bounds.minY, bounds.maxY), r: 2 }], mode: i % 3 }));
	for (const [i, d] of detours.entries()) nav2.request(i, d.a, d.b, { mode: d.mode, discs: d.discs });
	const got = new Map(nav2.findPaths(Infinity).map((r) => [r.id, r]));
	for (const [i, d] of detours.entries()) {
		js.pushDynamicObstacles(d.discs);
		const want = d.mode === 0 ? js.findPath(d.a, d.b) : hpa.findPath(d.a, d.b, d.mode === 2 ? { dynamic: "corridor" } : {});
		js.popDynamicObstacles();
		stats.detour++;
		if (samePath(asJs(got.get(i)), want)) stats.detourExact++;
		else fail(`world ${w} detour ${i} mode ${d.mode}: ${fmt(asJs(got.get(i)))} vs ${fmt(want)}`);
	}
	if (nav2.dynamicLayers !== 0) fail(`world ${w}: request layers left behind`);
	const jsDyn = js["dynamicMask"], nDyn = world2.world.navGetDynamicView();
	for (let i = 0; i < js.size; i++) if (nDyn[i] !== jsDyn[i]) { fail(`world ${w}: dynamic cells changed by detour requests`); break; }

	// Budgeted batch, carried over across calls, against the JS one-shot answers.
	const modes = [NAV_MODE.GRID, NAV_MODE.HPA, NAV_MODE.HPA_CORRIDOR];
	routes.forEach(([a, b], i) => nav2.request(i, a, b, { mode: modes[i % 3] }));
	const done = new Map();
	for (let t = 0; t < 100000 && done.size < routes.length; t++) {
		for (const r of nav2.findPaths(250 + (t % 7) * 50)) done.set(r.id, r);
		if (nav2.lastExpanded > 250 + (t % 7) * 50) fail(`world ${w}: findPaths spent ${nav2.lastExpanded} > budget`);
	}
	routes.forEach(([a, b], i) => {
		const m = modes[i % 3];
		const want = m === 0 ? js.findPath(a, b) : hpa.findPath(a, b, m === 2 ? { dynamic: "corridor" } : {});
		stats.batch++;
		if (done.has(i) && samePath(asJs(done.get(i)), want)) stats.batchExact++;
		else fail(`world ${w} batch ${i} mode ${m}: ${done.has(i) ? fmt(asJs(done.get(i))) : "unfinished"} vs ${fmt(want)}`);
	});
	world.destroy();
	world2.destroy();
}

console.log(JSON.stringify(stats));
console.log(failures === 0 ? "nav parity: OK" : `nav parity: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
