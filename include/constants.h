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

#define FDATA_EPO 28
#define FDATA_X 0 // Position
#define FDATA_Y 1 // Position
#define FDATA_R 2 // Rotation
#define FDATA_VX 3 // Velocity
#define FDATA_VY 4 // Velocity
#define FDATA_RS 5 // Rotation speed
#define FDATA_M 6 // Mass
#define FDATA_IM 7 // Inverse Mass
#define FDATA_G_SCALE 8 // How much gravity affects this object.
#define FDATA_RESTITUTION 9 // Bounciness
#define FDATA_S_FRICTION 10 // Static friction
#define FDATA_K_FRICTION 11 // Kinetic friction
#define FDATA_DAMPING 12 // Linear damping (air resistance)
#define FDATA_ANGULAR_DAMPING 13 // Angular damping
#define FDATA_W 14 // Width
#define FDATA_RADIUS 14 // Radius
#define FDATA_H 15 // Height
#define FDATA_FX 16 // Force accumulator (READ ONLY)
#define FDATA_FY 17 // Force accumulator (READ ONLY)
#define FDATA_IX 18
#define FDATA_IY 19
#define FDATA_AX1 20
#define FDATA_AY1 21
#define FDATA_AX2 22
#define FDATA_AY2 23
#define FDATA_NFX 24
#define FDATA_NFY 25
#define FDATA_NIX 26
#define FDATA_NIY 27