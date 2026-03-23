void ContactConstraint::preSolveSIMD(ContactConstraint** batch, float dt, bool enableRestitution, bool enablePenetration, bool enableFriction) {
#ifdef __EMSCRIPTEN__
    v128_t dt_v = v128_splat_f32(dt);
    v128_t zero_v = v128_splat_f32(0.0f);
    v128_t one_v = v128_splat_f32(1.0f);

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

    v128_t pAx = gather_body_fdata(idxA, BODY_FDATA_X);
    v128_t pAy = gather_body_fdata(idxA, BODY_FDATA_Y);
    v128_t pBx = gather_body_fdata(idxB, BODY_FDATA_X);
    v128_t pBy = gather_body_fdata(idxB, BODY_FDATA_Y);

    v128_t pointX = v128_make_f32(batch[0]->point.x, batch[1]->point.x, batch[2]->point.x, batch[3]->point.x);
    v128_t pointY = v128_make_f32(batch[0]->point.y, batch[1]->point.y, batch[2]->point.y, batch[3]->point.y);

    v128_t rAx = v128_sub_f32(pointX, pAx);
    v128_t rAy = v128_sub_f32(pointY, pAy);
    v128_t rBx = v128_sub_f32(pointX, pBx);
    v128_t rBy = v128_sub_f32(pointY, pBy);

    v128_t normalX = v128_make_f32(batch[0]->normal.x, batch[1]->normal.x, batch[2]->normal.x, batch[3]->normal.x);
    v128_t normalY = v128_make_f32(batch[0]->normal.y, batch[1]->normal.y, batch[2]->normal.y, batch[3]->normal.y);

    v128_t imA = gather_body_fdata(idxA, BODY_FDATA_IM);
    v128_t imB = gather_body_fdata(idxB, BODY_FDATA_IM);
    v128_t iIA = gather_body_fdata(idxA, BODY_FDATA_INV_INERTIA);
    v128_t iIB = gather_body_fdata(idxB, BODY_FDATA_INV_INERTIA);

    v128_t rnA = v128_cross_f32(rAx, rAy, normalX, normalY);
    v128_t rnB = v128_cross_f32(rBx, rBy, normalX, normalY);

    v128_t kNormal = v128_add_f32(v128_add_f32(imA, imB), 
                     v128_add_f32(v128_mul_f32(iIA, v128_mul_f32(rnA, rnA)), 
                                  v128_mul_f32(iIB, v128_mul_f32(rnB, rnB))));

    v128_t normalMass = v128_select(v128_gt_f32(kNormal, v128_splat_f32(0.00001f)), v128_div_f32(one_v, kNormal), zero_v);

    v128_t vAx = gather_body_fdata(idxA, BODY_FDATA_VX);
    v128_t vAy = gather_body_fdata(idxA, BODY_FDATA_VY);
    v128_t wA = gather_body_fdata(idxA, BODY_FDATA_RS);
    
    v128_t vBx = gather_body_fdata(idxB, BODY_FDATA_VX);
    v128_t vBy = gather_body_fdata(idxB, BODY_FDATA_VY);
    v128_t wB = gather_body_fdata(idxB, BODY_FDATA_RS);

    v128_t tangVelAx = v128_mul_f32(v128_sub_f32(zero_v, rAy), wA);
    v128_t tangVelAy = v128_mul_f32(rAx, wA);
    v128_t tangVelBx = v128_mul_f32(v128_sub_f32(zero_v, rBy), wB);
    v128_t tangVelBy = v128_mul_f32(rBx, wB);

    v128_t relVelX = v128_sub_f32(v128_add_f32(vBx, tangVelBx), v128_add_f32(vAx, tangVelAx));
    v128_t relVelY = v128_sub_f32(v128_add_f32(vBy, tangVelBy), v128_add_f32(vAy, tangVelAy));
    
    v128_t vn = v128_dot_f32(relVelX, relVelY, normalX, normalY);

    v128_t forceVn = zero_v;
    v128_t fvAx = gather_body_fdata(idxA, BODY_FDATA_FORCE_VX);
    v128_t fvAy = gather_body_fdata(idxA, BODY_FDATA_FORCE_VY);
    v128_t fvBx = gather_body_fdata(idxB, BODY_FDATA_FORCE_VX);
    v128_t fvBy = gather_body_fdata(idxB, BODY_FDATA_FORCE_VY);
    forceVn = v128_dot_f32(v128_sub_f32(fvBx, fvAx), v128_sub_f32(fvBy, fvAy), normalX, normalY);

    v128_t relativeVn = v128_sub_f32(vn, forceVn);

    v128_t restitution = v128_make_f32(batch[0]->restitution, batch[1]->restitution, batch[2]->restitution, batch[3]->restitution);
    v128_t vBounce = v128_mul_f32(v128_sub_f32(zero_v, restitution), relativeVn);
    
    v128_t depth = v128_make_f32(batch[0]->depth, batch[1]->depth, batch[2]->depth, batch[3]->depth);
    v128_t depth_lt_zero = v128_lt_f32(depth, zero_v);
    
    v128_t staticFric = v128_make_f32(batch[0]->staticFriction, batch[1]->staticFriction, batch[2]->staticFriction, batch[3]->staticFriction);
    v128_t kineticFric = v128_make_f32(batch[0]->kineticFriction, batch[1]->kineticFriction, batch[2]->kineticFriction, batch[3]->kineticFriction);
    
    staticFric = v128_select(depth_lt_zero, zero_v, staticFric);
    kineticFric = v128_select(depth_lt_zero, zero_v, kineticFric);
    
    v128_t enableRestitution_v = enableRestitution ? v128_splat_f32(1.0f) : zero_v;
    // Should Bounce logic
    // relativeVn < -RESTITUTION_THRESHOLD || (depth < 0.0f && relativeVn < depth / dt)
    v128_t restThresh_v = v128_splat_f32(-RESTITUTION_THRESHOLD);
    v128_t depth_over_dt = v128_div_f32(depth, dt_v);
    
    v128_t cond1 = v128_lt_f32(relativeVn, restThresh_v);
    v128_t cond2 = wasm_v128_and(depth_lt_zero, v128_lt_f32(relativeVn, depth_over_dt));
    v128_t shouldBounce = wasm_v128_and(wasm_f32x4_ne(enableRestitution_v, zero_v), wasm_v128_or(cond1, cond2));
    
    // Position iterations correction factor
    int posIter = batch[0]->a->world.getPositionIterations();
    float posIterFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)posIter);
    v128_t cumCorrFactor = v128_splat_f32(posIterFactor);
    v128_t maxPosCorr = v128_splat_f32(MAX_POSITION_CORRECTION);
    v128_t penSlop = v128_splat_f32(PENETRATION_SLOP);
    
    v128_t depth_gt_zero = v128_gt_f32(depth, zero_v);
    v128_t depthAfterVel = v128_max_f32(zero_v, v128_sub_f32(v128_sub_f32(depth, penSlop), v128_mul_f32(vBounce, dt_v)));
    v128_t expectedDisp = v128_select(depth_gt_zero, v128_mul_f32(v128_min_f32(depthAfterVel, maxPosCorr), cumCorrFactor), zero_v);
    
    v128_t accVn = v128_div_f32(forceVn, dt_v);
    v128_t workTerm = v128_mul_f32(v128_splat_f32(2.0f), v128_mul_f32(accVn, expectedDisp));
    v128_t vImpactSq = v128_mul_f32(relativeVn, relativeVn);
    v128_t vSurfSq = v128_add_f32(vImpactSq, workTerm);
    v128_t vFinal = v128_mul_f32(restitution, wasm_f32x4_sqrt(v128_max_f32(zero_v, vSurfSq)));
    
    v128_t bias_bounce_spec = v128_sub_f32(zero_v, v128_max_f32(vFinal, depth_over_dt));
    v128_t bias_bounce_norm = v128_sub_f32(zero_v, vFinal);
    v128_t bias_bounce = v128_select(depth_lt_zero, bias_bounce_spec, bias_bounce_norm);
    
    v128_t bias_no_bounce_spec = v128_sub_f32(zero_v, depth_over_dt);
    v128_t bias_no_bounce_norm = zero_v;
    v128_t bias_no_bounce = v128_select(depth_lt_zero, bias_no_bounce_spec, bias_no_bounce_norm);
    
    v128_t bias = v128_select(shouldBounce, bias_bounce, bias_no_bounce);
    
    v128_t tangentX = v128_sub_f32(zero_v, normalY);
    v128_t tangentY = normalX;
    
    v128_t rtA = v128_cross_f32(rAx, rAy, tangentX, tangentY);
    v128_t rtB = v128_cross_f32(rBx, rBy, tangentX, tangentY);
    
    v128_t kTangent = v128_add_f32(v128_add_f32(imA, imB), 
                     v128_add_f32(v128_mul_f32(iIA, v128_mul_f32(rtA, rtA)), 
                                  v128_mul_f32(iIB, v128_mul_f32(rtB, rtB))));
                                  
    v128_t tangentMass = v128_select(v128_gt_f32(kTangent, v128_splat_f32(0.00001f)), v128_div_f32(one_v, kTangent), zero_v);
    
    if (!enableFriction) {
        staticFric = zero_v;
        kineticFric = zero_v;
    }
    
    v128_t thetaA = gather_body_fdata(idxA, BODY_FDATA_R);
    v128_t thetaB = gather_body_fdata(idxB, BODY_FDATA_R);
    
    v128_t negThetaA = v128_sub_f32(zero_v, thetaA);
    v128_t cA = wasm_f32x4_cos(negThetaA);
    v128_t sA = wasm_f32x4_sin(negThetaA);
    
    v128_t localAnchorAx = v128_sub_f32(v128_mul_f32(rAx, cA), v128_mul_f32(rAy, sA));
    v128_t localAnchorAy = v128_add_f32(v128_mul_f32(rAx, sA), v128_mul_f32(rAy, cA));
    
    v128_t localNormalAx = v128_sub_f32(v128_mul_f32(normalX, cA), v128_mul_f32(normalY, sA));
    v128_t localNormalAy = v128_add_f32(v128_mul_f32(normalX, sA), v128_mul_f32(normalY, cA));
    
    v128_t negThetaB = v128_sub_f32(zero_v, thetaB);
    v128_t cB = wasm_f32x4_cos(negThetaB);
    v128_t sB = wasm_f32x4_sin(negThetaB);
    
    v128_t localAnchorBx = v128_sub_f32(v128_mul_f32(rBx, cB), v128_mul_f32(rBy, sB));
    v128_t localAnchorBy = v128_add_f32(v128_mul_f32(rBx, sB), v128_mul_f32(rBy, cB));

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
