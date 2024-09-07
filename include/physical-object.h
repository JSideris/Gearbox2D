#ifndef PHYSICAL_OBJECT_H
#define PHYSICAL_OBJECT_H

#include <initializer_list>
#include <iostream>

class World;

#include "debug.h"
#include "vec2.h"
#include "aabb.h"
#include "world.h"
#include "bvh.h"
#include "constants.h"

static Vec2 _dampingForce;
static Vec2 _acceleration;
static Vec2 _dv;
static Vec2 _force;
static Vec2 _position;
static Vec2 _velocity;   // Linear velocity of the object

class PhysicalObject {
private:
    // Vec2 force;
    // float rotation;  // Current rotation in degrees
    // float rotationalSpeed;  // Angular velocity (degrees per second)
    float damping;   // Linear damping factor (0 = no damping, 1 = full damping)
    float rotationalDamping; // Rotational damping factor (0 = no damping, 1 = full damping)

    float lastX = 0.0f;
    float lastY = 0.0f;
    float lastR = 0.0f;

public:
    int id;
    
    ObjectShape shape;
    ObjectType type;

    Aabb aabb;
    TreeNode* bvhNode; 
    
    // float mass;
    World& world;
    int worldIndex = -1;
    
    PhysicalObject(World& world, int id, emscripten_val options);

    bool recomputeAabb(bool disablePadding);

    // INTERNAL USE ONLY.
    void applyForce(float x, float y);

    void applyImpulse(float x, float y);

    // Step function to update position and rotation
    bool stepMovement(float dt);
};


#endif