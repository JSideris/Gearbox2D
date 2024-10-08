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

class PhysicalObject {
private:
    // Vec2 force;
    // float rotation;  // Current rotation in degrees
    // float rotationalSpeed;  // Angular velocity (degrees per second)
    // float damping;   // Linear damping factor (0 = no damping, 1 = full damping)
    // float rotationalDamping; // Rotational damping factor (0 = no damping, 1 = full damping)

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


    float getX() const;
    void setX(float x);
    float getY() const;
    void setY(float y);
    float getRotation() const;
    void setRotation(float r);
    float getVelocityX() const;
    void setVelocityX(float vx);
    float getVelocityY() const;
    void setVelocityY(float vy);
    float getAngularVelocity() const;
    void setAngularVelocity(float rs);

    float getMass() const;
    void setMass(float m);
    float getInverseMass() const;
    float getDamping() const;
    void setDamping(float d);
    float getRotationalDamping() const;
    void setRotationalDamping(float rd);
    float getRestitution() const;
    void setRestitution(float d);
    float getImpulseX() const;
    void setImpulseX(float ix);
    float getImpulseY() const;
    void setImpulseY(float iy);
    float getForceX() const;
    void setForceX(float fx);
    float getForceY() const;
    void setForceY(float fy);
    int getId() const;
    float getRadius() const;
    float getWidth() const;
    float getHeight() const;

    float getStaticFriction() const;
    void setStaticFriction(float f);
    float getKineticFriction() const;
    void setKineticFriction(float f);

    Vec2 getPosition() const;
    void setPosition(Vec2 p);
    Vec2 getVelocity() const;
    void setVelocity(Vec2 v);

    bool recomputeAabb(bool disablePadding);

    // INTERNAL USE ONLY.
    void applyForce(const Vec2& force);
    void applyForce(float x, float y);

    void applyImpulse(const Vec2& impulse, const Vec2& contactPoint);
    void applyImpulse(float x, float y, float cx, float cy);

    // Step function to update position and rotation
    bool stepMovement(float dt);
};


#endif