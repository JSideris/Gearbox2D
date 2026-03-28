#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "simd-math.h"
#include <cmath>

void World::_doIntegrateVelocitiesSIMD(float dt) {
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    V128 dt_v = v128_splat_f32(dt);
    V128 gravX_v = v128_splat_f32(gravity.x);
    V128 gravY_v = v128_splat_f32(gravity.y);
    V128 maxVelSq_v = v128_splat_f32(MAX_VELOCITY * MAX_VELOCITY);
    V128 zero_v = v128_splat_f32(0.0f);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < bodyCount; i += SIMD_LANE_COUNT) {
        V128 laneMask = v128_first_n(bodyCount - i);
        
        // Load isSleeping mask
        V128 flags = v128_load_f32(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);
        V128 isSleepingMask = v128_ne_i32(v128_and(flags, v128_splat_i32(IS_SLEEPING)), v128_splat_i32(0));

        // Load attributes
        V128 im = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IM)]);
        V128 m = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_M)]);
        V128 gScale = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_G_SCALE)]);
        V128 fx = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FX)]);
        V128 fy = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FY)]);
        V128 nfx = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)]);
        V128 nfy = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)]);
        V128 damping = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_DAMPING)]);
        V128 vx = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        V128 vy = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);

        // 1. Compute gravity force
        V128 gravFX = v128_mul_f32(v128_mul_f32(gravX_v, m), gScale);
        V128 gravFY = v128_mul_f32(v128_mul_f32(gravY_v, m), gScale);

        // 2. Apply external forces (NFX, NFY)
        V128 totalFX = v128_add_f32(fx, nfx);
        V128 totalFY = v128_add_f32(fy, nfy);

        // Clear NFX, NFY
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)], laneMask, zero_v);
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)], laneMask, zero_v);

        // 3. Calculate forceVelocity for KRB (only if im > 0 and NOT sleeping)
        V128 im_gt_zero = v128_gt_f32(im, zero_v);
        V128 validMask = v128_andnot(im_gt_zero, isSleepingMask);

        V128 forceVX = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFX, gravFX), im), dt_v);
        V128 forceVY = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFY, gravFY), im), dt_v);

        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VX)], laneMask, v128_select(validMask, forceVX, zero_v));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VY)], laneMask, v128_select(validMask, forceVY, zero_v));

        // 4. Apply damping
        totalFX = v128_sub_f32(totalFX, v128_mul_f32(vx, damping));
        totalFY = v128_sub_f32(totalFY, v128_mul_f32(vy, damping));

        // 5. Integrate total velocity
        V128 dvx = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFX, gravFX), im), dt_v);
        V128 dvy = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFY, gravFY), im), dt_v);

        V128 nextVX = v128_add_f32(vx, dvx);
        V128 nextVY = v128_add_f32(vy, dvy);

        // 6. Cap velocity
        V128 speedSq = v128_mag_sq_f32(nextVX, nextVY);
        V128 speedLimitMask = v128_gt_f32(speedSq, maxVelSq_v);

        // if (speedSq > maxVelSq) v *= maxVel / sqrt(speedSq)
        V128 speed = v128_sqrt_f32(speedSq);
        V128 invSpeed = v128_div_f32(v128_splat_f32(MAX_VELOCITY), speed);

        nextVX = v128_select(speedLimitMask, v128_mul_f32(nextVX, invSpeed), nextVX);
        nextVY = v128_select(speedLimitMask, v128_mul_f32(nextVY, invSpeed), nextVY);

        // Store back (only if NOT sleeping)
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)], laneMask, v128_select(isSleepingMask, vx, nextVX));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)], laneMask, v128_select(isSleepingMask, vy, nextVY));
    }
}

void World::_doIntegratePositionsSIMD(float dt) {
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    V128 dt_v = v128_splat_f32(dt);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 wake_threshold_v = v128_splat_f32(WAKE_MOVEMENT_THRESHOLD);
    V128 sleep_vel_sq_v = v128_splat_f32(SLEEP_VELOCITY_THRESHOLD * SLEEP_VELOCITY_THRESHOLD);
    V128 sleep_ang_vel_v = v128_splat_f32(SLEEP_ANGULAR_VELOCITY_THRESHOLD);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < bodyCount; i += SIMD_LANE_COUNT) {
        V128 laneMask = v128_first_n(bodyCount - i);

        // Load data for SIMD_LANE_COUNT bodies
        V128 type = v128_load_f32(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_TYPE)]);
        V128 flags = v128_load_f32(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);

        V128 isFixed = v128_eq_i32(type, v128_splat_i32((int)ObjectType::FIXED_OBJECT));
        V128 isDynamic = v128_eq_i32(type, v128_splat_i32((int)ObjectType::DYNAMIC_OBJECT));
        V128 isSleeping = v128_ne_i32(v128_and(flags, v128_splat_i32(IS_SLEEPING)), v128_splat_i32(0));

        V128 skipMask = v128_or(isFixed, isSleeping);

        V128 x = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)]);
        V128 y = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)]);
        V128 r = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)]);
        V128 vx = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        V128 vy = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);
        V128 rs = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_RS)]);
        V128 damping_a = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ANGULAR_DAMPING)]);

        V128 lastX = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_X)]);
        V128 lastY = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_Y)]);
        V128 lastR = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_R)]);

        V128 accX = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_X)]);
        V128 accY = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_Y)]);
        V128 accR = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_R)]);
        V128 sleepTimer = v128_load_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_SLEEP_TIMER)]);

        // 1. Angular Damping (only dynamic)
        V128 dampFactor = v128_sub_f32(one_v, v128_mul_f32(damping_a, dt_v));
        rs = v128_select(isDynamic, v128_mul_f32(rs, dampFactor), rs);

        // 2. Integrate
        V128 nextX = v128_add_f32(x, v128_mul_f32(vx, dt_v));
        V128 nextY = v128_add_f32(y, v128_mul_f32(vy, dt_v));
        V128 nextR = v128_add_f32(r, v128_mul_f32(rs, dt_v));

        // 4. Movement track
        V128 dx = v128_sub_f32(nextX, lastX);
        V128 dy = v128_sub_f32(nextY, lastY);
        V128 dr = v128_sub_f32(nextR, lastR);

        accX = v128_add_f32(accX, dx);
        accY = v128_add_f32(accY, dy);
        accR = v128_add_f32(accR, dr);

        V128 absAccX = v128_abs_f32(accX);
        V128 absAccY = v128_abs_f32(accY);
        V128 absAccR = v128_abs_f32(accR);

        V128 moved = v128_or(v128_or(v128_ne_f32(dx, zero_v), v128_ne_f32(dy, zero_v)), v128_ne_f32(dr, zero_v));
        V128 significantMove = v128_or(v128_or(v128_gt_f32(absAccX, wake_threshold_v), v128_gt_f32(absAccY, wake_threshold_v)), v128_gt_f32(absAccR, wake_threshold_v));

        V128 velSq = v128_mag_sq_f32(vx, vy);
        V128 aboveSleepVel = v128_or(v128_gt_f32(velSq, sleep_vel_sq_v), v128_gt_f32(v128_abs_f32(rs), sleep_ang_vel_v));

        V128 resetTimerMask = v128_and(v128_and(moved, significantMove), aboveSleepVel);

        sleepTimer = v128_select(resetTimerMask, zero_v, v128_add_f32(sleepTimer, dt_v));
        accX = v128_select(resetTimerMask, zero_v, accX);
        accY = v128_select(resetTimerMask, zero_v, accY);
        accR = v128_select(resetTimerMask, zero_v, accR);

        // Store back (only if NOT skipMask)
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)], laneMask, v128_select(skipMask, x, nextX));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)], laneMask, v128_select(skipMask, y, nextY));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)], laneMask, v128_select(skipMask, r, nextR));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)], laneMask, v128_select(skipMask, vx, vx));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)], laneMask, v128_select(skipMask, vy, vy));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_RS)], laneMask, v128_select(skipMask, rs, rs));

        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_X)], laneMask, v128_select(skipMask, lastX, nextX));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_Y)], laneMask, v128_select(skipMask, lastY, nextY));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_R)], laneMask, v128_select(skipMask, lastR, nextR));

        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_X)], laneMask, v128_select(skipMask, accX, accX));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_Y)], laneMask, v128_select(skipMask, accY, accY));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_R)], laneMask, v128_select(skipMask, accR, accR));
        v128_masked_store_f32(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_SLEEP_TIMER)], laneMask, v128_select(skipMask, sleepTimer, sleepTimer));
    }
}

void World::_syncFixturesSIMD() {
    int fixtureCount = (int)fixturesList.size();
    if (fixtureCount == 0) return;

    float* fdata = liveFixtureFloatData.data();
    int* idata = liveFixtureIntData.data();
    float* bfdata = liveBodyFloatData.data();
    int* bidata = liveBodyIntData.data();

    V128 zero_v = v128_splat_f32(0.0f);
    V128 half_vec = v128_splat_f32(0.5f);
    V128 two_vec = v128_splat_f32(2.0f);
    V128 one_vec = v128_splat_f32(1.0f);
    V128 pad_vec = v128_splat_f32(0.1f);
    V128 margin_ratio_vec = v128_splat_f32(0.05f);

    for (int i = 0; i < fixtureCount; i += SIMD_LANE_COUNT) {
        V128 laneMask = v128_first_n(fixtureCount - i);

        V128 bIdx_v = v128_load_f32(&idata[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_BODY_INDEX)]);
        V128 shape_v = v128_load_f32(&idata[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_SHAPE)]);
        
        alignas(64) uint32_t bIdx[HWY_MAX_LANES_D(DF)];
        v128_masked_store_f32(bIdx, laneMask, bIdx_v);
        
        alignas(64) float bx[HWY_MAX_LANES_D(DF)], by[HWY_MAX_LANES_D(DF)], br[HWY_MAX_LANES_D(DF)], bvx[HWY_MAX_LANES_D(DF)], bvy[HWY_MAX_LANES_D(DF)], brs[HWY_MAX_LANES_D(DF)];
        alignas(64) int bflags[HWY_MAX_LANES_D(DF)];
        alignas(64) int btypes[HWY_MAX_LANES_D(DF)];

        // Handle masked lanes for gather manually
        int activeLanes = std::min(SIMD_LANE_COUNT, fixtureCount - i);
        for (int j = 0; j < activeLanes; ++j) {
            int bodyIndex = bIdx[j];
            bx[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_X)];
            by[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_Y)];
            br[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_R)];
            bvx[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_VX)];
            bvy[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_VY)];
            brs[j] = bfdata[GET_BODY_FDATA_INDEX(bodyIndex, BODY_FDATA_RS)];
            bflags[j] = bidata[GET_BODY_IDATA_INDEX(bodyIndex, BODY_IDATA_FLAGS)];
            btypes[j] = bidata[GET_BODY_IDATA_INDEX(bodyIndex, BODY_IDATA_TYPE)];
        }
        
        V128 bflags_v = v128_load_f32(bflags);
        V128 btypes_v = v128_load_f32(btypes);
        V128 isFixed = v128_eq_i32(btypes_v, v128_splat_i32((int)ObjectType::FIXED_OBJECT));
        
        V128 isSleepingMask = v128_ne_i32(v128_and(bflags_v, v128_splat_i32(IS_SLEEPING)), v128_splat_i32(0));
        
        // Only skip if all are sleeping AND none are fixed objects.
        // Fixed objects need their world-space data for narrow-phase even if they don't move.
        V128 canSkipMask = v128_andnot(isSleepingMask, isFixed);
        
        // Combine with laneMask: only skip if ALL ACTIVE lanes can be skipped
        if (v128_all_true(v128_or(canSkipMask, v128_not(laneMask)))) continue;
        
        V128 bx_v = v128_load_f32(bx);
        V128 by_v = v128_load_f32(by);
        V128 br_v = v128_load_f32(br);
        V128 bvx_v = v128_load_f32(bvx);
        V128 bvy_v = v128_load_f32(bvy);
        V128 brs_v = v128_load_f32(brs);

        V128 lx = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_X)]);
        V128 ly = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_Y)]);
        V128 lr = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_R)]);
        V128 w = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_W)]);
        V128 h = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_H)]);
        
        V128 cosR = v128_cos_f32(br_v);
        V128 sinR = v128_sin_f32(br_v);
        
        V128 wx = v128_add_f32(bx_v, v128_sub_f32(v128_mul_f32(lx, cosR), v128_mul_f32(ly, sinR)));
        V128 wy = v128_add_f32(by_v, v128_add_f32(v128_mul_f32(lx, sinR), v128_mul_f32(ly, cosR)));
        
        V128 totalRot = v128_add_f32(br_v, lr);
        V128 isAabbMask = v128_eq_i32(shape_v, v128_splat_i32((int)ObjectShape::AABB));
        
        V128 cosTotal = v128_select(isAabbMask, one_vec, v128_cos_f32(totalRot));
        V128 sinTotal = v128_select(isAabbMask, zero_v, v128_sin_f32(totalRot));

        V128 vCount_v = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_COUNT)]);
        int maxVCount = (int)hn::ExtractLane(hn::MaxOfLanes(DF(), vCount_v), 0);

        V128 aabbMinX = v128_splat_f32(1e10f);
        V128 aabbMinY = v128_splat_f32(1e10f);
        V128 aabbMaxX = v128_splat_f32(-1e10f);
        V128 aabbMaxY = v128_splat_f32(-1e10f);

        if (maxVCount > 0) {
            for (int k = 0; k < MAX_POLYGON_VERTICES; ++k) {
                V128 vx_l = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2)]);
                V128 vy_l = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2 + 1)]);
                
                V128 worldVX = v128_add_f32(wx, v128_sub_f32(v128_mul_f32(vx_l, cosTotal), v128_mul_f32(vy_l, sinTotal)));
                V128 worldVY = v128_add_f32(wy, v128_add_f32(v128_mul_f32(vx_l, sinTotal), v128_mul_f32(vy_l, cosTotal)));
                
                v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)], laneMask, worldVX);
                v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)], laneMask, worldVY);

                V128 k_v = v128_splat_f32((float)k);
                V128 validV = v128_lt_f32(k_v, vCount_v);

                aabbMinX = v128_select(validV, v128_min_f32(aabbMinX, worldVX), aabbMinX);
                aabbMinY = v128_select(validV, v128_min_f32(aabbMinY, worldVY), aabbMinY);
                aabbMaxX = v128_select(validV, v128_max_f32(aabbMaxX, worldVX), aabbMaxX);
                aabbMaxY = v128_select(validV, v128_max_f32(aabbMaxY, worldVY), aabbMaxY);
            }
        }
        
        for (int k = 0; k < maxVCount; ++k) {
            int next_k = (k + 1) % MAX_POLYGON_VERTICES;
            V128 p1x = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)]);
            V128 p1y = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)]);
            V128 p2x = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2)]);
            V128 p2y = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2 + 1)]);
            
            V128 edgeX = v128_sub_f32(p2x, p1x);
            V128 edgeY = v128_sub_f32(p2y, p1y);
            
            V128 nx = edgeY;
            V128 ny = v128_sub_f32(zero_v, edgeX);
            
            V128 lenSq = v128_add_f32(v128_mul_f32(nx, nx), v128_mul_f32(ny, ny));
            V128 len = v128_sqrt_f32(lenSq);
            V128 lenGtZero = v128_gt_f32(len, zero_v);
            nx = v128_select(lenGtZero, v128_div_f32(nx, len), zero_v);
            ny = v128_select(lenGtZero, v128_div_f32(ny, len), zero_v);
            
            v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2)], laneMask, nx);
            v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2 + 1)], laneMask, ny);
        }

        V128 isCircleMask = v128_or(
            v128_eq_i32(shape_v, v128_splat_i32((int)ObjectShape::CIRCLE)),
            v128_eq_i32(shape_v, v128_splat_i32((int)ObjectShape::POINT))
        );
        V128 circMinX = v128_sub_f32(wx, w);
        V128 circMinY = v128_sub_f32(wy, w);
        V128 circMaxX = v128_add_f32(wx, w);
        V128 circMaxY = v128_add_f32(wy, w);
        
        aabbMinX = v128_select(isCircleMask, circMinX, aabbMinX);
        aabbMinY = v128_select(isCircleMask, circMinY, aabbMinY);
        aabbMaxX = v128_select(isCircleMask, circMaxX, aabbMaxX);
        aabbMaxY = v128_select(isCircleMask, circMaxY, aabbMaxY);
        
        V128 isCapsuleMask = v128_eq_i32(shape_v, v128_splat_i32((int)ObjectShape::CAPSULE));
        aabbMinX = v128_select(isCapsuleMask, v128_sub_f32(aabbMinX, w), aabbMinX);
        aabbMinY = v128_select(isCapsuleMask, v128_sub_f32(aabbMinY, w), aabbMinY);
        aabbMaxX = v128_select(isCapsuleMask, v128_add_f32(aabbMaxX, w), aabbMaxX);
        aabbMaxY = v128_select(isCapsuleMask, v128_add_f32(aabbMaxY, w), aabbMaxY);

        V128 oldAx1 = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX1)]);
        V128 oldAy1 = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY1)]);
        V128 oldAx2 = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX2)]);
        V128 oldAy2 = v128_load_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY2)]);
        
        V128 contains = v128_and(
            v128_and(v128_le_f32(oldAx1, aabbMinX), v128_le_f32(oldAy1, aabbMinY)),
            v128_and(v128_ge_f32(oldAx2, aabbMaxX), v128_ge_f32(oldAy2, aabbMaxY))
        );
        
        V128 hx = v128_mul_f32(v128_sub_f32(aabbMaxX, aabbMinX), half_vec);
        V128 hy = v128_mul_f32(v128_sub_f32(aabbMaxY, aabbMinY), half_vec);
        V128 size = v128_mul_f32(v128_max_f32(hx, hy), two_vec);
        
        V128 margin = v128_mul_f32(size, margin_ratio_vec);
        V128 absRs = v128_abs_f32(brs_v);
        
        V128 paddingX_neg = v128_min_f32(v128_mul_f32(v128_sub_f32(bvx_v, v128_mul_f32(absRs, hy)), pad_vec), zero_v);
        V128 paddingY_neg = v128_min_f32(v128_mul_f32(v128_sub_f32(bvy_v, v128_mul_f32(absRs, hx)), pad_vec), zero_v);
        V128 paddingX_pos = v128_max_f32(v128_mul_f32(v128_add_f32(bvx_v, v128_mul_f32(absRs, hy)), pad_vec), zero_v);
        V128 paddingY_pos = v128_max_f32(v128_mul_f32(v128_add_f32(bvy_v, v128_mul_f32(absRs, hx)), pad_vec), zero_v);
        
        V128 fatMinX = v128_sub_f32(v128_add_f32(aabbMinX, paddingX_neg), margin);
        V128 fatMinY = v128_sub_f32(v128_add_f32(aabbMinY, paddingY_neg), margin);
        V128 fatMaxX = v128_add_f32(v128_add_f32(aabbMaxX, paddingX_pos), margin);
        V128 fatMaxY = v128_add_f32(v128_add_f32(aabbMaxY, paddingY_pos), margin);
        
        V128 updateMask = v128_and(laneMask, v128_not(contains));
        updateMask = v128_andnot(updateMask, isSleepingMask);
        
        V128 finalAx1 = v128_select(updateMask, fatMinX, oldAx1);
        V128 finalAy1 = v128_select(updateMask, fatMinY, oldAy1);
        V128 finalAx2 = v128_select(updateMask, fatMaxX, oldAx2);
        V128 finalAy2 = v128_select(updateMask, fatMaxY, oldAy2);
        
        v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX1)], laneMask, finalAx1);
        v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY1)], laneMask, finalAy1);
        v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX2)], laneMask, finalAx2);
        v128_masked_store_f32(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY2)], laneMask, finalAy2);

        if (v128_any_true(updateMask)) {
            alignas(64) uint32_t maskBits[HWY_MAX_LANES_D(DF)];
            v128_masked_store_f32(maskBits, laneMask, updateMask);
            for (int j = 0; j < activeLanes; ++j) {
                if (maskBits[j]) {
                    Fixture* f = fixturesList[i + j];
                    f->aabb.min.x = fdata[GET_FIXTURE_FDATA_INDEX(i + j, FIXTURE_FDATA_AX1)];
                    f->aabb.min.y = fdata[GET_FIXTURE_FDATA_INDEX(i + j, FIXTURE_FDATA_AY1)];
                    f->aabb.max.x = fdata[GET_FIXTURE_FDATA_INDEX(i + j, FIXTURE_FDATA_AX2)];
                    f->aabb.max.y = fdata[GET_FIXTURE_FDATA_INDEX(i + j, FIXTURE_FDATA_AY2)];
                    
                    if (f->bvhNode) {
                        f->bvhNode = bvh.updateLeaf(f->bvhNode, f->aabb, f->getCollisionProperties());
                    }
                }
            }
        }
    }
}
