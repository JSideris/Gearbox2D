#include "distance-joint.h"
#include "body.h"
#include "world.h"
#include <cmath>

DistanceJoint::DistanceJoint(int id, Body* a, Body* b, Vec2 anchorA, Vec2 anchorB, float length)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), length(length), impulse(0.0f) {}

void DistanceJoint::preSolve(float dt) {
    _dt = dt;
    rA = localAnchorA.rotate(bodyA->getRotation());
    rB = localAnchorB.rotate(bodyB->getRotation());
    Vec2 pA = bodyA->getPosition();
    Vec2 pB = bodyB->getPosition();
    Vec2 d = (pB + rB) - (pA + rA);
    float dMag = d.magnitude();
    
    Vec2 oldNormal = normal;
    bool snapped = false;
    if (dMag > 1e-4f) {
        normal = d / dMag;
        if (hasLastNormal && lastNormal.dot(normal) < 0.9f) {
            snapped = true;
        }
    } else if (!hasLastNormal) {
        normal = Vec2(0, 1); 
    }
    // Else: keep previous normal to avoid singularity at dMag = 0

    float dot = 1.0f;
    if (hasLastNormal) {
        dot = lastNormal.dot(normal);
        impulse *= dot;
    }

    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    float rnA = rA.cross(normal), rnB = rB.cross(normal);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;

    lastNormal = normal;
    hasLastNormal = true;

    float C = dMag - length;
    float vB = BAUMGARTE_FACTOR * C / dt;
    
    // Kinematic Restitution Balancing (KRB) for Distance Joint
    // Component A: Force Velocity Compensation
    float forceVn = (bodyB->getForceVelocity() - bodyA->getForceVelocity()).dot(normal);
    
    // Component B: Kinematic Energy Balancing (The "Joint Tax")
    // We adjust the bias velocity to account for work done by external forces over the correction displacement.
    float accVn = forceVn / dt;

    // Cumulative correction over position iterations: 1 - (1 - beta)^n
    int n = bodyA->world.getPositionIterations();
    float cumulativeCorrectionFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)n);
    float workTerm = 2.0f * accVn * (C * cumulativeCorrectionFactor);
    
    float vB_balanced_sq = vB * vB - workTerm;
    
    bias = (C > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vB_balanced_sq));

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

void DistanceJoint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(normal);
    float lambda = -mass * (Cdot + bias);

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

Vec2 DistanceJoint::getReactionForce(float inv_dt) const { return normal * (impulse * inv_dt); }
float DistanceJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void DistanceJoint::setLength(float l) { length = l; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
float DistanceJoint::getLength() const { return length; }
void DistanceJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 DistanceJoint::getLocalAnchorA() const { return localAnchorA; }
void DistanceJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 DistanceJoint::getLocalAnchorB() const { return localAnchorB; }

void DistanceJoint::solvePosition() {
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
    if (dMag > 1e-4f) {
        normal_curr = d / dMag;
    } else {
        normal_curr = normal;
    }

    float C = dMag - length;
    float maxCorrection = 0.2f;

    if (std::abs(C) < PENETRATION_SLOP) return;

    float correction = C * BAUMGARTE_FACTOR;
    if (std::abs(correction) > maxCorrection) {
        correction = (correction > 0) ? maxCorrection : -maxCorrection;
    }

    float rnA = rA_curr.cross(normal_curr);
    float rnB = rB_curr.cross(normal_curr);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    if (k < 1e-6f) return;

    float impulse_local = -correction / k;
    Vec2 P = normal_curr * impulse_local;

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
