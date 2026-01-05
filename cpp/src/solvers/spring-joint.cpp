#include "spring-joint.h"
#include "physical-object.h"
#include <cmath>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

SpringJoint::SpringJoint(int id, PhysicalObject* a, PhysicalObject* b, Vec2 anchorA, Vec2 anchorB, float length, float frequencyHz, float dampingRatio)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), 
      frequencyHz(frequencyHz), dampingRatio(dampingRatio), impulse(0.0f) {}

void SpringJoint::preSolve(float dt) {
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

    float k_eff = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;

    if (frequencyHz > 0.0f) {
        float C = currentLength - length;

        // Frequency
        float omega = 2.0f * M_PI * frequencyHz;

        // Damping coefficient
        float d_coeff = 2.0f * dampingRatio * omega;

        // Spring stiffness
        float k_spring = omega * omega;

        // Softness
        gamma = dt * (d_coeff + dt * k_spring);
        gamma = (gamma > 0.0f) ? 1.0f / gamma : 0.0f;
        bias = C * dt * k_spring * gamma;

        mass = (k_eff + gamma > 0.0f) ? 1.0f / (k_eff + gamma) : 0.0f;
    } else {
        gamma = 0.0f;
        bias = 0.0f;
        mass = (k_eff > 0.0f) ? 1.0f / k_eff : 0.0f;
        
        // Position correction for zero frequency (standard distance joint)
        float beta = 0.2f;
        float C = currentLength - length;
        bias = (beta / dt) * C;
    }

    // Warm starting
    Vec2 P = u * impulse;
    bodyA->setVelocity(bodyA->getVelocity() - P * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(P) * iIA);

    bodyB->setVelocity(bodyB->getVelocity() + P * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(P) * iIB);
}

void SpringJoint::solve() {
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

    float lambda = -mass * (Cdot + bias + gamma * impulse);
    impulse += lambda;

    Vec2 P = u * lambda;
    bodyA->setVelocity(bodyA->getVelocity() - P * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(P) * iIA);

    bodyB->setVelocity(bodyB->getVelocity() + P * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(P) * iIB);
}

Vec2 SpringJoint::getReactionForce(float inv_dt) const {
    return u * (impulse * inv_dt);
}

float SpringJoint::getReactionTorque(float inv_dt) const {
    return 0.0f;
}

