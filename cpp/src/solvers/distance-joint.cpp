#include "distance-joint.h"
#include "body.h"
#include <cmath>

DistanceJoint::DistanceJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), impulse(0.0f) {}

void DistanceJoint::preSolve(float dt) {
    _dt = dt;
    rA = localAnchorA.rotate(bodyA->getRotation());
    rB = localAnchorB.rotate(bodyB->getRotation());
    Vec2 d = (bodyB->getPosition() + rB) - (bodyA->getPosition() + rA);
    float dMag = d.magnitude();
    if (dMag > 1e-6f) {
        normal = d / dMag;
    } else {
        normal = Vec2(0, 1); // Default normal if anchors overlap
    }
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    float rnA = rA.cross(normal), rnB = rB.cross(normal);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;
    bias = (dMag - length) * (0.2f / dt);
    Vec2 p = normal * impulse;
    bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA);
    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA);
    bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB);
}

void DistanceJoint::solve() {
    Vec2 vA = bodyA->getVelocity(), vB = bodyB->getVelocity();
    float wA = bodyA->getAngularVelocity(), wB = bodyB->getAngularVelocity();
    Vec2 vrA(-wA * rA.y, wA * rA.x), vrB(-wB * rB.y, wB * rB.x);
    float Cdot = (vB + vrB - (vA + vrA)).dot(normal);
    float lambda = -mass * (Cdot + bias);
    impulse += lambda;
    Vec2 p = normal * lambda;
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    if (imA > 0.0f) { bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA); bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA); }
    if (imB > 0.0f) { bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB); bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB); }
}

Vec2 DistanceJoint::getReactionForce(float inv_dt) const { return normal * (impulse * inv_dt); }
float DistanceJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void DistanceJoint::setLength(float l) { length = l; bodyA->wakeUp(); bodyB->wakeUp(); }
float DistanceJoint::getLength() const { return length; }
void DistanceJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 DistanceJoint::getLocalAnchorA() const { return localAnchorA; }
void DistanceJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 DistanceJoint::getLocalAnchorB() const { return localAnchorB; }
