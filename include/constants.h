#pragma once

#define LIVE_INT_EPO 4
#define LIVE_INT_ID 0
#define LIVE_INT_SHAPE 1
#define LIVE_INT_TYPE 2
#define LIVE_INT_HAS_COLLISION 3

// Int flags
// Shape and Object Type
enum class ObjectType {
    RIGID_BODY,
    SENSOR,
    FIXED_OBJECT
};

enum class ObjectShape {
    POINT,
    CIRCLE,
    AABB,
    BOX,
    ELLIPSE,
    CAPSULE,
    POLYGON
};

// Collision type.
#define HAS_AABB_COLLISION 0x1
#define HAS_PHYSICAL_COLLISION 0x2

#define LIVE_FLOAT_EPO 21
#define LIVE_FLOAT_X 0
#define LIVE_FLOAT_Y 1
#define LIVE_FLOAT_R 2
#define LIVE_FLOAT_VX 3
#define LIVE_FLOAT_VY 4
#define LIVE_FLOAT_RS 5
#define LIVE_FLOAT_M 6
#define LIVE_FLOAT_W 7
#define LIVE_FLOAT_RADIUS 7
#define LIVE_FLOAT_H 8
#define LIVE_FLOAT_FX 9
#define LIVE_FLOAT_FY 10
#define LIVE_FLOAT_IX 11
#define LIVE_FLOAT_IY 12
#define LIVE_FLOAT_AX1 13
#define LIVE_FLOAT_AY1 14
#define LIVE_FLOAT_AX2 15
#define LIVE_FLOAT_AY2 16
#define LIVE_FLOAT_NFX 17
#define LIVE_FLOAT_NFY 18
#define LIVE_FLOAT_NIX 19
#define LIVE_FLOAT_NIY 20