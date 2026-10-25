// Single-threaded wasm heap: many live worlds, then a read on an older world after another allocation.
// Requires dist/ from `npm run build`. Not part of `npm test` (CI does not build a real wasm module).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gearbox from "../dist/js/gearbox.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmPath = path.join(root, "dist/wasm/gearbox-module-st.wasm");
if (!fs.existsSync(wasmPath) || fs.statSync(wasmPath).size < 1000) {
	console.error(`Missing a built ${wasmPath}. Run npm run build first.`);
	process.exit(1);
}

const bin = new Uint8Array(fs.readFileSync(wasmPath));
await gearbox.init({
	mode: "st",
	wasmBinary: bin,
	instantiateWasm: (imports, done) => {
		WebAssembly.instantiate(bin, imports).then((result) => done(result.instance));
		return {};
	},
});

function createLiveWorld(x) {
	const world = gearbox.createWorld();
	const body = world.createBody({
		id: 1,
		type: gearbox.bodyTypes.FIXED_OBJECT,
		x,
		y: 1,
		shape: gearbox.shapes.CIRCLE,
		radius: 0.5,
	});
	return { world, body };
}

const live = [];
for (let i = 0; i < 10; i++) live.push(createLiveWorld(1 + i));

const heapAfter10 = gearbox.getWasmMemory();
// The single-threaded module starts at about 16 MiB. Ten worlds do not fit unless the heap grew.
if (heapAfter10 <= 17 * 1024 * 1024) {
	throw new Error(`expected the heap to grow past 16 MiB, got ${heapAfter10} bytes`);
}

const older = live[0];
older.world.step();
const before = older.body.x;

live.push(createLiveWorld(50));
const after = older.body.x;
if (after !== before) {
	throw new Error(`body.x on an older world changed after another world was created: ${before} -> ${after}`);
}

for (const entry of live) entry.world.destroy();

for (let i = 0; i < 20; i++) {
	const world = gearbox.createWorld();
	world.destroy();
}

console.log(`heap after 10 live worlds: ${(heapAfter10 / 1048576).toFixed(2)} MiB`);
console.log("heap growth test passed");
