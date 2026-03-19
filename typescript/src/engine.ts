import gearboxModule from "../../dist/wasm/gearbox-module.js";
import { DebugGraphics } from "./debug-graphics.js";
import { SHAPES, BODY_TYPES } from "./constants.js";
import { World } from "./world.js";
import * as polygon from "./polygon-utils.js";

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
	private _module: any;
	private _worldC: any;
	private _vec2C: any;

	constructor() {}

	get Vec2() {
		return this._vec2C;
	}

	_initCheck() {
		if (!this.isInitialized) throw new Error("Engine is not initialized. Call and await init() first.");
	}

	async init(options: { wasmBinary?: Uint8Array } = {}) {
		if (this.isInitialized) return;

		let Module = await gearboxModule(options);
		this._module = Module;

		const { Vec2, World: WorldConstructor } = Module;

		this._worldC = WorldConstructor;
		this._vec2C = Vec2;

		this.isInitialized = true;
	}

	getWasmMemory() {
		this._initCheck();
		// Emscripten modularized builds might expose memory in different ways
		const buffer =
			this._module.HEAP8?.buffer ||
			this._module.HEAPU8?.buffer ||
			this._module.wasmMemory?.buffer ||
			this._module.buffer;
		return buffer ? buffer.byteLength : 0;
	}

	makeWorld() {
		this._initCheck();
		const world = new World(new this._worldC());
		(world as any)._wasmMemoryGetter = () => this.getWasmMemory();
		return world;
	}
}

const gearbox = new Gearbox();

export default gearbox;
