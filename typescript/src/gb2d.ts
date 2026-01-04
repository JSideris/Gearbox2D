
import gb2dModule from '../../dist/wasm/gb2d-module.js';
import { DebugGraphics } from './debug-graphics.js';

const SIZE_I = 6;
const SIZE_F = 30;

const ID_OFFSET = 0;
const SHAPE_OFFSET = 1;
const TYPE_OFFSET = 2;
const HAS_COLLISION_OFFSET = 3;
const CATEGORY_BITS_OFFSET = 4;
const MASK_BITS_OFFSET = 5;

const HAS_AABB_COLLISION = 0x1;
const HAS_PHYSICAL_COLLISION = 0x2;
const IS_ASLEEP = 0x4;

export const SHAPES = {
	POINT: 0,
	CIRCLE: 1,
	AABB: 2,
	BOX: 3,
	ELLIPSE: 4,
	CAPSULE: 5,
	POLYGON: 6
};

export const BODY_TYPES = {
	RIGID_BODY: 0,
	SENSOR: 1,
	FIXED_OBJECT: 2,
};

export { HAS_AABB_COLLISION, HAS_PHYSICAL_COLLISION, IS_ASLEEP };

const X_OFFSET = 0;
const Y_OFFSET = 1;
const R_OFFSET = 2;
const VX_OFFSET = 3;
const VY_OFFSET = 4;
const RS_OFFSET = 5;
const MASS_OFFSET = 6;
const INV_MASS_OFFSET = 7;

const G_SCALE_OFFSET = 8 // How much gravity affects this object.
const RESTITUTION_OFFSET = 9 // Bounciness
const S_FRICTION_OFFSET = 10 // Static friction
const K_FRICTION_OFFSET = 11 // Kinetic friction
const DAMPING_OFFSET = 12 // Linear damping (air resistance)
const ANGULAR_DAMPING_OFFSET = 13 // Angular damping

const RADIUS_OFFSET = 14;
const WIDTH_OFFSET = 14;
const HEIGHT_OFFSET = 15;
const FX_OFFSET = 16;
const FY_OFFSET = 17;
const IX_OFFSET = 18;
const IY_OFFSET = 19;
const AX1_OFFSET = 20;
const AY1_OFFSET = 21;
const AX2_OFFSET = 22;
const AY2_OFFSET = 23;
const NFX_OFFSET = 24;
const NFY_OFFSET = 25;
const NIX_OFFSET = 26;
const NIY_OFFSET = 27;
const IA_OFFSET = 28;
const NIA_OFFSET = 29;

export class World {
	world: any;
	liveFloatData: Float32Array;
	liveIntData: Int32Array;
	objectCount: number;
	objectsById: Record<number, PhysicalObject>;
	constructor(WorldConstructor){
		this.world = new WorldConstructor();
		// this.ids = this.world.getIds();
		this.liveFloatData = this.world.getLiveFloatData();
		this.liveIntData = this.world.getLiveIntData();
		// console.log(this.liveFloatData);
		/**
		 * @type {Record<number, PhysicalObject>}
		 */
		this.objectsById = {}
		this.objectCount = 0;
	}
	// getObjectByIndex(index){
	// 	return new PhysicalObject(index, this, this.liveFloatData, this.liveIntData);
	// }
	getObjectById(id){
		return this.objectsById[id];
	}
	iterateObjects(cb){
		// We can just iterate the objects in this.objectsById.
		for(let id in this.objectsById){
			cb(this.objectsById[id]);
		}
	}

	step(){
		// console.log("STEP");
		// this.liveFloatData[2] += 0.1;
		return this.world.step();
	}
	clear(){
		this.objectsById = {};
		this.objectCount = 0;
		return this.world.clear();
	}
	setGravity(x, y){
		this.world.setGravity(x,y);
	}
	makeObject(id, spec){
		if(this.objectsById[id]) return null;

		this.objectCount++;

		// console.log("MAKE OBJECT");

		let index = this.world.makeObject(id, spec);
		let obj = new PhysicalObject(index, this, this.liveFloatData, this.liveIntData);
		if (spec.color) obj.color = spec.color;
		this.objectsById[id] = obj;
		return obj;
	
	}
	removeObject(id){
		if(!this.objectsById[id]) {
			console.warn(`Object ${id} not found.`);
			return false;
		}
		else {
			// Remove any labels attached to this object.
			gb2d.debug.removeObjectLabels(id);

			// To delete an object, call world.removeObject. This will return the index.
			// Then read the index, it will contain the ID of the object from the end of the vector
			// which replaced the deleted item. 
			// Then, update the index of the object that replaced the deleted object within our model.
			delete this.objectsById[id];
			let deletedIndex = this.world.removeObject(id);
			// console.debug(`Removing from index ${deletedIndex}.`);
			let replacedId = this.liveIntData[deletedIndex * SIZE_I + ID_OFFSET];
			// console.debug(`Replacing with #${replacedId}.`);
			if(replacedId != id){
				// Happens when we delete the last object in the list.
				let replacedObj = this.objectsById[replacedId];
				replacedObj.index = deletedIndex;
			}
			this.objectCount--;
		}
	}

	setHasPenetrationResolution(value){ this.world.setHasPenetrationResolution(value); }
	setHasRestitution(value){ this.world.setHasRestitution(value); }
	setHasFriction(value){ this.world.setHasFriction(value); }
};

// There's a way to make this work.
// We just need to grab the index given the ID.
// Thing is, this probably isn't something that needs to happen on each frame, and certainly not on each data read.
// I bet there's a way to just mark the object as "dirty".
export class PhysicalObject{
	id: number;
	liveFData: Float32Array;
	liveIData: Int32Array;
	index: number;
	world: World;
	color?: string;
	constructor(index: number, world: World, liveFData: Float32Array, liveIData: Int32Array){
		this.id = liveIData[index * SIZE_I + ID_OFFSET];
		this.liveFData = liveFData;
		this.liveIData = liveIData;
		this.index = index;
		this.world = world;
	}

    get shape() { return this.liveIData[this.index * SIZE_I + SHAPE_OFFSET]; }
    set shape(v) { this.liveIData[this.index * SIZE_I + SHAPE_OFFSET] = v; }

    get type() { return this.liveIData[this.index * SIZE_I + TYPE_OFFSET]; }
    // set type(v) { this.liveIData[this.index * SIZE_I + TYPE_OFFSET] = v; }

    get x() { return this.liveFData[this.index * SIZE_F + X_OFFSET]; }
    set x(v) { 
		if(this.liveFData[this.index * SIZE_F + X_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + X_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get y() { return this.liveFData[this.index * SIZE_F + Y_OFFSET]; }
    set y(v) { 
		if(this.liveFData[this.index * SIZE_F + Y_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + Y_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get r() { return this.liveFData[this.index * SIZE_F + R_OFFSET]; }
    set r(v) { 
		if(this.liveFData[this.index * SIZE_F + R_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + R_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get vx() { return this.liveFData[this.index * SIZE_F + VX_OFFSET]; }
    set vx(v) { 
		if(this.liveFData[this.index * SIZE_F + VX_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + VX_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get vy() { return this.liveFData[this.index * SIZE_F + VY_OFFSET]; }
    set vy(v) { 
		if(this.liveFData[this.index * SIZE_F + VY_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + VY_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get rs() { return this.liveFData[this.index * SIZE_F + RS_OFFSET]; }
    set rs(v) { 
		if(this.liveFData[this.index * SIZE_F + RS_OFFSET] != v){
			this.liveFData[this.index * SIZE_F + RS_OFFSET] = v; 
			this.wakeUp();
		}
	}
    
    get mass() { return this.liveFData[this.index * SIZE_F + MASS_OFFSET]; }
    set mass(v) { 
		if(this.type != BODY_TYPES.FIXED_OBJECT){
			this.liveFData[this.index * SIZE_F + MASS_OFFSET] = v; 
			this.liveFData[this.index * SIZE_F + INV_MASS_OFFSET] = (v != 0) ? (1 / v) : 0; 
		}
	}
    
    get fx() { return this.liveFData[this.index * SIZE_F + FX_OFFSET]; }
    // set fx(v) { this.liveFData[this.index * SIZE_F + FX_OFFSET] = v; }
    
    get fy() { return this.liveFData[this.index * SIZE_F + FY_OFFSET]; }
    // set fy(v) { this.liveFData[this.index * SIZE_F + FY_OFFSET] = v; }
    
    get ix() { return this.liveFData[this.index * SIZE_F + IX_OFFSET]; }
    // set ix(v) { this.liveFData[this.index * SIZE_F + IX_OFFSET] = v; }
    
    get iy() { return this.liveFData[this.index * SIZE_F + IY_OFFSET]; }
    // set iy(v) { this.liveFData[this.index * SIZE_F + IY_OFFSET] = v; }
    
    get radius() { return this.liveFData[this.index * SIZE_F + RADIUS_OFFSET]; }
    set radius(v) { this.liveFData[this.index * SIZE_F + RADIUS_OFFSET] = v; }
    
    get width() { return this.liveFData[this.index * SIZE_F + WIDTH_OFFSET]; } // width shares a common index with radius
    set width(v) { this.liveFData[this.index * SIZE_F + WIDTH_OFFSET] = v; }
    
    get height() { return this.liveFData[this.index * SIZE_F + HEIGHT_OFFSET]; }
    set height(v) { this.liveFData[this.index * SIZE_F + HEIGHT_OFFSET] = v; }
    
    get ax1() { return this.liveFData[this.index * SIZE_F + AX1_OFFSET]; }
    // set ax1(v) { this.liveFData[this.index * SIZE_F + AX1_OFFSET] = v; }
    
    get ay1() { return this.liveFData[this.index * SIZE_F + AY1_OFFSET]; }
    // set ay1(v) { this.liveFData[this.index * SIZE_F + AY1_OFFSET] = v; }
    
    get ax2() { return this.liveFData[this.index * SIZE_F + AX2_OFFSET]; }
    // set ax2(v) { this.liveFData[this.index * SIZE_F + AX2_OFFSET] = v; }
    
    get ay2() { return this.liveFData[this.index * SIZE_F + AY2_OFFSET]; }
    // set ay2(v) { this.liveFData[this.index * SIZE_F + AY2_OFFSET] = v; }
    
    get hasCollisionFlags() { return this.liveIData[this.index * SIZE_I + HAS_COLLISION_OFFSET]; }

	wakeUp() {
		const cppObj = this.world.world.getObject(this.id);
		if (cppObj) {
			cppObj.wakeUp();
		}
	}

	get angularImpulse() { return this.liveFData[this.index * SIZE_F + IA_OFFSET]; }

	get categoryBits() { return this.liveIData[this.index * SIZE_I + CATEGORY_BITS_OFFSET]; }
	set categoryBits(v) {
		this.liveIData[this.index * SIZE_I + CATEGORY_BITS_OFFSET] = v;
		const cppObj = this.world.world.getObject(this.id);
		if (cppObj) cppObj.setCategoryBits(v);
	}

	get maskBits() { return this.liveIData[this.index * SIZE_I + MASK_BITS_OFFSET]; }
	set maskBits(v) {
		this.liveIData[this.index * SIZE_I + MASK_BITS_OFFSET] = v;
		const cppObj = this.world.world.getObject(this.id);
		if (cppObj) cppObj.setMaskBits(v);
	}

	get gScale() { return this.liveFData[this.index * SIZE_F + G_SCALE_OFFSET]; }
	set gScale(v) { this.liveFData[this.index * SIZE_F + G_SCALE_OFFSET] = v; }

	get restitution() { return this.liveFData[this.index * SIZE_F + RESTITUTION_OFFSET]; }
	set restitution(v) { this.liveFData[this.index * SIZE_F + RESTITUTION_OFFSET] = v; }
	
	get staticFriction() { return this.liveFData[this.index * SIZE_F + S_FRICTION_OFFSET]; }
	set staticFriction(v) { this.liveFData[this.index * SIZE_F + S_FRICTION_OFFSET] = v; }
	
	get kineticFriction() { return this.liveFData[this.index * SIZE_F + K_FRICTION_OFFSET]; }
	set kineticFriction(v) { this.liveFData[this.index * SIZE_F + K_FRICTION_OFFSET] = v; }

	applyForce(x, y){
		if (x || y) {
			this.liveFData[this.index * SIZE_F + NFX_OFFSET] += x || 0;
			this.liveFData[this.index * SIZE_F + NFY_OFFSET] += y || 0;
			this.wakeUp();
		}
	}
	applyImpulse(x, y, px = 0, py = 0){
		if (x || y) {
			this.liveFData[this.index * SIZE_F + NIX_OFFSET] += x || 0;
			this.liveFData[this.index * SIZE_F + NIY_OFFSET] += y || 0;

			if (px !== 0 || py !== 0) {
				const torque = x * py - y * px;
				this.applyAngularImpulse(torque);
			} else {
				this.wakeUp();
			}
		}
	}
	applyAngularImpulse(torque){
		if (torque) {
			this.liveFData[this.index * SIZE_F + NIA_OFFSET] += torque || 0;
			this.wakeUp();
		}
	}
}

/**@type {Gb2d} */
class Gb2d{
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

	async init(){
		if(this.isInitialized) return;

		let Module = await gb2dModule()

		const {
			// ObjectShape,
			// ObjectType, 
			// PhysicalObject, 
			Vec2, 
			World, 
		} = Module;

		
		this._worldC = World;
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

const gb2d = new Gb2d();

export default gb2d;
