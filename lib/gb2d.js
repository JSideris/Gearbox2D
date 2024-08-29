
import gb2dModule from './build/gb2d-module.js';

/**@type {Gb2d} */
class Gb2d{
	
	constructor(){
		this.canvas = null;
		this.ctx = null;
		this.debugWorld = null;
		this.animFrame = null;
		this.debugFps = 0;
		this.lastTick = Date.now();
	}

	get World(){ return this._world; }
	get Vec2(){ return this._vec2; }
	get PhysicalObject(){ return this._physicalObject; }
	get ObjectType(){ return this._objectType; }
	get ObjectShape(){ return this._objectShape; }

	init(){
		return new Promise((resolve, reject) => {

			if(this.World) resolve();

			try{
				gb2dModule().then(Module => {
					const {
						ObjectShape,
						ObjectType, 
						PhysicalObject, 
						Vec2, 
						World, 
					} = Module;
					this._world = class extends World{
						constructor(){
							super();
						}
						getObjectById(id){
							let index = super.getIndex(id);
							
							let SIZE = 6;

							return {
								x: this.liveData[index * SIZE + 0],
								y: this.liveData[index * SIZE + 1],
								r: this.liveData[index * SIZE + 2],
								vx: this.liveData[index * SIZE + 3],
								vy: this.liveData[index * SIZE + 4],
								vr: this.liveData[index * SIZE + 5],
								// ix: this.impulses[index * 2 + 0],
								// iy: this.impulses[index * 2 + 1],
								// fx: this.forces[index * 2 + 0],
								// fy: this.forces[index * 2 + 1],
								// mass: this.masses[index],
								// damping: this.dampings[index],
								// shape: this.shapes[index],
								// type: this.types[index],
								// radius: this.radii[index],
								// width: this.widths[index],
								// height: this.heights[index],
								// x0: this.aabbs[index * 4 + 0],
								// y0: this.aabbs[index * 4 + 1],
								// x1: this.aabbs[index * 4 + 2],
								// y1: this.aabbs[index * 4 + 3],
							}
						}
					};
					this._vec2 = Vec2;
					this._physicalObject = PhysicalObject;
					this._objectType = ObjectType;
					this._objectShape = ObjectShape;

					resolve();
				});
			}
			catch(e){
				reject(e);
			}
		});
	}

	enableDebugGraphics(canvas, world){

		this.disableDebugGraphics();

		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.debugWorld = world;
		this.debugLiveData = this.debugWorld.getLiveData();
		this.debugIds = this.debugWorld.getIds();
		
		// setInterval(()=>{
		// 	// console.log(this.debugWorld.getLiveData());
		// 	console.log(this.debugLiveData[0]);
		// 	// console.log(this.debugIds);
		// }, 100)

		this.animFrame = requestAnimationFrame(()=>this.animate());
	}

	disableDebugGraphics(){
		this.ctx = null;
		this.debugWorld = null;
		if(this.animFrame) cancelAnimationFrame(this.animFrame);
		this.animFrame = null;
	}

	animate(){
		let now = Date.now();
		let delta = now - this.lastTick;
		this.lastTick = now;
		this.debugFrameTime = delta;
		// this.debugWorld.step(0.017);

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// this.debugLiveData = this.debugWorld.getLiveData();
		// this.debugIds = this.debugWorld.getIds();

		// let ids = this.debugWorld.getIds();
		// let size = ids.size();
		// console.log(size);

		// let idsSize = this.debugWorld.getIdsSize();
		// console.log(idsSize);

		// for(let i = 0; i < size; i++){
		// 	let id = this.debugIds.get(i);
		// 	let x = this.debugLiveData.get(i * 6 + 0);
		// 	let y = this.debugLiveData.get(i * 6 + 1);
		// 	let r = this.debugLiveData.get(i * 6 + 2);
		// 	let xs = this.debugLiveData.get(i * 6 + 3);
		// 	let ys = this.debugLiveData.get(i * 6 + 4);
		// 	let rs = this.debugLiveData.get(i * 6 + 5);

		// 		let radius = 2;
		// 		this.ctx.beginPath();
		// 		this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
		// 		this.ctx.stroke();
		// }

		// console.debug(objectCount);

		// Set stroke color to black.
		
		let objectCount = this.debugWorld.getObjectCount();
		for(let i = 0; i < objectCount; i++){

			let obj = this.debugWorld.getObjectAtIndex(i);

			{ // Draw the AABB.
				if(objectCount < 500){
					let x0 = obj.x0;
					let y0 = obj.y0;
					let x1 = obj.x1;
					let y1 = obj.y1;
					this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
					this.ctx.beginPath();
					this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
					this.ctx.stroke();
				}
			}

			{ // Draw the object.
				this.ctx.strokeStyle = 'black';
				this.ctx.lineWidth = 2;
				let shape = obj.getShape();
				this.ctx.beginPath();
				if(shape == gb2d.ObjectShape.POINT){
					if(objectCount > 100){
						// Draw a simpler point.
						this.ctx.moveTo(obj.x, obj.y);
						this.ctx.lineTo(obj.x + 1, obj.y);
					}
					else{
						let radius = 2;
						this.ctx.arc(obj.x, obj.y, radius, 0, 2 * Math.PI);
					}
				}
				else if(shape == gb2d.ObjectShape.CIRCLE){
					let radius = obj.getRadius();
					this.ctx.arc(obj.x, obj.y, radius, 0, 2 * Math.PI);
				}
				else if(shape == gb2d.ObjectShape.AABB){
					let width = obj.getWidth();
					let height = obj.getHeight();
					this.ctx.rect(obj.x - width / 2, obj.y - height / 2, width, height);
				}
				else if(shape == gb2d.ObjectShape.BOX){
					let width = obj.getWidth();
					let height = obj.getHeight();
					let r = obj.r;
					this.ctx.save();
					this.ctx.translate(obj.x, obj.y);
					this.ctx.rotate(r * 180 / Math.PI);
					this.ctx.rect(-width / 2, -height / 2, width, height);
					this.ctx.restore();

				}
				this.ctx.stroke();
				this.ctx.lineWidth = 1;
			}

			// Skip the rest if there are too many objects.
			if(objectCount > 100) continue;

			{ // Force vector.
				this.ctx.strokeStyle = 'red';
				this.ctx.beginPath();
				this.ctx.moveTo(obj.x, obj.y);
				this.ctx.lineTo(obj.x + obj.fx / 3, obj.y + obj.fy / 3);
				this.ctx.stroke();

				// Draw arrowhead
				let forceScale = ((obj.fx) * (obj.fx) + (obj.fy) * (obj.fy));
				if(forceScale > 3000){
					let arrowSize = Math.min(10, Math.sqrt(forceScale) / 10);
					let angle = Math.atan2(obj.fy, obj.fx);
					let arrowX = obj.x + obj.fx / 3;
					let arrowY = obj.y + obj.fy / 3;
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
				this.ctx.moveTo(obj.x, obj.y);
				this.ctx.lineTo(obj.x + obj.ix / 30, obj.y + obj.iy / 30);
				this.ctx.stroke();

				// Draw arrowhead
				let impulseScale = ((obj.ix) * (obj.ix) + (obj.iy) * (obj.iy));
				if(impulseScale > 10000){
					let arrowSize = Math.min(10, Math.sqrt(impulseScale) / 100);
					let angle = Math.atan2(obj.iy, obj.ix);
					let arrowX = obj.x + obj.ix / 30;
					let arrowY = obj.y + obj.iy / 30;
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
		}

		this.animFrame = requestAnimationFrame(()=>this.animate());
	}
}

const gb2d = new Gb2d();

export default gb2d;