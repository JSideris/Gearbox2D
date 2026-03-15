#ifndef BODY_H
#define BODY_H

#include <vector>
#include "debug.h"
#include "vec2.h"
#include "constants.h"
#include "solver-data.h"

class World;
class Fixture;
class Joint;

class Body {
private:
    float lastX = 0.0f;
    float lastY = 0.0f;
    float lastR = 0.0f;
    std::vector<Body*> contacts;

public:
    std::vector<Joint*> joints;
    int id;
    World& world;
    int worldIndex = -1;
    ObjectType type;
    std::vector<Fixture*> fixtures;

    // Sleep properties
    bool isSleeping = false;
    bool canSleep = true;
    float sleepTimeRequired = 1.0f;
    
    float getSleepTimer() const;
    void setSleepTimer(float t);
    float getSleepErrAccumulatorX() const;
    void setSleepErrAccumulatorX(float x);
    float getSleepErrAccumulatorY() const;
    void setSleepErrAccumulatorY(float y);
    float getSleepErrAccumulatorR() const;
    void setSleepErrAccumulatorR(float r);
    
    Vec2 forceVelocity = Vec2(0.0f, 0.0f);

    Body(World& world, int id, emscripten_val options);
    ~Body();

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
    float getInverseInertia() const;
    float getGravityScale() const;
    void setGravityScale(float s);
    float getDamping() const;
    void setDamping(float d);
    float getRotationalDamping() const;
    void setRotationalDamping(float rd);
    
    int getId() const { return id; }
    void setCategoryBits(uint32_t bits);
    void setMaskBits(uint32_t bits);
    bool wantsEvents() const;
    bool testPoint(float x, float y) const;
    void recomputeAabb(int mode = 0);

    float getForceX() const;
    void setForceX(float fx);
    float getForceY() const;
    void setForceY(float fy);
    
    Vec2 getPosition() const;
    void setPosition(Vec2 p);
    Vec2 getVelocity() const;
    void setVelocity(Vec2 v);
    void setVelocityInternal(Vec2 v);
    void setAngularVelocityInternal(float rs);

    void applyForce(const Vec2& force);
    void applyForce(float x, float y);
    void applyImpulse(const Vec2& impulse, const Vec2& contactPoint);
    void applyImpulse(float x, float y, float cx, float cy);
    void applyAngularImpulse(float torque);

    void integrateVelocities(float dt);
    bool integratePositions(float dt);
    void sleep();
    void wakeUp();
    void forceWakeUp();
    void addContact(Body* other);
    void removeContact(Body* other);
    int getContactCount() const { return (int)contacts.size(); }
    void updateInverseInertia();
    void recomputeMassProperties();

    // Internal fast access
    SolverData getSolverData() const;
    void setSolverData(const SolverData& data);

    void addFixture(Fixture* fixture);
    int createFixture(emscripten_val options);
};

#endif
