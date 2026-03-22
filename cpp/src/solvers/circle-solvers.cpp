#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include "simd-math.h"
#include <cmath>
#include <algorithm>

using namespace std;

bool CollisionSolver::_solveCircleCircle() {
    int bIdxA = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexA, FIXTURE_IDATA_BODY_INDEX)];
    int bIdxB = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexB, FIXTURE_IDATA_BODY_INDEX)];

    float rA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_RADIUS)];
    float rB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_RADIUS)];
    
    // World position = Body position + rotated Local position
    float bXA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_X)];
    float bYA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_Y)];
    float bRA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_R)];
    float lXA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_LOCAL_X)];
    float lYA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));

    float bXB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_X)];
    float bYB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_Y)];
    float bRB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_R)];
    float lXB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_X)];
    float lYB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    Vec2 pDiff = pB - pA;
    float pd2 = pDiff.magnitudeSquared();
    float combinedRadius = rA + rB;

    if ((combinedRadius + _speculativeMargin) * (combinedRadius + _speculativeMargin) > pd2) {
        float distance = sqrt(pd2);
        Vec2 normal = (distance > 0.0001f) ? pDiff / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = combinedRadius - distance;

        // Check for speculative contact: only create if overlapping or going to overlap
        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) {
            return false;
        }

        Vec2 contactPoint = pA + normal * (rA - std::max(0.0f, penetrationDepth) * 0.5f);

        Vec2 vA(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VY)]);
        Vec2 vB(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VY)]);
        float wA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_RS)];
        float wB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_RS)];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0; // Circle center
        id.features.indexB = 0; // Circle center
        id.features.typeA = 0; // Vertex
        id.features.typeB = 0; // Vertex
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

int CollisionSolver::_solveCircleCircleSIMD(int indexA, const int indicesB[4], float dt) {
    int bIdxA = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(indexA, FIXTURE_IDATA_BODY_INDEX)];
    float rA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_RADIUS)];
    float bXA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_X)];
    float bYA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_Y)];
    float bRA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_R)];
    float lXA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_LOCAL_X)];
    float lYA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));
    Vec2 vA(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VY)]);
    float wA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_RS)];

    v128_t pAX_v = v128_splat_f32(pA.x);
    v128_t pAY_v = v128_splat_f32(pA.y);
    v128_t rA_v = v128_splat_f32(rA);
    v128_t vAX_v = v128_splat_f32(vA.x);
    v128_t vAY_v = v128_splat_f32(vA.y);
    v128_t wA_v = v128_splat_f32(wA);
    v128_t dt_v = v128_splat_f32(dt);
    v128_t specMargin_v = v128_splat_f32(world.getSpeculativeMargin());

    int bIdxB[4];
    float rB[4], bXB[4], bYB[4], bRB[4], lXB[4], lYB[4], vBX[4], vBY[4], wB[4];
    for (int i = 0; i < 4; ++i) {
        bIdxB[i] = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(indicesB[i], FIXTURE_IDATA_BODY_INDEX)];
        rB[i] = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indicesB[i], FIXTURE_FDATA_RADIUS)];
        bXB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_X)];
        bYB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_Y)];
        bRB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_R)];
        lXB[i] = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indicesB[i], FIXTURE_FDATA_LOCAL_X)];
        lYB[i] = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indicesB[i], FIXTURE_FDATA_LOCAL_Y)];
        vBX[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_VX)];
        vBY[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_VY)];
        wB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_RS)];
    }

    v128_t rB_v = v128_make_f32(rB[0], rB[1], rB[2], rB[3]);
    v128_t bXB_v = v128_make_f32(bXB[0], bXB[1], bXB[2], bXB[3]);
    v128_t bYB_v = v128_make_f32(bYB[0], bYB[1], bYB[2], bYB[3]);
    v128_t bRB_v = v128_make_f32(bRB[0], bRB[1], bRB[2], bRB[3]);
    v128_t lXB_v = v128_make_f32(lXB[0], lXB[1], lXB[2], lXB[3]);
    v128_t lYB_v = v128_make_f32(lYB[0], lYB[1], lYB[2], lYB[3]);
    v128_t vBX_v = v128_make_f32(vBX[0], vBX[1], vBX[2], vBX[3]);
    v128_t vBY_v = v128_make_f32(vBY[0], vBY[1], vBY[2], vBY[3]);
    v128_t wB_v = v128_make_f32(wB[0], wB[1], wB[2], wB[3]);

    v128_t cosB_v = v128_make_f32(cos(bRB[0]), cos(bRB[1]), cos(bRB[2]), cos(bRB[3]));
    v128_t sinB_v = v128_make_f32(sin(bRB[0]), sin(bRB[1]), sin(bRB[2]), sin(bRB[3]));

    v128_t pBX_v = v128_add_f32(bXB_v, v128_rotate_x_f32(lXB_v, lYB_v, cosB_v, sinB_v));
    v128_t pBY_v = v128_add_f32(bYB_v, v128_rotate_y_f32(lXB_v, lYB_v, cosB_v, sinB_v));

    v128_t pDiffX_v = v128_sub_f32(pBX_v, pAX_v);
    v128_t pDiffY_v = v128_sub_f32(pBY_v, pAY_v);
    v128_t pd2_v = v128_mag_sq_f32(pDiffX_v, pDiffY_v);

    v128_t combinedRadius_v = v128_add_f32(rA_v, rB_v);
    v128_t combinedMargin_v = v128_add_f32(combinedRadius_v, specMargin_v);
    v128_t overlapMask = v128_lt_f32(pd2_v, v128_mul_f32(combinedMargin_v, combinedMargin_v));

    if (!v128_any_true(overlapMask)) return 0;

    v128_t distance_v = wasm_f32x4_sqrt(pd2_v);
    v128_t dist_gt_0001_v = v128_gt_f32(distance_v, v128_splat_f32(0.0001f));
    v128_t invDist_v = v128_div_f32(v128_splat_f32(1.0f), distance_v);

    v128_t normalX_v = v128_select(dist_gt_0001_v, v128_mul_f32(pDiffX_v, invDist_v), v128_splat_f32(0.0f));
    v128_t normalY_v = v128_select(dist_gt_0001_v, v128_mul_f32(pDiffY_v, invDist_v), v128_splat_f32(-1.0f));
    v128_t penetrationDepth_v = v128_sub_f32(combinedRadius_v, distance_v);

    v128_t relVX_v = v128_sub_f32(vBX_v, vAX_v);
    v128_t relVY_v = v128_sub_f32(vBY_v, vAY_v);
    v128_t vn_v = v128_add_f32(v128_mul_f32(relVX_v, normalX_v), v128_mul_f32(relVY_v, normalY_v));

    v128_t specCond1 = v128_le_f32(penetrationDepth_v, v128_splat_f32(0.0f));
    v128_t specCond2 = v128_ge_f32(vn_v, v128_div_f32(penetrationDepth_v, dt_v));
    v128_t ignoreMask = v128_and(specCond1, specCond2);
    v128_t finalMask = v128_andnot(overlapMask, ignoreMask);

    int collisionCount = 0;
    int bitmask = v128_bitmask(finalMask);
    
    // Extract SIMD results using lanes directly to avoid alignment issues on stack
    for (int i = 0; i < 4; ++i) {
        if (bitmask & (1 << i)) {
            float pen, nx, ny, pbx, pby, rb;
            switch(i) {
                case 0:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 0);
                    nx = wasm_f32x4_extract_lane(normalX_v, 0);
                    ny = wasm_f32x4_extract_lane(normalY_v, 0);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 0);
                    pby = wasm_f32x4_extract_lane(pBY_v, 0);
                    rb = wasm_f32x4_extract_lane(rB_v, 0);
                    break;
                case 1:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 1);
                    nx = wasm_f32x4_extract_lane(normalX_v, 1);
                    ny = wasm_f32x4_extract_lane(normalY_v, 1);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 1);
                    pby = wasm_f32x4_extract_lane(pBY_v, 1);
                    rb = wasm_f32x4_extract_lane(rB_v, 1);
                    break;
                case 2:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 2);
                    nx = wasm_f32x4_extract_lane(normalX_v, 2);
                    ny = wasm_f32x4_extract_lane(normalY_v, 2);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 2);
                    pby = wasm_f32x4_extract_lane(pBY_v, 2);
                    rb = wasm_f32x4_extract_lane(rB_v, 2);
                    break;
                case 3:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 3);
                    nx = wasm_f32x4_extract_lane(normalX_v, 3);
                    ny = wasm_f32x4_extract_lane(normalY_v, 3);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 3);
                    pby = wasm_f32x4_extract_lane(pBY_v, 3);
                    rb = wasm_f32x4_extract_lane(rB_v, 3);
                    break;
                default: pen = nx = ny = pbx = pby = rb = 0.0f; break;
            }
            
            Vec2 normal(nx, ny);
            Vec2 pB_curr(pbx, pby);
            Vec2 contactPoint = pA + normal * (rA - std::max(0.0f, pen) * 0.5f);
            
            Vec2 rA_vec = contactPoint - pA;
            Vec2 rB_vec = contactPoint - pB_curr;
            Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
            Vec2 totalVelocityB = Vec2(vBX[i], vBY[i]) + Vec2(-rB_vec.y * wB[i], rB_vec.x * wB[i]);
            
            ContactID id;
            id.features.indexA = 0; id.features.indexB = 0;
            id.features.typeA = 0; id.features.typeB = 0;
            
            collisions.push_back(CollisionInfo{true, contactPoint, normal, pen, indexA, indicesB[i], totalVelocityB - totalVelocityA, 0.0f, id});
            collisionCount++;
        }
    }
    return collisionCount;
}

bool CollisionSolver::_solveCirclePoint() {
    int bIdxA = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexA, FIXTURE_IDATA_BODY_INDEX)];
    int bIdxB = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexB, FIXTURE_IDATA_BODY_INDEX)];

    float rA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_RADIUS)];
    
    float bXA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_X)];
    float bYA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_Y)];
    float bRA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_R)];
    float lXA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_LOCAL_X)];
    float lYA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexA, FIXTURE_FDATA_LOCAL_Y)];
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));

    float bXB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_X)];
    float bYB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_Y)];
    float bRB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_R)];
    float lXB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_X)];
    float lYB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_Y)];
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    Vec2 pDiff = pB - pA;
    float pd2 = pDiff.magnitudeSquared();

    if ((rA + _speculativeMargin) * (rA + _speculativeMargin) > pd2) {
        float distance = sqrt(pd2);
        Vec2 normal = (distance > 0.0001f) ? pDiff / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = rA - distance;

        // Check for speculative contact: only create if overlapping or going to overlap
        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) {
            return false;
        }
        
        Vec2 vA(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VY)]);
        Vec2 vB(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VY)]);
        float wA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_RS)];
        float wB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_RS)];
        
        Vec2 rA_vec = pB - pA;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB; // Point has no rotation effects usually or we can add if needed
        
        ContactID id;
        id.features.indexA = 0; // Circle center
        id.features.indexB = 0; // Point
        id.features.typeA = 0; // Vertex
        id.features.typeB = 0; // Vertex
        
        collisions.push_back(CollisionInfo{true, pB, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

int CollisionSolver::_solveCirclePointSIMD(int indexA, const int indicesB[4], float dt) {
    int bIdxA = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(indexA, FIXTURE_IDATA_BODY_INDEX)];
    float rA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_RADIUS)];
    float bXA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_X)];
    float bYA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_Y)];
    float bRA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_R)];
    float lXA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_LOCAL_X)];
    float lYA = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indexA, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));
    Vec2 vA(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_VY)]);
    float wA = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxA, BODY_FDATA_RS)];

    v128_t pAX_v = v128_splat_f32(pA.x);
    v128_t pAY_v = v128_splat_f32(pA.y);
    v128_t rA_v = v128_splat_f32(rA);
    v128_t vAX_v = v128_splat_f32(vA.x);
    v128_t vAY_v = v128_splat_f32(vA.y);
    v128_t wA_v = v128_splat_f32(wA);
    v128_t dt_v = v128_splat_f32(dt);
    v128_t specMargin_v = v128_splat_f32(world.getSpeculativeMargin());

    int bIdxB[4];
    float bXB[4], bYB[4], bRB[4], lXB[4], lYB[4], vBX[4], vBY[4];
    for (int i = 0; i < 4; ++i) {
        bIdxB[i] = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(indicesB[i], FIXTURE_IDATA_BODY_INDEX)];
        bXB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_X)];
        bYB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_Y)];
        bRB[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_R)];
        lXB[i] = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indicesB[i], FIXTURE_FDATA_LOCAL_X)];
        lYB[i] = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(indicesB[i], FIXTURE_FDATA_LOCAL_Y)];
        vBX[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_VX)];
        vBY[i] = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB[i], BODY_FDATA_VY)];
    }

    v128_t bXB_v = v128_make_f32(bXB[0], bXB[1], bXB[2], bXB[3]);
    v128_t bYB_v = v128_make_f32(bYB[0], bYB[1], bYB[2], bYB[3]);
    v128_t bRB_v = v128_make_f32(bRB[0], bRB[1], bRB[2], bRB[3]);
    v128_t lXB_v = v128_make_f32(lXB[0], lXB[1], lXB[2], lXB[3]);
    v128_t lYB_v = v128_make_f32(lYB[0], lYB[1], lYB[2], lYB[3]);
    v128_t vBX_v = v128_make_f32(vBX[0], vBX[1], vBX[2], vBX[3]);
    v128_t vBY_v = v128_make_f32(vBY[0], vBY[1], vBY[2], vBY[3]);

    v128_t cosB_v = v128_make_f32(cos(bRB[0]), cos(bRB[1]), cos(bRB[2]), cos(bRB[3]));
    v128_t sinB_v = v128_make_f32(sin(bRB[0]), sin(bRB[1]), sin(bRB[2]), sin(bRB[3]));

    v128_t pBX_v = v128_add_f32(bXB_v, v128_rotate_x_f32(lXB_v, lYB_v, cosB_v, sinB_v));
    v128_t pBY_v = v128_add_f32(bYB_v, v128_rotate_y_f32(lXB_v, lYB_v, cosB_v, sinB_v));

    v128_t pDiffX_v = v128_sub_f32(pBX_v, pAX_v);
    v128_t pDiffY_v = v128_sub_f32(pBY_v, pAY_v);
    v128_t pd2_v = v128_mag_sq_f32(pDiffX_v, pDiffY_v);

    v128_t combinedMargin_v = v128_add_f32(rA_v, specMargin_v);
    v128_t overlapMask = v128_lt_f32(pd2_v, v128_mul_f32(combinedMargin_v, combinedMargin_v));

    if (!v128_any_true(overlapMask)) return 0;

    v128_t distance_v = wasm_f32x4_sqrt(pd2_v);
    v128_t dist_gt_0001_v = v128_gt_f32(distance_v, v128_splat_f32(0.0001f));
    v128_t invDist_v = v128_div_f32(v128_splat_f32(1.0f), distance_v);

    v128_t normalX_v = v128_select(dist_gt_0001_v, v128_mul_f32(pDiffX_v, invDist_v), v128_splat_f32(0.0f));
    v128_t normalY_v = v128_select(dist_gt_0001_v, v128_mul_f32(pDiffY_v, invDist_v), v128_splat_f32(-1.0f));
    v128_t penetrationDepth_v = v128_sub_f32(rA_v, distance_v);

    v128_t relVX_v = v128_sub_f32(vBX_v, vAX_v);
    v128_t relVY_v = v128_sub_f32(vBY_v, vAY_v);
    v128_t vn_v = v128_add_f32(v128_mul_f32(relVX_v, normalX_v), v128_mul_f32(relVY_v, normalY_v));

    v128_t specCond1 = v128_le_f32(penetrationDepth_v, v128_splat_f32(0.0f));
    v128_t specCond2 = v128_ge_f32(vn_v, v128_div_f32(penetrationDepth_v, dt_v));
    v128_t ignoreMask = v128_and(specCond1, specCond2);
    v128_t finalMask = v128_andnot(overlapMask, ignoreMask);

    int collisionCount = 0;
    int bitmask = v128_bitmask(finalMask);
    
    // Extract SIMD results using lanes directly to avoid alignment issues on stack
    for (int i = 0; i < 4; ++i) {
        if (bitmask & (1 << i)) {
            float pen, nx, ny, pbx, pby;
            switch(i) {
                case 0:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 0);
                    nx = wasm_f32x4_extract_lane(normalX_v, 0);
                    ny = wasm_f32x4_extract_lane(normalY_v, 0);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 0);
                    pby = wasm_f32x4_extract_lane(pBY_v, 0);
                    break;
                case 1:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 1);
                    nx = wasm_f32x4_extract_lane(normalX_v, 1);
                    ny = wasm_f32x4_extract_lane(normalY_v, 1);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 1);
                    pby = wasm_f32x4_extract_lane(pBY_v, 1);
                    break;
                case 2:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 2);
                    nx = wasm_f32x4_extract_lane(normalX_v, 2);
                    ny = wasm_f32x4_extract_lane(normalY_v, 2);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 2);
                    pby = wasm_f32x4_extract_lane(pBY_v, 2);
                    break;
                case 3:
                    pen = wasm_f32x4_extract_lane(penetrationDepth_v, 3);
                    nx = wasm_f32x4_extract_lane(normalX_v, 3);
                    ny = wasm_f32x4_extract_lane(normalY_v, 3);
                    pbx = wasm_f32x4_extract_lane(pBX_v, 3);
                    pby = wasm_f32x4_extract_lane(pBY_v, 3);
                    break;
                default: pen = nx = ny = pbx = pby = 0.0f; break;
            }
            
            Vec2 normal(nx, ny);
            Vec2 pB_curr(pbx, pby);
            
            Vec2 rA_vec = pB_curr - pA;
            Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
            Vec2 totalVelocityB = Vec2(vBX[i], vBY[i]);
            
            ContactID id;
            id.features.indexA = 0; id.features.indexB = 0;
            id.features.typeA = 0; id.features.typeB = 0;
            
            collisions.push_back(CollisionInfo{true, pB_curr, normal, pen, indexA, indicesB[i], totalVelocityB - totalVelocityA, 0.0f, id});
            collisionCount++;
        }
    }
    return collisionCount;
}
