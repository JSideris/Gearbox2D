#include "spring-joint.h"
#include "body.h"
#include <cmath>

SpringJoint::SpringJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length, float frequencyHz, float dampingRatio)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), frequencyHz(frequencyHz), dampingRatio(dampingRatio), impulse(0.0f), mass(0.0f), bias(0.0f), gamma(0.0f) {}

void SpringJoint::preSolve(float dt) {
    _dt = dt;
    rA = localAnchorA.rotate(bodyA->getRotation());
    rB = localAnchorB.rotate(bodyB->getRotation());
    Vec2 d = (bodyB->getPosition() + rB) - (bodyA->getPosition() + rA);
    float dMag = d.magnitude();
    if (dMag > 1e-6f) {
        normal = d / dMag;
    } else {
        normal = Vec2(0, 0);
    }
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    float rnA = rA.cross(normal), rnB = rB.cross(normal);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    if (frequencyHz > 0.0f) {
        float omega = 2.0f * M_PI * frequencyHz;
        float invK = (k > 0.0f) ? 1.0f / k : 0.0f;
        float d_coeff = 2.0f * invK * dampingRatio * omega;
        float k_coeff = invK * omega * omega;
        gamma = dt * (d_coeff + dt * k_coeff);
        gamma = (gamma > 0.0f) ? 1.0f / gamma : 0.0f;
        bias = (dMag - length) * dt * k_coeff * gamma;
        mass = k + gamma;
        mass = (mass > 0.0f) ? 1.0f / mass : 0.0f;
    } else {
        gamma = 0.0f;
        bias = 0.0f;
        mass = (k > 0.0f) ? 1.0f / k : 0.0f;
    }
    Vec2 p = normal * impulse;
    bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA);
    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA);
    bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB);
}

void SpringJoint::solve() {
    Vec2 vA = bodyA->getVelocity(), vB = bodyB->getVelocity();
    float wA = bodyA->getAngularVelocity(), wB = bodyB->getAngularVelocity();
    Vec2 vrA(-wA * rA.y, wA * rA.x), vrB(-wB * rB.y, wB * rB.x);
    float Cdot = (vB + vrB - (vA + vrA)).dot(normal);
    float lambda = -mass * (Cdot + bias + gamma * impulse);
    impulse += lambda;
    Vec2 p = normal * lambda;
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    if (imA > 0.0f) { bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA); bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA); }
    if (imB > 0.0f) { bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB); bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB); }
}

Vec2 SpringJoint::getReactionForce(float inv_dt) const { return normal * (impulse * inv_dt); }
float SpringJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void SpringJoint::setLength(float l) { length = l; bodyA->wakeUp(); bodyB->wakeUp(); }
float SpringJoint::getLength() const { return length; }
void SpringJoint::setFrequencyHz(float f) { frequencyHz = f; bodyA->wakeUp(); bodyB->wakeUp(); }
float SpringJoint::getFrequencyHz() const { return frequencyHz; }
void SpringJoint::setDampingRatio(float d) { dampingRatio = d; bodyA->wakeUp(); bodyB->wakeUp(); }
float SpringJoint::getDampingRatio() const { return dampingRatio; }
void SpringJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 SpringJoint::getLocalAnchorA() const { return localAnchorA; }
void SpringJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->wakeUp(); bodyB->wakeUp(); }
Vec2 SpringJoint::getLocalAnchorB() const { return localAnchorB; }
