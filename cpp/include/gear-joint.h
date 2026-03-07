#ifndef GEAR_JOINT_H
#define GEAR_JOINT_H

#include "joint.h"
#include "hinge-joint.h"

class GearJoint : public Joint {
public:
    HingeJoint* joint1;
    HingeJoint* joint2;
    float ratio;

    GearJoint(int id, HingeJoint* joint1, HingeJoint* joint2, float ratio);

    void preSolve(float dt) override;
    void solve() override;
    void solveFast() override;
    void solvePosition() override;

    Vec2 getReactionForce(float inv_dt) const override;
    float getReactionTorque(float inv_dt) const override;

    void setRatio(float r) override;
    float getRatio() const override;

    bool isConnectedTo(Body* body) const override;

private:
    float impulse;
    float mass;
    float bias;
    float constant;
    
    // Jacobian entries
    float J1, J2, J3, J4;
    
    float _dt;
};

#endif

