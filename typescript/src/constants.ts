
export const SIZE_I = 6;
export const SIZE_F = 32;

export const ID_OFFSET = 0;
export const SHAPE_OFFSET = 1;
export const TYPE_OFFSET = 2;
export const HAS_COLLISION_OFFSET = 3;
export const CATEGORY_BITS_OFFSET = 4;
export const MASK_BITS_OFFSET = 5;

export const HAS_AABB_COLLISION = 0x1;
export const HAS_PHYSICAL_COLLISION = 0x2;
export const IS_ASLEEP = 0x4;

export const EVENT_TYPES = {
	COLLISION_START: 0,
	COLLISION_END: 1,
	SLEEP: 2,
	WAKE: 3
};

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
	KINEMATIC_OBJECT: 3,
};

export const X_OFFSET = 0;
export const Y_OFFSET = 1;
export const R_OFFSET = 2;
export const VX_OFFSET = 3;
export const VY_OFFSET = 4;
export const RS_OFFSET = 5;
export const MASS_OFFSET = 6;
export const INV_MASS_OFFSET = 7;

export const G_SCALE_OFFSET = 8 // How much gravity affects this object.
export const RESTITUTION_OFFSET = 9 // Bounciness
export const S_FRICTION_OFFSET = 10 // Static friction
export const K_FRICTION_OFFSET = 11 // Kinetic friction
export const DAMPING_OFFSET = 12 // Linear damping (air resistance)
export const ANGULAR_DAMPING_OFFSET = 13 // Angular damping

export const RADIUS_OFFSET = 14;
export const WIDTH_OFFSET = 14;
export const HEIGHT_OFFSET = 15;
export const FX_OFFSET = 16;
export const FY_OFFSET = 17;
export const IX_OFFSET = 18;
export const IY_OFFSET = 19;
export const AX1_OFFSET = 20;
export const AY1_OFFSET = 21;
export const AX2_OFFSET = 22;
export const AY2_OFFSET = 23;
export const NFX_OFFSET = 24;
export const NFY_OFFSET = 25;
export const NIX_OFFSET = 26;
export const NIY_OFFSET = 27;
export const IA_OFFSET = 28;
export const NIA_OFFSET = 29;
export const INV_INERTIA_OFFSET = 30;
export const MAX_EXTENT_OFFSET = 31;

