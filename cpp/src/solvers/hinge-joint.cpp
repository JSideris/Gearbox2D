#include "hinge-joint.h"
#include "body.h"
#include "world.h"
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
    
    // Kinematic Restitution Balancing (KRB) for Hinge Joint
    // We apply the "Joint Tax" to the Baumgarte bias component-wise.
    Vec2 vB = C * (BAUMGARTE_FACTOR / dt);
    Vec2 forceVelDiff = bodyB->forceVelocity - bodyA->forceVelocity;
    Vec2 accExt = forceVelDiff / dt;
    
    // Cumulative correction over position iterations: 1 - (1 - beta)^n
    int n = bodyA->world.getPositionIterations();
    float cumulativeCorrectionFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)n);
    float totalDisplacementX = C.x * cumulativeCorrectionFactor;
    float totalDisplacementY = C.y * cumulativeCorrectionFactor;

    float vBx_balanced_sq = vB.x * vB.x - 2.0f * accExt.x * totalDisplacementX;
    float vBy_balanced_sq = vB.y * vB.y - 2.0f * accExt.y * totalDisplacementY;
    
    bias.x = (C.x > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vBx_balanced_sq));
    bias.y = (C.y > 0 ? 1.0f : -1.0f) * std::sqrt(std::max(0.0f, vBy_balanced_sq));
    
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
    Vec2 lambda(-(massMatrix[0][0] * (Cdot.x + bias.x) + massMatrix[0][1] * (Cdot.y + bias.y)), 
                -(massMatrix[1][0] * (Cdot.x + bias.x) + massMatrix[1][1] * (Cdot.y + bias.y)));
    if (std::isfinite(lambda.x) && std::isfinite(lambda.y)) {
        impulse = impulse + lambda;
        if (imA > 0.0f) { bodyA->setVelocityInternal(bodyA->getVelocity() - lambda * imA); bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(lambda) * iIA); }
        if (imB > 0.0f) { bodyB->setVelocityInternal(bodyB->getVelocity() + lambda * imB); bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(lambda) * iIB); }
    }
}

void HingeJoint::solveFast() {
    Body::SolverData& sA = *static_cast<Body::SolverData*>(context.a);
    Body::SolverData& sB = *static_cast<Body::SolverData*>(context.b);

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    Vec2 Cdot = (sB.v + vrB) - (sA.v + vrA);
    Vec2 lambda(-(massMatrix[0][0] * (Cdot.x + bias.x) + massMatrix[0][1] * (Cdot.y + bias.y)), 
                -(massMatrix[1][0] * (Cdot.x + bias.x) + massMatrix[1][1] * (Cdot.y + bias.y)));

    if (std::isfinite(lambda.x) && std::isfinite(lambda.y)) {
        impulse = impulse + lambda;
        if (sA.im > 0.0f) {
            sA.v.x -= lambda.x * sA.im;
            sA.v.y -= lambda.y * sA.im;
            sA.w -= rA.cross(lambda) * sA.iI;
        }
        if (sB.im > 0.0f) {
            sB.v.x += lambda.x * sB.im;
            sB.v.y += lambda.y * sB.im;
            sB.w += rB.cross(lambda) * sB.iI;
        }
    }
}

Vec2 HingeJoint::getReactionForce(float inv_dt) const { return impulse * inv_dt; }
float HingeJoint::getReactionTorque(float inv_dt) const { return 0.0f; }
void HingeJoint::setLocalAnchorA(Vec2 a) { localAnchorA = a; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 HingeJoint::getLocalAnchorA() const { return localAnchorA; }
void HingeJoint::setLocalAnchorB(Vec2 b) { localAnchorB = b; bodyA->forceWakeUp(); bodyB->forceWakeUp(); }
Vec2 HingeJoint::getLocalAnchorB() const { return localAnchorB; }

void HingeJoint::solvePosition() {
    float imA = bodyA->getInverseMass(), imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    if (imA + imB == 0.0f) return;

    Vec2 pA = bodyA->getPosition(); float thetaA = bodyA->getRotation();
    Vec2 pB = bodyB->getPosition(); float thetaB = bodyB->getRotation();

    Vec2 rA_curr = localAnchorA.rotate(thetaA);
    Vec2 rB_curr = localAnchorB.rotate(thetaB);

    Vec2 C = (pB + rB_curr) - (pA + rA_curr);
    float maxCorrection = 0.2f;

    float Cmag = C.magnitude();
    if (Cmag < PENETRATION_SLOP) return;

    Vec2 correction = C * BAUMGARTE_FACTOR;
    float corrMag = correction.magnitude();
    if (corrMag > maxCorrection) {
        correction = (correction / corrMag) * maxCorrection;
    }

    float k00 = imA + imB + iIA * rA_curr.y * rA_curr.y + iIB * rB_curr.y * rB_curr.y;
    float k01 = -iIA * rA_curr.x * rA_curr.y - iIB * rB_curr.x * rB_curr.y;
    float k11 = imA + imB + iIA * rA_curr.x * rA_curr.x + iIB * rB_curr.x * rB_curr.x;

    float det = k00 * k11 - k01 * k01;
    Vec2 impulse_local;
    if (std::abs(det) > 1e-6f) {
        float invDet = 1.0f / det;
        impulse_local.x = -invDet * (k11 * correction.x - k01 * correction.y);
        impulse_local.y = -invDet * (-k01 * correction.x + k00 * correction.y);
    } else {
        return;
    }

    if (imA > 0.0f) {
        int idx = bodyA->worldIndex * BODY_FDATA_EPO;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_X] = pA.x - impulse_local.x * imA;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pA.y - impulse_local.y * imA;
        bodyA->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaA - rA_curr.cross(impulse_local) * iIA;
    }
    if (imB > 0.0f) {
        int idx = bodyB->worldIndex * BODY_FDATA_EPO;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_X] = pB.x + impulse_local.x * imB;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pB.y + impulse_local.y * imB;
        bodyB->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaB + rB_curr.cross(impulse_local) * iIB;
    }
}
