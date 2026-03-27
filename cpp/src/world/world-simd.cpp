#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "simd-math.h"
#include <cmath>

void World::_doIntegrateVelocitiesSIMD(float dt) {
#if HWY_TARGET != HWY_SCALAR
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    int vectorizedCount = (bodyCount / SIMD_LANE_COUNT) * SIMD_LANE_COUNT;

    V128 dt_v = v128_splat_f32(dt);
    V128 gravX_v = v128_splat_f32(gravity.x);
    V128 gravY_v = v128_splat_f32(gravity.y);
    V128 maxVelSq_v = v128_splat_f32(MAX_VELOCITY * MAX_VELOCITY);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < vectorizedCount; i += SIMD_LANE_COUNT) {
        // Load isSleeping mask
        V128 flags = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);
        V128 isSleepingMask = wasm_i32x4_ne(wasm_v128_and(flags, wasm_i32x4_splat(IS_SLEEPING)), wasm_i32x4_splat(0));

        // Load attributes
        V128 im = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IM)]);
        V128 m = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_M)]);
        V128 gScale = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_G_SCALE)]);
        V128 fx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FX)]);
        V128 fy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FY)]);
        V128 nfx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)]);
        V128 nfy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)]);
        V128 damping = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_DAMPING)]);
        V128 vx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        V128 vy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);

        // 1. Compute gravity force
        V128 gravFX = v128_mul_f32(v128_mul_f32(gravX_v, m), gScale);
        V128 gravFY = v128_mul_f32(v128_mul_f32(gravY_v, m), gScale);

        // 2. Apply external forces (NFX, NFY)
        V128 totalFX = v128_add_f32(fx, nfx);
        V128 totalFY = v128_add_f32(fy, nfy);

        // Clear NFX, NFY
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)], zero_v);
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)], zero_v);

        // 3. Calculate forceVelocity for KRB (only if im > 0 and NOT sleeping)
        V128 im_gt_zero = v128_gt_f32(im, zero_v);
        V128 validMask = wasm_v128_andnot(im_gt_zero, isSleepingMask);

        V128 forceVX = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFX, gravFX), im), dt_v);
        V128 forceVY = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFY, gravFY), im), dt_v);

        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VX)], v128_select(validMask, forceVX, zero_v));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VY)], v128_select(validMask, forceVY, zero_v));

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
        V128 speed = wasm_f32x4_sqrt(speedSq);
        V128 invSpeed = v128_div_f32(v128_splat_f32(MAX_VELOCITY), speed);

        nextVX = v128_select(speedLimitMask, v128_mul_f32(nextVX, invSpeed), nextVX);
        nextVY = v128_select(speedLimitMask, v128_mul_f32(nextVY, invSpeed), nextVY);

        // Store back (only if NOT sleeping)
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)], v128_select(isSleepingMask, vx, nextVX));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)], v128_select(isSleepingMask, vy, nextVY));
    }

    // Tail handling
    for (int i = vectorizedCount; i < (int)bodiesList.size(); ++i) {
#else
    int bodyCount = (int)bodiesList.size();
    for (int i = 0; i < bodyCount; ++i) {
#endif
        if (bodiesList[i]->isSleeping) continue;

        int bIdx = i;
        float* fdata = liveBodyFloatData.data();
        float im = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IM)];
        float m = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_M)];
        float gScale = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_G_SCALE)];
        
        float gravFX = gravity.x * m * gScale;
        float gravFY = gravity.y * m * gScale;

        float totalFX = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FX)] + fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFX)];
        float totalFY = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FY)] + fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFY)];
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFX)] = 0;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFY)] = 0;

        if (im > 0) {
            fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FORCE_VX)] = (totalFX + gravFX) * im * dt;
            fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FORCE_VY)] = (totalFY + gravFY) * im * dt;
        } else {
            fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FORCE_VX)] = 0;
            fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_FORCE_VY)] = 0;
        }

        float linearDamping = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_DAMPING)];
        float vx = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)];
        float vy = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)];
        totalFX -= vx * linearDamping;
        totalFY -= vy * linearDamping;

        if (im > 0) {
            vx += (totalFX + gravFX) * im * dt;
            vy += (totalFY + gravFY) * im * dt;
        }

        float speedSq = vx * vx + vy * vy;
        if (speedSq > MAX_VELOCITY * MAX_VELOCITY) {
            float invSpeed = MAX_VELOCITY / std::sqrt(speedSq);
            vx *= invSpeed;
            vy *= invSpeed;
        }
        
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)] = vx;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)] = vy;
    }
}

void World::_doIntegratePositionsSIMD(float dt) {
#if HWY_TARGET != HWY_SCALAR
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    int vectorizedCount = (bodyCount / SIMD_LANE_COUNT) * SIMD_LANE_COUNT;

    V128 dt_v = v128_splat_f32(dt);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 one_v = v128_splat_f32(1.0f);
    V128 wake_threshold_v = v128_splat_f32(WAKE_MOVEMENT_THRESHOLD);
    V128 sleep_vel_sq_v = v128_splat_f32(SLEEP_VELOCITY_THRESHOLD * SLEEP_VELOCITY_THRESHOLD);
    V128 sleep_ang_vel_v = v128_splat_f32(SLEEP_ANGULAR_VELOCITY_THRESHOLD);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < vectorizedCount; i += SIMD_LANE_COUNT) {
        // Load data for SIMD_LANE_COUNT bodies
        V128 type = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_TYPE)]);
        V128 flags = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);

        V128 isFixed = wasm_i32x4_eq(type, wasm_i32x4_splat((int)ObjectType::FIXED_OBJECT));
        V128 isDynamic = wasm_i32x4_eq(type, wasm_i32x4_splat((int)ObjectType::DYNAMIC_OBJECT));
        V128 isSleeping = wasm_i32x4_ne(wasm_v128_and(flags, wasm_i32x4_splat(IS_SLEEPING)), wasm_i32x4_splat(0));

        V128 skipMask = wasm_v128_or(isFixed, isSleeping);

        V128 x = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)]);
        V128 y = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)]);
        V128 r = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)]);
        V128 vx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        V128 vy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);
        V128 rs = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_RS)]);
        V128 damping_a = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ANGULAR_DAMPING)]);

        V128 lastX = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_X)]);
        V128 lastY = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_Y)]);
        V128 lastR = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_R)]);

        V128 accX = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_X)]);
        V128 accY = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_Y)]);
        V128 accR = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_R)]);
        V128 sleepTimer = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_SLEEP_TIMER)]);

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

        V128 absAccX = wasm_f32x4_abs(accX);
        V128 absAccY = wasm_f32x4_abs(accY);
        V128 absAccR = wasm_f32x4_abs(accR);

        V128 moved = wasm_v128_or(wasm_v128_or(wasm_f32x4_ne(dx, zero_v), wasm_f32x4_ne(dy, zero_v)), wasm_f32x4_ne(dr, zero_v));
        V128 significantMove = wasm_v128_or(wasm_v128_or(v128_gt_f32(absAccX, wake_threshold_v), v128_gt_f32(absAccY, wake_threshold_v)), v128_gt_f32(absAccR, wake_threshold_v));

        V128 velSq = v128_mag_sq_f32(vx, vy);
        V128 aboveSleepVel = wasm_v128_or(v128_gt_f32(velSq, sleep_vel_sq_v), v128_gt_f32(wasm_f32x4_abs(rs), sleep_ang_vel_v));

        V128 resetTimerMask = wasm_v128_and(wasm_v128_and(moved, significantMove), aboveSleepVel);

        sleepTimer = v128_select(resetTimerMask, zero_v, v128_add_f32(sleepTimer, dt_v));
        accX = v128_select(resetTimerMask, zero_v, accX);
        accY = v128_select(resetTimerMask, zero_v, accY);
        accR = v128_select(resetTimerMask, zero_v, accR);

        // Store back (only if NOT skipMask)
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)], v128_select(skipMask, x, nextX));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)], v128_select(skipMask, y, nextY));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)], v128_select(skipMask, r, nextR));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)], v128_select(skipMask, vx, vx));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)], v128_select(skipMask, vy, vy));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_RS)], v128_select(skipMask, rs, rs));

        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_X)], v128_select(skipMask, lastX, nextX));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_Y)], v128_select(skipMask, lastY, nextY));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_R)], v128_select(skipMask, lastR, nextR));

        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_X)], v128_select(skipMask, accX, accX));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_Y)], v128_select(skipMask, accY, accY));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_R)], v128_select(skipMask, accR, accR));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_SLEEP_TIMER)], v128_select(skipMask, sleepTimer, sleepTimer));
    }

    // Tail handling
    for (int i = vectorizedCount; i < (int)bodiesList.size(); ++i) {
#else
    int bodyCount = (int)bodiesList.size();
    for (int i = 0; i < bodyCount; ++i) {
#endif
        Body* body = bodiesList[i];
        if (body->type == ObjectType::FIXED_OBJECT || body->isSleeping) continue;
        
        int bIdx = i;
        float* fdata = liveBodyFloatData.data();
        float vx = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)];
        float vy = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)];
        float rs = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_RS)];
        
        if (body->type == ObjectType::DYNAMIC_OBJECT) {
            float angularDamping = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ANGULAR_DAMPING)];
            rs *= (1.0f - angularDamping * dt);
        }
        
        float x = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)];
        float y = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)];
        float r = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)];
        
        float nextX = x + vx * dt;
        float nextY = y + vy * dt;
        float nextR = r + rs * dt;
        
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)] = nextX;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)] = nextY;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)] = nextR;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)] = vx;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)] = vy;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_RS)] = rs;
        
        float dx = nextX - fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_X)];
        float dy = nextY - fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_Y)];
        float dr = nextR - fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_R)];
        
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_X)] = nextX;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_Y)] = nextY;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_R)] = nextR;
        
        float accX = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_X)] + dx;
        float accY = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_Y)] + dy;
        float accR = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_R)] + dr;
        
        float timer = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_SLEEP_TIMER)];
        bool moved = dx != 0 || dy != 0 || dr != 0;
        
        if (moved && (std::abs(accX) > WAKE_MOVEMENT_THRESHOLD || std::abs(accY) > WAKE_MOVEMENT_THRESHOLD || std::abs(accR) > WAKE_MOVEMENT_THRESHOLD)) {
            if (vx * vx + vy * vy > SLEEP_VELOCITY_THRESHOLD * SLEEP_VELOCITY_THRESHOLD || std::abs(rs) > SLEEP_ANGULAR_VELOCITY_THRESHOLD) {
                timer = 0; accX = 0; accY = 0; accR = 0;
            } else {
                timer += dt;
            }
        } else {
            timer += dt;
        }
        
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_X)] = accX;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_Y)] = accY;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_ERR_ACC_R)] = accR;
        fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_SLEEP_TIMER)] = timer;
    }
}

void World::_syncFixturesSIMD() {
    int fixtureCount = (int)fixturesList.size();
    if (fixtureCount == 0) return;

#if HWY_TARGET != HWY_SCALAR
    int vectorizedCount = (fixtureCount / SIMD_LANE_COUNT) * SIMD_LANE_COUNT;

    float* fdata = liveFixtureFloatData.data();
    int* idata = liveFixtureIntData.data();
    float* bfdata = liveBodyFloatData.data();
    int* bidata = liveBodyIntData.data();

    V128 pad_v = v128_splat_f32(0.1f);
    V128 margin_ratio_v = v128_splat_f32(0.05f);
    V128 zero_v = v128_splat_f32(0.0f);
    V128 half_v = v128_splat_f32(0.5f);
    V128 two_v = v128_splat_f32(2.0f);
    V128 large_v = v128_splat_f32(1e10f);
    V128 nlarge_v = v128_splat_f32(-1e10f);

    for (int i = 0; i < vectorizedCount; i += SIMD_LANE_COUNT) {
        V128 bIdx_v = wasm_v128_load(&idata[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_BODY_INDEX)]);
        V128 shape_v = wasm_v128_load(&idata[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_SHAPE)]);
        
        alignas(64) uint32_t bIdx[HWY_MAX_LANES_D(DF)];
        wasm_v128_store(bIdx, bIdx_v);
        
        alignas(64) float bx[HWY_MAX_LANES_D(DF)], by[HWY_MAX_LANES_D(DF)], br[HWY_MAX_LANES_D(DF)], bvx[HWY_MAX_LANES_D(DF)], bvy[HWY_MAX_LANES_D(DF)], brs[HWY_MAX_LANES_D(DF)];
        alignas(64) int bflags[HWY_MAX_LANES_D(DF)];
        alignas(64) int btypes[HWY_MAX_LANES_D(DF)];
        for (int j = 0; j < SIMD_LANE_COUNT; ++j) {
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
        
        V128 bflags_v = wasm_v128_load(bflags);
        V128 btypes_v = wasm_v128_load(btypes);
        V128 isFixed = wasm_i32x4_eq(btypes_v, wasm_i32x4_splat((int)ObjectType::FIXED_OBJECT));
        
        V128 isSleepingMask = wasm_i32x4_ne(wasm_v128_and(bflags_v, wasm_i32x4_splat(IS_SLEEPING)), wasm_i32x4_splat(0));
        
        // Only skip if all are sleeping AND none are fixed objects.
        // Fixed objects need their world-space data for narrow-phase even if they don't move.
        V128 canSkipMask = wasm_v128_andnot(isSleepingMask, isFixed);
        if (v128_all_true(canSkipMask)) continue;
        
        V128 bx_v = wasm_v128_load(bx);
        V128 by_v = wasm_v128_load(by);
        V128 br_v = wasm_v128_load(br);
        V128 bvx_v = wasm_v128_load(bvx);
        V128 bvy_v = wasm_v128_load(bvy);
        V128 brs_v = wasm_v128_load(brs);

        V128 lx = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_X)]);
        V128 ly = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_Y)]);
        V128 lr = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_LOCAL_R)]);
        V128 w = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_W)]);
        V128 h = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_H)]);
        
        V128 cosR = wasm_f32x4_cos(br_v);
        V128 sinR = wasm_f32x4_sin(br_v);
        
        V128 wx = v128_add_f32(bx_v, v128_sub_f32(v128_mul_f32(lx, cosR), v128_mul_f32(ly, sinR)));
        V128 wy = v128_add_f32(by_v, v128_add_f32(v128_mul_f32(lx, sinR), v128_mul_f32(ly, cosR)));
        
        V128 totalRot = v128_add_f32(br_v, lr);
        V128 isAabbMask = wasm_i32x4_eq(shape_v, wasm_i32x4_splat((int)ObjectShape::AABB));
        
        V128 one_vec = v128_splat_f32(1.0f);
        V128 zero_vec = v128_splat_f32(0.0f);
        
        V128 cosTotal = v128_select(isAabbMask, one_vec, wasm_f32x4_cos(totalRot));
        V128 sinTotal = v128_select(isAabbMask, zero_vec, wasm_f32x4_sin(totalRot));

        V128 vCount_v = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_COUNT)]);
        int maxVCount = (int)hn::ExtractLane(hn::MaxOfLanes(DF(), vCount_v), 0);

        V128 aabbMinX = v128_splat_f32(1e10f);
        V128 aabbMinY = v128_splat_f32(1e10f);
        V128 aabbMaxX = v128_splat_f32(-1e10f);
        V128 aabbMaxY = v128_splat_f32(-1e10f);

        if (maxVCount > 0) {
            for (int k = 0; k < MAX_POLYGON_VERTICES; ++k) {
                V128 vx_l = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2)]);
                V128 vy_l = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2 + 1)]);
                
                V128 worldVX = v128_add_f32(wx, v128_sub_f32(v128_mul_f32(vx_l, cosTotal), v128_mul_f32(vy_l, sinTotal)));
                V128 worldVY = v128_add_f32(wy, v128_add_f32(v128_mul_f32(vx_l, sinTotal), v128_mul_f32(vy_l, cosTotal)));
                
                wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)], worldVX);
                wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)], worldVY);

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
            V128 p1x = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)]);
            V128 p1y = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)]);
            V128 p2x = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2)]);
            V128 p2y = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2 + 1)]);
            
            V128 edgeX = v128_sub_f32(p2x, p1x);
            V128 edgeY = v128_sub_f32(p2y, p1y);
            
            V128 nx = edgeY;
            V128 ny = v128_sub_f32(zero_vec, edgeX);
            
            V128 lenSq = v128_add_f32(v128_mul_f32(nx, nx), v128_mul_f32(ny, ny));
            V128 len = wasm_f32x4_sqrt(lenSq);
            V128 lenGtZero = v128_gt_f32(len, zero_vec);
            nx = v128_select(lenGtZero, v128_div_f32(nx, len), zero_vec);
            ny = v128_select(lenGtZero, v128_div_f32(ny, len), zero_vec);
            
            wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2)], nx);
            wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2 + 1)], ny);
        }

        V128 isCircleMask = wasm_v128_or(
            wasm_i32x4_eq(shape_v, wasm_i32x4_splat((int)ObjectShape::CIRCLE)),
            wasm_i32x4_eq(shape_v, wasm_i32x4_splat((int)ObjectShape::POINT))
        );
        V128 circMinX = v128_sub_f32(wx, w);
        V128 circMinY = v128_sub_f32(wy, w);
        V128 circMaxX = v128_add_f32(wx, w);
        V128 circMaxY = v128_add_f32(wy, w);
        
        aabbMinX = v128_select(isCircleMask, circMinX, aabbMinX);
        aabbMinY = v128_select(isCircleMask, circMinY, aabbMinY);
        aabbMaxX = v128_select(isCircleMask, circMaxX, aabbMaxX);
        aabbMaxY = v128_select(isCircleMask, circMaxY, aabbMaxY);
        
        V128 isCapsuleMask = wasm_i32x4_eq(shape_v, wasm_i32x4_splat((int)ObjectShape::CAPSULE));
        aabbMinX = v128_select(isCapsuleMask, v128_sub_f32(aabbMinX, w), aabbMinX);
        aabbMinY = v128_select(isCapsuleMask, v128_sub_f32(aabbMinY, w), aabbMinY);
        aabbMaxX = v128_select(isCapsuleMask, v128_add_f32(aabbMaxX, w), aabbMaxX);
        aabbMaxY = v128_select(isCapsuleMask, v128_add_f32(aabbMaxY, w), aabbMaxY);

        V128 oldAx1 = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX1)]);
        V128 oldAy1 = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY1)]);
        V128 oldAx2 = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX2)]);
        V128 oldAy2 = wasm_v128_load(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY2)]);
        
        V128 contains = wasm_v128_and(
            wasm_v128_and(v128_le_f32(oldAx1, aabbMinX), v128_le_f32(oldAy1, aabbMinY)),
            wasm_v128_and(v128_ge_f32(oldAx2, aabbMaxX), v128_ge_f32(oldAy2, aabbMaxY))
        );
        
        V128 half_vec = v128_splat_f32(0.5f);
        V128 two_vec = v128_splat_f32(2.0f);
        V128 hx = v128_mul_f32(v128_sub_f32(aabbMaxX, aabbMinX), half_vec);
        V128 hy = v128_mul_f32(v128_sub_f32(aabbMaxY, aabbMinY), half_vec);
        V128 size = v128_mul_f32(v128_max_f32(hx, hy), two_vec);
        
        V128 margin_ratio_vec = v128_splat_f32(0.05f);
        V128 margin = v128_mul_f32(size, margin_ratio_vec);
        V128 absRs = wasm_f32x4_abs(brs_v);
        
        V128 pad_vec = v128_splat_f32(0.1f);
        V128 paddingX_neg = v128_min_f32(v128_mul_f32(v128_sub_f32(bvx_v, v128_mul_f32(absRs, hy)), pad_vec), zero_vec);
        V128 paddingY_neg = v128_min_f32(v128_mul_f32(v128_sub_f32(bvy_v, v128_mul_f32(absRs, hx)), pad_vec), zero_vec);
        V128 paddingX_pos = v128_max_f32(v128_mul_f32(v128_add_f32(bvx_v, v128_mul_f32(absRs, hy)), pad_vec), zero_vec);
        V128 paddingY_pos = v128_max_f32(v128_mul_f32(v128_add_f32(bvy_v, v128_mul_f32(absRs, hx)), pad_vec), zero_vec);
        
        V128 fatMinX = v128_sub_f32(v128_add_f32(aabbMinX, paddingX_neg), margin);
        V128 fatMinY = v128_sub_f32(v128_add_f32(aabbMinY, paddingY_neg), margin);
        V128 fatMaxX = v128_add_f32(v128_add_f32(aabbMaxX, paddingX_pos), margin);
        V128 fatMaxY = v128_add_f32(v128_add_f32(aabbMaxY, paddingY_pos), margin);
        
        V128 updateMask = v128_not(contains);
        updateMask = wasm_v128_andnot(updateMask, isSleepingMask);
        
        V128 finalAx1 = v128_select(updateMask, fatMinX, oldAx1);
        V128 finalAy1 = v128_select(updateMask, fatMinY, oldAy1);
        V128 finalAx2 = v128_select(updateMask, fatMaxX, oldAx2);
        V128 finalAy2 = v128_select(updateMask, fatMaxY, oldAy2);
        
        wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX1)], finalAx1);
        wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY1)], finalAy1);
        wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AX2)], finalAx2);
        wasm_v128_store(&fdata[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_AY2)], finalAy2);

        if (v128_any_true(updateMask)) {
            alignas(64) uint32_t maskBits[HWY_MAX_LANES_D(DF)];
            wasm_v128_store(maskBits, updateMask);
            for (int j = 0; j < SIMD_LANE_COUNT; ++j) {
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
    
    for (int i = vectorizedCount; i < fixtureCount; ++i) {
#else
    for (int i = 0; i < fixtureCount; ++i) {
#endif
        Fixture* f = fixturesList[i];
        if (f->body->isSleeping && f->body->type != ObjectType::FIXED_OBJECT) continue;
        
        float cosR = std::cos(f->body->getRotation());
        float sinR = std::sin(f->body->getRotation());
        
        float px = f->body->getX();
        float py = f->body->getY();
        float lx = f->getLocalX();
        float ly = f->getLocalY();
        float wx = px + (lx * cosR - ly * sinR);
        float wy = py + (lx * sinR + ly * cosR);
        
        float lr = f->getLocalR();
        float totalRot = f->body->getRotation() + lr;
        float cosTotal = std::cos(totalRot);
        float sinTotal = std::sin(totalRot);
        if (f->shape == ObjectShape::AABB) {
            cosTotal = 1.0f;
            sinTotal = 0.0f;
        }

        int vCount = (int)liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_COUNT)];

        if (vCount > 0) {
            for(int k=0; k<MAX_POLYGON_VERTICES; ++k) {
                float vx_l = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2)];
                float vy_l = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_VERTEX_START + k * 2 + 1)];
                
                float worldVX = wx + (vx_l * cosTotal - vy_l * sinTotal);
                float worldVY = wy + (vx_l * sinTotal + vy_l * cosTotal);
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)] = worldVX;
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)] = worldVY;
            }
        }

        for (int k = 0; k < vCount; ++k) {
            int next_k = (k + 1) % MAX_POLYGON_VERTICES;
            float p1x = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2)];
            float p1y = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + k * 2 + 1)];
            float p2x = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2)];
            float p2y = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_VERTEX_START + next_k * 2 + 1)];
            
            float edgeX = p2x - p1x;
            float edgeY = p2y - p1y;
            float len = std::sqrt(edgeX * edgeX + edgeY * edgeY);
            if (len > 0) {
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2)] = edgeY / len;
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2 + 1)] = -edgeX / len;
            } else {
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2)] = 0.0f;
                liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(i, FIXTURE_FDATA_WORLD_NORMAL_START + k * 2 + 1)] = 0.0f;
            }
        }
        
        Aabb tightAabb = f->computeAabb(cosR, sinR, 1);
        if (!f->aabb.contains(tightAabb)) {
            f->updateAabb(cosR, sinR, 0);
            if (f->bvhNode) {
                f->bvhNode = bvh.updateLeaf(f->bvhNode, f->aabb, f->getCollisionProperties());
            }
        }
    }
}
