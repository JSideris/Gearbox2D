#ifndef FIXTURE_H
#define FIXTURE_H

#include "debug.h"
#include "vec2.h"
#include "aabb.h"
#include "constants.h"

class Body;
class World;
struct BvhNode;
struct CollisionProperties;

struct MassData {
    float mass;
    float inertia;
    Vec2 center;
};

class Fixture {
public:
    int id;
    Body* body;
    World& world;
    int worldIndex = -1;
    
    ObjectShape shape;
    Aabb aabb;
    BvhNode* bvhNode = nullptr;

    Fixture(World& world, int id, int worldIndex, Body* body, emscripten_val options);
    ~Fixture();

    void updateAabb(int mode);
    void updateAabb(float cosR, float sinR, int mode);
    Aabb computeAabb(float cosR, float sinR, int mode) const;
    bool testPoint(float x, float y) const;

    // Getters for live data
    float getLocalX() const;
    float getLocalY() const;
    float getLocalR() const;
    float getWidth() const;
    float getHeight() const;
    float getRadius() const;
    float getRestitution() const;
    float getStaticFriction() const;
    float getKineticFriction() const;
    uint32_t getCategoryBits() const;
    uint32_t getMaskBits() const;
    uint32_t getSystemCategory() const;
    float getDensity() const;
    MassData getMassData() const;
    
    void setCategoryBits(uint32_t bits);
    void setMaskBits(uint32_t bits);
    void setSensor(bool isSensor);
    bool isSensor() const;
    bool wantsEvents() const;
    void setDensity(float density);
    
    // BVH Support
    CollisionProperties getCollisionProperties() const;
};

#endif
