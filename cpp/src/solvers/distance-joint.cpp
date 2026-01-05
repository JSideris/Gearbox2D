#include "distance-joint.h"
#include "physical-object.h"
#include <cmath>
#include <algorithm>

DistanceJoint::DistanceJoint(int id, PhysicalObject* a, PhysicalObject* b, Vec2 anchorA, Vec2 anchorB, float length)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), impulse(0.0f) {}

void DistanceJoint::preSolve(float dt) {
    _dt = dt;

    float rotA = bodyA->getRotation();
    float rotB = bodyB->getRotation();

    rA = localAnchorA.rotate(rotA);
    rB = localAnchorB.rotate(rotB);

    Vec2 posA = bodyA->getPosition();
    Vec2 posB = bodyB->getPosition();

    Vec2 d = (posB + rB) - (posA + rA);
    float currentLength = d.magnitude();

    if (currentLength > 0.0001f) {
        u = d / currentLength;
    } else {
        u = Vec2(0, 0);
    }

    float imA = bodyA->getInverseMass();
    float imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();

    float rnA = rA.cross(u);
    float rnB = rB.cross(u);

    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;

    // Position correction (Baumgarte stabilization)
    float beta = 0.2f;
    float C = currentLength - length;
    bias = (beta / dt) * C;

    // Warm starting
    Vec2 P = u * impulse;
    bodyA->setVelocity(bodyA->getVelocity() - P * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(P) * iIA);

    bodyB->setVelocity(bodyB->getVelocity() + P * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(P) * iIB);
}

void DistanceJoint::solve() {
    float imA = bodyA->getInverseMass();
    float imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();

    Vec2 vA = bodyA->getVelocity();
    float wA = bodyA->getAngularVelocity();
    Vec2 vB = bodyB->getVelocity();
    float wB = bodyB->getAngularVelocity();

    Vec2 vrA(-wA * rA.y, wA * rA.x);
    Vec2 vrB(-wB * rB.y, wB * rB.x);

    Vec2 Cdot_vec = (vB + vrB) - (vA + vrA);
    float Cdot = Cdot_vec.dot(u);

    float lambda = -mass * (Cdot + bias);
    impulse += lambda;

    Vec2 P = u * lambda;
    bodyA->setVelocity(bodyA->getVelocity() - P * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(P) * iIA);

    bodyB->setVelocity(bodyB->getVelocity() + P * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(P) * iIB);
}

Vec2 DistanceJoint::getReactionForce(float inv_dt) const {
    return u * (impulse * inv_dt);
}

float DistanceJoint::getReactionTorque(float inv_dt) const {
    return 0.0f;
}

