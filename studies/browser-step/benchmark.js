// Loaded as a browser ES module by run.py on a cross-origin-isolated origin.
const warmup = 120;
const samples = 180;
const repeats = 4;
const seed = 210021;

function check(ok, message) {
    if (!ok) throw new Error(message);
}

function populate(world, scene, count) {
    let state = seed;
    function random() {
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return state / 2 ** 32;
    }
    const columns = Math.ceil(Math.sqrt(count));
    world.setGravity(0, scene === "pile" ? -9.81 : 0);
    for (let i = 0; i < count; i++) {
        const jitter = random() * 0.01;
        const id = i + 1;
        if (scene === "pile") {
            world.createBody(id, {shape: 2, width: 1, height: 1, canSleep: false, restitution: 0,
                x: i % columns * 1.002 + jitter, y: 0.5 + Math.floor(i / columns) * 1.002});
        } else if (scene === "islands") {
            const pair = Math.floor(i / 2);
            world.createBody(id, {shape: 1, radius: 0.25, canSleep: false,
                x: pair % 32 * 8 + i % 2, y: Math.floor(pair / 32) * 8 + jitter,
                vy: i % 2 ? 0.5 : -0.5, linearDamping: 0});
            if (i % 2) check(world.createDistanceJoint(id, id - 1, id, 0, 0, 0, 0, 1) === id, "joint creation");
        } else {
            world.createBody(id, {shape: 1, radius: 0.25, x: i % 32 * 6 + jitter, y: Math.floor(i / 32) * 6,
                isSleeping: i % 16 !== 0, canSleep: i % 16 !== 0, vy: 0.1});
        }
    }
    if (scene === "pile") {
        world.createBody(count + 1, {type: 1, shape: 2, width: columns + 8, height: 1,
            x: (columns - 1) / 2, y: -0.5, restitution: 0});
    }
}

function checkWorld(world, scene, count, mode) {
    const ints = world.getLiveBodyIntData();
    check((ints.buffer instanceof SharedArrayBuffer) === (mode === "mt"), "unexpected WASM memory");
    check(world.getBodyCount() === count + Number(scene === "pile"), "body count");
    const floats = world.getLiveBodyFloatData();
    // SoA layout from cpp/include/constants.h.
    let sleeping = 0;
    for (let i = 0; i < count; i++) {
        check(Number.isFinite(floats[i]) && Number.isFinite(floats[10000 + i]), "nonfinite position");
        sleeping += Number((ints[20000 + i] & 4) !== 0);
    }
    check(sleeping === (scene === "sleeping" ? count * 15 / 16 : 0), "sleep count " + sleeping);
}

function run(module, scene, count, mode, diagnostic) {
    const world = new module.World();
    try {
        populate(world, scene, count);
        for (let i = 0; i < warmup; i++) world.step();
        checkWorld(world, scene, count, mode);
        check((typeof world.benchCandidates === "function") === diagnostic, "build mismatch");
        const times = [];
        let candidates = 0;
        const updates = diagnostic && world.benchLeafUpdates();
        const tasks = diagnostic && world.benchWorkerTasks();
        for (let i = 0; i < samples; i++) {
            if (diagnostic) {
                world.step();
                candidates += world.benchCandidates();
            } else {
                const start = performance.now();
                world.step();
                times.push(performance.now() - start);
            }
        }
        checkWorld(world, scene, count, mode);
        if (!diagnostic) return times;
        const workerTasks = world.benchWorkerTasks() - tasks;
        check((workerTasks > 0) === (mode === "mt"), "unexpected worker task count");
        check(scene !== "pile" || candidates >= samples * count, "pile lost its contacts");
        return {candidates: candidates / samples, updates: (world.benchLeafUpdates() - updates) / samples,
            workerTasks: workerTasks / samples};
    } finally {
        world.delete();
    }
}

async function benchmark() {
    check(crossOriginIsolated, "cross-origin isolation required");
    let workers = 0;
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
        constructor(...args) { super(...args); workers++; }
    };
    const rows = [];
    for (const build of ["release", "diagnostic"]) {
        const modules = {};
        for (const mode of ["st", "mt"]) {
            const before = workers;
            const factory = await import('./' + build + '/gearbox-module-' + mode + '.js');
            modules[mode] = await factory.default();
            check(workers - before === (mode === "mt" ? 4 : 0), "pthread pool size");
        }
        for (const scene of ["sleeping", "pile", "islands"]) {
            for (const count of [64, 256, 1024]) {
                const diagnostic = build === "diagnostic";
                const row = {build, scene, count, st: [], mt: []};
                for (let i = 0; i < (diagnostic ? 1 : repeats); i++) {
                    for (const mode of i % 2 ? ["mt", "st"] : ["st", "mt"]) {
                        row[mode].push(run(modules[mode], scene, count, mode, diagnostic));
                    }
                }
                rows.push(row);
            }
        }
    }
    return {browser: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
        warmup, samples, repeats, seed, rows};
}

try {
    const result = await benchmark();
    await fetch("/result", {method: "POST", body: JSON.stringify(result)});
} catch (error) {
    await fetch("/result", {method: "POST", body: JSON.stringify({error: String(error.stack || error)})});
}
