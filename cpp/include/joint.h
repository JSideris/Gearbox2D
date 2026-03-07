#ifndef JOINT_H
#define JOINT_H

#include "vec2.h"

class Body;

class Joint {
public:
    int id;
    Body* bodyA;
    Body* bodyB;

    // Temporary storage during iterations
    struct SolverContext {
        void* a;
        void* b;
        void* c; // For GearJoint
        void* d; // For GearJoint
    } context;

    Joint(int id, Body* a, Body* b) : id(id), bodyA(a), bodyB(b) {}
    virtual ~Joint() {}

    virtual void preSolve(float dt) = 0;
    virtual void solve() = 0;
    virtual void solveFast() = 0;
    virtual void solvePosition() = 0;
    
    virtual Vec2 getReactionForce(float inv_dt) const = 0;
    virtual float getReactionTorque(float inv_dt) const = 0;

    virtual void setLength(float l) {}
    virtual float getLength() const { return 0.0f; }

    virtual void setFrequencyHz(float f) {}
    virtual float getFrequencyHz() const { return 0.0f; }

    virtual void setDampingRatio(float d) {}
    virtual float getDampingRatio() const { return 0.0f; }

    virtual void setRatio(float r) {}
    virtual float getRatio() const { return 0.0f; }

    virtual void setLocalAnchorA(Vec2 a) {}
    virtual Vec2 getLocalAnchorA() const { return Vec2(0, 0); }

    virtual void setLocalAnchorB(Vec2 b) {}
    virtual Vec2 getLocalAnchorB() const { return Vec2(0, 0); }

    virtual bool isConnectedTo(Body* body) const {
        return bodyA == body || bodyB == body;
    }
};

#endif
