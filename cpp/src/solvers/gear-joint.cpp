#include "gear-joint.h"
#include "body.h"
#include "hinge-joint.h"
#include <cmath>

GearJoint::GearJoint(int id, HingeJoint* joint1, HingeJoint* joint2, float ratio)
    : Joint(id, joint1->bodyB, joint2->bodyB), joint1(joint1), joint2(joint2), ratio(ratio), impulse(0.0f) {}

void GearJoint::preSolve(float dt) {
    _dt = dt;
    Body* bodyA = joint1->bodyA;
    Body* bodyB = joint1->bodyB;
    Body* bodyC = joint2->bodyA;
    Body* bodyD = joint2->bodyB;

    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();
    float iIC = bodyC->getInverseInertia();
    float iID = bodyD->getInverseInertia();

    float k = ratio * ratio * (iIA + iIB) + (iIC + iID);
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;

    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - ratio * impulse * iIA);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + ratio * impulse * iIB);
    bodyC->setAngularVelocityInternal(bodyC->getAngularVelocity() - impulse * iIC);
    bodyD->setAngularVelocityInternal(bodyD->getAngularVelocity() + impulse * iID);
}

void GearJoint::solve() {
    Body* bodyA = joint1->bodyA;
    Body* bodyB = joint1->bodyB;
    Body* bodyC = joint2->bodyA;
    Body* bodyD = joint2->bodyB;

    float wA = bodyA->getAngularVelocity();
    float wB = bodyB->getAngularVelocity();
    float wC = bodyC->getAngularVelocity();
    float wD = bodyD->getAngularVelocity();

    // Constraint: ratio * (wB - wA) + (wD - wC) = 0
    float Cdot = ratio * (wB - wA) + (wD - wC);
    float lambda = -mass * Cdot;
    impulse += lambda;

    bodyA->setAngularVelocityInternal(wA - ratio * lambda * bodyA->getInverseInertia());
    bodyB->setAngularVelocityInternal(wB + ratio * lambda * bodyB->getInverseInertia());
    bodyC->setAngularVelocityInternal(wC - lambda * bodyC->getInverseInertia());
    bodyD->setAngularVelocityInternal(wD + lambda * bodyD->getInverseInertia());
}

void GearJoint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);
    SolverData& sC = *static_cast<SolverData*>(context.c);
    SolverData& sD = *static_cast<SolverData*>(context.d);

    float Cdot = ratio * (sB.w - sA.w) + (sD.w - sC.w);
    float lambda = -mass * Cdot;
    impulse += lambda;

    sA.w -= ratio * lambda * sA.iI;
    sB.w += ratio * lambda * sB.iI;
    sC.w -= lambda * sC.iI;
    sD.w += lambda * sD.iI;
}

Vec2 GearJoint::getReactionForce(float inv_dt) const { return Vec2(0, 0); }
float GearJoint::getReactionTorque(float inv_dt) const { return impulse * inv_dt; }
void GearJoint::setRatio(float r) { ratio = r; joint1->bodyB->forceWakeUp(); joint2->bodyB->forceWakeUp(); }
float GearJoint::getRatio() const { return ratio; }
bool GearJoint::isConnectedTo(Body* body) const {
    return joint1->bodyA == body || joint1->bodyB == body || joint2->bodyA == body || joint2->bodyB == body;
}

void GearJoint::solvePosition() {}
