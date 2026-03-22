#include "spring-joint.h"
#include "body.h"
#include "world.h"
#include "simd-math.h"
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

void SpringJoint::preSolveSIMD(SpringJoint** joints, float dt) {
#ifdef __EMSCRIPTEN__
    v128_t dt_v = v128_splat_f32(dt);
    v128_t zero_v = v128_splat_f32(0.0f);
    v128_t one_v = v128_splat_f32(1.0f);
    v128_t threshold_v = v128_splat_f32(1e-4f);
    v128_t pi2_v = v128_splat_f32(2.0f * M_PI);

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

    v128_t pAx = gather_body_fdata(idxA, BODY_FDATA_X);
    v128_t pAy = gather_body_fdata(idxA, BODY_FDATA_Y);
    v128_t thetaA = gather_body_fdata(idxA, BODY_FDATA_R);
    v128_t pBx = gather_body_fdata(idxB, BODY_FDATA_X);
    v128_t pBy = gather_body_fdata(idxB, BODY_FDATA_Y);
    v128_t thetaB = gather_body_fdata(idxB, BODY_FDATA_R);

    v128_t localAnchorAx = v128_make_f32(joints[0]->localAnchorA.x, joints[1]->localAnchorA.x, joints[2]->localAnchorA.x, joints[3]->localAnchorA.x);
    v128_t localAnchorAy = v128_make_f32(joints[0]->localAnchorA.y, joints[1]->localAnchorA.y, joints[2]->localAnchorA.y, joints[3]->localAnchorA.y);
    v128_t localAnchorBx = v128_make_f32(joints[0]->localAnchorB.x, joints[1]->localAnchorB.x, joints[2]->localAnchorB.x, joints[3]->localAnchorB.x);
    v128_t localAnchorBy = v128_make_f32(joints[0]->localAnchorB.y, joints[1]->localAnchorB.y, joints[2]->localAnchorB.y, joints[3]->localAnchorB.y);

    v128_t cosA = wasm_f32x4_cos(thetaA);
    v128_t sinA = wasm_f32x4_sin(thetaA);
    v128_t cosB = wasm_f32x4_cos(thetaB);
    v128_t sinB = wasm_f32x4_sin(thetaB);

    v128_t rAx = v128_rotate_x_f32(localAnchorAx, localAnchorAy, cosA, sinA);
    v128_t rAy = v128_rotate_y_f32(localAnchorAx, localAnchorAy, cosA, sinA);
    v128_t rBx = v128_rotate_x_f32(localAnchorBx, localAnchorBy, cosB, sinB);
    v128_t rBy = v128_rotate_y_f32(localAnchorBx, localAnchorBy, cosB, sinB);

    v128_t dx = v128_sub_f32(v128_add_f32(pBx, rBx), v128_add_f32(pAx, rAx));
    v128_t dy = v128_sub_f32(v128_add_f32(pBy, rBy), v128_add_f32(pAy, rAy));
    v128_t dMag = v128_mag_f32(dx, dy);

    v128_t hasLastNormal = v128_make_f32(joints[0]->hasLastNormal ? -1.0f : 0.0f, joints[1]->hasLastNormal ? -1.0f : 0.0f, joints[2]->hasLastNormal ? -1.0f : 0.0f, joints[3]->hasLastNormal ? -1.0f : 0.0f);
    v128_t lastNormalX = v128_make_f32(joints[0]->lastNormal.x, joints[1]->lastNormal.x, joints[2]->lastNormal.x, joints[3]->lastNormal.x);
    v128_t lastNormalY = v128_make_f32(joints[0]->lastNormal.y, joints[1]->lastNormal.y, joints[2]->lastNormal.y, joints[3]->lastNormal.y);

    v128_t normalX, normalY;
    v128_t useD = v128_gt_f32(dMag, threshold_v);
    
    v128_t invDMag = v128_div_f32(one_v, dMag);
    v128_t normDX = v128_mul_f32(dx, invDMag);
    v128_t normDY = v128_mul_f32(dy, invDMag);

    v128_t defaultNormalX = v128_select(hasLastNormal, lastNormalX, zero_v);
    v128_t defaultNormalY = v128_select(hasLastNormal, lastNormalY, one_v);

    normalX = v128_select(useD, normDX, defaultNormalX);
    normalY = v128_select(useD, normDY, defaultNormalY);

    v128_t impulse = v128_make_f32(joints[0]->impulse, joints[1]->impulse, joints[2]->impulse, joints[3]->impulse);
    v128_t dotLastNorm = v128_dot_f32(lastNormalX, lastNormalY, normalX, normalY);
    impulse = v128_select(hasLastNormal, v128_mul_f32(impulse, dotLastNorm), impulse);

    // Mass calculation
    v128_t imA = gather_body_fdata(idxA, BODY_FDATA_IM);
    v128_t imB = gather_body_fdata(idxB, BODY_FDATA_IM);
    v128_t iIA = gather_body_fdata(idxA, BODY_FDATA_INV_INERTIA);
    v128_t iIB = gather_body_fdata(idxB, BODY_FDATA_INV_INERTIA);

    v128_t rnA = v128_cross_f32(rAx, rAy, normalX, normalY);
    v128_t rnB = v128_cross_f32(rBx, rBy, normalX, normalY);
    v128_t k = v128_add_f32(v128_add_f32(imA, imB), v128_add_f32(v128_mul_f32(v128_mul_f32(iIA, rnA), rnA), v128_mul_f32(v128_mul_f32(iIB, rnB), rnB)));

    // Spring logic
    v128_t frequencyHz = v128_make_f32(joints[0]->frequencyHz, joints[1]->frequencyHz, joints[2]->frequencyHz, joints[3]->frequencyHz);
    v128_t dampingRatio = v128_make_f32(joints[0]->dampingRatio, joints[1]->dampingRatio, joints[2]->dampingRatio, joints[3]->dampingRatio);
    v128_t length = v128_make_f32(joints[0]->length, joints[1]->length, joints[2]->length, joints[3]->length);

    v128_t isSpring = v128_gt_f32(frequencyHz, zero_v);
    v128_t omega = v128_mul_f32(pi2_v, frequencyHz);
    v128_t invK = v128_select(v128_gt_f32(k, zero_v), v128_div_f32(one_v, k), zero_v);
    
    v128_t d_coeff = v128_mul_f32(v128_mul_f32(v128_splat_f32(2.0f), invK), v128_mul_f32(dampingRatio, omega));
    v128_t k_coeff = v128_mul_f32(invK, v128_mul_f32(omega, omega));
    
    v128_t gamma = v128_mul_f32(dt_v, v128_add_f32(d_coeff, v128_mul_f32(dt_v, k_coeff)));
    gamma = v128_select(v128_gt_f32(gamma, zero_v), v128_div_f32(one_v, gamma), zero_v);
    
    v128_t bias = v128_mul_f32(v128_sub_f32(dMag, length), v128_mul_f32(dt_v, v128_mul_f32(k_coeff, gamma)));
    v128_t mass_spring = v128_add_f32(k, gamma);
    mass_spring = v128_select(v128_gt_f32(mass_spring, zero_v), v128_div_f32(one_v, mass_spring), zero_v);

    v128_t mass_scalar = v128_select(v128_gt_f32(k, zero_v), v128_div_f32(one_v, k), zero_v);

    v128_t final_gamma = v128_select(isSpring, gamma, zero_v);
    v128_t final_bias = v128_select(isSpring, bias, zero_v);
    v128_t final_mass = v128_select(isSpring, mass_spring, mass_scalar);

    // Store back results
    float resNormalX[4], resNormalY[4], resImpulse[4], resMass[4], resBias[4], resGamma[4], resRAx[4], resRAy[4], resRBx[4], resRBy[4];
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
        joints[i]->bias = resBias[i];
        joints[i]->gamma = resGamma[i];
        joints[i]->rA = Vec2(resRAx[i], resRAy[i]);
        joints[i]->rB = Vec2(resRBx[i], resRBy[i]);
        joints[i]->lastNormal = joints[i]->normal;
        joints[i]->hasLastNormal = true;

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
