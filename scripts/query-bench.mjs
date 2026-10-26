// PER-856 micro-benchmark: neighbour queries at 400 bodies through the real WASM module,
// against the flat JS scan they replace. Requires dist/ from `npm run build`.
// Run: nice -n 19 node scripts/query-bench.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gearbox from "../dist/js/gearbox.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = new Uint8Array(fs.readFileSync(path.join(root, "dist/wasm/gearbox-module-st.wasm")));
await gearbox.init({ mode: "st", wasmBinary: bin, instantiateWasm: (imports, done) => { WebAssembly.instantiate(bin, imports).then((r) => done(r.instance)); return {}; } });

const N = Number(process.env.BODIES ?? 400), EXTENT = Number(process.env.EXTENT ?? 200), RADIUS = Number(process.env.RADIUS ?? 15);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const world = gearbox.createWorld();
world.setGravity(0, 0);
const bodies = [];
for (let id = 1; id <= N; id++) {
	const circle = rnd() < 0.6;
	bodies.push(world.createBody({
		id, type: rnd() < 0.3 ? gearbox.bodyTypes.FIXED_OBJECT : gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 1, canSleep: false,
		x: (rnd() * 2 - 1) * EXTENT, y: (rnd() * 2 - 1) * EXTENT, vx: (rnd() * 2 - 1) * 5, vy: (rnd() * 2 - 1) * 5,
		shape: circle ? gearbox.shapes.CIRCLE : gearbox.shapes.BOX, radius: circle ? 0.5 + rnd() * 2 : undefined,
		width: circle ? undefined : 1 + rnd() * 3, height: circle ? undefined : 1 + rnd() * 3,
	}));
}
for (let i = 0; i < 30; i++) world.step();
const radii = bodies.map((b) => (b.fixtures[0].shape === gearbox.shapes.CIRCLE ? b.fixtures[0].radius : 2.5));

function time(label, fn, reps) {
	for (let i = 0; i < 20; i++) fn(); // warm up
	const t0 = process.hrtime.bigint();
	let sink = 0;
	for (let i = 0; i < reps; i++) sink += fn();
	const us = Number(process.hrtime.bigint() - t0) / 1000 / reps;
	return { label, us, sink };
}

// Flat scan: every body checks every other body (bounding circles), what game code does today.
const flat = () => {
	let hits = 0;
	const xs = new Float64Array(N), ys = new Float64Array(N);
	for (let i = 0; i < N; i++) { xs[i] = bodies[i].x; ys[i] = bodies[i].y; }
	for (let i = 0; i < N; i++) {
		for (let j = 0; j < N; j++) {
			if (i === j) continue;
			const rr = RADIUS + radii[j];
			const dx = xs[j] - xs[i], dy = ys[j] - ys[i];
			if (dx * dx + dy * dy <= rr * rr) hits++;
		}
	}
	return hits;
};
const singles = () => {
	let hits = 0;
	for (let i = 0; i < N; i++) hits += world.queryRadiusRaw(bodies[i].x, bodies[i].y, RADIUS, 0xffffffff, 1);
	return hits - N; // minus self
};
const batch = () => {
	const { centers, exclude } = world.batchInput(N);
	for (let i = 0; i < N; i++) { centers[i * 3] = bodies[i].x; centers[i * 3 + 1] = bodies[i].y; centers[i * 3 + 2] = RADIUS; exclude[i] = bodies[i].internalId; }
	return world.queryRadiusBatchRaw(N, 0xffffffff, 1);
};
const rays = () => {
	let hits = 0;
	for (let i = 0; i < N; i++) {
		const b = bodies[i], c = bodies[(i * 7 + 3) % N];
		hits += world.raycastRaw(b.x, b.y, c.x, c.y, 0xffffffff, 0, b.internalId);
	}
	return hits;
};
const boxes = () => {
	let hits = 0;
	for (let i = 0; i < N; i++) hits += world.queryAABBRaw(bodies[i].x - RADIUS, bodies[i].y - RADIUS, bodies[i].x + RADIUS, bodies[i].y + RADIUS, 0xffffffff, 1);
	return hits;
};

const results = [time(`flat JS scan, ${N} x ${N} (bounding circles)`, flat, 300), time(`${N} x queryRadiusRaw`, singles, 300), time(`1 x queryRadiusBatchRaw (${N} centres)`, batch, 300), time(`${N} x queryAABBRaw`, boxes, 300), time(`${N} x raycastRaw (closest)`, rays, 300)];
console.log(`bodies=${N} extent=±${EXTENT} radius=${RADIUS}; µs per full pass (all ${N} queries), node ${process.version}`);
for (const r of results) console.log(`${r.label.padEnd(44)} ${r.us.toFixed(1).padStart(8)} µs  (hits/pass ${Math.round(r.sink / 300)})`);
world.destroy();
