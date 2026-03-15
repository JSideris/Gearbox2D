#include "spring-joint.h"
#include "body.h"
#include "world.h"
#include <cmath>

SpringJoint::SpringJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length, float frequencyHz, float dampingRatio)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), frequencyHz(frequencyHz), dampingRatio(dampingRatio), impulse(0.0f), mass(0.0f), bias(0.0f), gamma(0.0f) {}

void SpringJoint::preSolve(float dt) {
    _dt = dt;
    rA = localAnchorA.rotate(bodyA->getRotation());
    rB = localAnchorB.rotate(bodyB->getRotation());
    Vec2 d = (bodyB->getPosition() + rB) - (bodyA->getPosition() + rA);
    float dMag = d.magnitude();
    if (dMag > 1e-4f) {
        normal = d / dMag;
    } else if (hasLastNormal) {
        normal = lastNormal;
    } else {
        normal = Vec2(0, 1);
    }

    if (hasLastNormal) {
        impulse *= lastNormal.dot(normal);
    }
    lastNormal = normal;
    hasLastNormal = true;

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

void SpringJoint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(normal);
    float lambda = -mass * (Cdot + bias + gamma * impulse);
    impulse += lambda;
    Vec2 p = normal * lambda;

    if (sA.im > 0.0f) {
        sA.v.x -= p.x * sA.im;
        sA.v.y -= p.y * sA.im;
        sA.w -= rA.cross(p) * sA.iI;
    }
    if (sB.im > 0.0f) {
        sB.v.x += p.x * sB.im;
        sB.v.y += p.y * sB.im;
        sB.w += rB.cross(p) * sB.iI;
    }
}

Vec2 SpringJoint::getReactionForce(float inv_dt) const { return normal * (impulse * inv_dt); }
float SpringJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void SpringJoint::setLength(float l) { length = l; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
float SpringJoint::getLength() const { return length; }
void SpringJoint::setFrequencyHz(float f) { frequencyHz = f; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
float SpringJoint::getFrequencyHz() const { return frequencyHz; }
void SpringJoint::setDampingRatio(float d) { dampingRatio = d; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
float SpringJoint::getDampingRatio() const { return dampingRatio; }
void SpringJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 SpringJoint::getLocalAnchorA() const { return localAnchorA; }
void SpringJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 SpringJoint::getLocalAnchorB() const { return localAnchorB; }

void SpringJoint::solvePosition() {
    // For SpringJoint, we only apply position correction if it's stiff (frequencyHz > 0)
    // or if we want to prevent extreme stretching. 
    // Here we'll use a logic similar to DistanceJoint but only if frequencyHz > 0.
    if (frequencyHz <= 0.0f) return;

    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    if (imA + imB == 0.0f) return;

    Vec2 pA = bodyA->getPosition(); float thetaA = bodyA->getRotation();
    Vec2 pB = bodyB->getPosition(); float thetaB = bodyB->getRotation();

    Vec2 rA_curr = localAnchorA.rotate(thetaA);
    Vec2 rB_curr = localAnchorB.rotate(thetaB);

    Vec2 d = (pB + rB_curr) - (pA + rA_curr);
    float dMag = d.magnitude();
    Vec2 normal_curr;
    if (dMag > 1e-6f) {
        normal_curr = d / dMag;
    } else {
        normal_curr = normal;
    }

    float C = dMag - length;
    float slop = 0.008f;
    float baumgarte = 0.2f;
    float maxCorrection = 2.0f;

    float correction = C * baumgarte;
    if (std::abs(correction) > maxCorrection) {
        correction = (correction > 0) ? maxCorrection : -maxCorrection;
    }
    if (std::abs(correction) < slop) return;

    float rnA = rA_curr.cross(normal_curr);
    float rnB = rB_curr.cross(normal_curr);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    if (k < 1e-6f) return;

    float impulse = -correction / k;
    Vec2 P = normal_curr * impulse;

    if (imA > 0.0f) {
        int idx = bodyA->worldIndex * BODY_FDATA_EPO;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_X] = pA.x - P.x * imA;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pA.y - P.y * imA;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaA - rA_curr.cross(P) * iIA;
    }
    if (imB > 0.0f) {
        int idx = bodyB->worldIndex * BODY_FDATA_EPO;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_X] = pB.x + P.x * imB;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pB.y + P.y * imB;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaB + rB_curr.cross(P) * iIB;
    }
}
