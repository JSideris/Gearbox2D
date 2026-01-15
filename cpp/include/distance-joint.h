#ifndef DISTANCE_JOINT_H
#define DISTANCE_JOINT_H

#include "joint.h"

class DistanceJoint : public Joint {
public:
    Vec2 localAnchorA;
    Vec2 localAnchorB;
    float length;

    DistanceJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length);

    void preSolve(float dt) override;
    void solve() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

    void setLength(float l) override;
    float getLength() const override;

    void setLocalAnchorA(Vec2 a) override;
    Vec2 getLocalAnchorA() const override;

    void setLocalAnchorB(Vec2 b) override;
    Vec2 getLocalAnchorB() const override;

private:
    float impulse;
    Vec2 normal;
    Vec2 rA, rB;
    float mass;
    float bias;
    float _dt;
};

#endif

