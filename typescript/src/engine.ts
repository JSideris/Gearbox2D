import gearboxModule from "../../dist/wasm/gearbox-module.js";
import { DebugGraphics } from "./debug-graphics.js";
import { SHAPES, BODY_TYPES } from "./constants.js";
import { World } from "./world.js";
import * as polygon from "./polygon-utils.js";
import type { WasmModule, CppWorld, CppVec2 } from "./wasm-types.js";

/**@type {Gearbox} */
export class Gearbox {
	isInitialized: boolean;
	debug = new DebugGraphics();

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

	constructor() {}

	get Vec2() {
		return this._vec2C;
	}

	_initCheck() {
		if (!this.isInitialized) throw new Error("Engine is not initialized. Call and await init() first.");
	}

	async init(options: { wasmBinary?: Uint8Array } = {}) {
		if (this.isInitialized) return;

		let Module = (await gearboxModule(options)) as WasmModule;
		this._module = Module;

		const { Vec2, World: WorldConstructor } = Module;

		this._worldC = WorldConstructor;
		this._vec2C = Vec2;

		this.isInitialized = true;
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
