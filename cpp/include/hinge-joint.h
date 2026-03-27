#ifndef HINGE_JOINT_H
#define HINGE_JOINT_H

#include "joint.h"

class HingeJoint : public Joint {
public:
    Vec2 localAnchorA;
    Vec2 localAnchorB;

    HingeJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB);

    JointType getType() const override { return JointType::HINGE; }
    void preSolve(float dt) override;
    void solve() override;
    void solveFast() override;
    void solvePosition() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

    void setLocalAnchorA(Vec2 a) override;
    Vec2 getLocalAnchorA() const override;

    void setLocalAnchorB(Vec2 b) override;
    Vec2 getLocalAnchorB() const override;

private:
    Vec2 impulse;
    Vec2 rA, rB;
    float massMatrix[2][2];
    Vec2 bias;
    float _dt;
};

#endif

