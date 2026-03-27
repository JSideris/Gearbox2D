#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "simd-math.h"
#include <algorithm>
#include <cmath>

void ContactConstraint::preSolve(float dt, bool enableRestitution, bool enablePenetration, bool enableFriction) {
    rA = point - a->getPosition();
    rB = point - b->getPosition();
    float imA = a->getInverseMass(), imB = b->getInverseMass();
    float iIA = a->getInverseInertia(), iIB = b->getInverseInertia();
    float rnA = rA.x * normal.y - rA.y * normal.x;
    float rnB = rB.x * normal.y - rB.y * normal.x;

    float kNormal = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    normalMass = (kNormal > 0.00001f) ? 1.0f / kNormal : 0.0f;
    Vec2 tangentialVelocityA(-rA.y * a->getAngularVelocity(), rA.x * a->getAngularVelocity());
    Vec2 tangentialVelocityB(-rB.y * b->getAngularVelocity(), rB.x * b->getAngularVelocity());
    Vec2 relVel = (b->getVelocity() + tangentialVelocityB) - (a->getVelocity() + tangentialVelocityA);
    float vn = relVel.dot(normal);

    // Component A: Force Velocity Compensation
    float forceVn = (b->getForceVelocity() - a->getForceVelocity()).dot(normal);
    float relativeVn = vn - forceVn;

    float vBounce = -restitution * relativeVn;
    float expectedDisplacement = 0.0f;

    if (depth < 0.0f) {
        staticFriction = 0.0f;
        kineticFriction = 0.0f;
    }

    bool shouldBounce = enableRestitution && (relativeVn < -RESTITUTION_THRESHOLD || (depth < 0.0f && relativeVn < depth / dt));

    if (shouldBounce) {
        if (depth > 0.0f) {
            float depthAfterVelocity = std::max(0.0f, (depth - PENETRATION_SLOP) - vBounce * dt);
            int n = a->world.getPositionIterations();
            float cumulativeCorrectionFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)n);
            expectedDisplacement = std::min(depthAfterVelocity, MAX_POSITION_CORRECTION) * cumulativeCorrectionFactor;
        } else {
            expectedDisplacement = 0.0f;
        }
        
        float accVn = forceVn / dt;
        float workTerm = 2.0f * accVn * expectedDisplacement;
        float vImpactSq = relativeVn * relativeVn;
        
        float vSurfSq = vImpactSq + workTerm;
        float vFinal = restitution * std::sqrt(std::max(0.0f, vSurfSq));

        if (depth < 0.0f) {
            bias = -std::max(vFinal, depth / dt);
        } else {
            bias = -vFinal;
        }
    } else {
        if (depth < 0.0f) {
            bias = -depth / dt;
        } else {
            bias = 0.0f;
        }
    }
    
    tangent = Vec2(-normal.y, normal.x);
    float rtA = rA.x * tangent.y - rA.y * tangent.x;
    float rtB = rB.x * tangent.y - rB.y * tangent.x;
    float kTangent = imA + imB + iIA * rtA * rtA + iIB * rtB * rtB;
    tangentMass = (kTangent > 0.00001f) ? 1.0f / kTangent : 0.0f;

    if (!enableFriction) {
        staticFriction = 0.0f;
        kineticFriction = 0.0f;
    }

    float thetaA = a->getRotation();
    float cA = std::cos(-thetaA), sA = std::sin(-thetaA);
    localAnchorA = Vec2(rA.x * cA - rA.y * sA, rA.x * sA + rA.y * cA);
    localNormalA = Vec2(normal.x * cA - normal.y * sA, normal.x * sA + normal.y * cA);

    float thetaB = b->getRotation();
    float cB = std::cos(-thetaB), sB = std::sin(-thetaB);
    localAnchorB = Vec2(rB.x * cB - rB.y * sB, rB.x * sB + rB.y * cB);
}

void ContactConstraint::preSolveSIMD(ContactConstraint** batch, float dt, bool enableRestitution, bool enablePenetration, bool enableFriction) {
#if HWY_TARGET != HWY_SCALAR
    V128 dt_v = v128_splat_f32(dt);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 eps_v = v128_splat_f32(0.00001f);

    int idxA[4], idxB[4];
    for (int i = 0; i < 4; ++i) {
        idxA[i] = batch[i]->a->worldIndex;
        idxB[i] = batch[i]->b->worldIndex;
    }

    World& world = batch[0]->a->world;
    float* fdata = world.liveBodyFloatData.data();

    auto gather_body_fdata = [&](int* indices, int offset) {
        return v128_make_f32(
            fdata[GET_BODY_FDATA_INDEX(indices[0], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[1], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[2], offset)],
            fdata[GET_BODY_FDATA_INDEX(indices[3], offset)]
        );
    };

    // Body A data
    V128 pAx = gather_body_fdata(idxA, BODY_FDATA_X);
    V128 pAy = gather_body_fdata(idxA, BODY_FDATA_Y);
    V128 vAx = gather_body_fdata(idxA, BODY_FDATA_VX);
    V128 vAy = gather_body_fdata(idxA, BODY_FDATA_VY);
    V128 wA  = gather_body_fdata(idxA, BODY_FDATA_RS);
    V128 imA = gather_body_fdata(idxA, BODY_FDATA_IM);
    V128 iIA = gather_body_fdata(idxA, BODY_FDATA_INV_INERTIA);
    V128 fvAx = gather_body_fdata(idxA, BODY_FDATA_FORCE_VX);
    V128 fvAy = gather_body_fdata(idxA, BODY_FDATA_FORCE_VY);
    V128 thetaA = gather_body_fdata(idxA, BODY_FDATA_R);

    // Body B data
    V128 pBx = gather_body_fdata(idxB, BODY_FDATA_X);
    V128 pBy = gather_body_fdata(idxB, BODY_FDATA_Y);
    V128 vBx = gather_body_fdata(idxB, BODY_FDATA_VX);
    V128 vBy = gather_body_fdata(idxB, BODY_FDATA_VY);
    V128 wB  = gather_body_fdata(idxB, BODY_FDATA_RS);
    V128 imB = gather_body_fdata(idxB, BODY_FDATA_IM);
    V128 iIB = gather_body_fdata(idxB, BODY_FDATA_INV_INERTIA);
    V128 fvBx = gather_body_fdata(idxB, BODY_FDATA_FORCE_VX);
    V128 fvBy = gather_body_fdata(idxB, BODY_FDATA_FORCE_VY);
    V128 thetaB = gather_body_fdata(idxB, BODY_FDATA_R);

    // Batch data
    V128 pointX = v128_make_f32(batch[0]->point.x, batch[1]->point.x, batch[2]->point.x, batch[3]->point.x);
    V128 pointY = v128_make_f32(batch[0]->point.y, batch[1]->point.y, batch[2]->point.y, batch[3]->point.y);
    V128 normalX = v128_make_f32(batch[0]->normal.x, batch[1]->normal.x, batch[2]->normal.x, batch[3]->normal.x);
    V128 normalY = v128_make_f32(batch[0]->normal.y, batch[1]->normal.y, batch[2]->normal.y, batch[3]->normal.y);
    V128 restitution = v128_make_f32(batch[0]->restitution, batch[1]->restitution, batch[2]->restitution, batch[3]->restitution);
    V128 depth = v128_make_f32(batch[0]->depth, batch[1]->depth, batch[2]->depth, batch[3]->depth);
    V128 staticFric = v128_make_f32(batch[0]->staticFriction, batch[1]->staticFriction, batch[2]->staticFriction, batch[3]->staticFriction);
    V128 kineticFric = v128_make_f32(batch[0]->kineticFriction, batch[1]->kineticFriction, batch[2]->kineticFriction, batch[3]->kineticFriction);

    // Relative vectors rA, rB
    V128 rAx = v128_sub_f32(pointX, pAx);
    V128 rAy = v128_sub_f32(pointY, pAy);
    V128 rBx = v128_sub_f32(pointX, pBx);
    V128 rBy = v128_sub_f32(pointY, pBy);

    // Normal mass calculation
    V128 rnA = v128_sub_f32(v128_mul_f32(rAx, normalY), v128_mul_f32(rAy, normalX));
    V128 rnB = v128_sub_f32(v128_mul_f32(rBx, normalY), v128_mul_f32(rBy, normalX));
    V128 kNormal = v128_add_f32(v128_add_f32(imA, imB), 
                     v128_add_f32(v128_mul_f32(iIA, v128_mul_f32(rnA, rnA)), 
                                  v128_mul_f32(iIB, v128_mul_f32(rnB, rnB))));
    V128 normalMass = v128_select(v128_gt_f32(kNormal, eps_v), v128_div_f32(one_v, kNormal), zero_v);

    // Relative velocity
    V128 tangVelAx = v128_mul_f32(v128_neg_f32(rAy), wA);
    V128 tangVelAy = v128_mul_f32(rAx, wA);
    V128 tangVelBx = v128_mul_f32(v128_neg_f32(rBy), wB);
    V128 tangVelBy = v128_mul_f32(rBx, wB);
    V128 relVelX = v128_sub_f32(v128_add_f32(vBx, tangVelBx), v128_add_f32(vAx, tangVelAx));
    V128 relVelY = v128_sub_f32(v128_add_f32(vBy, tangVelBy), v128_add_f32(vAy, tangVelAy));
    V128 vn = v128_dot_f32(relVelX, relVelY, normalX, normalY);

    // Component A: Force Velocity Compensation
    V128 forceVn = v128_dot_f32(v128_sub_f32(fvBx, fvAx), v128_sub_f32(fvBy, fvAy), normalX, normalY);
    V128 relativeVn = v128_sub_f32(vn, forceVn);
    V128 vBounce = v128_mul_f32(v128_neg_f32(restitution), relativeVn);

    // Speculative contact masks
    V128 depth_lt_zero = v128_lt_f32(depth, zero_v);
    staticFric = v128_select(depth_lt_zero, zero_v, staticFric);
    kineticFric = v128_select(depth_lt_zero, zero_v, kineticFric);

    // Bouncing condition
    V128 enableRestitution_v = enableRestitution ? one_v : zero_v;
    V128 restThresh_v = v128_splat_f32(-RESTITUTION_THRESHOLD);
    V128 depth_over_dt = v128_div_f32(depth, dt_v);
    V128 cond1 = v128_lt_f32(relativeVn, restThresh_v);
    V128 cond2 = v128_and(depth_lt_zero, v128_lt_f32(relativeVn, depth_over_dt));
    V128 shouldBounce = v128_and(v128_ne_f32(enableRestitution_v, zero_v), v128_or(cond1, cond2));

    // Component B: Kinematic Energy Balancing
    int posIter = world.getPositionIterations();
    float posIterFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)posIter);
    V128 cumCorrFactor = v128_splat_f32(posIterFactor);
    V128 maxPosCorr = v128_splat_f32(MAX_POSITION_CORRECTION);
    V128 penSlop = v128_splat_f32(PENETRATION_SLOP);
    
    V128 depth_gt_zero = v128_gt_f32(depth, zero_v);
    V128 depthAfterVel = v128_max_f32(zero_v, v128_sub_f32(v128_sub_f32(depth, penSlop), v128_mul_f32(vBounce, dt_v)));
    V128 expectedDisp = v128_select(depth_gt_zero, v128_mul_f32(v128_min_f32(depthAfterVel, maxPosCorr), cumCorrFactor), zero_v);
    
    V128 accVn = v128_div_f32(forceVn, dt_v);
    V128 workTerm = v128_mul_f32(v128_splat_f32(2.0f), v128_mul_f32(accVn, expectedDisp));
    V128 vSurfSq = v128_add_f32(v128_mul_f32(relativeVn, relativeVn), workTerm);
    V128 vFinal = v128_mul_f32(restitution, v128_sqrt_f32(v128_max_f32(zero_v, vSurfSq)));

    // Bias calculation
    V128 bias_bounce = v128_select(depth_lt_zero, v128_neg_f32(v128_max_f32(vFinal, depth_over_dt)), v128_neg_f32(vFinal));
    V128 bias_no_bounce = v128_select(depth_lt_zero, v128_neg_f32(depth_over_dt), zero_v);
    V128 bias = v128_select(shouldBounce, bias_bounce, bias_no_bounce);

    // Tangent and tangent mass
    V128 tangentX = v128_neg_f32(normalY);
    V128 tangentY = normalX;
    V128 rtA = v128_sub_f32(v128_mul_f32(rAx, tangentY), v128_mul_f32(rAy, tangentX));
    V128 rtB = v128_sub_f32(v128_mul_f32(rBx, tangentY), v128_mul_f32(rBy, tangentX));
    V128 kTangent = v128_add_f32(v128_add_f32(imA, imB), 
                     v128_add_f32(v128_mul_f32(iIA, v128_mul_f32(rtA, rtA)), 
                                  v128_mul_f32(iIB, v128_mul_f32(rtB, rtB))));
    V128 tangentMass = v128_select(v128_gt_f32(kTangent, eps_v), v128_div_f32(one_v, kTangent), zero_v);

    if (!enableFriction) {
        staticFric = zero_v;
        kineticFric = zero_v;
    }

    // Local coordinates transformation
    V128 negThetaA = v128_neg_f32(thetaA);
    V128 cA = v128_cos_f32(negThetaA);
    V128 sA = v128_sin_f32(negThetaA);
    V128 localAnchorAx = v128_sub_f32(v128_mul_f32(rAx, cA), v128_mul_f32(rAy, sA));
    V128 localAnchorAy = v128_add_f32(v128_mul_f32(rAx, sA), v128_mul_f32(rAy, cA));
    V128 localNormalAx = v128_sub_f32(v128_mul_f32(normalX, cA), v128_mul_f32(normalY, sA));
    V128 localNormalAy = v128_add_f32(v128_mul_f32(normalX, sA), v128_mul_f32(normalY, cA));

    V128 negThetaB = v128_neg_f32(thetaB);
    V128 cB = v128_cos_f32(negThetaB);
    V128 sB = v128_sin_f32(negThetaB);
    V128 localAnchorBx = v128_sub_f32(v128_mul_f32(rBx, cB), v128_mul_f32(rBy, sB));
    V128 localAnchorBy = v128_add_f32(v128_mul_f32(rBx, sB), v128_mul_f32(rBy, cB));

    // Result buffers
    float resRAx[4], resRAy[4], resRBx[4], resRBy[4];
    float resNormalMass[4], resBias[4], resTangentX[4], resTangentY[4], resTangentMass[4];
    float resStaticFric[4], resKineticFric[4];
    float resLAx[4], resLAy[4], resLNAx[4], resLNAy[4], resLBx[4], resLBy[4];

    v128_store_f32(resRAx, rAx); v128_store_f32(resRAy, rAy);
    v128_store_f32(resRBx, rBx); v128_store_f32(resRBy, rBy);
    v128_store_f32(resNormalMass, normalMass);
    v128_store_f32(resBias, bias);
    v128_store_f32(resTangentX, tangentX); v128_store_f32(resTangentY, tangentY);
    v128_store_f32(resTangentMass, tangentMass);
    v128_store_f32(resStaticFric, staticFric);
    v128_store_f32(resKineticFric, kineticFric);
    v128_store_f32(resLAx, localAnchorAx); v128_store_f32(resLAy, localAnchorAy);
    v128_store_f32(resLNAx, localNormalAx); v128_store_f32(resLNAy, localNormalAy);
    v128_store_f32(resLBx, localAnchorBx); v128_store_f32(resLBy, localAnchorBy);

    for(int i = 0; i < 4; i++) {
        batch[i]->rA = Vec2(resRAx[i], resRAy[i]);
        batch[i]->rB = Vec2(resRBx[i], resRBy[i]);
        batch[i]->normalMass = resNormalMass[i];
        batch[i]->bias = resBias[i];
        batch[i]->tangent = Vec2(resTangentX[i], resTangentY[i]);
        batch[i]->tangentMass = resTangentMass[i];
        batch[i]->staticFriction = resStaticFric[i];
        batch[i]->kineticFriction = resKineticFric[i];
        batch[i]->localAnchorA = Vec2(resLAx[i], resLAy[i]);
        batch[i]->localNormalA = Vec2(resLNAx[i], resLNAy[i]);
        batch[i]->localAnchorB = Vec2(resLBx[i], resLBy[i]);
    }
#else
    for (int i = 0; i < 4; ++i) {
        batch[i]->preSolve(dt, enableRestitution, enablePenetration, enableFriction);
    }
#endif
}

void ContactConstraint::solveFastSIMD(ContactConstraint** batch) {
#if HWY_TARGET != HWY_SCALAR
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 neg_one_v = v128_splat_f32(-1.0f);

    SolverData* sA[4];
    SolverData* sB[4];
    for (int i = 0; i < 4; ++i) {
        sA[i] = static_cast<SolverData*>(batch[i]->context.a);
        sB[i] = static_cast<SolverData*>(batch[i]->context.b);
    }

    // Gather constraint data
    V128 rAx = v128_make_f32(batch[0]->rA.x, batch[1]->rA.x, batch[2]->rA.x, batch[3]->rA.x);
    V128 rAy = v128_make_f32(batch[0]->rA.y, batch[1]->rA.y, batch[2]->rA.y, batch[3]->rA.y);
    V128 rBx = v128_make_f32(batch[0]->rB.x, batch[1]->rB.x, batch[2]->rB.x, batch[3]->rB.x);
    V128 rBy = v128_make_f32(batch[0]->rB.y, batch[1]->rB.y, batch[2]->rB.y, batch[3]->rB.y);
    V128 normalX = v128_make_f32(batch[0]->normal.x, batch[1]->normal.x, batch[2]->normal.x, batch[3]->normal.x);
    V128 normalY = v128_make_f32(batch[0]->normal.y, batch[1]->normal.y, batch[2]->normal.y, batch[3]->normal.y);
    V128 nMass = v128_make_f32(batch[0]->normalMass, batch[1]->normalMass, batch[2]->normalMass, batch[3]->normalMass);
    V128 bias = v128_make_f32(batch[0]->bias, batch[1]->bias, batch[2]->bias, batch[3]->bias);
    V128 normalImpulse = v128_make_f32(batch[0]->normalImpulse, batch[1]->normalImpulse, batch[2]->normalImpulse, batch[3]->normalImpulse);

    // Gather body data
    V128 vAx = v128_make_f32(sA[0]->v.x, sA[1]->v.x, sA[2]->v.x, sA[3]->v.x);
    V128 vAy = v128_make_f32(sA[0]->v.y, sA[1]->v.y, sA[2]->v.y, sA[3]->v.y);
    V128 wA  = v128_make_f32(sA[0]->w,   sA[1]->w,   sA[2]->w,   sA[3]->w);
    V128 imA = v128_make_f32(sA[0]->im,  sA[1]->im,  sA[2]->im,  sA[3]->im);
    V128 iIA = v128_make_f32(sA[0]->iI,  sA[1]->iI,  sA[2]->iI,  sA[3]->iI);

    V128 vBx = v128_make_f32(sB[0]->v.x, sB[1]->v.x, sB[2]->v.x, sB[3]->v.x);
    V128 vBy = v128_make_f32(sB[0]->v.y, sB[1]->v.y, sB[2]->v.y, sB[3]->v.y);
    V128 wB  = v128_make_f32(sB[0]->w,   sB[1]->w,   sB[2]->w,   sB[3]->w);
    V128 imB = v128_make_f32(sB[0]->im,  sB[1]->im,  sB[2]->im,  sB[3]->im);
    V128 iIB = v128_make_f32(sB[0]->iI,  sB[1]->iI,  sB[2]->iI,  sB[3]->iI);

    // Normal constraint
    V128 vrAx = v128_mul_f32(neg_one_v, v128_mul_f32(wA, rAy));
    V128 vrAy = v128_mul_f32(wA, rAx);
    V128 vrBx = v128_mul_f32(neg_one_v, v128_mul_f32(wB, rBy));
    V128 vrBy = v128_mul_f32(wB, rBx);

    V128 relVelX = v128_sub_f32(v128_add_f32(vBx, vrBx), v128_add_f32(vAx, vrAx));
    V128 relVelY = v128_sub_f32(v128_add_f32(vBy, vrBy), v128_add_f32(vAy, vrAy));
    
    V128 vn = v128_dot_f32(relVelX, relVelY, normalX, normalY);
    V128 dLambda = v128_mul_f32(v128_neg_f32(v128_add_f32(vn, bias)), nMass);
    
    V128 oldImpulse = normalImpulse;
    normalImpulse = v128_max_f32(v128_add_f32(oldImpulse, dLambda), zero_v);
    dLambda = v128_sub_f32(normalImpulse, oldImpulse);
    
    V128 impulseX = v128_mul_f32(normalX, dLambda);
    V128 impulseY = v128_mul_f32(normalY, dLambda);

    // Apply normal impulse
    V128 torqueA = v128_cross_f32(rAx, rAy, impulseX, impulseY);
    vAx = v128_sub_f32(vAx, v128_mul_f32(impulseX, imA));
    vAy = v128_sub_f32(vAy, v128_mul_f32(impulseY, imA));
    wA = v128_sub_f32(wA, v128_mul_f32(torqueA, iIA));

    V128 torqueB = v128_cross_f32(rBx, rBy, impulseX, impulseY);
    vBx = v128_add_f32(vBx, v128_mul_f32(impulseX, imB));
    vBy = v128_add_f32(vBy, v128_mul_f32(impulseY, imB));
    wB = v128_add_f32(wB, v128_mul_f32(torqueB, iIB));

    // Friction constraint
    V128 staticFric = v128_make_f32(batch[0]->staticFriction, batch[1]->staticFriction, batch[2]->staticFriction, batch[3]->staticFriction);
    if (v128_any_true(v128_gt_f32(staticFric, zero_v))) {
        V128 kineticFric = v128_make_f32(batch[0]->kineticFriction, batch[1]->kineticFriction, batch[2]->kineticFriction, batch[3]->kineticFriction);
        V128 tangentX = v128_make_f32(batch[0]->tangent.x, batch[1]->tangent.x, batch[2]->tangent.x, batch[3]->tangent.x);
        V128 tangentY = v128_make_f32(batch[0]->tangent.y, batch[1]->tangent.y, batch[2]->tangent.y, batch[3]->tangent.y);
        V128 tMass = v128_make_f32(batch[0]->tangentMass, batch[1]->tangentMass, batch[2]->tangentMass, batch[3]->tangentMass);
        V128 frictionImpulse = v128_make_f32(batch[0]->frictionImpulse, batch[1]->frictionImpulse, batch[2]->frictionImpulse, batch[3]->frictionImpulse);

        V128 vrAx_f = v128_mul_f32(neg_one_v, v128_mul_f32(wA, rAy));
        V128 vrAy_f = v128_mul_f32(wA, rAx);
        V128 vrBx_f = v128_mul_f32(neg_one_v, v128_mul_f32(wB, rBy));
        V128 vrBy_f = v128_mul_f32(wB, rBx);
        V128 relVelX_f = v128_sub_f32(v128_add_f32(vBx, vrBx_f), v128_add_f32(vAx, vrAx_f));
        V128 relVelY_f = v128_sub_f32(v128_add_f32(vBy, vrBy_f), v128_add_f32(vAy, vrAy_f));
        
        V128 vt = v128_dot_f32(relVelX_f, relVelY_f, tangentX, tangentY);
        V128 dLambdaT = v128_mul_f32(v128_neg_f32(vt), tMass);

        V128 maxStaticFric = v128_mul_f32(staticFric, normalImpulse);
        V128 maxKineticFric = v128_mul_f32(kineticFric, normalImpulse);
        V128 oldImpulseT = frictionImpulse;
        V128 newImpulseT = v128_add_f32(oldImpulseT, dLambdaT);
        
        V128 overMax = v128_gt_f32(v128_abs_f32(newImpulseT), maxStaticFric);
        frictionImpulse = v128_select(overMax, v128_max_f32(v128_neg_f32(maxKineticFric), v128_min_f32(maxKineticFric, newImpulseT)), newImpulseT);
        
        // Zero out friction impulse for lanes where staticFriction is 0
        frictionImpulse = v128_select(v128_gt_f32(staticFric, zero_v), frictionImpulse, zero_v);

        dLambdaT = v128_sub_f32(frictionImpulse, oldImpulseT);
        V128 fImpulseX = v128_mul_f32(tangentX, dLambdaT);
        V128 fImpulseY = v128_mul_f32(tangentY, dLambdaT);

        // Apply friction impulse
        vAx = v128_sub_f32(vAx, v128_mul_f32(fImpulseX, imA));
        vAy = v128_sub_f32(vAy, v128_mul_f32(fImpulseY, imA));
        wA = v128_sub_f32(wA, v128_mul_f32(v128_cross_f32(rAx, rAy, fImpulseX, fImpulseY), iIA));

        vBx = v128_add_f32(vBx, v128_mul_f32(fImpulseX, imB));
        vBy = v128_add_f32(vBy, v128_mul_f32(fImpulseY, imB));
        wB = v128_add_f32(wB, v128_mul_f32(v128_cross_f32(rBx, rBy, fImpulseX, fImpulseY), iIB));

        // Store back friction impulses to constraints
        alignas(16) float resImpulseT[4];
        v128_store_f32(resImpulseT, frictionImpulse);
        for (int i = 0; i < 4; ++i) batch[i]->frictionImpulse = resImpulseT[i];
    }

    // Store back updated dynamic data
    alignas(16) float resVAx[4], resVAy[4], resWA[4], resVBx[4], resVBy[4], resWB[4], resImpulseN[4];
    v128_store_f32(resVAx, vAx); v128_store_f32(resVAy, vAy); v128_store_f32(resWA, wA);
    v128_store_f32(resVBx, vBx); v128_store_f32(resVBy, vBy); v128_store_f32(resWB, wB);
    v128_store_f32(resImpulseN, normalImpulse);

    for (int i = 0; i < 4; ++i) {
        sA[i]->v.x = resVAx[i]; sA[i]->v.y = resVAy[i]; sA[i]->w = resWA[i];
        sB[i]->v.x = resVBx[i]; sB[i]->v.y = resVBy[i]; sB[i]->w = resWB[i];
        batch[i]->normalImpulse = resImpulseN[i];
    }
#else
    for (int i = 0; i < 4; ++i) batch[i]->solveFast();
#endif
}

void ContactConstraint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);

    // Normal constraint
    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    Vec2 relVel = (sB.v + vrB) - (sA.v + vrA);
    
    float vn = relVel.dot(normal);
    float dLambda = -(vn + bias) * normalMass;
    
    float oldImpulse = normalImpulse;
    normalImpulse = std::max(oldImpulse + dLambda, 0.0f);
    dLambda = normalImpulse - oldImpulse;
    
    Vec2 impulse = normal * dLambda;
    if (sA.im > 0) {
        float torqueA = rA.cross(impulse);
        sA.v.x -= impulse.x * sA.im;
        sA.v.y -= impulse.y * sA.im;
        sA.w -= torqueA * sA.iI;
    }
    if (sB.im > 0) {
        sB.v.x += impulse.x * sB.im;
        sB.v.y += impulse.y * sB.im;
        sB.w += rB.cross(impulse) * sB.iI;
    }

    // Friction constraint
    if (staticFriction > 0.0f) {
        Vec2 vrA_new(-sA.w * rA.y, sA.w * rA.x);
        Vec2 vrB_new(-sB.w * rB.y, sB.w * rB.x);
        Vec2 relVel_new = (sB.v + vrB_new) - (sA.v + vrA_new);
        float vt = relVel_new.dot(tangent);
        float dLambdaT = -vt * tangentMass;

        float maxStaticFriction = staticFriction * normalImpulse;
        float maxKineticFriction = kineticFriction * normalImpulse;
        float oldImpulseT = frictionImpulse;
        float newImpulseT = oldImpulseT + dLambdaT;
        
        if (std::abs(newImpulseT) > maxStaticFriction) frictionImpulse = std::max(-maxKineticFriction, std::min(maxKineticFriction, newImpulseT));
        else frictionImpulse = newImpulseT;
        
        dLambdaT = frictionImpulse - oldImpulseT;
        Vec2 fImpulse = tangent * dLambdaT;
        if (sA.im > 0) {
            sA.v.x -= fImpulse.x * sA.im;
            sA.v.y -= fImpulse.y * sA.im;
            sA.w -= rA.cross(fImpulse) * sA.iI;
        }
        if (sB.im > 0) {
            sB.v.x += fImpulse.x * sB.im;
            sB.v.y += fImpulse.y * sB.im;
            sB.w += rB.cross(fImpulse) * sB.iI;
        }
    }
}

void ContactConstraint::solve(bool enableNormal, bool enableFriction) {
    float imA = a->getInverseMass(), imB = b->getInverseMass();
    float iIA = a->getInverseInertia(), iIB = b->getInverseInertia();
    Vec2 vA = a->getVelocity(), vB = b->getVelocity();
    float wA = a->getAngularVelocity(), wB = b->getAngularVelocity();
    Vec2 vrA(-wA * rA.y, wA * rA.x), vrB(-wB * rB.y, wB * rB.x);
    Vec2 relVel = (vB + vrB) - (vA + vrA);
    if (enableNormal) {
        float vn = relVel.dot(normal);
        float dLambda = -(vn + bias) * normalMass;
        if (std::isfinite(dLambda)) {
            float old = normalImpulse; normalImpulse = std::max(old + dLambda, 0.0f); dLambda = normalImpulse - old;
            Vec2 impulse = normal * dLambda;
            if (imA > 0) { a->setVelocityInternal(a->getVelocity() - impulse * imA); a->setAngularVelocityInternal(a->getAngularVelocity() - rA.cross(impulse) * iIA); }
            if (imB > 0) { b->setVelocityInternal(b->getVelocity() + impulse * imB); b->setAngularVelocityInternal(b->getAngularVelocity() + rB.cross(impulse) * iIB); }
        }
    }

    if (enableFriction && staticFriction > 0.0f) {
        Vec2 vA_new = a->getVelocity(), vB_new = b->getVelocity();
        float wA_new = a->getAngularVelocity(), wB_new = b->getAngularVelocity();
        Vec2 vrA_new(-wA_new * rA.y, wA_new * rA.x), vrB_new(-wB_new * rB.y, wB_new * rB.x);
        Vec2 relVel_new = (vB_new + vrB_new) - (vA_new + vrA_new);
        float vt = relVel_new.dot(tangent);
        float dLambdaT = -vt * tangentMass;

        if (std::isfinite(dLambdaT)) {
            float maxStaticFriction = staticFriction * normalImpulse;
            float maxKineticFriction = kineticFriction * normalImpulse;
            float oldImpulseT = frictionImpulse;
            float newImpulseT = oldImpulseT + dLambdaT;
            if (std::abs(newImpulseT) > maxStaticFriction) frictionImpulse = std::max(-maxKineticFriction, std::min(maxKineticFriction, newImpulseT));
            else frictionImpulse = newImpulseT;
            dLambdaT = frictionImpulse - oldImpulseT;
            Vec2 fImpulse = tangent * dLambdaT;
            if (imA > 0) { a->setVelocityInternal(a->getVelocity() - fImpulse * imA); a->setAngularVelocityInternal(a->getAngularVelocity() - rA.cross(fImpulse) * iIA); }
            if (imB > 0) { b->setVelocityInternal(b->getVelocity() + fImpulse * imB); b->setAngularVelocityInternal(b->getAngularVelocity() + rB.cross(fImpulse) * iIB); }
        }
    }
}

void ContactConstraint::solvePosition() {
    float imA = a->getInverseMass(), imB = b->getInverseMass();
    float iIA = a->getInverseInertia(), iIB = b->getInverseInertia();
    if (imA == 0.0f && imB == 0.0f) return;
    Vec2 pA = a->getPosition(); float thetaA = a->getRotation();
    Vec2 pB = b->getPosition(); float thetaB = b->getRotation();
    float cA = std::cos(thetaA), sA = std::sin(thetaA);
    Vec2 rA_curr(localAnchorA.x * cA - localAnchorA.y * sA, localAnchorA.x * sA + localAnchorA.y * cA);
    Vec2 normal_curr(localNormalA.x * cA - localNormalA.y * sA, localNormalA.x * sA + localNormalA.y * cA);
    float cB = std::cos(thetaB), sB = std::sin(thetaB);
    Vec2 rB_curr(localAnchorB.x * cB - localAnchorB.y * sB, localAnchorB.x * sB + localAnchorB.y * cB);
    Vec2 separation_vec = (pB + rB_curr) - (pA + rA_curr);
    float current_depth = depth - separation_vec.dot(normal_curr);
    if (current_depth <= PENETRATION_SLOP) return;

    float correction = std::min(current_depth - PENETRATION_SLOP, MAX_POSITION_CORRECTION) * BAUMGARTE_FACTOR;
    float rnA = rA_curr.x * normal_curr.y - rA_curr.y * normal_curr.x;
    float rnB = rB_curr.x * normal_curr.y - rB_curr.y * normal_curr.x;
    float kNormal = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    if (kNormal < 0.00001f) return;
    float impulse = correction / kNormal;
    Vec2 P = normal_curr * impulse;
    if (imA > 0) {
        int bIdx = a->worldIndex;
        a->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pA.x - P.x * imA;
        a->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pA.y - P.y * imA;
        a->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaA - rA_curr.cross(P) * iIA;
    }
    if (imB > 0) {
        int bIdx = b->worldIndex;
        b->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = pB.x + P.x * imB;
        b->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = pB.y + P.y * imB;
        b->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = thetaB + rB_curr.cross(P) * iIB;
    }
}
