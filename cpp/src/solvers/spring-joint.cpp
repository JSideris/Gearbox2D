#include "spring-joint.h"
#include "body.h"
#include "world.h"
#include "constants.h"
#include "simd-math.h"
#include <algorithm>
#include <cmath>

namespace {

float krbRestingPositionScale(float relativeVn, float forceVn, float expectedDisplacement, float dt) {
	if (expectedDisplacement <= 1e-8f || dt <= 0.0f) {
		return 1.0f;
	}
	const float accVn = forceVn / dt;
	const float vImpactSq = relativeVn * relativeVn;
	if (vImpactSq <= 1e-8f || accVn >= 0.0f) {
		return 0.0f;
	}
	const float dhAfford = vImpactSq / (-2.0f * accVn);
	return std::min(1.0f, dhAfford / expectedDisplacement);
}

// Frozen stretch after sleep() zeros velocity. Soft-spring bias is a velocity
// Baumgarte term; at rest it would dump |d-L| into KE. Same bounce identity
// as overlapping non-bounce contacts. Window covers 20 observe steps and
// expires during a 120-step hold so landing suspension still works.
float springWakeBiasScale(Body* a, Body* b, const Vec2& rA, const Vec2& rB, const Vec2& normal, float stretch, float dt) {
#ifndef GEARBOX_DISABLE_KRB
	if (!a || !b || dt <= 0.0f) {
		return 1.0f;
	}
	const float age = std::min(a->timeSinceWake, b->timeSinceWake);
	if (age >= 25.0f * dt || (!a->sleptOnSupport && !b->sleptOnSupport)) {
		return 1.0f;
	}
	const float expectedDisplacement = std::abs(stretch);
	if (expectedDisplacement <= 1e-8f) {
		return 1.0f;
	}
	const float forceVn = (b->getForceVelocity() - a->getForceVelocity()).dot(normal);
	const Vec2 tvA(-a->getAngularVelocity() * rA.y, a->getAngularVelocity() * rA.x);
	const Vec2 tvB(-b->getAngularVelocity() * rB.y, b->getAngularVelocity() * rB.x);
	const Vec2 relVel = (b->getVelocity() + tvB) - (a->getVelocity() + tvA);
	const float relativeVn = relVel.dot(normal) - forceVn;
	return krbRestingPositionScale(relativeVn, forceVn, expectedDisplacement, dt);
#else
	(void)a;
	(void)b;
	(void)rA;
	(void)rB;
	(void)normal;
	(void)stretch;
	(void)dt;
	return 1.0f;
#endif
}

bool skipSpringSolveOnSupportedWake(Body* a, Body* b, float stretch, float dt) {
	if (!a || !b || dt <= 0.0f) {
		return false;
	}
	const float age = std::min(a->timeSinceWake, b->timeSinceWake);
	if (age >= 25.0f * dt || (!a->sleptOnSupport && !b->sleptOnSupport)) {
		return false;
	}
	if (a->getInverseMass() > 0.0f && b->getInverseMass() > 0.0f) {
		return true;
	}
	return std::abs(stretch) < PENETRATION_SLOP;
}

} // namespace

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
        const float maxBias = MAX_POSITION_CORRECTION / std::max(dt, 1e-6f);
        if (std::abs(bias) > maxBias) {
            bias = (bias > 0.0f) ? maxBias : -maxBias;
        }
        mass = k + gamma;
        mass = (mass > 0.0f) ? 1.0f / mass : 0.0f;
        bias *= springWakeBiasScale(bodyA, bodyB, rA, rB, normal, dMag - length, dt);
    } else {
        gamma = 0.0f;
        bias = 0.0f;
        mass = (k > 0.0f) ? 1.0f / k : 0.0f;
    }
    const float stretch = dMag - length;
    if (!skipSpringSolveOnSupportedWake(bodyA, bodyB, stretch, dt)) {
        Vec2 p = normal * impulse;
        bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA);
        bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA);
        bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB);
        bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB);
    }
}

void SpringJoint::preSolveSIMD(SpringJoint** joints, float dt) {
#if HWY_TARGET != HWY_SCALAR
    V128 dt_v = v128_splat_f32(dt);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 threshold_v = v128_splat_f32(1e-4f);
    V128 pi2_v = v128_splat_f32(2.0f * M_PI);

    // Gather indices and body data
    int idxA[4], idxB[4];
    for (int i = 0; i < 4; ++i) {
        idxA[i] = joints[i]->bodyA->worldIndex;
        idxB[i] = joints[i]->bodyB->worldIndex;
        joints[i]->_dt = dt;
    }

    World& world = joints[0]->bodyA->world;
    float* fdata = world.liveBodyFloatData.data();

    auto gather_body_fdata = [&](int* indices, int offset) {
        return v128_make_f32(
            fdata[GET_BODY_FDATA_INDEX(indices[0], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[1], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[2], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[3], offset)]
        );
    };

    V128 pAx = gather_body_fdata(idxA, BODY_FDATA_X);
    V128 pAy = gather_body_fdata(idxA, BODY_FDATA_Y);
    V128 thetaA = gather_body_fdata(idxA, BODY_FDATA_R);
    V128 pBx = gather_body_fdata(idxB, BODY_FDATA_X);
    V128 pBy = gather_body_fdata(idxB, BODY_FDATA_Y);
    V128 thetaB = gather_body_fdata(idxB, BODY_FDATA_R);

    V128 localAnchorAx = v128_make_f32(joints[0]->localAnchorA.x, joints[1]->localAnchorA.x, joints[2]->localAnchorA.x, joints[3]->localAnchorA.x);
    V128 localAnchorAy = v128_make_f32(joints[0]->localAnchorA.y, joints[1]->localAnchorA.y, joints[2]->localAnchorA.y, joints[3]->localAnchorA.y);
    V128 localAnchorBx = v128_make_f32(joints[0]->localAnchorB.x, joints[1]->localAnchorB.x, joints[2]->localAnchorB.x, joints[3]->localAnchorB.x);
    V128 localAnchorBy = v128_make_f32(joints[0]->localAnchorB.y, joints[1]->localAnchorB.y, joints[2]->localAnchorB.y, joints[3]->localAnchorB.y);

    V128 cosA = v128_cos_f32(thetaA);
    V128 sinA = v128_sin_f32(thetaA);
    V128 cosB = v128_cos_f32(thetaB);
    V128 sinB = v128_sin_f32(thetaB);

    V128 rAx = v128_rotate_x_f32(localAnchorAx, localAnchorAy, cosA, sinA);
    V128 rAy = v128_rotate_y_f32(localAnchorAx, localAnchorAy, cosA, sinA);
    V128 rBx = v128_rotate_x_f32(localAnchorBx, localAnchorBy, cosB, sinB);
    V128 rBy = v128_rotate_y_f32(localAnchorBx, localAnchorBy, cosB, sinB);

    V128 dx = v128_sub_f32(v128_add_f32(pBx, rBx), v128_add_f32(pAx, rAx));
    V128 dy = v128_sub_f32(v128_add_f32(pBy, rBy), v128_add_f32(pAy, rAy));
    V128 dMag = v128_mag_f32(dx, dy);

    V128 hasLastNormal = v128_make_mask_f32(joints[0]->hasLastNormal, joints[1]->hasLastNormal, joints[2]->hasLastNormal, joints[3]->hasLastNormal);
    V128 lastNormalX = v128_make_f32(joints[0]->lastNormal.x, joints[1]->lastNormal.x, joints[2]->lastNormal.x, joints[3]->lastNormal.x);
    V128 lastNormalY = v128_make_f32(joints[0]->lastNormal.y, joints[1]->lastNormal.y, joints[2]->lastNormal.y, joints[3]->lastNormal.y);

    V128 normalX, normalY;
    V128 useD = v128_gt_f32(dMag, threshold_v);
    
    V128 invDMag = v128_div_f32(one_v, dMag);
    V128 normDX = v128_mul_f32(dx, invDMag);
    V128 normDY = v128_mul_f32(dy, invDMag);

    V128 defaultNormalX = v128_select(hasLastNormal, lastNormalX, zero_v);
    V128 defaultNormalY = v128_select(hasLastNormal, lastNormalY, one_v);

    normalX = v128_select(useD, normDX, defaultNormalX);
    normalY = v128_select(useD, normDY, defaultNormalY);

    V128 impulse = v128_make_f32(joints[0]->impulse, joints[1]->impulse, joints[2]->impulse, joints[3]->impulse);
    V128 dotLastNorm = v128_dot_f32(lastNormalX, lastNormalY, normalX, normalY);
    impulse = v128_select(hasLastNormal, v128_mul_f32(impulse, dotLastNorm), impulse);

    // Mass calculation
    V128 imA = gather_body_fdata(idxA, BODY_FDATA_IM);
    V128 imB = gather_body_fdata(idxB, BODY_FDATA_IM);
    V128 iIA = gather_body_fdata(idxA, BODY_FDATA_INV_INERTIA);
    V128 iIB = gather_body_fdata(idxB, BODY_FDATA_INV_INERTIA);

    V128 rnA = v128_cross_f32(rAx, rAy, normalX, normalY);
    V128 rnB = v128_cross_f32(rBx, rBy, normalX, normalY);
    V128 k = v128_add_f32(v128_add_f32(imA, imB), v128_add_f32(v128_mul_f32(v128_mul_f32(iIA, rnA), rnA), v128_mul_f32(v128_mul_f32(iIB, rnB), rnB)));

    // Spring logic
    V128 frequencyHz = v128_make_f32(joints[0]->frequencyHz, joints[1]->frequencyHz, joints[2]->frequencyHz, joints[3]->frequencyHz);
    V128 dampingRatio = v128_make_f32(joints[0]->dampingRatio, joints[1]->dampingRatio, joints[2]->dampingRatio, joints[3]->dampingRatio);
    V128 length = v128_make_f32(joints[0]->length, joints[1]->length, joints[2]->length, joints[3]->length);

    V128 isSpring = v128_gt_f32(frequencyHz, zero_v);
    V128 omega = v128_mul_f32(pi2_v, frequencyHz);
    V128 invK = v128_select(v128_gt_f32(k, zero_v), v128_div_f32(one_v, k), zero_v);
    
    V128 d_coeff = v128_mul_f32(v128_mul_f32(v128_splat_f32(2.0f), invK), v128_mul_f32(dampingRatio, omega));
    V128 k_coeff = v128_mul_f32(invK, v128_mul_f32(omega, omega));
    
    V128 gamma = v128_mul_f32(dt_v, v128_add_f32(d_coeff, v128_mul_f32(dt_v, k_coeff)));
    gamma = v128_select(v128_gt_f32(gamma, zero_v), v128_div_f32(one_v, gamma), zero_v);
    
    V128 bias = v128_mul_f32(v128_sub_f32(dMag, length), v128_mul_f32(dt_v, v128_mul_f32(k_coeff, gamma)));
    V128 maxBias = v128_div_f32(v128_splat_f32(MAX_POSITION_CORRECTION), dt_v);
    V128 negMaxBias = v128_mul_f32(maxBias, v128_splat_f32(-1.0f));
    bias = v128_select(isSpring, v128_min_f32(maxBias, v128_max_f32(negMaxBias, bias)), bias);
    V128 mass_spring = v128_add_f32(k, gamma);
    mass_spring = v128_select(v128_gt_f32(mass_spring, zero_v), v128_div_f32(one_v, mass_spring), zero_v);

    V128 mass_scalar = v128_select(v128_gt_f32(k, zero_v), v128_div_f32(one_v, k), zero_v);

    V128 final_gamma = v128_select(isSpring, gamma, zero_v);
    V128 final_bias = v128_select(isSpring, bias, zero_v);
    V128 final_mass = v128_select(isSpring, mass_spring, mass_scalar);

    // Store back results
    alignas(64) float resNormalX[SIMD_LANE_COUNT], resNormalY[SIMD_LANE_COUNT], resImpulse[SIMD_LANE_COUNT], resMass[SIMD_LANE_COUNT], resBias[SIMD_LANE_COUNT], resGamma[SIMD_LANE_COUNT], resRAx[SIMD_LANE_COUNT], resRAy[SIMD_LANE_COUNT], resRBx[SIMD_LANE_COUNT], resRBy[SIMD_LANE_COUNT];
    v128_store_f32(resNormalX, normalX);
    v128_store_f32(resNormalY, normalY);
    v128_store_f32(resImpulse, impulse);
    v128_store_f32(resMass, final_mass);
    v128_store_f32(resBias, final_bias);
    v128_store_f32(resGamma, final_gamma);
    v128_store_f32(resRAx, rAx);
    v128_store_f32(resRAy, rAy);
    v128_store_f32(resRBx, rBx);
    v128_store_f32(resRBy, rBy);

    for (int i = 0; i < 4; ++i) {
        joints[i]->normal = Vec2(resNormalX[i], resNormalY[i]);
        joints[i]->impulse = resImpulse[i];
        joints[i]->mass = resMass[i];
        joints[i]->rA = Vec2(resRAx[i], resRAy[i]);
        joints[i]->rB = Vec2(resRBx[i], resRBy[i]);
        const float stretch = ((joints[i]->bodyB->getPosition() + joints[i]->rB)
            - (joints[i]->bodyA->getPosition() + joints[i]->rA)).magnitude() - joints[i]->length;
        joints[i]->bias = resBias[i] * springWakeBiasScale(
            joints[i]->bodyA, joints[i]->bodyB, joints[i]->rA, joints[i]->rB,
            Vec2(resNormalX[i], resNormalY[i]), stretch, dt);
        joints[i]->gamma = resGamma[i];
        joints[i]->lastNormal = joints[i]->normal;
        joints[i]->hasLastNormal = true;

        if (skipSpringSolveOnSupportedWake(joints[i]->bodyA, joints[i]->bodyB, stretch, dt)) {
            continue;
        }

        // Apply initial impulse scalar-wise
        Vec2 p = joints[i]->normal * joints[i]->impulse;
        float imA = joints[i]->bodyA->getInverseMass();
        float imB = joints[i]->bodyB->getInverseMass();
        float iIA = joints[i]->bodyA->getInverseInertia();
        float iIB = joints[i]->bodyB->getInverseInertia();

        joints[i]->bodyA->setVelocityInternal(joints[i]->bodyA->getVelocity() - p * imA);
        joints[i]->bodyA->setAngularVelocityInternal(joints[i]->bodyA->getAngularVelocity() - joints[i]->rA.cross(p) * iIA);
        joints[i]->bodyB->setVelocityInternal(joints[i]->bodyB->getVelocity() + p * imB);
        joints[i]->bodyB->setAngularVelocityInternal(joints[i]->bodyB->getAngularVelocity() + joints[i]->rB.cross(p) * iIB);
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->preSolve(dt);
#endif
}


void SpringJoint::solve() {
    const float stretch = ((bodyB->getPosition() + rB) - (bodyA->getPosition() + rA)).magnitude() - length;
    if (skipSpringSolveOnSupportedWake(bodyA, bodyB, stretch, _dt)) {
        return;
    }
    Vec2 vA = bodyA->getVelocity(), vB = bodyB->getVelocity();
    float wA = bodyA->getAngularVelocity(), wB = bodyB->getAngularVelocity();
    Vec2 vrA(-wA * rA.y, wA * rA.x), vrB(-wB * rB.y, wB * rB.x);
    float Cdot = (vB + vrB - (vA + vrA)).dot(normal);
    float lambda;
    const float imA = bodyA->getInverseMass();
    const float imB = bodyB->getInverseMass();
    if (frequencyHz > 0.0f) {
        lambda = -mass * (Cdot + bias + gamma * impulse);
    } else {
        const float slipScale = 1.0f / (1.0f + std::abs(Cdot) * _dt);
        lambda = -mass * (Cdot + bias + gamma * impulse) * slipScale;
    }
    impulse += lambda;
    Vec2 p = normal * lambda;
    float iIA = bodyA->getInverseInertia(), iIB = bodyB->getInverseInertia();
    if (imA > 0.0f) { bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA); bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA); }
    if (imB > 0.0f) { bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB); bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB); }
}

void SpringJoint::solveFast() {
    const float stretch = ((bodyB->getPosition() + rB) - (bodyA->getPosition() + rA)).magnitude() - length;
    if (skipSpringSolveOnSupportedWake(bodyA, bodyB, stretch, _dt)) {
        return;
    }
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(normal);
    float lambda;
    if (frequencyHz > 0.0f) {
        lambda = -mass * (Cdot + bias + gamma * impulse);
    } else {
        const float slipScale = 1.0f / (1.0f + std::abs(Cdot) * _dt);
        lambda = -mass * (Cdot + bias + gamma * impulse) * slipScale;
    }
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

void SpringJoint::solveFastSIMD(SpringJoint** joints) {
#if HWY_TARGET != HWY_SCALAR
    for (int i = 0; i < 4; ++i) {
        const float stretch = ((joints[i]->bodyB->getPosition() + joints[i]->rB) -
            (joints[i]->bodyA->getPosition() + joints[i]->rA)).magnitude() - joints[i]->length;
        if (skipSpringSolveOnSupportedWake(joints[i]->bodyA, joints[i]->bodyB, stretch, joints[i]->_dt)) {
            for (int j = 0; j < 4; ++j) {
                joints[j]->solveFast();
            }
            return;
        }
    }
    // Load joint properties
    V128 mass = v128_make_f32(joints[0]->mass, joints[1]->mass, joints[2]->mass, joints[3]->mass);
    V128 bias = v128_make_f32(joints[0]->bias, joints[1]->bias, joints[2]->bias, joints[3]->bias);
    V128 gamma = v128_make_f32(joints[0]->gamma, joints[1]->gamma, joints[2]->gamma, joints[3]->gamma);
    V128 impulse = v128_make_f32(joints[0]->impulse, joints[1]->impulse, joints[2]->impulse, joints[3]->impulse);
    V128 normalX = v128_make_f32(joints[0]->normal.x, joints[1]->normal.x, joints[2]->normal.x, joints[3]->normal.x);
    V128 normalY = v128_make_f32(joints[0]->normal.y, joints[1]->normal.y, joints[2]->normal.y, joints[3]->normal.y);
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
    V128 zero_v = v128_splat_f32(0.0f);
    V128 frequencyHz = v128_make_f32(
        joints[0]->frequencyHz, joints[1]->frequencyHz,
        joints[2]->frequencyHz, joints[3]->frequencyHz);

    // Relative velocity at anchors
    V128 vrAx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wA, rAy));
    V128 vrAy = v128_mul_f32(wA, rAx);
    V128 vrBx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wB, rBy));
    V128 vrBy = v128_mul_f32(wB, rBx);

    V128 relVx = v128_sub_f32(v128_add_f32(vBx, vrBx), v128_add_f32(vAx, vrAx));
    V128 relVy = v128_sub_f32(v128_add_f32(vBy, vrBy), v128_add_f32(vAy, vrAy));

    // Cdot = relV.dot(normal)
    V128 Cdot = v128_dot_f32(relVx, relVy, normalX, normalY);
    V128 dt_v = v128_splat_f32(joints[0]->_dt);
    V128 isSpring = v128_gt_f32(frequencyHz, zero_v);
    V128 raw = v128_mul_f32(
        v128_splat_f32(-1.0f),
        v128_mul_f32(mass, v128_add_f32(v128_add_f32(Cdot, bias), v128_mul_f32(gamma, impulse))));
    V128 slipScale = v128_div_f32(
        v128_splat_f32(1.0f),
        v128_add_f32(v128_splat_f32(1.0f), v128_mul_f32(v128_abs_f32(Cdot), dt_v)));
    V128 lambda = v128_select(isSpring, raw, v128_mul_f32(raw, slipScale));

    // Apply impulse
    V128 px = v128_mul_f32(normalX, lambda);
    V128 py = v128_mul_f32(normalY, lambda);

    // sA.v -= p * imA
    vAx = v128_sub_f32(vAx, v128_mul_f32(px, imA));
    vAy = v128_sub_f32(vAy, v128_mul_f32(py, imA));
    // sA.w -= rA.cross(p) * iIA
    wA = v128_sub_f32(wA, v128_mul_f32(v128_cross_f32(rAx, rAy, px, py), iIA));

    // sB.v += p * imB
    vBx = v128_add_f32(vBx, v128_mul_f32(px, imB));
    vBy = v128_add_f32(vBy, v128_mul_f32(py, imB));
    // sB.w += rB.cross(p) * iIB
    wB = v128_add_f32(wB, v128_mul_f32(v128_cross_f32(rBx, rBy, px, py), iIB));

    // Store back results
    alignas(16) float resVAx[4], resVAy[4], resWA[4], resVBx[4], resVBy[4], resWB[4], resLambda[4];
    v128_store_f32(resVAx, vAx);
    v128_store_f32(resVAy, vAy);
    v128_store_f32(resWA, wA);
    v128_store_f32(resVBx, vBx);
    v128_store_f32(resVBy, vBy);
    v128_store_f32(resWB, wB);
    v128_store_f32(resLambda, lambda);

    for (int i = 0; i < 4; ++i) {
        sA[i]->v.x = resVAx[i];
        sA[i]->v.y = resVAy[i];
        sA[i]->w = resWA[i];
        sB[i]->v.x = resVBx[i];
        sB[i]->v.y = resVBy[i];
        sB[i]->w = resWB[i];
        joints[i]->impulse += resLambda[i];
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->solveFast();
#endif
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
	// Soft springs (frequencyHz > 0) are modeled in velocity space via bias/gamma.
	// Position correction here fights wheel–terrain contacts in resting islands.
	if (frequencyHz > 0.0f) return;

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

    if (std::abs(C) < PENETRATION_SLOP) return;

    float correction = C * BAUMGARTE_FACTOR;
    if (std::abs(correction) > MAX_POSITION_CORRECTION) {
        correction = (correction > 0) ? MAX_POSITION_CORRECTION : -MAX_POSITION_CORRECTION;
    }

    float rnA = rA_curr.cross(normal_curr);
    float rnB = rB_curr.cross(normal_curr);
    float k = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    if (k < 1e-6f) return;

    float impulse = -correction / k;
    Vec2 P = normal_curr * impulse;

    if (imA > 0.0f) {
        int bIdx = bodyA->worldIndex;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pA.x - P.x * imA;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pA.y - P.y * imA;
        bodyA->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaA - rA_curr.cross(P) * iIA;
    }
    if (imB > 0.0f) {
        int bIdx = bodyB->worldIndex;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pB.x + P.x * imB;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pB.y + P.y * imB;
        bodyB->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaB + rB_curr.cross(P) * iIB;
    }
}
