#pragma once

// --- Global Capacities for SoA ---
#define MAX_BODIES 10000
#define MAX_FIXTURES 10000

// --- Body Data Layout ---
// IMPORTANT: These constants define the shared memory layout between C++ and TypeScript.
// Any changes here MUST be mirrored in typescript/src/constants.ts or the simulation will corrupt memory.
#define BODY_IDATA_EPO 4
#define BODY_IDATA_ID 0
#define BODY_IDATA_TYPE 1
#define BODY_IDATA_FLAGS 2
#define BODY_IDATA_FIXTURE_COUNT 3

#define BODY_FDATA_EPO 34
#define BODY_FDATA_X 0
#define BODY_FDATA_Y 1
#define BODY_FDATA_R 2
#define BODY_FDATA_VX 3
#define BODY_FDATA_VY 4
#define BODY_FDATA_RS 5
#define BODY_FDATA_M 6
#define BODY_FDATA_IM 7
#define BODY_FDATA_G_SCALE 8
#define BODY_FDATA_DAMPING 9
#define BODY_FDATA_ANGULAR_DAMPING 10
#define BODY_FDATA_FX 11
#define BODY_FDATA_FY 12
#define BODY_FDATA_IX 13
#define BODY_FDATA_IY 14
#define BODY_FDATA_IA 15
#define BODY_FDATA_NFX 16
#define BODY_FDATA_NFY 17
#define BODY_FDATA_NIX 18
#define BODY_FDATA_NIY 19
#define BODY_FDATA_NIA 20
#define BODY_FDATA_INV_INERTIA 21
#define BODY_FDATA_PREV_X 22
#define BODY_FDATA_PREV_Y 23
#define BODY_FDATA_PREV_R 24
#define BODY_FDATA_SLEEP_TIMER 25
#define BODY_FDATA_ERR_ACC_X 26
#define BODY_FDATA_ERR_ACC_Y 27
#define BODY_FDATA_ERR_ACC_R 28
#define BODY_FDATA_FORCE_VX 29
#define BODY_FDATA_FORCE_VY 30
#define BODY_FDATA_LAST_X 31
#define BODY_FDATA_LAST_Y 32
#define BODY_FDATA_LAST_R 33

#define GET_BODY_IDATA_INDEX(idx, offset) ((offset) * MAX_BODIES + (idx))
#define GET_BODY_FDATA_INDEX(idx, offset) ((offset) * MAX_BODIES + (idx))

// --- Solver Constants ---
// These are to be hand-tuned only. 
// They have already been rigerously tuned. Avoid messing with them - when debugging, prioritize other hypotheses first.
// In the future, these should be relative to the size of the shapes.
#define BAUMGARTE_FACTOR 0.2f
#define PENETRATION_SLOP 0.016f
#define RESTITUTION_THRESHOLD 0.01f
#define MAX_POSITION_CORRECTION 0.2f

// --- Fixture Data Layout ---
#define FIXTURE_IDATA_EPO 6
#define FIXTURE_IDATA_ID 0
#define FIXTURE_IDATA_BODY_INDEX 1
#define FIXTURE_IDATA_SHAPE 2
#define FIXTURE_IDATA_CATEGORY_BITS 3
#define FIXTURE_IDATA_MASK_BITS 4
#define FIXTURE_IDATA_FLAGS 5

#define FIXTURE_FDATA_EPO 64
#define FIXTURE_FDATA_LOCAL_X 0
#define FIXTURE_FDATA_LOCAL_Y 1
#define FIXTURE_FDATA_LOCAL_R 2
#define FIXTURE_FDATA_W 3
#define FIXTURE_FDATA_RADIUS 3
#define FIXTURE_FDATA_H 4
#define FIXTURE_FDATA_RESTITUTION 5
#define FIXTURE_FDATA_S_FRICTION 6
#define FIXTURE_FDATA_K_FRICTION 7
#define FIXTURE_FDATA_AX1 8
#define FIXTURE_FDATA_AY1 9
#define FIXTURE_FDATA_AX2 10
#define FIXTURE_FDATA_AY2 11
#define FIXTURE_FDATA_MAX_EXTENT 12
#define FIXTURE_FDATA_DENSITY 13
#define FIXTURE_FDATA_VERTEX_COUNT 14
#define FIXTURE_FDATA_VERTEX_START 16
#define FIXTURE_FDATA_WORLD_VERTEX_START 32
#define FIXTURE_FDATA_WORLD_NORMAL_START 48

#define GET_FIXTURE_IDATA_INDEX(idx, offset) ((offset) * MAX_FIXTURES + (idx))
#define GET_FIXTURE_FDATA_INDEX(idx, offset) ((offset) * MAX_FIXTURES + (idx))

#define MAX_POLYGON_VERTICES 8

// Collision type and Body Flags
#define HAS_AABB_COLLISION 0x1
#define HAS_PHYSICAL_COLLISION 0x2
#define IS_SLEEPING 0x4
#define HAS_FIXED_MASS 0x8
#define WANTS_EVENTS 0x10

#define WAKE_MOVEMENT_THRESHOLD 0.001f
#define SLEEP_VELOCITY_THRESHOLD 0.005f
#define SLEEP_ANGULAR_VELOCITY_THRESHOLD 0.005f

#define MAX_VELOCITY 1000.0f

enum class ObjectType {
    DYNAMIC_OBJECT,
    FIXED_OBJECT,
    KINEMATIC_OBJECT
};

#define FIXTURE_FLAG_IS_SENSOR 0x4
#define FIXTURE_FLAG_WANTS_EVENTS 0x8

enum class ObjectShape {
    POINT,
    CIRCLE,
    AABB,
    BOX,
    ELLIPSE,
    CAPSULE,
    POLYGON
};

enum class EventType {
    COLLISION_START = 0,
    COLLISION_END = 1,
    SLEEP = 2,
    WAKE = 3
};
