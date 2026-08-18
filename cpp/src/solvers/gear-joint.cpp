#include "gear-joint.h"
#include "body.h"
#include "hinge-joint.h"
#include "world.h"
#include "constants.h"
#include "simd-math.h"
#include <cmath>

namespace {

float clampGearLambda(float lambda, float ratio, float iIB, float iID, float dt) {
	const float maxOmegaStep = 0.5f * MAX_POSITION_CORRECTION / std::max(dt, 1e-6f);
	if (iID > 0.0f) {
		const float maxFromWheel = maxOmegaStep / iID;
		lambda = std::max(-maxFromWheel, std::min(maxFromWheel, lambda));
	}
	if (iIB > 0.0f && ratio != 0.0f) {
		const float maxFromEngine = maxOmegaStep / (ratio * iIB);
		lambda = std::max(-maxFromEngine, std::min(maxFromEngine, lambda));
	}
	return lambda;
}

float gearSlipScale(float cdot, float dt) {
	return 1.0f / (1.0f + 4.0f * std::abs(cdot) * dt);
}

} // namespace

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

    const float maxImpulse = 75.0f * _dt;
    impulse = std::max(-maxImpulse, std::min(maxImpulse, impulse));

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

    float iIB = bodyB->getInverseInertia();
    float iID = bodyD->getInverseInertia();
    float Cdot = ratio * (wB - wA) + (wD - wC);
    float slipScale = gearSlipScale(Cdot, _dt);
    float lambda = clampGearLambda(-mass * Cdot * slipScale, ratio, iIB, iID, _dt);
    impulse += lambda;

    bodyA->setAngularVelocityInternal(wA - ratio * lambda * bodyA->getInverseInertia());
    bodyB->setAngularVelocityInternal(wB + ratio * lambda * iIB);
    bodyC->setAngularVelocityInternal(wC - lambda * bodyC->getInverseInertia());
    bodyD->setAngularVelocityInternal(wD + lambda * iID);
}

void GearJoint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);
    SolverData& sC = *static_cast<SolverData*>(context.c);
    SolverData& sD = *static_cast<SolverData*>(context.d);

    float Cdot = ratio * (sB.w - sA.w) + (sD.w - sC.w);
    float slipScale = gearSlipScale(Cdot, _dt);
    float lambda = clampGearLambda(-mass * Cdot * slipScale, ratio, sB.iI, sD.iI, _dt);
    impulse += lambda;

    sA.w -= ratio * lambda * sA.iI;
    sB.w += ratio * lambda * sB.iI;
    sC.w -= lambda * sC.iI;
    sD.w += lambda * sD.iI;
}

void GearJoint::solveFastSIMD(GearJoint** joints) {
#if HWY_TARGET != HWY_SCALAR
    // Load joint properties
    V128 mass = v128_make_f32(joints[0]->mass, joints[1]->mass, joints[2]->mass, joints[3]->mass);
    V128 ratio = v128_make_f32(joints[0]->ratio, joints[1]->ratio, joints[2]->ratio, joints[3]->ratio);

    SolverData* sA[4];
    SolverData* sB[4];
    SolverData* sC[4];
    SolverData* sD[4];
    for (int i = 0; i < 4; ++i) {
        sA[i] = static_cast<SolverData*>(joints[i]->context.a);
        sB[i] = static_cast<SolverData*>(joints[i]->context.b);
        sC[i] = static_cast<SolverData*>(joints[i]->context.c);
        sD[i] = static_cast<SolverData*>(joints[i]->context.d);
    }

    // Load angular velocities and inertia properties
    V128 wA = v128_make_f32(sA[0]->w, sA[1]->w, sA[2]->w, sA[3]->w);
    V128 wB = v128_make_f32(sB[0]->w, sB[1]->w, sB[2]->w, sB[3]->w);
    V128 wC = v128_make_f32(sC[0]->w, sC[1]->w, sC[2]->w, sC[3]->w);
    V128 wD = v128_make_f32(sD[0]->w, sD[1]->w, sD[2]->w, sD[3]->w);

    V128 iIA = v128_make_f32(sA[0]->iI, sA[1]->iI, sA[2]->iI, sA[3]->iI);
    V128 iIB = v128_make_f32(sB[0]->iI, sB[1]->iI, sB[2]->iI, sB[3]->iI);
    V128 iIC = v128_make_f32(sC[0]->iI, sC[1]->iI, sC[2]->iI, sC[3]->iI);
    V128 iID = v128_make_f32(sD[0]->iI, sD[1]->iI, sD[2]->iI, sD[3]->iI);

    // Cdot = ratio * (wB - wA) + (wD - wC)
    V128 Cdot = v128_add_f32(v128_mul_f32(ratio, v128_sub_f32(wB, wA)), v128_sub_f32(wD, wC));
    V128 dt_v = v128_splat_f32(joints[0]->_dt);
    V128 slipScale = v128_div_f32(v128_splat_f32(1.0f), v128_add_f32(v128_splat_f32(1.0f), v128_mul_f32(v128_splat_f32(4.0f), v128_mul_f32(v128_abs_f32(Cdot), dt_v))));

    // lambda = -mass * Cdot * slipScale
    V128 lambda = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(v128_mul_f32(mass, Cdot), slipScale));
    V128 maxOmegaStep = v128_splat_f32(0.5f * MAX_POSITION_CORRECTION / std::max(joints[0]->_dt, 1e-6f));
    V128 maxFromWheel = v128_div_f32(maxOmegaStep, iID);
    V128 maxFromEngine = v128_div_f32(maxOmegaStep, v128_mul_f32(ratio, iIB));
    V128 maxLambda = v128_min_f32(maxFromWheel, maxFromEngine);
    V128 negMaxLambda = v128_mul_f32(maxLambda, v128_splat_f32(-1.0f));
    lambda = v128_min_f32(maxLambda, v128_max_f32(negMaxLambda, lambda));

    // Apply updates
    V128 ratioLambda = v128_mul_f32(ratio, lambda);
    
    wA = v128_sub_f32(wA, v128_mul_f32(ratioLambda, iIA));
    wB = v128_add_f32(wB, v128_mul_f32(ratioLambda, iIB));
    wC = v128_sub_f32(wC, v128_mul_f32(lambda, iIC));
    wD = v128_add_f32(wD, v128_mul_f32(lambda, iID));

    // Store back
    alignas(16) float resWA[4], resWB[4], resWC[4], resWD[4], resL[4];
    v128_store_f32(resWA, wA);
    v128_store_f32(resWB, wB);
    v128_store_f32(resWC, wC);
    v128_store_f32(resWD, wD);
    v128_store_f32(resL, lambda);

    for (int i = 0; i < 4; ++i) {
        sA[i]->w = resWA[i];
        sB[i]->w = resWB[i];
        sC[i]->w = resWC[i];
        sD[i]->w = resWD[i];
        joints[i]->impulse += resL[i];
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->solveFast();
#endif
}

Vec2 GearJoint::getReactionForce(float inv_dt) const { return Vec2(0, 0); }
float GearJoint::getReactionTorque(float inv_dt) const { return impulse * inv_dt; }
void GearJoint::setRatio(float r) { ratio = r; joint1->bodyB->forceWakeUp(); joint2->bodyB->forceWakeUp(); }
float GearJoint::getRatio() const { return ratio; }
bool GearJoint::isConnectedTo(Body* body) const {
    return joint1->bodyA == body || joint1->bodyB == body || joint2->bodyA == body || joint2->bodyB == body;
}

void GearJoint::solvePosition() {
    Body* bodyA = joint1->bodyA;
    Body* bodyB = joint1->bodyB;
    Body* bodyC = joint2->bodyA;
    Body* bodyD = joint2->bodyB;

    float thetaA = bodyA->getRotation();
    float thetaB = bodyB->getRotation();
    float thetaC = bodyC->getRotation();
    float thetaD = bodyD->getRotation();

    float C = ratio * (thetaB - thetaA) + (thetaD - thetaC);
    if (std::abs(C) < PENETRATION_SLOP) {
        return;
    }

    const float maxOmega = MAX_POSITION_CORRECTION / std::max(_dt, 1e-6f);
    if (std::abs(bodyD->getAngularVelocity()) > maxOmega && std::abs(C) < 0.25f) {
        return;
    }

    float correction = C * BAUMGARTE_FACTOR;
    if (std::abs(correction) > MAX_POSITION_CORRECTION) {
        correction = (correction > 0.0f) ? MAX_POSITION_CORRECTION : -MAX_POSITION_CORRECTION;
    }

    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();
    float iIC = bodyC->getInverseInertia();
    float iID = bodyD->getInverseInertia();
    float k = ratio * ratio * (iIA + iIB) + (iIC + iID);
    if (k < 1e-6f) {
        return;
    }

    float lambda = -correction / k;
    if (iIA > 0.0f) {
        int bIdx = bodyA->worldIndex;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] =
            thetaA - ratio * lambda * iIA;
    }
    if (iIB > 0.0f) {
        int bIdx = bodyB->worldIndex;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] =
            thetaB + ratio * lambda * iIB;
    }
    if (iIC > 0.0f) {
        int bIdx = bodyC->worldIndex;
        bodyC->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] =
            thetaC - lambda * iIC;
    }
    if (iID > 0.0f) {
        int bIdx = bodyD->worldIndex;
        bodyD->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] =
            thetaD + lambda * iID;
    }
}
