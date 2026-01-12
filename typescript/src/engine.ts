
import gearboxModule from '../../dist/wasm/gearbox-module.js';
import { DebugGraphics } from './debug-graphics.js';
import { SHAPES, BODY_TYPES } from './constants.js';
import { World } from './world.js';

/**@type {Gearbox} */
export class Gearbox {
	isInitialized: boolean;
	debug = new DebugGraphics();

	// Enums.
	shapes = SHAPES;
	bodyTypes = BODY_TYPES;

	// Wasm module constructors.
	private _worldC: any;
	private _vec2C: any;
	
	constructor(){
		
	}

	get Vec2(){ return this._vec2C; }

	_initCheck(){
		if(!this.isInitialized) throw new Error("Engine is not initialized. Call and await init() first.");
	}

	async init(options: { wasmBinary?: Uint8Array } = {}){
		if(this.isInitialized) return;

		let Module = await gearboxModule(options)

		const {
			// ObjectShape,
			// ObjectType, 
			// PhysicalObject, 
			Vec2, 
			World: WorldConstructor, 
		} = Module;

		
		this._worldC = WorldConstructor;
		this._vec2C = Vec2;
		// this._physicalObject = PhysicalObject;
		// this._objectType = ObjectType;
		// this._objectShape = ObjectShape;

		this.isInitialized = true;
	}

	makeWorld(){
		this._initCheck();
		return new World(this._worldC);
	}
}

const gearbox = new Gearbox();

export default gearbox;

