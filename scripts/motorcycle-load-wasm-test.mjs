// Run the real showcase callbacks with the shipped single-threaded WASM engine.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import gearbox from "../dist/js/gearbox.js";

const wasmBinary = readFileSync(new URL("../dist/wasm/gearbox-module-st.wasm", import.meta.url));
await gearbox.init({
	mode: "st",
	wasmBinary,
	instantiateWasm(imports, done) {
		WebAssembly.instantiate(wasmBinary, imports).then(({ instance }) => done(instance));
		return {};
	},
});

const showcase = await build({
	entryPoints: [fileURLToPath(new URL("../site/examples/showcase/motorcycle.ts", import.meta.url))],
	bundle: true,
	write: false,
	format: "esm",
	plugins: [{
		name: "use-shipped-engine",
		setup(builder) {
			builder.onResolve({ filter: /^gearbox2d$/ }, () => ({
				path: new URL("../dist/js/gearbox.js", import.meta.url).href,
				external: true,
			}));
		},
	}],
});
const { motorcycleExample } = await import("data:text/javascript;base64," +
	Buffer.from(showcase.outputFiles[0].contents).toString("base64"));
globalThis.window = new EventTarget();
globalThis.document = { getElementById: () => new EventTarget() };

function wheelOverlap(wheel, world) {
	let deepest = 0;
	world.iterateBodies(terrain => {
		if (terrain.type !== gearbox.bodyTypes.FIXED_OBJECT) return;
		const box = terrain.fixtures[0];
		const center = terrain.worldToLocal(wheel);
		const dx = Math.abs(center.x) - box.width / 2;
		const dy = Math.abs(center.y) - box.height / 2;
		const signedDistance = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
		deepest = Math.max(deepest, wheel.fixtures[0].radius - signedDistance);
	});
	return deepest;
}

function compression(spring) {
	const a = spring.bodyA.localToWorld(spring.localAnchorA);
	const b = spring.bodyB.localToWorld(spring.localAnchorB);
	return Math.max(0, spring.length - Math.hypot(a.x - b.x, a.y - b.y));
}

function run(label, key, flat) {
	const world = gearbox.createWorld();
	const random = Math.random;
	let seed = 1;
	Math.random = flat ? () => 0.5 : () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
	try {
		const dt = 1 / 60;
		world.setTimeStep(dt);
		motorcycleExample.init(world);
		const rear = world.getBodyById(7);
		const front = world.getBodyById(13);
		const rearSpring = world.getJointById(6);
		const frontSpring = world.getJointById(12);
		function sample(steps) {
			const peaks = { rearOverlap: 0, frontOverlap: 0, rearCompression: 0, frontCompression: 0 };
			for (let i = 0; i < steps; i++) {
				world.step();
				motorcycleExample.tick(world, dt);
				peaks.rearOverlap = Math.max(peaks.rearOverlap, wheelOverlap(rear, world));
				peaks.frontOverlap = Math.max(peaks.frontOverlap, wheelOverlap(front, world));
				peaks.rearCompression = Math.max(peaks.rearCompression, compression(rearSpring));
				peaks.frontCompression = Math.max(peaks.frontCompression, compression(frontSpring));
			}
			return peaks;
		}
		const landing = sample(120);
		const idle = sample(60);
		const start = rear.x;
		window.dispatchEvent(Object.assign(new Event("keydown"), { code: key }));
		const driving = sample(420);
		console.log(label, { landing, idle, driving, rearTravel: rear.x - start });
		assert.ok(idle.rearOverlap > 0 && idle.rearOverlap < 0.016, "settled tire supports the rear");
		assert.ok(idle.rearCompression > 0, "settled suspension carries load");
		assert.ok(key === "KeyD" ? rear.x > 15 : rear.x < 0, "drive reaches the next terrain feature");
		for (const overlap of [driving.rearOverlap, driving.frontOverlap]) {
			assert.ok(overlap < rear.fixtures[0].radius / 10, `${label}: excessive tire overlap ${overlap} m`);
		}
	} finally {
		Math.random = random;
		motorcycleExample.cleanup(world);
		world.destroy();
	}
}

run("seed 1 forward", "KeyD", false);
run("flat forward", "KeyD", true);
run("back hill reverse", "KeyA", false);
