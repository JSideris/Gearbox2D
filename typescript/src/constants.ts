
// --- Body Data Layout ---
export const BODY_SIZE_I = 4;
export const BODY_ID_OFFSET = 0;
export const BODY_TYPE_OFFSET = 1;
export const BODY_FLAGS_OFFSET = 2;
export const BODY_FIXTURE_COUNT_OFFSET = 3;

export const BODY_SIZE_F = 28;
export const BODY_X_OFFSET = 0;
export const BODY_Y_OFFSET = 1;
export const BODY_R_OFFSET = 2;
export const BODY_VX_OFFSET = 3;
export const BODY_VY_OFFSET = 4;
export const BODY_RS_OFFSET = 5;
export const BODY_MASS_OFFSET = 6;
export const BODY_INV_MASS_OFFSET = 7;
export const BODY_G_SCALE_OFFSET = 8;
export const BODY_DAMPING_OFFSET = 9;
export const BODY_ANGULAR_DAMPING_OFFSET = 10;
export const BODY_FX_OFFSET = 11;
export const BODY_FY_OFFSET = 12;
export const BODY_IX_OFFSET = 13;
export const BODY_IY_OFFSET = 14;
export const BODY_IA_OFFSET = 15;
export const BODY_NFX_OFFSET = 16;
export const BODY_NFY_OFFSET = 17;
export const BODY_NIX_OFFSET = 18;
export const BODY_NIY_OFFSET = 19;
export const BODY_NIA_OFFSET = 20;
export const BODY_INV_INERTIA_OFFSET = 21;
export const BODY_PREV_X_OFFSET = 22;
export const BODY_PREV_Y_OFFSET = 23;
export const BODY_PREV_R_OFFSET = 24;
export const BODY_SLEEP_TIMER_OFFSET = 25;

// --- Fixture Data Layout ---
export const FIXTURE_SIZE_I = 6;
export const FIXTURE_ID_OFFSET = 0;
export const FIXTURE_BODY_INDEX_OFFSET = 1;
export const FIXTURE_SHAPE_OFFSET = 2;
export const FIXTURE_CATEGORY_BITS_OFFSET = 3;
export const FIXTURE_MASK_BITS_OFFSET = 4;
export const FIXTURE_FLAGS_OFFSET = 5;

export const FIXTURE_SIZE_F = 16;
export const FIXTURE_LOCAL_X_OFFSET = 0;
export const FIXTURE_LOCAL_Y_OFFSET = 1;
export const FIXTURE_LOCAL_R_OFFSET = 2;
export const FIXTURE_RADIUS_OFFSET = 3;
export const FIXTURE_WIDTH_OFFSET = 3;
export const FIXTURE_HEIGHT_OFFSET = 4;
export const FIXTURE_RESTITUTION_OFFSET = 5;
export const FIXTURE_S_FRICTION_OFFSET = 6;
export const FIXTURE_K_FRICTION_OFFSET = 7;
export const FIXTURE_AX1_OFFSET = 8;
export const FIXTURE_AY1_OFFSET = 9;
export const FIXTURE_AX2_OFFSET = 10;
export const FIXTURE_AY2_OFFSET = 11;
export const FIXTURE_MAX_EXTENT_OFFSET = 12;
export const FIXTURE_DENSITY_OFFSET = 13;

// Flags and Types
export const HAS_AABB_COLLISION = 0x1;
export const HAS_PHYSICAL_COLLISION = 0x2;
export const IS_SLEEPING = 0x4;
export const HAS_FIXED_MASS = 0x8;
export const WANTS_EVENTS = 0x10;

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
	DYNAMIC_OBJECT: 0,
	FIXED_OBJECT: 1,
	KINEMATIC_OBJECT: 2,
};

export const FIXTURE_FLAGS = {
	IS_SENSOR: 0x4,
	WANTS_EVENTS: 0x8
};

export const JOINT_TYPES = {
	HINGE: 0,
	DISTANCE: 1,
	SPRING: 2,
	GEAR: 3
};
