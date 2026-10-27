// PER-871 benchmark: native (WASM) planner vs the gear3engine g3e-ai JS planner on the Saucers ctf map
// (400 x 400 cells), 150 seeded routes longer than 150 m, like PER-877's benchmark.
// Requires dist/ from `npm run build`. Run on a quiet machine: nice -n 0 node scripts/nav-bench.mjs
// Env: OUT=path.jsonl appends one JSON line per section (with the load average at that moment).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gearbox, { NAV_MODE } from "../dist/js/gearbox.js";
import { loadReference } from "./nav-reference/load.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = new Uint8Array(fs.readFileSync(path.join(root, "dist/wasm/gearbox-module-st.wasm")));
await gearbox.init({ mode: "st", wasmBinary: bin, instantiateWasm: (imports, done) => { WebAssembly.instantiate(bin, imports).then((r) => done(r.instance)); return {}; } });
const { NavGrid, NavHierarchy } = await loadReference();
const map = JSON.parse(fs.readFileSync(path.join(root, "scripts/bench-data/ctf-nav.json"), "utf8"));
const REPS = Number(process.env.REPS ?? 5), ROUTES = Number(process.env.ROUTES ?? 150), ROCKS = Number(process.env.ROCKS ?? 168);
const OUT = process.env.OUT ?? null;
const now = () => performance.now();
const load = () => os.loadavg().map((x) => +x.toFixed(2));
const emit = (o) => { const line = JSON.stringify({ ...o, load: load(), node: process.version, at: new Date().toISOString() }); console.log(line); if (OUT) fs.appendFileSync(OUT, line + "\n"); };

const options = { cell: 1, clearance: 2, rasterize: "centers", atGoal: "empty", nearestFreeOutside: "point", astarTies: "heap" };
const bounds = { minX: -map.halfW, minY: -map.halfH, maxX: map.halfW, maxY: map.halfH };
let seed = 877;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const js = new NavGrid(bounds, { boxes: map.walls }, options);
// rocks: seeded discs inside the map's asteroid fields (stand-ins for live asteroids)
const rocks = [];
for (let i = 0; i < ROCKS; i++) {
	const f = map.asteroidFields[i % map.asteroidFields.length];
	rocks.push({ x: f.x + (rnd() - 0.5) * f.w, y: f.y + (rnd() - 0.5) * f.h, r: 0.8 + rnd() * 2.2 });
}
// routes: free start and goal (static), at least 150 m apart
const routes = [];
while (routes.length < ROUTES) {
	const a = { x: (rnd() * 2 - 1) * map.halfW, y: (rnd() * 2 - 1) * map.halfH }, b = { x: (rnd() * 2 - 1) * map.halfW, y: (rnd() * 2 - 1) * map.halfH };
	if (!js.isFree(a) || !js.isFree(b) || Math.hypot(a.x - b.x, a.y - b.y) < 150) continue;
	routes.push([a, b]);
}
const avgLen = routes.reduce((s, [a, b]) => s + Math.hypot(a.x - b.x, a.y - b.y), 0) / routes.length;

const world = gearbox.createWorld();
const nav = world.createNav(bounds, options);
for (const w of map.walls) nav.addBox(w);
nav.syncStatic();
let mism = 0;
for (let i = 0; i < js.size; i++) if (nav.blocked[i] !== js.blocked[i]) mism++;
emit({ section: "setup", cols: nav.cols, rows: nav.rows, walls: map.walls.length, rocks: rocks.length, routes: routes.length, avgRouteM: +avgLen.toFixed(1), staticCellMismatch: mism });

// hierarchy build
{
	const tj = [], tn = [];
	let hpaJs = null;
	for (let r = 0; r < 3; r++) {
		let t = now(); hpaJs = new NavHierarchy(js, { cluster: 16 }); tj.push(now() - t);
		t = now(); nav.buildHierarchy({ cluster: 16 }); tn.push(now() - t);
	}
	globalThis.__hpa = hpaJs;
	emit({ section: "hierarchy-build", jsMs: tj.map((x) => +x.toFixed(2)), nativeMs: tn.map((x) => +x.toFixed(2)), nodes: hpaJs.nodeCount, edges: hpaJs.edgeCount, nativeNodes: nav.hierarchyStats.nodes, nativeEdges: nav.hierarchyStats.edges });
}
const hpa = globalThis.__hpa;

const summarize = (perRoute) => {
	const s = [...perRoute].sort((a, b) => a - b);
	const mean = s.reduce((a, b) => a + b, 0) / s.length;
	return { mean: +mean.toFixed(4), p50: +s[Math.floor(s.length / 2)].toFixed(4), p95: +s[Math.floor(s.length * 0.95)].toFixed(4), worst: +s[s.length - 1].toFixed(4) };
};
const samePath = (a, b) => { if (!a || !b) return !a && !b; if (a.length !== b.length || a.points.length !== b.points.length) return false; for (let i = 0; i < a.points.length; i++) if (a.points[i].x !== b.points[i].x || a.points[i].y !== b.points[i].y) return false; return true; };
const asJs = (r) => (r.status === 1 ? { points: r.points, length: r.length } : null);

function section(name, mode, withRocks) {
	js.setDynamicObstacles(withRocks ? rocks : []);
	nav.setDynamicObstacles(withRocks ? rocks : []);
	const jsCall = mode === NAV_MODE.GRID ? (a, b) => js.findPath(a, b) : mode === NAV_MODE.HPA ? (a, b) => hpa.findPath(a, b) : (a, b) => hpa.findPath(a, b, { dynamic: "corridor" });
	// warm up both (JIT, scratch pools)
	for (let k = 0; k < Math.min(20, routes.length); k++) { jsCall(...routes[k]); nav.findPath(...routes[k], { mode }); }
	const jsT = routes.map(() => Infinity), nT = routes.map(() => Infinity), expanded = new Array(routes.length).fill(0);
	let same = 0, nulls = 0;
	for (let rep = 0; rep < REPS; rep++) {
		routes.forEach(([a, b], i) => {
			let t = now(); const want = jsCall(a, b); const dj = now() - t;
			t = now(); const got = nav.findPath(a, b, { mode }); const dn = now() - t;
			jsT[i] = Math.min(jsT[i], dj); nT[i] = Math.min(nT[i], dn);
			expanded[i] = got.expanded;
			if (rep === 0) { if (samePath(asJs(got), want)) same++; if (!want) nulls++; }
		});
	}
	// batched: every route queued, one findPaths(Infinity) call
	const batchT = [];
	for (let rep = 0; rep < REPS; rep++) {
		routes.forEach(([a, b], i) => nav.request(i, a, b, { mode }));
		const t = now(); const res = nav.findPaths(Infinity); batchT.push(now() - t);
		if (res.length !== routes.length) throw new Error("batch lost results");
	}
	const totalExp = expanded.reduce((a, b) => a + b, 0);
	const sumJs = jsT.reduce((a, b) => a + b, 0), sumN = nT.reduce((a, b) => a + b, 0), bestBatch = Math.min(...batchT);
	emit({
		section: name, routes: routes.length, reps: REPS, identicalPaths: same, nullPaths: nulls,
		jsMs: summarize(jsT), nativeMs: summarize(nT),
		speedupMean: +(sumJs / sumN).toFixed(2),
		expanded: { total: totalExp, p50: [...expanded].sort((a, b) => a - b)[Math.floor(routes.length / 2)], max: Math.max(...expanded) },
		nodesPerMs: { js: Math.round(totalExp / sumJs), native: Math.round(totalExp / sumN), nativeBatched: Math.round(totalExp / bestBatch) },
		batchedMs: { total: +bestBatch.toFixed(3), perRoute: +(bestBatch / routes.length).toFixed(4) },
		oneShotSumMs: +sumN.toFixed(3),
	});
}

section("grid-walls", NAV_MODE.GRID, false);
section("grid-walls+rocks", NAV_MODE.GRID, true);
section("hpa-walls", NAV_MODE.HPA, false);
section("hpa-corridor-walls+rocks", NAV_MODE.HPA_CORRIDOR, true);

// crossing overhead: an empty findPaths call, a trivial one-route call, and writing+reading 150 trivial requests
{
	nav.setDynamicObstacles([]);
	const N = 20000, p = routes[0][0];
	for (let k = 0; k < 2000; k++) nav.findPathsRaw(0);
	let t = now();
	for (let k = 0; k < N; k++) nav.findPathsRaw(0);
	const empty = (now() - t) / N;
	t = now();
	for (let k = 0; k < N; k++) { nav.request(1, p, p); nav.findPathsRaw(Infinity); }
	const trivialBatch = (now() - t) / N;
	t = now();
	for (let k = 0; k < N; k++) nav.findPath(p, p);
	const trivialOne = (now() - t) / N;
	t = now();
	for (let k = 0; k < N; k++) js.findPath(p, p);
	const trivialJs = (now() - t) / N;
	const M = 2000;
	t = now();
	for (let k = 0; k < M; k++) { for (let i = 0; i < 150; i++) nav.request(i, p, p); nav.findPaths(Infinity); }
	const batch150 = (now() - t) / M;
	emit({ section: "crossing", us: { emptyFindPaths: +(empty * 1e3).toFixed(3), oneTrivialRequestBatched: +(trivialBatch * 1e3).toFixed(3), oneTrivialFindPath: +(trivialOne * 1e3).toFixed(3), jsTrivialFindPath: +(trivialJs * 1e3).toFixed(3), batchOf150TrivialWithResults: +(batch150 * 1e3).toFixed(3), perRequestIn150Batch: +(batch150 * 1e3 / 150).toFixed(3) } });
}
