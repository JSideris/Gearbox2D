#ifndef JOINT_H
#define JOINT_H

#include "vec2.h"

class PhysicalObject;

class Joint {
public:
    int id;
    PhysicalObject* bodyA;
    PhysicalObject* bodyB;

    Joint(int id, PhysicalObject* a, PhysicalObject* b) : id(id), bodyA(a), bodyB(b) {}
    virtual ~Joint() {}

    virtual void preSolve(float dt) = 0;
    virtual void solve() = 0;
    
    virtual Vec2 getReactionForce(float inv_dt) const = 0;
    virtual float getReactionTorque(float inv_dt) const = 0;

    bool isConnectedTo(PhysicalObject* body) const {
        return bodyA == body || bodyB == body;
    }
};

#endif

