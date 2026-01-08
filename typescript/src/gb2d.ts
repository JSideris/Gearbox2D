
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
	stepCount: number = 0;
	objectsById: Record<number, PhysicalObject>;
	jointsById: Record<number, HingeJoint | DistanceJoint | SpringJoint | GearJoint>;
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
		this.jointsById = {}
		this.objectCount = 0;
		this.stepCount = 0;
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
		this.stepCount++;
		// console.log("STEP");
		// this.liveFloatData[2] += 0.1;
		return this.world.step();
	}
	clear(){
		this.objectsById = {};
		this.jointsById = {};
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

			// Remove any associated joints from our local record.
			// The C++ side will handle the actual removal of the joints.
			for (let jointId in this.jointsById) {
				const joint = this.jointsById[jointId];
				if (joint instanceof GearJoint) {
					if (joint.joint1.bodyA.id === id || joint.joint1.bodyB.id === id ||
						joint.joint2.bodyA.id === id || joint.joint2.bodyB.id === id) {
						delete this.jointsById[jointId];
					}
				} else {
					if ((joint as any).bodyA.id === id || (joint as any).bodyB.id === id) {
						delete this.jointsById[jointId];
					}
				}
			}

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

	createHingeJoint(id, bodyA, bodyB, options: any = {}) {
		if (this.jointsById[id]) return null;

		let localAnchorA = { x: 0, y: 0 };
		let localAnchorB = { x: 0, y: 0 };

		if (options.worldAnchor) {
			localAnchorA = bodyA.worldToLocal(options.worldAnchor);
			localAnchorB = bodyB.worldToLocal(options.worldAnchor);
		} else {
			localAnchorA = options.anchorA || { x: 0, y: 0 };
			localAnchorB = options.anchorB || { x: 0, y: 0 };
		}

		this.world.createHingeJoint(id, bodyA.id, bodyB.id, localAnchorA.x, localAnchorA.y, localAnchorB.x, localAnchorB.y);
		const joint = new HingeJoint(id, this, bodyA, bodyB, localAnchorA, localAnchorB);
		this.jointsById[id] = joint;
		return joint;
	}

	createDistanceJoint(id, bodyA, bodyB, options: any = {}) {
		if (this.jointsById[id]) return null;

		let localAnchorA = { x: 0, y: 0 };
		let localAnchorB = { x: 0, y: 0 };

		if (options.worldAnchorA && options.worldAnchorB) {
			localAnchorA = bodyA.worldToLocal(options.worldAnchorA);
			localAnchorB = bodyB.worldToLocal(options.worldAnchorB);
		} else if (options.worldAnchor) {
			localAnchorA = bodyA.worldToLocal(options.worldAnchor);
			localAnchorB = bodyB.worldToLocal(options.worldAnchor);
		} else {
			localAnchorA = options.anchorA || { x: 0, y: 0 };
			localAnchorB = options.anchorB || { x: 0, y: 0 };
		}

		let length = options.length;
		if (length === undefined) {
			const wA = bodyA.localToWorld(localAnchorA);
			const wB = bodyB.localToWorld(localAnchorB);
			length = Math.sqrt(Math.pow(wB.x - wA.x, 2) + Math.pow(wB.y - wA.y, 2));
		}

		this.world.createDistanceJoint(id, bodyA.id, bodyB.id, localAnchorA.x, localAnchorA.y, localAnchorB.x, localAnchorB.y, length);
		const joint = new DistanceJoint(id, this, bodyA, bodyB, localAnchorA, localAnchorB, length);
		this.jointsById[id] = joint;
		return joint;
	}

	createSpringJoint(id, bodyA, bodyB, options: any = {}) {
		if (this.jointsById[id]) return null;

		let localAnchorA = { x: 0, y: 0 };
		let localAnchorB = { x: 0, y: 0 };

		if (options.worldAnchorA && options.worldAnchorB) {
			localAnchorA = bodyA.worldToLocal(options.worldAnchorA);
			localAnchorB = bodyB.worldToLocal(options.worldAnchorB);
		} else if (options.worldAnchor) {
			localAnchorA = bodyA.worldToLocal(options.worldAnchor);
			localAnchorB = bodyB.worldToLocal(options.worldAnchor);
		} else {
			localAnchorA = options.anchorA || { x: 0, y: 0 };
			localAnchorB = options.anchorB || { x: 0, y: 0 };
		}

		let length = options.length;
		if (length === undefined) {
			const wA = bodyA.localToWorld(localAnchorA);
			const wB = bodyB.localToWorld(localAnchorB);
			length = Math.sqrt(Math.pow(wB.x - wA.x, 2) + Math.pow(wB.y - wA.y, 2));
		}

		const frequencyHz = options.frequencyHz || 5.0;
		const dampingRatio = options.dampingRatio !== undefined ? options.dampingRatio : 0.7;

		this.world.createSpringJoint(id, bodyA.id, bodyB.id, localAnchorA.x, localAnchorA.y, localAnchorB.x, localAnchorB.y, length, frequencyHz, dampingRatio);
		const joint = new SpringJoint(id, this, bodyA, bodyB, localAnchorA, localAnchorB, length, frequencyHz, dampingRatio);
		this.jointsById[id] = joint;
		return joint;
	}

	createGearJoint(id, joint1, joint2, ratio = 1.0) {
		if (this.jointsById[id]) return null;
		this.world.createGearJoint(id, joint1.id, joint2.id, ratio);
		const joint = new GearJoint(id, this, joint1, joint2, ratio);
		this.jointsById[id] = joint;
		return joint;
	}

	removeJoint(id) {
		this.world.removeJoint(id);
		delete this.jointsById[id];
	}

	getJointById(id) {
		return this.jointsById[id];
	}
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

	get damping() { return this.liveFData[this.index * SIZE_F + DAMPING_OFFSET]; }
	set damping(v) { this.liveFData[this.index * SIZE_F + DAMPING_OFFSET] = v; }

	get angularDamping() { return this.liveFData[this.index * SIZE_F + ANGULAR_DAMPING_OFFSET]; }
	set angularDamping(v) { this.liveFData[this.index * SIZE_F + ANGULAR_DAMPING_OFFSET] = v; }

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

	worldToLocal(worldPoint: { x: number, y: number }) {
		const dx = worldPoint.x - this.x;
		const dy = worldPoint.y - this.y;
		const angle = -this.r;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return {
			x: dx * cos - dy * sin,
			y: dx * sin + dy * cos
		};
	}

	localToWorld(localPoint: { x: number, y: number }) {
		const angle = this.r;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const rx = localPoint.x * cos - localPoint.y * sin;
		const ry = localPoint.x * sin + localPoint.y * cos;
		return {
			x: this.x + rx,
			y: this.y + ry
		};
	}
}

export class HingeJoint {
	id: number;
	world: World;
	bodyA: PhysicalObject;
	bodyB: PhysicalObject;
	localAnchorA: { x: number, y: number };
	localAnchorB: { x: number, y: number };

	constructor(id: number, world: World, bodyA: PhysicalObject, bodyB: PhysicalObject, localAnchorA: { x: number, y: number }, localAnchorB: { x: number, y: number }) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		// We need to pass the inverse dt to get the force from the impulse
		// For now, let's just return the impulse or assume 1/60 step
		const f = cppJoint.getReactionForce(60.0); 
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
	}
}

export class DistanceJoint {
	id: number;
	world: World;
	bodyA: PhysicalObject;
	bodyB: PhysicalObject;
	localAnchorA: { x: number, y: number };
	localAnchorB: { x: number, y: number };
	length: number;

	constructor(id: number, world: World, bodyA: PhysicalObject, bodyB: PhysicalObject, localAnchorA: { x: number, y: number }, localAnchorB: { x: number, y: number }, length: number) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
		this.length = length;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		const f = cppJoint.getReactionForce(60.0);
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get length() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getLength();
	}

	set length(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLength(v);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
	}
}

export class SpringJoint {
	id: number;
	world: World;
	bodyA: PhysicalObject;
	bodyB: PhysicalObject;
	localAnchorA: { x: number, y: number };
	localAnchorB: { x: number, y: number };
	length: number;
	frequencyHz: number;
	dampingRatio: number;

	constructor(id: number, world: World, bodyA: PhysicalObject, bodyB: PhysicalObject, localAnchorA: { x: number, y: number }, localAnchorB: { x: number, y: number }, length: number, frequencyHz: number, dampingRatio: number) {
		this.id = id;
		this.world = world;
		this.bodyA = bodyA;
		this.bodyB = bodyB;
		this.localAnchorA = localAnchorA;
		this.localAnchorB = localAnchorB;
		this.length = length;
		this.frequencyHz = frequencyHz;
		this.dampingRatio = dampingRatio;
	}

	get reactionForce() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		const f = cppJoint.getReactionForce(60.0);
		return { x: f.x, y: f.y };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get length() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getLength();
	}

	set length(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLength(v);
	}

	get frequencyHz() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getFrequencyHz();
	}

	set frequencyHz(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setFrequencyHz(v);
	}

	get dampingRatio() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getDampingRatio();
	}

	set dampingRatio(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setDampingRatio(v);
	}

	get localAnchorA() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorA();
	}

	set localAnchorA(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorA(v);
	}

	get localAnchorB() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return { x: 0, y: 0 };
		return cppJoint.getLocalAnchorB();
	}

	set localAnchorB(v: { x: number, y: number }) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setLocalAnchorB(v);
	}
}

export class GearJoint {
	id: number;
	world: World;
	joint1: HingeJoint;
	joint2: HingeJoint;
	ratio: number;

	constructor(id: number, world: World, joint1: HingeJoint, joint2: HingeJoint, ratio: number) {
		this.id = id;
		this.world = world;
		this.joint1 = joint1;
		this.joint2 = joint2;
		this.ratio = ratio;
	}

	get reactionForce() {
		return { x: 0, y: 0 };
	}

	get reactionTorque() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getReactionTorque(60.0);
	}

	get ratio() {
		const cppJoint = this.world.world.getJoint(this.id);
		if (!cppJoint) return 0;
		return cppJoint.getRatio();
	}

	set ratio(v: number) {
		const cppJoint = this.world.world.getJoint(this.id);
		if (cppJoint) cppJoint.setRatio(v);
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
