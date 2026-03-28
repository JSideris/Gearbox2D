#include "distance-joint.h"
#include "body.h"
#include "world.h"
#include "simd-math.h"
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
    
    // Kinematic Restitution Balancing (KRB) for Distance Joint
    // Component A: Force Velocity Compensation
    float forceVn = (bodyB->getForceVelocity() - bodyA->getForceVelocity()).dot(normal);
    
    // Component B: Energy Audit for the correction work
    float v_bias_ideal = BAUMGARTE_FACTOR * C / dt;
    float expectedDisplacement = v_bias_ideal * dt; 
    float accVn = forceVn / dt;
    float workTerm = 2.0f * accVn * expectedDisplacement;
    
    float v_bias_sq = v_bias_ideal * v_bias_ideal;
    if (workTerm > 0.0f) {
        float adjusted_v_bias_sq = std::max(0.0f, v_bias_sq - workTerm);
        float v_bias_actual = std::sqrt(adjusted_v_bias_sq);
        bias = (v_bias_ideal > 0 ? v_bias_actual : -v_bias_actual) - forceVn;
    } else {
        bias = v_bias_ideal - forceVn;
    }

    Vec2 p = normal * impulse;
    bodyA->setVelocityInternal(bodyA->getVelocity() - p * imA);
    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - rA.cross(p) * iIA);
    bodyB->setVelocityInternal(bodyB->getVelocity() + p * imB);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + rB.cross(p) * iIB);
}

void DistanceJoint::preSolveSIMD(DistanceJoint** joints, float dt) {
#if HWY_TARGET != HWY_SCALAR
    V128 dt_v = v128_splat_f32(dt);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 threshold_v = v128_splat_f32(1e-4f);
    V128 baumgarte_v = v128_splat_f32(BAUMGARTE_FACTOR);

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
    
    // Normal calculation
    V128 invDMag = v128_div_f32(one_v, dMag);
    V128 normDX = v128_mul_f32(dx, invDMag);
    V128 normDY = v128_mul_f32(dy, invDMag);

    V128 defaultNormalX = v128_select(hasLastNormal, lastNormalX, zero_v);
    V128 defaultNormalY = v128_select(hasLastNormal, lastNormalY, one_v);

    normalX = v128_select(useD, normDX, defaultNormalX);
    normalY = v128_select(useD, normDY, defaultNormalY);

    // Warm start impulse adjustment
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
    V128 mass = v128_select(v128_gt_f32(k, zero_v), v128_div_f32(one_v, k), zero_v);

    // KRB Bias calculation
    // Component A: Force Velocity Compensation
    V128 length = v128_make_f32(joints[0]->length, joints[1]->length, joints[2]->length, joints[3]->length);
    V128 C = v128_sub_f32(dMag, length);
    V128 v_bias_ideal = v128_div_f32(v128_mul_f32(baumgarte_v, C), dt_v);

    V128 forceVX_A = gather_body_fdata(idxA, BODY_FDATA_FORCE_VX);
    V128 forceVY_A = gather_body_fdata(idxA, BODY_FDATA_FORCE_VY);
    V128 forceVX_B = gather_body_fdata(idxB, BODY_FDATA_FORCE_VX);
    V128 forceVY_B = gather_body_fdata(idxB, BODY_FDATA_FORCE_VY);

    V128 forceVn = v128_dot_f32(v128_sub_f32(forceVX_B, forceVX_A), v128_sub_f32(forceVY_B, forceVY_A), normalX, normalY);

    // Component B: Energy Audit for the correction work
    V128 expectedDisplacement = v128_mul_f32(v_bias_ideal, dt_v);
    V128 accVn = v128_div_f32(forceVn, dt_v);
    V128 workTerm = v128_mul_f32(v128_splat_f32(2.0f), v128_mul_f32(accVn, expectedDisplacement));

    V128 v_bias_sq = v128_mul_f32(v_bias_ideal, v_bias_ideal);
    V128 workTerm_gt_zero = v128_gt_f32(workTerm, zero_v);
    
    V128 adjusted_v_bias_sq = v128_max_f32(zero_v, v128_sub_f32(v_bias_sq, workTerm));
    V128 v_bias_actual = v128_sqrt_f32(adjusted_v_bias_sq);
    
    V128 v_bias_ideal_gt_zero = v128_gt_f32(v_bias_ideal, zero_v);
    V128 v_bias_actual_signed = v128_select(v_bias_ideal_gt_zero, v_bias_actual, v128_neg_f32(v_bias_actual));
    
    V128 final_v_bias = v128_select(workTerm_gt_zero, v_bias_actual_signed, v_bias_ideal);
    
    V128 bias = v128_sub_f32(final_v_bias, forceVn);

    // Store back results
    alignas(64) float resNormalX[SIMD_LANE_COUNT], resNormalY[SIMD_LANE_COUNT], resImpulse[SIMD_LANE_COUNT], resMass[SIMD_LANE_COUNT], resBias[SIMD_LANE_COUNT], resRAx[SIMD_LANE_COUNT], resRAy[SIMD_LANE_COUNT], resRBx[SIMD_LANE_COUNT], resRBy[SIMD_LANE_COUNT];
    v128_store_f32(resNormalX, normalX);
    v128_store_f32(resNormalY, normalY);
    v128_store_f32(resImpulse, impulse);
    v128_store_f32(resMass, mass);
    v128_store_f32(resBias, bias);
    v128_store_f32(resRAx, rAx);
    v128_store_f32(resRAy, rAy);
    v128_store_f32(resRBx, rBx);
    v128_store_f32(resRBy, rBy);

    for (int i = 0; i < 4; ++i) {
        joints[i]->normal = Vec2(resNormalX[i], resNormalY[i]);
        joints[i]->impulse = resImpulse[i];
        joints[i]->mass = resMass[i];
        joints[i]->bias = resBias[i];
        joints[i]->rA = Vec2(resRAx[i], resRAy[i]);
        joints[i]->rB = Vec2(resRBx[i], resRBy[i]);
        joints[i]->lastNormal = joints[i]->normal;
        joints[i]->hasLastNormal = true;

        // Warm start
        Vec2 p = joints[i]->normal * joints[i]->impulse;
        float imA = joints[i]->bodyA->getInverseMass();
        float imB = joints[i]->bodyB->getInverseMass();
        float iIA = joints[i]->bodyA->getInverseInertia();
        float iIB = joints[i]->bodyB->getInverseInertia();

        if (imA > 0.0f) {
            joints[i]->bodyA->setVelocityInternal(joints[i]->bodyA->getVelocity() - p * imA);
            joints[i]->bodyA->setAngularVelocityInternal(joints[i]->bodyA->getAngularVelocity() - joints[i]->rA.cross(p) * iIA);
        }
        if (imB > 0.0f) {
            joints[i]->bodyB->setVelocityInternal(joints[i]->bodyB->getVelocity() + p * imB);
            joints[i]->bodyB->setAngularVelocityInternal(joints[i]->bodyB->getAngularVelocity() + joints[i]->rB.cross(p) * iIB);
        }
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->preSolve(dt);
#endif
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

void DistanceJoint::solveFastSIMD(DistanceJoint** joints) {
#if HWY_TARGET != HWY_SCALAR
    // Load joint properties
    V128 mass = v128_make_f32(joints[0]->mass, joints[1]->mass, joints[2]->mass, joints[3]->mass);
    V128 bias = v128_make_f32(joints[0]->bias, joints[1]->bias, joints[2]->bias, joints[3]->bias);
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

    // Relative velocity at anchors
    V128 vrAx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wA, rAy));
    V128 vrAy = v128_mul_f32(wA, rAx);
    V128 vrBx = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(wB, rBy));
    V128 vrBy = v128_mul_f32(wB, rBx);

    V128 relVx = v128_sub_f32(v128_add_f32(vBx, vrBx), v128_add_f32(vAx, vrAx));
    V128 relVy = v128_sub_f32(v128_add_f32(vBy, vrBy), v128_add_f32(vAy, vrAy));

    // Cdot = relV.dot(normal)
    V128 Cdot = v128_dot_f32(relVx, relVy, normalX, normalY);

    // lambda = -mass * (Cdot + bias)
    V128 lambda = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(mass, v128_add_f32(Cdot, bias)));

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
