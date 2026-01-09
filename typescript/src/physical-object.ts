
import { 
    SIZE_I, SIZE_F, ID_OFFSET, SHAPE_OFFSET, TYPE_OFFSET, 
    X_OFFSET, Y_OFFSET, R_OFFSET, VX_OFFSET, VY_OFFSET, 
    RS_OFFSET, MASS_OFFSET, INV_MASS_OFFSET, G_SCALE_OFFSET, 
    RESTITUTION_OFFSET, S_FRICTION_OFFSET, K_FRICTION_OFFSET, 
    DAMPING_OFFSET, ANGULAR_DAMPING_OFFSET, RADIUS_OFFSET, 
    WIDTH_OFFSET, HEIGHT_OFFSET, FX_OFFSET, FY_OFFSET, 
    IX_OFFSET, IY_OFFSET, AX1_OFFSET, AY1_OFFSET, 
    AX2_OFFSET, AY2_OFFSET, HAS_COLLISION_OFFSET, 
    CATEGORY_BITS_OFFSET, MASK_BITS_OFFSET, IA_OFFSET, 
    NFX_OFFSET, NFY_OFFSET, NIX_OFFSET, NIY_OFFSET, NIA_OFFSET,
    BODY_TYPES
} from './constants.js';
import type { World } from './world.js';

export class PhysicalObject {
	id: number;
	liveFData: Float32Array;
	liveIData: Int32Array;
	index: number;
	world: World;
	color?: string;

	onSleep?: () => void;
	onWake?: () => void;

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
		if(this.type != BODY_TYPES.FIXED_OBJECT && this.type != BODY_TYPES.KINEMATIC_OBJECT){
			this.liveFData[this.index * SIZE_F + MASS_OFFSET] = v; 
			this.liveFData[this.index * SIZE_F + INV_MASS_OFFSET] = (v != 0) ? (1 / v) : 0; 
		}
	}

	get inverseInertia() { return this.liveFData[this.index * SIZE_F + INV_INERTIA_OFFSET]; }
    
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

	testPoint(x: number, y: number): boolean {
		return this.world.world.getObject(this.id).testPoint(x, y);
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

	get wantsEvents() {
		const cppObj = this.world.world.getObject(this.id);
		return cppObj ? cppObj.wantsEvents : false;
	}
	set wantsEvents(v: boolean) {
		const cppObj = this.world.world.getObject(this.id);
		if (cppObj) cppObj.wantsEvents = v;
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

