// PER-856: spatial queries and sensor-vs-sensor contacts through the real single-threaded WASM module.
// Requires dist/ from `npm run build`. Like heap-growth-test.mjs, not part of `npm test`
// (CI's jest run has no real wasm module). Run: npm run test:wasm:queries
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gearbox from "../dist/js/gearbox.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmPath = path.join(root, "dist/wasm/gearbox-module-st.wasm");
const bin = new Uint8Array(fs.readFileSync(wasmPath));
await gearbox.init({
	mode: "st",
	wasmBinary: bin,
	instantiateWasm: (imports, done) => {
		WebAssembly.instantiate(bin, imports).then((r) => done(r.instance));
		return {};
	},
});

let failures = 0;
const check = (cond, msg) => {
	if (!cond) {
		failures++;
		console.error("FAIL:", msg);
	}
};

// Seeded RNG so failures reproduce.
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Circles and axis-aligned boxes: exact brute force is easy in JS.
function makeWorld(n, extent) {
	const world = gearbox.createWorld();
	world.setGravity(0, 0);
	const bodies = [];
	for (let id = 1; id <= n; id++) {
		const circle = rnd() < 0.5;
		const opts = {
			id,
			type: rnd() < 0.3 ? gearbox.bodyTypes.FIXED_OBJECT : gearbox.bodyTypes.DYNAMIC_OBJECT,
			x: (rnd() * 2 - 1) * extent,
			y: (rnd() * 2 - 1) * extent,
			vx: (rnd() * 2 - 1) * 5,
			vy: (rnd() * 2 - 1) * 5,
			mass: 1,
			canSleep: false,
			categoryBits: 1 << Math.floor(rnd() * 3),
			isSensor: rnd() < 0.2,
			shape: circle ? gearbox.shapes.CIRCLE : gearbox.shapes.AABB,
			radius: circle ? 0.3 + rnd() * 2 : undefined,
			width: circle ? undefined : 0.5 + rnd() * 3,
			height: circle ? undefined : 0.5 + rnd() * 3,
		};
		bodies.push({ body: world.createBody(opts), circle, opts });
	}
	return { world, bodies };
}

function overlapsCircle(b, cx, cy, r) {
	const x = b.body.x, y = b.body.y;
	if (b.circle) {
		const rr = b.opts.radius + r;
		return (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr * (1 + 1e-6);
	}
	const hw = b.opts.width / 2, hh = b.opts.height / 2;
	const dx = Math.max(x - hw - cx, 0, cx - (x + hw)), dy = Math.max(y - hh - cy, 0, cy - (y + hh));
	return dx * dx + dy * dy <= r * r * (1 + 1e-6);
}
const nearBoundary = (b, cx, cy, r) => overlapsCircle(b, cx, cy, r * 1.001 + 1e-3) !== overlapsCircle(b, cx, cy, Math.max(0, r * 0.999 - 1e-3));

// 1) queryRadius / queryAABB vs JS brute force, with masks and sensor skipping.
{
	const { world, bodies } = makeWorld(400, 100);
	for (let i = 0; i < 20; i++) world.step();
	for (let q = 0; q < 300; q++) {
		const cx = (rnd() * 2 - 1) * 110, cy = (rnd() * 2 - 1) * 110, r = rnd() * 20;
		const mask = [0xffffffff, 1, 2, 4, 3][q % 5];
		const skipSensors = q % 2 === 1;
		const got = new Set(world.queryRadius(cx, cy, r, { mask, skipSensors }).map((b) => b.id));
		for (const b of bodies) {
			if ((b.opts.categoryBits & mask) === 0 || (skipSensors && b.opts.isSensor)) {
				check(!got.has(b.body.id), `radius q${q}: filtered body ${b.body.id} returned`);
				continue;
			}
			if (nearBoundary(b, cx, cy, r)) continue;
			check(got.has(b.body.id) === overlapsCircle(b, cx, cy, r), `radius q${q}: body ${b.body.id}`);
		}
		// Box query vs brute force for axis-aligned shapes (circle-vs-box via clamped distance).
		const lo = { x: cx - r, y: cy - r * 0.5 }, hi = { x: cx + r, y: cy + r * 0.5 };
		const boxGot = new Set(world.queryAABB(lo.x, lo.y, hi.x, hi.y, { mask }).map((b) => b.id));
		for (const b of bodies) {
			if ((b.opts.categoryBits & mask) === 0) continue;
			const x = b.body.x, y = b.body.y;
			let expect, margin;
			if (b.circle) {
				const dx = Math.max(lo.x - x, 0, x - hi.x), dy = Math.max(lo.y - y, 0, y - hi.y);
				const d = Math.sqrt(dx * dx + dy * dy);
				expect = d <= b.opts.radius; margin = Math.abs(d - b.opts.radius);
			} else {
				const hw = b.opts.width / 2, hh = b.opts.height / 2;
				expect = x - hw <= hi.x && x + hw >= lo.x && y - hh <= hi.y && y + hh >= lo.y;
				margin = Math.min(Math.abs(x - hw - hi.x), Math.abs(x + hw - lo.x), Math.abs(y - hh - hi.y), Math.abs(y + hh - lo.y));
			}
			if (margin < 1e-3) continue;
			check(boxGot.has(b.body.id) === expect, `aabb q${q}: body ${b.body.id}`);
		}
	}

	// 2) Batch == singles (with self-exclusion).
	const queries = [], exclude = [];
	for (let i = 0; i < 400; i++) {
		const b = bodies[i].body;
		queries.push(b.x, b.y, 8);
		exclude.push(b);
	}
	const batch = world.queryRadiusBatch(queries, exclude);
	for (let i = 0; i < 400; i++) {
		const single = world.queryRadius(queries[i * 3], queries[i * 3 + 1], 8).filter((b) => b !== exclude[i]).map((b) => b.id);
		check(JSON.stringify(batch[i].map((b) => b.id)) === JSON.stringify(single), `batch ${i} != single`);
		check(!batch[i].includes(exclude[i]), `batch ${i} includes the excluded body`);
	}

	// 3) Raycast: a ray through an empty corridor with one known box.
	const wall = world.createBody({ id: 9999, type: gearbox.bodyTypes.FIXED_OBJECT, x: 500, y: 500, shape: gearbox.shapes.BOX, width: 2, height: 2 });
	const hit = world.raycast(480, 500, 520, 500);
	check(hit && hit.body === wall && Math.abs(hit.fraction - 19 / 40) < 1e-5 && Math.abs(hit.nx + 1) < 1e-5, `raycast hit ${JSON.stringify(hit && { id: hit.body.id, f: hit.fraction, nx: hit.nx })}`);
	check(world.raycast(480, 500, 520, 500, { exclude: wall }) === null, "raycast exclude");
	check(world.raycastAll(480, 500, 520, 500).length === 1, "raycastAll count");

	// 4) Heap growth between queries: views must be re-fetched, results unchanged.
	const before = world.queryRadius(0, 0, 30).map((b) => b.id).join(",");
	const others = [];
	const heapBefore = gearbox.getWasmMemory();
	for (let i = 0; i < 6; i++) others.push(gearbox.createWorld());
	check(gearbox.getWasmMemory() > heapBefore, "heap did not grow; test 4 is vacuous");
	const after = world.queryRadius(0, 0, 30).map((b) => b.id).join(",");
	check(before === after, "queryRadius changed across heap growth");
	const batch2 = world.queryRadiusBatch(queries, exclude);
	check(JSON.stringify(batch2.map((l) => l.map((b) => b.id))) === JSON.stringify(batch.map((l) => l.map((b) => b.id))), "batch changed across heap growth");
	for (const w of others) w.destroy();
	world.destroy();
}

// 5) Sensor-vs-sensor contacts through onCollisionStart / onCollisionEnd.
{
	const world = gearbox.createWorld();
	world.setGravity(0, 0);
	const sensor = (id, x, sensorContacts) =>
		world.createBody({ id, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 1, x, y: 0, shape: gearbox.shapes.CIRCLE, radius: 1, isSensor: true, wantsEvents: true, sensorContacts, canSleep: false });
	const events = [];
	world.onCollisionStart = (a, b) => events.push(["start", Math.min(a, b), Math.max(a, b)]);
	world.onCollisionEnd = (a, b) => events.push(["end", Math.min(a, b), Math.max(a, b)]);
	const a = sensor(1, 0, true), b = sensor(2, 1.5, true), c = sensor(3, -1.5, false);
	world.step();
	check(JSON.stringify(events) === JSON.stringify([["start", 1, 2]]), `sensor start events ${JSON.stringify(events)}`);
	events.length = 0;
	b.x = 10;
	world.step();
	check(JSON.stringify(events) === JSON.stringify([["end", 1, 2]]), `sensor end events ${JSON.stringify(events)}`);
	events.length = 0;
	c.fixtures[0].sensorContacts = true;
	check(c.fixtures[0].sensorContacts === true, "sensorContacts setter");
	world.step();
	check(JSON.stringify(events) === JSON.stringify([["start", 1, 3]]), `runtime opt-in ${JSON.stringify(events)}`);
	world.destroy();
}

if (failures) {
	console.error(`${failures} failure(s)`);
	process.exit(1);
}
console.log("spatial-query-wasm-test: ok");
