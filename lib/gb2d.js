
import gb2dModule from './build/gb2d-module.js';

const SIZE_I = 4;
const SIZE_F = 28;

const ID_OFFSET = 0;
const SHAPE_OFFSET = 1;
const TYPE_OFFSET = 2;
const HAS_COLLISION_OFFSET = 3;

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

const ANIMSCALE = 100;

class World {
	constructor(WorldConstructor){
		this.world = new WorldConstructor();
		// this.ids = this.world.getIds();
		this.liveFloatData = this.world.getLiveFloatData();
		this.liveIntData = this.world.getLiveIntData();
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
		let obj = new PhysicalObject(index, this.world, this.liveFloatData, this.liveIntData);
		this.objectsById[id] = obj;
		return obj;
	
	}
	removeObject(id){
		// console.log("REMOVE OBJECT");

		// console.debug(`Deleting #${id}.`);
		if(!this.objectsById[id]) {
			console.warn(`Object ${id} not found.`);
			return false;
		}
		else {
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
};

// There's a way to make this work.
// We just need to grab the index given the ID.
// Thing is, this probably isn't something that needs to happen on each frame, and certainly not on each data read.
// I bet there's a way to just mark the object as "dirty".
class PhysicalObject{
	constructor(index, world, liveFData, liveIData){
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
    set x(v) { this.liveFData[this.index * SIZE_F + X_OFFSET] = v; }
    
    get y() { return this.liveFData[this.index * SIZE_F + Y_OFFSET]; }
    set y(v) { this.liveFData[this.index * SIZE_F + Y_OFFSET] = v; }
    
    get r() { return this.liveFData[this.index * SIZE_F + R_OFFSET]; }
    set r(v) { this.liveFData[this.index * SIZE_F + R_OFFSET] = v; }
    
    get vx() { return this.liveFData[this.index * SIZE_F + VX_OFFSET]; }
    set vx(v) { this.liveFData[this.index * SIZE_F + VX_OFFSET] = v; }
    
    get vy() { return this.liveFData[this.index * SIZE_F + VY_OFFSET]; }
    set vy(v) { this.liveFData[this.index * SIZE_F + VY_OFFSET] = v; }
    
    get rs() { return this.liveFData[this.index * SIZE_F + RS_OFFSET]; }
    set rs(v) { this.liveFData[this.index * SIZE_F + RS_OFFSET] = v; }
    
    get mass() { return this.liveFData[this.index * SIZE_F + MASS_OFFSET]; }
    set mass(v) { 
		if(this.type != gb2d.FIXED_OBJECT){
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

	// G_SCALE_OFFSET
	// RESTITUTION_OFFSET
	// S_FRICTION_OFFSET
	// D_FRICTION_OFFSET
	// K_FRICTION_OFFSET
	// DAMPING_OFFSET
	// ANGULAR_DAMPING_OFFSET

	get gScale() { return this.liveFData[this.index * SIZE_F + G_SCALE_OFFSET]; }
	set gScale(v) { this.liveFData[this.index * SIZE_F + G_SCALE_OFFSET] = v; }

	get restitution() { return this.liveFData[this.index * SIZE_F + RESTITUTION_OFFSET]; }
	set restitution(v) { this.liveFData[this.index * SIZE_F + RESTITUTION_OFFSET] = v; }
	
	get staticFriction() { return this.liveFData[this.index * SIZE_F + S_FRICTION_OFFSET]; }
	set staticFriction(v) { this.liveFData[this.index * SIZE_F + S_FRICTION_OFFSET] = v; }
	
	// get dynamicFriction() { return this.liveFData[this.index * SIZE_F + D_FRICTION_OFFSET]; }
	// set dynamicFriction(v) { this.liveFData[this.index * SIZE_F + D_FRICTION_OFFSET] = v; }
	
	get kineticFriction() { return this.liveFData[this.index * SIZE_F + F_FRICTION_OFFSET]; }
	set kineticFriction(v) { this.liveFData[this.index * SIZE_F + F_FRICTION_OFFSET] = v; }

	

	applyForce(x, y){
		this.liveFData[this.index * SIZE_F + NFX_OFFSET] += x || 0;
		this.liveFData[this.index * SIZE_F + NFY_OFFSET] += y || 0;
	}
	applyImpulse(x, y){
		// TODO: apply at a contact point.
		this.liveFData[this.index * SIZE_F + NIX_OFFSET] += x || 0;
		this.liveFData[this.index * SIZE_F + NIY_OFFSET] += y || 0;
	}
}

/**@type {Gb2d} */
class Gb2d{
	
	constructor(){
		this.canvas = null;
		this.ctx = null;
		this.debugWorld = null;
		this.animFrame = null;
		this.debugFps = 0;
		this.lastTick = Date.now();

		this.isInitialized = false;

		this.POINT = 0;
		this.CIRCLE = 1;
		this.AABB = 2;
		this.BOX = 3;
		this.ELLIPSE = 4;
		this.CAPSULE = 5;
		this.POLYGON = 6;

		this.RIGID_BODY = 0;
		this.SENSOR = 1;
		this.FIXED_OBJECT = 2;
	}

	// get World(){ return this._world; }
	get Vec2(){ return this._vec2; }
	// get PhysicalObject(){ return this._physicalObject; }
	get ObjectType(){ return this._objectType; }
	get ObjectShape(){ return this._objectShape; }

	_initCheck(){
		if(!this.isInitialized) throw new Error("Engine is not initialized. Call and await init() first.");
	}

	init(){
		return new Promise((resolve, reject) => {

			if(this.isInitialized) resolve();

			try{
				gb2dModule().then(Module => {
					const {
						// ObjectShape,
						// ObjectType, 
						// PhysicalObject, 
						Vec2, 
						World, 
					} = Module;

					
					this._world = World;
					this._vec2 = Vec2;
					// this._physicalObject = PhysicalObject;
					// this._objectType = ObjectType;
					// this._objectShape = ObjectShape;

					this.isInitialized = true;
					resolve();
				});
			}
			catch(e){
				reject(e);
			}
		});
	}

	makeWorld(){
		this._initCheck();
		return new World(this._world);
	}

	enableDebugGraphics(canvas, world){
		this._initCheck();

		this.disableDebugGraphics();

		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.debugWorld = world;
		// this.debugLiveData = this.debugWorld.getLiveData();
		// this.debugIds = this.debugWorld.getIds();
		
		// setInterval(()=>{
		// 	// console.log(this.debugWorld.getLiveData());
		// 	// console.log(world.liveFloatData);
		// 	console.log(world.liveIntData);
		// 	// console.log(this.debugIds);
		// }, 1000)

		this.animFrame = requestAnimationFrame(()=>this._animate());
	}

	disableDebugGraphics(){
		this.ctx = null;
		this.debugWorld = null;
		if(this.animFrame) cancelAnimationFrame(this.animFrame);
		this.animFrame = null;
	}

	_animate(){
		let now = Date.now();
		let delta = now - this.lastTick;
		this.lastTick = now;
		this.debugFrameTime = delta;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		this.debugWorld.iterateObjects((obj)=>{

			// console.log(this.debugWorld.liveFloatData[2]);

			{ // Draw the AABB.
				if(this.debugWorld.objectCount < 500){

					// set stroke color to green.

					let x0 = obj.ax1 * ANIMSCALE;
					let y0 = obj.ay1 * ANIMSCALE;
					let x1 = obj.ax2 * ANIMSCALE;
					let y1 = obj.ay2 * ANIMSCALE;
					// console.log(obj.hasCollisionFlags);
					if(obj.hasCollisionFlags & 0x2){
						this.ctx.strokeStyle = 'rgba(255,100,100,0.7)';
						// fill color too
						this.ctx.fillStyle = 'rgba(255,100,100,0.1)';
					}
					else if(obj.hasCollisionFlags & 0x1){
						this.ctx.strokeStyle = 'rgba(100,255,100,0.7)';
						// fill color too
						this.ctx.fillStyle = 'rgba(100,255,100,0.1)';
					}
					else{
						this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';

					}
					this.ctx.beginPath();
					this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
					if(obj.hasCollisionFlags) this.ctx.fill();
					this.ctx.stroke();
				}
			}
	
			{ // Draw the object.
				this.ctx.strokeStyle = 'black';
				this.ctx.lineWidth = 2;
				// let shape = obj.getShape(); // TODO
				let shape = obj.shape;
				// console.log(shape)
				this.ctx.beginPath();
				switch(shape){
					case gb2d.POINT:{
						if(this.debugWorld.objectCount > 100){
							// Draw a simpler point.
							this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
							this.ctx.lineTo(obj.x * ANIMSCALE + 1, obj.y * ANIMSCALE);
						}
						else{
							let radius = 2;
							this.ctx.arc(obj.x * ANIMSCALE, obj.y * ANIMSCALE, radius, 0, 2 * Math.PI);
						}
						break;
					}
					case gb2d.CIRCLE:{
						this.ctx.arc(obj.x * ANIMSCALE, obj.y * ANIMSCALE, obj.radius * ANIMSCALE, 0, 2 * Math.PI);
						this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
						this.ctx.lineTo(obj.x * ANIMSCALE + Math.cos(obj.r) * obj.radius * ANIMSCALE, obj.y * ANIMSCALE + Math.sin(obj.r) * obj.radius * ANIMSCALE);
						break;
					}
					// Draw AABBs the same as boxes in case there are bugs causing rotations.
					// Note that the commented out method is more efficient.
					// case gb2d.AABB:{
					// 	let width = obj.width * ANIMSCALE;
					// 	let height = obj.height * ANIMSCALE;
					// 	this.ctx.rect(obj.x * ANIMSCALE - width / 2, obj.y * ANIMSCALE - height / 2, width, height);
					// 	break;
					// }
					case gb2d.AABB:
						// this.ctx.beginPath();
						this.ctx.setLineDash([2, 10]);
						// Draw the top and left axis of the AABB.

						let width = obj.width * ANIMSCALE;
						let height = obj.height * ANIMSCALE;
						this.ctx.rect(obj.x * ANIMSCALE - width / 2+2, obj.y * ANIMSCALE - height / 2+2, width-4, height-4);

						// Just draw a line through the center axes of the box. Both X and Y.
						// this.ctx.moveTo(obj.ax1 * ANIMSCALE, obj.ay1 * ANIMSCALE);
						// this.ctx.lineTo(obj.ax2 * ANIMSCALE, obj.ay2 * ANIMSCALE);
						// this.ctx.moveTo(obj.ax2 * ANIMSCALE, obj.ay1 * ANIMSCALE);
						// this.ctx.lineTo(obj.ax1 * ANIMSCALE, obj.ay2 * ANIMSCALE);
						

						this.ctx.stroke();
						this.ctx.beginPath();
						this.ctx.setLineDash([]);
					case gb2d.BOX:{
						let width = obj.width * ANIMSCALE;
						let height = obj.height * ANIMSCALE;
						let r = obj.r;
						this.ctx.save();
						this.ctx.translate(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
						// this.ctx.rotate(r * 180 / Math.PI);
						this.ctx.rotate(r);
						this.ctx.rect(-width / 2, -height / 2, width, height);
						this.ctx.restore();
						break;
					}
				}

				this.ctx.stroke();
				this.ctx.lineWidth = 1;
			}
	
			// Skip the rest if there are too many objects.
			if(this.debugWorld.objectCount > 100) return;
	
			{ // Force vector.
				this.ctx.strokeStyle = 'red';
				this.ctx.beginPath();

				this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
				this.ctx.lineTo(obj.x * ANIMSCALE + obj.fx * ANIMSCALE / 3, obj.y * ANIMSCALE + obj.fy * ANIMSCALE / 3);
				this.ctx.stroke();
	
				// Draw arrowhead
				let forceScale = ((obj.fx) * (obj.fx) + (obj.fy) * (obj.fy));
				
				// console.log(forceScale);
				
				if(forceScale > 3){
					let arrowSize = Math.min(10, Math.sqrt(forceScale) * 10);
					let angle = Math.atan2(obj.fy, obj.fx);
					let arrowX = obj.x * ANIMSCALE + obj.fx * ANIMSCALE / 3;
					let arrowY = obj.y * ANIMSCALE + obj.fy * ANIMSCALE / 3;
					this.ctx.save();
					this.ctx.translate(arrowX, arrowY);
					this.ctx.rotate(angle);
					this.ctx.beginPath();
					this.ctx.moveTo(0, 0);
					this.ctx.lineTo(-arrowSize, -arrowSize / 2);
					this.ctx.lineTo(-arrowSize, arrowSize / 2);
					this.ctx.closePath();
					this.ctx.fillStyle = 'red';
					this.ctx.fill();
					this.ctx.restore();
				}
			}
	
			{ // Impulse vector.
				this.ctx.strokeStyle = 'blue';
				this.ctx.beginPath();
				this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
				this.ctx.lineTo(obj.x * ANIMSCALE + obj.ix * 30.0, obj.y * ANIMSCALE + obj.iy * 30.0);
				this.ctx.stroke();
	
				// Draw arrowhead
				let impulseScale = ((obj.ix) * (obj.ix) + (obj.iy) * (obj.iy)) * 100;
				if(impulseScale > 100){
					let arrowSize = Math.min(10, Math.sqrt(impulseScale));
					let angle = Math.atan2(obj.iy, obj.ix);
					let arrowX = obj.x * ANIMSCALE + obj.ix * 30;
					let arrowY = obj.y * ANIMSCALE + obj.iy * 30;
					this.ctx.save();
					this.ctx.translate(arrowX, arrowY);
					this.ctx.rotate(angle);
					this.ctx.beginPath();
					this.ctx.moveTo(0, 0);
					this.ctx.lineTo(-arrowSize, -arrowSize / 2);
					this.ctx.lineTo(-arrowSize, arrowSize / 2);
					this.ctx.closePath();
					this.ctx.fillStyle = 'blue';
					this.ctx.fill();
					this.ctx.restore();
				}
			}
		});

		// let obj = this.debugWorld.getObjectAtIndex(i);

		this.animFrame = requestAnimationFrame(()=>this._animate());
	}
}

const gb2d = new Gb2d();

export default gb2d;