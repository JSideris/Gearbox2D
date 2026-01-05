#ifndef HINGE_JOINT_H
#define HINGE_JOINT_H

#include "joint.h"

class HingeJoint : public Joint {
public:
    Vec2 localAnchorA;
    Vec2 localAnchorB;

    HingeJoint(int id, PhysicalObject* a, PhysicalObject* b, Vec2 anchorA, Vec2 anchorB);

    void preSolve(float dt) override;
    void solve() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

private:
    Vec2 impulse;
    Vec2 rA, rB;
    float massMatrix[2][2];
    Vec2 bias;
    float _dt;
};

#endif

