import { DebugGraphics } from "./debug-graphics.js";
import { SHAPES, BODY_TYPES } from "./constants.js";
import { World } from "./world.js";
import * as polygon from "./polygon-utils.js";
import type { WasmModule, CppWorld, CppVec2 } from "./wasm-types.js";

export type GearboxMode = "auto" | "mt" | "st";

/**@type {Gearbox} */
export class Gearbox {
	isInitialized: boolean;
	debug = new DebugGraphics();
	mode: "mt" | "st" = "st";

	// Enums.
	shapes = SHAPES;
	bodyTypes = BODY_TYPES;
	polygon = {
		makeRegularPolygon: polygon.makeRegularPolygon,
		makeStar: polygon.makeStar,
	};

	// Wasm module constructors.
	private _module: WasmModule | null = null;
	private _worldC: { new (): CppWorld } | null = null;
	private _vec2C: { new (x: number, y: number): CppVec2 } | null = null;
	private _initPromise: Promise<void> | null = null;

	constructor() {}

	get Vec2() {
		return this._vec2C;
	}

	_initCheck() {
		if (!this.isInitialized) throw new Error("Engine is not initialized. Call and await init() first.");
	}

	async init(options: { wasmBinary?: Uint8Array; mode?: GearboxMode } = {}) {
		if (this.isInitialized) return;
		if (this._initPromise) return this._initPromise;

		this._initPromise = (async () => {
			const requestedMode = options.mode || "auto";
			const isIsolated = typeof self !== "undefined" && self.crossOriginIsolated;
			const supportsThreads = isIsolated && typeof SharedArrayBuffer !== "undefined";

			let useMT = false;
			if (requestedMode === "mt") {
				if (!supportsThreads) {
					throw new Error(
						"Gearbox2D: Multithreading requested but cross-origin isolation is not enabled or SharedArrayBuffer is not supported.",
					);
				}
				useMT = true;
			} else if (requestedMode === "st") {
				useMT = false;
			} else {
				// auto
				if (supportsThreads) {
					useMT = true;
				} else {
					console.warn(
						"Gearbox2D: Cross-origin isolation is not enabled. Falling back to single-threaded mode. " +
							"To enable multithreading, ensure your server sends: \n" +
							"  Cross-Origin-Opener-Policy: same-origin\n" +
							"  Cross-Origin-Embedder-Policy: require-corp\n" +
							"To suppress this warning, explicitly set mode to 'st' in init().",
					);
					useMT = false;
				}
			}

			this.mode = useMT ? "mt" : "st";

			let gearboxModule;
			if (useMT) {
				// @ts-ignore
				gearboxModule = (await import("../../dist/wasm/gearbox-module-mt.js")).default;
			} else {
				// @ts-ignore
				gearboxModule = (await import("../../dist/wasm/gearbox-module-st.js")).default;
			}

			let Module = (await gearboxModule(options)) as WasmModule;
			this._module = Module;

			const { Vec2, World: WorldConstructor } = Module;

			this._worldC = WorldConstructor;
			this._vec2C = Vec2;

			this.isInitialized = true;
		})();

		return this._initPromise;
	}

	getWasmMemory() {
		this._initCheck();
		if (!this._module) return 0;
		// Emscripten modularized builds might expose memory in different ways
		const buffer =
			this._module.HEAP8?.buffer ||
			this._module.HEAPU8?.buffer ||
			this._module.wasmMemory?.buffer ||
			this._module.buffer;
		return buffer ? buffer.byteLength : 0;
	}

	createWorld() {
		this._initCheck();
		if (!this._worldC) throw new Error("WASM World constructor not found.");
		const world = new World(new this._worldC());
		world._wasmMemoryGetter = () => this.getWasmMemory();
		return world;
	}
}

const gearbox = new Gearbox();

export default gearbox;
