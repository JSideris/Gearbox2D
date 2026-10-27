// Headless smoke test of the "Nav Arena" showcase (site/examples/showcase/nav-arena.ts): bundles the example
// against dist/js, runs its tick loop exactly like showcase.html (step, then onTick) for a few seeded layouts,
// and checks that bots keep reaching goals, never overlap each other and never sink into walls.
// Requires dist/ from `npm run build`. Run: node scripts/nav-arena-smoke.mjs [seconds] [seeds...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distJs = path.join(root, "dist/js/gearbox.js");
const outFile = path.join(root, "dist/nav-arena-smoke.bundle.mjs");
await build({
	entryPoints: [path.join(root, "site/examples/showcase/nav-arena.ts")],
	bundle: true,
	format: "esm",
	platform: "node",
	outfile: outFile,
	logLevel: "warning",
	plugins: [
		{
			name: "gearbox2d-dist",
			setup(b) {
				b.onResolve({ filter: /^gearbox2d$/ }, () => ({ path: pathToFileURL(distJs).href, external: true }));
			},
		},
	],
});
const { default: gearbox } = await import(pathToFileURL(distJs).href);
const bin = new Uint8Array(fs.readFileSync(path.join(root, "dist/wasm/gearbox-module-st.wasm")));
await gearbox.init({
	mode: "st",
	wasmBinary: bin,
	instantiateWasm: (imports, done) => {
		WebAssembly.instantiate(bin, imports).then((r) => done(r.instance));
		return {};
	},
});
const { navArenaExample, navArenaState: S } = await import(pathToFileURL(outFile).href);

const seconds = Number(process.argv[2] ?? 90);
const seeds = process.argv.slice(3).map(Number);
if (!seeds.length) seeds.push(871, 1234, 99991);
const BOT_R = 0.3;
let failures = 0;
const fail = (m) => {
	failures++;
	console.error("FAIL:", m);
};

for (const seed of seeds) {
	globalThis.NAV_ARENA_SEED = seed;
	const world = gearbox.createWorld();
	navArenaExample.init(world);
	const dt = 1 / 60;
	let worstOverlap = 0,
		wallHits = 0,
		worstGap = 0,
		maxMs = 0,
		sumMs = 0;
	const lastArrival = S.bots.map(() => 0);
	const arrivals = S.bots.map(() => 0);
	const ticks = Math.round(seconds / dt);
	for (let t = 0; t < ticks; t++) {
		world.step();
		const t0 = performance.now();
		navArenaExample.tick(world, dt);
		const ms = performance.now() - t0;
		if (t > 60) maxMs = Math.max(maxMs, ms);
		sumMs += ms;
		for (let i = 0; i < S.bots.length; i++) {
			const a = S.bots[i];
			if (process.env.ARENA_DEBUG && (t - lastArrival[i]) * dt === 25)
				console.log("long trip", seed, i, a.body.x.toFixed(2), a.body.y.toFixed(2), "goal", a.goal, "waiting", a.waiting, "path", a.path.length, a.idx, "stuck", a.stuckCount, "since", a.sinceArrival.toFixed(1), "noPath", S.totalNoPath);
			if (a.arrivals !== arrivals[i]) {
				worstGap = Math.max(worstGap, (t - lastArrival[i]) * dt);
				arrivals[i] = a.arrivals;
				lastArrival[i] = t;
			}
			for (let j = i + 1; j < S.bots.length; j++) {
				const b = S.bots[j].body;
				worstOverlap = Math.max(worstOverlap, 2 * BOT_R - Math.hypot(a.body.x - b.x, a.body.y - b.y));
			}
			// deep in a wall or gate = more than half the radius inside
			const hits = world.queryRadius(a.body.x, a.body.y, BOT_R * 0.5, { mask: 1 | 2 });
			if (hits.length) {
				wallHits++;
				if (process.env.ARENA_DEBUG) console.log("wall", seed, t, i, a.body.x.toFixed(2), a.body.y.toFixed(2), hits.map((h) => [h.type, h.x.toFixed(2), h.y.toFixed(2)]).join(" "));
			}
			if (a.body.x < 0 || a.body.y < 0 || a.body.x > 32 || a.body.y > 20) fail(`seed ${seed}: bot ${i} left the arena`);
		}
	}
	for (let i = 0; i < S.bots.length; i++) worstGap = Math.max(worstGap, (ticks - lastArrival[i]) * dt);
	const minArrivals = Math.min(...arrivals);
	console.log(
		`seed ${seed}: ${S.bots.length} bots, ${seconds}s: arrivals ${S.totalArrivals} (min/bot ${minArrivals}), ` +
			`replans ${S.totalReplans}, no-path ${S.totalNoPath}, longest without arrival ${worstGap.toFixed(1)}s, ` +
			`worst bot overlap ${(Math.max(0, worstOverlap) * 100).toFixed(1)} cm, wall hits ${wallHits}, ` +
			`tick ${(sumMs / ticks).toFixed(3)} ms avg / ${maxMs.toFixed(2)} ms max, ` +
			`HPA ${S.nav.hierarchyStats.nodes} nodes`,
	);
	if (minArrivals < Math.floor(seconds / 30)) fail(`seed ${seed}: a bot reached only ${minArrivals} goals`);
	if (worstGap > 30) fail(`seed ${seed}: a bot went ${worstGap.toFixed(1)}s without reaching a goal (stuck)`);
	if (worstOverlap > 0.05) fail(`seed ${seed}: bots overlapped by ${(worstOverlap * 100).toFixed(1)} cm`);
	if (wallHits > 0) fail(`seed ${seed}: ${wallHits} bot-ticks deep inside a wall`);
	navArenaExample.cleanup(world);
	world.destroy?.();
}
fs.rmSync(outFile, { force: true });
if (failures) {
	console.error(`${failures} failure(s)`);
	process.exit(1);
}
console.log("nav arena smoke: OK");
