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

    SpringJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length, float frequencyHz, float dampingRatio);

    JointType getType() const override { return JointType::SPRING; }
    void preSolve(float dt) override;
    static void preSolveSIMD(SpringJoint** joints, float dt);
    void solve() override;
    void solveFast() override;
    void solvePosition() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

    void setLength(float l) override;
    float getLength() const override;

    void setFrequencyHz(float f) override;
    float getFrequencyHz() const override;

    void setDampingRatio(float d) override;
    float getDampingRatio() const override;

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
    float gamma;
    float _dt;
    Vec2 lastNormal;
    bool hasLastNormal = false;
};

#endif

