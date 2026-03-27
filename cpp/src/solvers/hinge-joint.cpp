#include "hinge-joint.h"
#include "body.h"
#include "world.h"
#include "simd-math.h"
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
    // Component A: Force Velocity Compensation
    Vec2 vB = C * (BAUMGARTE_FACTOR / dt);
    Vec2 forceVelDiff = bodyB->getForceVelocity() - bodyA->getForceVelocity();
    
    bias = vB - forceVelDiff;
    
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
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);

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

void HingeJoint::solveFastSIMD(HingeJoint** joints) {
#if HWY_TARGET != HWY_SCALAR
    // Load joint properties
    V128 m00 = v128_make_f32(joints[0]->massMatrix[0][0], joints[1]->massMatrix[0][0], joints[2]->massMatrix[0][0], joints[3]->massMatrix[0][0]);
    V128 m01 = v128_make_f32(joints[0]->massMatrix[0][1], joints[1]->massMatrix[0][1], joints[2]->massMatrix[0][1], joints[3]->massMatrix[0][1]);
    V128 m11 = v128_make_f32(joints[0]->massMatrix[1][1], joints[1]->massMatrix[1][1], joints[2]->massMatrix[1][1], joints[3]->massMatrix[1][1]);

    V128 biasX = v128_make_f32(joints[0]->bias.x, joints[1]->bias.x, joints[2]->bias.x, joints[3]->bias.x);
    V128 biasY = v128_make_f32(joints[0]->bias.y, joints[1]->bias.y, joints[2]->bias.y, joints[3]->bias.y);

    V128 rAx = v128_make_f32(joints[0]->rA.x, joints[1]->rA.x, joints[2]->rA.x, joints[3]->rA.x);
    V128 rAy = v128_make_f32(joints[0]->rA.y, joints[1]->rA.y, joints[2]->rA.y, joints[3]->rA.y);
    V128 rBx = v128_make_f32(joints[0]->rB.x, joints[1]->rB.x, joints[2]->rB.x, joints[3]->rB.x);
    V128 rBy = v128_make_f32(joints[0]->rB.y, joints[1]->rB.y, joints[2]->rB.y, joints[3]->rB.y);

    SolverData* sA[4];
    SolverData* sB[4];
    for (int i = 0; i < 4; ++i) {
        sA[i] = static_cast<SolverData*>(joints[i]->context.a);
        sB[i] = static_cast<SolverData*>(joints[i]->context.b);
    }

    // Load velocities and mass properties
    V128 vAx = v128_make_f32(sA[0]->v.x, sA[1]->v.x, sA[2]->v.x, sA[3]->v.x);
    V128 vAy = v128_make_f32(sA[0]->v.y, sA[1]->v.y, sA[2]->v.y, sA[3]->v.y);
    V128 wA  = v128_make_f32(sA[0]->w,   sA[1]->w,   sA[2]->w,   sA[3]->w);
    V128 vBx = v128_make_f32(sB[0]->v.x, sB[1]->v.x, sB[2]->v.x, sB[3]->v.x);
    V128 vBy = v128_make_f32(sB[0]->v.y, sB[1]->v.y, sB[2]->v.y, sB[3]->v.y);
    V128 wB  = v128_make_f32(sB[0]->w,   sB[1]->w,   sB[2]->w,   sB[3]->w);

    V128 imA = v128_make_f32(sA[0]->im, sA[1]->im, sA[2]->im, sA[3]->im);
    V128 iIA = v128_make_f32(sA[0]->iI, sA[1]->iI, sA[2]->iI, sA[3]->iI);
    V128 imB = v128_make_f32(sB[0]->im, sB[1]->im, sB[2]->im, sB[3]->im);
    V128 iIB = v128_make_f32(sB[0]->iI, sB[1]->iI, sB[2]->iI, sB[3]->iI);

    // Relative velocity at anchors
    V128 vrAx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wA, rAy));
    V128 vrAy = v128_mul_f32(wA, rAx);
    V128 vrBx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wB, rBy));
    V128 vrBy = v128_mul_f32(wB, rBx);

    V128 CdotX = v128_sub_f32(v128_add_f32(vBx, vrBx), v128_add_f32(vAx, vrAx));
    V128 CdotY = v128_sub_f32(v128_add_f32(vBy, vrBy), v128_add_f32(vAy, vrAy));

    V128 termX = v128_add_f32(CdotX, biasX);
    V128 termY = v128_add_f32(CdotY, biasY);

    V128 lambdaX = v128_mul_f32(v128_splat_f32(-1.0f), v128_add_f32(v128_mul_f32(m00, termX), v128_mul_f32(m01, termY)));
    V128 lambdaY = v128_mul_f32(v128_splat_f32(-1.0f), v128_add_f32(v128_mul_f32(m01, termX), v128_mul_f32(m11, termY)));

    // Finiteness check
    V128 finite = v128_and(v128_is_finite(lambdaX), v128_is_finite(lambdaY));
    lambdaX = v128_select(finite, lambdaX, v128_splat_f32(0.0f));
    lambdaY = v128_select(finite, lambdaY, v128_splat_f32(0.0f));

    // Apply impulse
    vAx = v128_sub_f32(vAx, v128_mul_f32(lambdaX, imA));
    vAy = v128_sub_f32(vAy, v128_mul_f32(lambdaY, imA));
    wA = v128_sub_f32(wA, v128_mul_f32(v128_cross_f32(rAx, rAy, lambdaX, lambdaY), iIA));

    vBx = v128_add_f32(vBx, v128_mul_f32(lambdaX, imB));
    vBy = v128_add_f32(vBy, v128_mul_f32(lambdaY, imB));
    wB = v128_add_f32(wB, v128_mul_f32(v128_cross_f32(rBx, rBy, lambdaX, lambdaY), iIB));

    // Store back results
    alignas(16) float resVAx[4], resVAy[4], resWA[4], resVBx[4], resVBy[4], resWB[4], resLX[4], resLY[4];
    v128_store_f32(resVAx, vAx);
    v128_store_f32(resVAy, vAy);
    v128_store_f32(resWA, wA);
    v128_store_f32(resVBx, vBx);
    v128_store_f32(resVBy, vBy);
    v128_store_f32(resWB, wB);
    v128_store_f32(resLX, lambdaX);
    v128_store_f32(resLY, lambdaY);

    for (int i = 0; i < 4; ++i) {
        sA[i]->v.x = resVAx[i];
        sA[i]->v.y = resVAy[i];
        sA[i]->w = resWA[i];
        sB[i]->v.x = resVBx[i];
        sB[i]->v.y = resVBy[i];
        sB[i]->w = resWB[i];
        joints[i]->impulse.x += resLX[i];
        joints[i]->impulse.y += resLY[i];
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->solveFast();
#endif
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
        int bIdx = bodyA->worldIndex;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pA.x - impulse_local.x * imA;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pA.y - impulse_local.y * imA;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaA - rA_curr.cross(impulse_local) * iIA;
    }
    if (imB > 0.0f) {
        int bIdx = bodyB->worldIndex;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pB.x + impulse_local.x * imB;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pB.y + impulse_local.y * imB;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaB + rB_curr.cross(impulse_local) * iIB;
    }
}
