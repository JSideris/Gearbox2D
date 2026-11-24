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

const dt = 1 / 120;

function hangingSpring(run) {
	const world = gearbox.createWorld();
	try {
		world.setTimeStep(dt);
		world.setGravity(0, 1);
		const circle = { shape: gearbox.shapes.CIRCLE, radius: 0.1, mass: 1, x: 0 };
		const anchor = world.createBody({ ...circle, type: gearbox.bodyTypes.FIXED_OBJECT, y: 0 });
		const load = world.createBody({ ...circle, type: gearbox.bodyTypes.DYNAMIC_OBJECT, y: 2.1 });
		const spring = world.createSpringJoint(anchor, load, { length: 2, frequencyHz: 1, dampingRatio: 0.02 });
		// Establish a moving, stretched spring before each edit.
		for (let i = 0; i < 5; ++i) world.step();
		return run(world, load, spring);
	} finally {
		world.destroy();
	}
}

hangingSpring((world, load, spring) => {
	spring.dampingRatio = 0.8;
	for (let i = 0; i < 360; ++i) world.step();
	const before = load.y;
	load.sleep();
	assert.ok(load.isSleeping);
	spring.length = 3;
	for (let i = 0; i < 360; ++i) world.step();
	assert.ok(Math.abs(load.y - before - 1) < 0.05, `rest length increased by 1, load moved ${load.y - before}`);
});

function trajectory(edit) {
	return hangingSpring((world, load, spring) => {
		edit(spring);
		const samples = [];
		for (let i = 0; i < 360; ++i) {
			world.step();
			samples.push(load.y);
		}
		return samples;
	});
}

function period(samples) {
	const peaks = [];
	for (let i = 1; i < samples.length - 1; ++i) {
		if (samples[i] > samples[i - 1] && samples[i] >= samples[i + 1]) peaks.push(i);
	}
	assert.ok(peaks.length >= 2, "expected two oscillation peaks");
	return (peaks[1] - peaks[0]) * dt;
}

const control = trajectory(() => {});
const slow = period(control);
const fast = period(trajectory(spring => { spring.frequencyHz = 2; }));
assert.ok(Math.abs(fast / slow - 0.5) < 0.06, `doubling frequency changed period from ${slow} to ${fast} s`);

function secondCycleRange(samples) {
	const cycle = samples.slice(Math.round(slow / dt), Math.round(2 * slow / dt));
	return Math.max(...cycle) - Math.min(...cycle);
}

const lightlyDamped = secondCycleRange(control);
const stronglyDamped = secondCycleRange(trajectory(spring => { spring.dampingRatio = 0.4; }));
assert.ok(stronglyDamped < 0.3 * lightlyDamped, `second-cycle excursions: ${lightlyDamped} vs ${stronglyDamped}`);
console.log("Live spring edits passed", { slow, fast, lightlyDamped, stronglyDamped });
