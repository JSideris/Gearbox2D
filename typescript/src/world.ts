
import { PhysicalObject } from './physical-object.js';
import { HingeJoint, DistanceJoint, SpringJoint, GearJoint } from './joints.js';
import { SIZE_I, ID_OFFSET, EVENT_TYPES } from './constants.js';
// We'll import gearbox from engine.js to access debug graphics
import gearbox from './engine.js';

export class World {
	world: any;
	liveFloatData: Float32Array;
	liveIntData: Int32Array;
	objectCount: number;
	stepCount: number = 0;
	interpolationAlpha: number = 1.0;
	objectsById: Record<number, PhysicalObject>;
	jointsById: Record<number, HingeJoint | DistanceJoint | SpringJoint | GearJoint>;

	onCollisionStart?: (idA: number, idB: number, impulse: number) => void;
	onCollisionEnd?: (idA: number, idB: number, impulse: number) => void;
	onSleep?: (id: number) => void;
	onWake?: (id: number) => void;

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
		const result = this.world.step();
		
		// Handle events
		const eventCount = this.world.getEventCount();
		if (eventCount > 0) {
			const eventData = this.world.getEventData();
			for (let i = 0; i < eventCount; i++) {
				const type = eventData[i * 4];
				const idA = eventData[i * 4 + 1];
				const idB = eventData[i * 4 + 2];
				const impulse = eventData[i * 4 + 3];

				if (type === EVENT_TYPES.COLLISION_START && this.onCollisionStart) {
					this.onCollisionStart(idA, idB, impulse);
				} else if (type === EVENT_TYPES.COLLISION_END && this.onCollisionEnd) {
					this.onCollisionEnd(idA, idB, impulse);
				} else if (type === EVENT_TYPES.SLEEP) {
					if (this.onSleep) this.onSleep(idA);
					const obj = this.objectsById[idA];
					if (obj && obj.onSleep) obj.onSleep();
				} else if (type === EVENT_TYPES.WAKE) {
					if (this.onWake) this.onWake(idA);
					const obj = this.objectsById[idA];
					if (obj && obj.onWake) obj.onWake();
				}
			}
		}

		return result;
	}
	queryPoint(x: number, y: number, mask: number = 0xFFFFFFFF): number[] {
		const resultVec = this.world.queryPoint(x, y, mask);
		const result = [];
		for (let i = 0; i < resultVec.size(); i++) {
			result.push(resultVec.get(i));
		}
		resultVec.delete();
		return result;
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
			gearbox.debug.removeObjectLabels(id);

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

