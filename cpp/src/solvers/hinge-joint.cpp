#include "hinge-joint.h"
#include "body.h"
#include <cmath>

HingeJoint::HingeJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), impulse(0, 0) {}

void HingeJoint::preSolve(float dt) {
    _dt = dt;
    float rotA = bodyA->getRotation();
    float rotB = bodyB->getRotation();
    rA = localAnchorA.rotate(rotA);
    rB = localAnchorB.rotate(rotB);
    float imA = bodyA->getInverseMass();
    float imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();
    massMatrix[0][0] = imA + imB + iIA * rA.y * rA.y + iIB * rB.y * rB.y;
    massMatrix[0][1] = -iIA * rA.x * rA.y - iIB * rB.x * rB.y;
    massMatrix[1][0] = massMatrix[0][1];
    massMatrix[1][1] = imA + imB + iIA * rA.x * rA.x + iIB * rB.x * rB.x;
    float det = massMatrix[0][0] * massMatrix[1][1] - massMatrix[0][1] * massMatrix[1][0];
    if (std::abs(det) > 1e-6f) {
        float invDet = 1.0f / det;
        float k00 = massMatrix[0][0], k01 = massMatrix[0][1], k11 = massMatrix[1][1];
        massMatrix[0][0] = k11 * invDet; massMatrix[0][1] = -k01 * invDet;
        massMatrix[1][0] = -k01 * invDet; massMatrix[1][1] = k00 * invDet;
    } else {
        massMatrix[0][0] = massMatrix[0][1] = massMatrix[1][0] = massMatrix[1][1] = 0.0f;
    }
    Vec2 posA = bodyA->getPosition(), posB = bodyB->getPosition();
    Vec2 C = (posB + rB) - (posA + rA);
    bias = C * (0.2f / dt);
    float maxStabilizationVelocity = 10.0f;
    float biasMag = bias.magnitude();
    if (biasMag > maxStabilizationVelocity) bias = bias * (maxStabilizationVelocity / biasMag);
    bodyA->setVelocityInternal(bodyA->getVelocity() - impulse * imA);
    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(impulse) * iIA);
    bodyB->setVelocityInternal(bodyB->getVelocity() + impulse * imB);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(impulse) * iIB);
}

void HingeJoint::solve() {
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    Vec2 vrA(-bodyA->getAngularVelocity() * rA.y, bodyA->getAngularVelocity() * rA.x);
    Vec2 vrB(-bodyB->getAngularVelocity() * rB.y, bodyB->getAngularVelocity() * rB.x);
    Vec2 Cdot = (bodyB->getVelocity() + vrB) - (bodyA->getVelocity() + vrA);
    Vec2 jBias = Cdot + bias;
    Vec2 lambda(-(massMatrix[0][0] * jBias.x + massMatrix[0][1] * jBias.y), -(massMatrix[1][0] * jBias.x + massMatrix[1][1] * jBias.y));
    if (std::isfinite(lambda.x) && std::isfinite(lambda.y)) {
        impulse = impulse + lambda;
        if (imA > 0.0f) { bodyA->setVelocityInternal(bodyA->getVelocity() - lambda * imA); bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(lambda) * iIA); }
        if (imB > 0.0f) { bodyB->setVelocityInternal(bodyB->getVelocity() + lambda * imB); bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(lambda) * iIB); }
    }
}

Vec2 HingeJoint::getReactionForce(float inv_dt) const { return impulse * inv_dt; }
float HingeJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void HingeJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 HingeJoint::getLocalAnchorA() const { return localAnchorA; }
void HingeJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 HingeJoint::getLocalAnchorB() const { return localAnchorB; }
