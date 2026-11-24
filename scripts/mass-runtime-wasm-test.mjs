// Exercise live edits through the shipped JavaScript wrapper and single-threaded WASM.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function checkResponse(world, body, mass, inertia) {
	body.vx = 0;
	body.rs = 0;
	body.applyImpulse(1, 0);
	body.applyAngularImpulse(1);
	world.step();
	for (const [name, actual, expected] of [
		["mass", body.mass, mass],
		["vx", body.vx, mass > 0 ? 1 / mass : 0],
		["rs", body.rs, inertia > 0 ? 1 / inertia : 0],
	]) {
		assert.ok(Math.abs(actual - expected) < 1e-5, `${name}: expected ${expected}, got ${actual}`);
	}
}

const world = gearbox.createWorld();
try {
	world.setGravity(0, 0);
	const options = { linearDamping: 0, angularDamping: 0 };
	const circle = { shape: gearbox.shapes.CIRCLE, radius: 1 };
	const body = world.createBody(options);
	body.mass = 10;
	checkResponse(world, body, 10, 0);
	const small = body.createFixture(circle);
	const large = body.createFixture({ ...circle, radius: 2 });
	checkResponse(world, body, 10, 17);
	body.mass = 20;
	checkResponse(world, body, 20, 34);
	small.density = 4;
	checkResponse(world, body, 20, 25);
	body.mass = 0;
	checkResponse(world, body, 8 * Math.PI, 10 * Math.PI);
	small.density = 0;
	checkResponse(world, body, 4 * Math.PI, 8 * Math.PI);
	large.density = 0;
	checkResponse(world, body, 0, 0);

	for (const [i, type] of [gearbox.bodyTypes.FIXED_OBJECT, gearbox.bodyTypes.KINEMATIC_OBJECT].entries()) {
		const immovable = world.createBody({ ...options, ...circle, type, x: 20 * (i + 1) });
		immovable.mass = 10;
		immovable.fixtures[0].density = 4;
		checkResponse(world, immovable, 0, 0);
	}
} finally {
	world.destroy();
}
console.log("Runtime mass overrides passed");
