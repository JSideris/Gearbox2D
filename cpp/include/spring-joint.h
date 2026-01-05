#ifndef SPRING_JOINT_H
#define SPRING_JOINT_H

#include "joint.h"

class SpringJoint : public Joint {
public:
    Vec2 localAnchorA;
    Vec2 localAnchorB;
    float length;
    float frequencyHz;
    float dampingRatio;

    SpringJoint(int id, PhysicalObject* a, PhysicalObject* b, Vec2 anchorA, Vec2 anchorB, float length, float frequencyHz, float dampingRatio);

    void preSolve(float dt) override;
    void solve() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

private:
    float impulse;
    Vec2 u;
    Vec2 rA, rB;
    float mass;
    float bias;
    float gamma;
    float _dt;
};

#endif

