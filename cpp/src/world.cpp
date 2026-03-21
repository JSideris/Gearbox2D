#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include "simd-math.h"
#include <algorithm>
#include <type_traits>
#include <cmath>

World::World() : collisionSolver(*this) {
    timeStep = 1.0f / 60.0f;
    invTimeStep = 60.0f;
    velocityIterations = 50;
    positionIterations = 10;
    velocitySubSteps = 1;
    speculativeMargin = 0.01f;
    liveBodyFloatData.resize(MAX_BODIES * BODY_FDATA_EPO, 0.0f);
    liveBodyIntData.resize(MAX_BODIES * BODY_IDATA_EPO, 0);
    liveFixtureFloatData.resize(MAX_FIXTURES * FIXTURE_FDATA_EPO, 0.0f);
    liveFixtureIntData.resize(MAX_FIXTURES * FIXTURE_IDATA_EPO, 0);
    contactConstraints.reserve(1000);
    solverBodies.resize(MAX_BODIES);
    solverBodyActive.resize(MAX_BODIES, 0);
    nextFixtureId = 1;
#ifdef GEARBOX_MT
    // Initialize the thread pool with 4 threads matching PTHREAD_POOL_SIZE
    threadPool = std::make_unique<ThreadPool>(4);
    for (int i = 0; i < 4; ++i) {
        mtSolvers.push_back(std::make_unique<ThreadLocalSolver>(*this));
    }
#endif
}

World::~World() {
    clear();
}

int World::createBody(int id, emscripten_val options) {
    int bIdx = bodiesList.size();
    auto* body = new Body(*this, id, bIdx, options);
    body->worldIndex = bIdx;
    bodiesMap[id] = body;
    if (id >= (int)_idToBody.size()) _idToBody.resize(id + 1, nullptr);
    _idToBody[id] = body;
    bodiesList.push_back(body);

    // Support atomic creation of multiple fixtures
    if (!options["fixtures"].isUndefined()) {
        emscripten_val fixtures = options["fixtures"];
        int length = fixtures["length"].as<int>();
        for (int i = 0; i < length; ++i) {
            createFixture(id, 0, fixtures[i], true);
        }
    }

    // Only create an initial fixture if shape is specified (legacy/single fixture support)
    if (!options["shape"].isUndefined()) {
        int fId = (!options["fixtureId"].isUndefined()) ? options["fixtureId"].as<int>() : nextFixtureId++;
        createFixture(id, fId, options, true);
    }

    return body->worldIndex;
}

int World::createFixture(int bodyId, int fixtureId, emscripten_val options, bool recomputeMass) {
    auto it = bodiesMap.find(bodyId);
    if (it == bodiesMap.end()) return -1;
    Body* body = it->second;

    int fId = (fixtureId > 0) ? fixtureId : nextFixtureId++;
    int fIdx = (int)fixturesList.size();
    auto* fixture = new Fixture(*this, fId, fIdx, body, options);
    fixture->worldIndex = fIdx;
    fixturesMap[fId] = fixture;
    if (fId >= (int)_idToFixture.size()) _idToFixture.resize(fId + 1, nullptr);
    _idToFixture[fId] = fixture;
    fixturesList.push_back(fixture);
    
    body->addFixture(fixture, recomputeMass);
    fixture->updateAabb(1);

    fixture->bvhNode = bvh.insert(fixture->aabb, fixture, fixture->getCollisionProperties());

    return fixture->worldIndex;
}

int World::removeObject(int id) {
    auto itBody = bodiesMap.find(id);
    if (itBody == bodiesMap.end()) return -1;

    Body* body = itBody->second;
    int bIdx = body->worldIndex;
    
    // Remove joints
    std::vector<int> jointsToRemove;
    for (auto& pair : jointsMap) {
        if (pair.second->isConnectedTo(body)) jointsToRemove.push_back(pair.first);
    }
    for (int jId : jointsToRemove) removeJoint(jId);

    // Remove fixtures
    std::vector<int> fixtureIds;
    for (auto* fixture : body->fixtures) {
        fixtureIds.push_back(fixture->id);
        if (fixture->bvhNode) {
            bvh.remove(fixture->bvhNode);
            fixture->bvhNode = nullptr;
        }
        
        int fIdx = fixture->worldIndex;
        if (fIdx != -1 && fIdx < (int)fixturesList.size()) {
            int lastIdx = (int)fixturesList.size() - 1;
            if (fIdx != lastIdx) {
                // Swap pointers in list
                std::swap(fixturesList[fIdx], fixturesList[lastIdx]);
                
                // Swap data in SoA arrays
                for (int i = 0; i < FIXTURE_IDATA_EPO; ++i) {
                    liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(fIdx, i)] = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(lastIdx, i)];
                }
                for (int i = 0; i < FIXTURE_FDATA_EPO; ++i) {
                    liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(fIdx, i)] = liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(lastIdx, i)];
                }
                
                // Update the index of the fixture that was moved from the end to fIdx
                fixturesList[fIdx]->worldIndex = fIdx;
            }
            
            fixturesList.pop_back();
            // In SoA, we don't pop_back from data vectors as they are fixed size.
        }
        fixturesMap.erase(fixture->id);
        if (fixture->id < (int)_idToFixture.size()) _idToFixture[fixture->id] = nullptr;
        delete fixture;
    }

    // Scrub contact tracking state for this body and its fixtures
    for (auto it = bodyContactCounts.begin(); it != bodyContactCounts.end(); ) {
        if (it->first.first == id || it->first.second == id) it = bodyContactCounts.erase(it);
        else ++it;
    }
    for (int fId : fixtureIds) {
        for (auto it = currentPairs.begin(); it != currentPairs.end(); ) {
            if (it->first == fId || it->second == fId) it = currentPairs.erase(it);
            else ++it;
        }
        for (auto it = prevPairs.begin(); it != prevPairs.end(); ) {
            if (it->first == fId || it->second == fId) it = prevPairs.erase(it);
            else ++it;
        }
        for (auto it = resolvedImpulses.begin(); it != resolvedImpulses.end(); ) {
            if (it->first.first == fId || it->first.second == fId) it = resolvedImpulses.erase(it);
            else ++it;
        }
        for (auto it = warmStartImpulses.begin(); it != warmStartImpulses.end(); ) {
            if (it->first.first == fId || it->first.second == fId) it = warmStartImpulses.erase(it);
            else ++it;
        }
    }
    body->fixtures.clear(); // Important: prevent dangling pointers

    // Remove body
    if (bIdx != -1 && bIdx < (int)bodiesList.size()) {
        int lastIdx = (int)bodiesList.size() - 1;
        
        if (bIdx != lastIdx) {
            // Swap pointers in list
            std::swap(bodiesList[bIdx], bodiesList[lastIdx]);
            
            // Swap data in SoA arrays
            for (int i = 0; i < BODY_IDATA_EPO; ++i) {
                liveBodyIntData[GET_BODY_IDATA_INDEX(bIdx, i)] = liveBodyIntData[GET_BODY_IDATA_INDEX(lastIdx, i)];
            }
            for (int i = 0; i < BODY_FDATA_EPO; ++i) {
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, i)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(lastIdx, i)];
            }
            
            // Update the index of the body that was moved from the end to bIdx
            bodiesList[bIdx]->worldIndex = bIdx;
            
            // Update all fixtures of the moved body to point to the new body index
            for (auto* f : bodiesList[bIdx]->fixtures) {
                liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f->worldIndex, FIXTURE_IDATA_BODY_INDEX)] = bIdx;
            }
        }

        // Just pop from the pointer list
        bodiesList.pop_back();
        // In SoA, we don't pop_back from data vectors
    }
    
    bodiesMap.erase(itBody);
    if (id < (int)_idToBody.size()) _idToBody[id] = nullptr;
    delete body;
    return bIdx;
}

void World::step() {
    currentPairs.clear();

    // Propagate wakefulness along joints
    bool changed = true;
    while (changed) {
        changed = false;
        for (auto& pair : jointsMap) {
            Joint* j = pair.second.get();
            if (j->bodyA->isSleeping != j->bodyB->isSleeping) {
                if (j->bodyA->isSleeping && j->bodyA->type != ObjectType::FIXED_OBJECT) {
                    j->bodyA->wakeUp();
                    changed = true;
                } else if (j->bodyB->isSleeping && j->bodyB->type != ObjectType::FIXED_OBJECT) {
                    j->bodyB->wakeUp();
                    changed = true;
                }
            }
        }
    }

    // Clear collision flags on all bodies and fixtures
    for (int i = 0; i < (int)bodiesList.size(); ++i) {
        liveBodyIntData[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
        
        // Reset forces and accumulated impulses from the previous frame
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FX)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FY)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IX)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IY)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IA)] = 0;
    }
    for (int i = 0; i < (int)fixturesList.size(); ++i) {
        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_FLAGS)] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
    }

    for (int i = 0; i < (int)bodiesList.size(); ++i) {
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_X)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)];
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_Y)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)];
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_R)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)];
    }

    eventData.clear();

    float subStepDt = timeStep / velocitySubSteps;
    
    // Apply position integration per substep as well
    for (int i = 0; i < velocitySubSteps; ++i) {
        _doIntegrateVelocitiesSubStep(subStepDt);
        _doBroadPhase();
        _doNarrowPhase(subStepDt);
        
        _buildAndProcessIslands(subStepDt, i);
    }
    _doContactManagement();
}

void World::_doIntegrateVelocitiesSubStep(float dt) {
    // 1. Scalar Pass: Wake up logic and discrete impulses
    // This pass is branchy, so we keep it scalar.
    for (auto* body : bodiesList) {
        int bIdx = body->worldIndex;
        if (body->isSleeping && body->type != ObjectType::FIXED_OBJECT) {
            if (liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFX)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFY)] != 0) {
                body->wakeUp();
            }
        }
        
        if (body->isSleeping) continue;

        float im = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IM)];
        float invI = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_INV_INERTIA)];
        
        // Apply discrete impulses (NIX, NIY, NIA)
        float nix = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)];
        float niy = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)];
        if (nix != 0 || niy != 0) {
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IX)] += nix;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IY)] += niy;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)] += nix * im;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)] += niy * im;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)] = 0;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)] = 0;
        }
        
        float nia = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)];
        if (nia != 0) {
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IA)] += nia;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_RS)] += nia * invI;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)] = 0;
        }
    }

    // 2. Vectorized Pass: Dense math (forces, gravity, damping, velocity integration)
    _doIntegrateVelocitiesSIMD(dt);
}

void World::_doIntegrateVelocitiesSIMD(float dt) {
#ifdef __EMSCRIPTEN__
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    int vectorizedCount = (bodyCount / 4) * 4;

    v128_t dt_v = v128_splat_f32(dt);
    v128_t gravX_v = v128_splat_f32(gravity.x);
    v128_t gravY_v = v128_splat_f32(gravity.y);
    v128_t maxVelSq_v = v128_splat_f32(MAX_VELOCITY * MAX_VELOCITY);
    v128_t zero_v = v128_splat_f32(0.0f);
    v128_t one_v = v128_splat_f32(1.0f);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < vectorizedCount; i += 4) {
        // Load isSleeping mask
        v128_t flags = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);
        v128_t isSleepingMask = wasm_i32x4_ne(wasm_v128_and(flags, wasm_i32x4_splat(IS_SLEEPING)), wasm_i32x4_splat(0));
        
        // Load attributes
        v128_t im = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IM)]);
        v128_t m = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_M)]);
        v128_t gScale = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_G_SCALE)]);
        v128_t fx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FX)]);
        v128_t fy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FY)]);
        v128_t nfx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)]);
        v128_t nfy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)]);
        v128_t damping = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_DAMPING)]);
        v128_t vx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        v128_t vy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);

        // 1. Compute gravity force
        v128_t gravFX = v128_mul_f32(v128_mul_f32(gravX_v, m), gScale);
        v128_t gravFY = v128_mul_f32(v128_mul_f32(gravY_v, m), gScale);

        // 2. Apply external forces (NFX, NFY)
        v128_t totalFX = v128_add_f32(fx, nfx);
        v128_t totalFY = v128_add_f32(fy, nfy);
        
        // Clear NFX, NFY
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)], zero_v);
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)], zero_v);

        // 3. Calculate forceVelocity for KRB (only if im > 0 and NOT sleeping)
        v128_t im_gt_zero = v128_gt_f32(im, zero_v);
        v128_t validMask = wasm_v128_andnot(im_gt_zero, isSleepingMask);
        
        v128_t forceVX = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFX, gravFX), im), dt_v);
        v128_t forceVY = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFY, gravFY), im), dt_v);
        
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VX)], v128_select(validMask, forceVX, zero_v));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FORCE_VY)], v128_select(validMask, forceVY, zero_v));

        // 4. Apply damping
        totalFX = v128_sub_f32(totalFX, v128_mul_f32(vx, damping));
        totalFY = v128_sub_f32(totalFY, v128_mul_f32(vy, damping));

        // 5. Integrate total velocity
        v128_t dvx = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFX, gravFX), im), dt_v);
        v128_t dvy = v128_mul_f32(v128_mul_f32(v128_add_f32(totalFY, gravFY), im), dt_v);
        
        v128_t nextVX = v128_add_f32(vx, dvx);
        v128_t nextVY = v128_add_f32(vy, dvy);

        // 6. Cap velocity
        v128_t speedSq = v128_mag_sq_f32(nextVX, nextVY);
        v128_t speedLimitMask = v128_gt_f32(speedSq, maxVelSq_v);
        
        // if (speedSq > maxVelSq) v *= maxVel / sqrt(speedSq)
        v128_t speed = wasm_f32x4_sqrt(speedSq);
        v128_t invSpeed = v128_div_f32(v128_splat_f32(MAX_VELOCITY), speed);
        
        nextVX = v128_select(speedLimitMask, v128_mul_f32(nextVX, invSpeed), nextVX);
        nextVY = v128_select(speedLimitMask, v128_mul_f32(nextVY, invSpeed), nextVY);

        // Store back (only if NOT sleeping)
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)], v128_select(isSleepingMask, vx, nextVX));
        wasm_v128_store(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)], v128_select(isSleepingMask, vy, nextVY));
    }

    // Tail handling
    for (int i = vectorizedCount; i < bodyCount; ++i) {
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
#ifdef __EMSCRIPTEN__
    int bodyCount = (int)bodiesList.size();
    if (bodyCount == 0) return;

    int vectorizedCount = (bodyCount / 4) * 4;

    v128_t dt_v = v128_splat_f32(dt);
    v128_t zero_v = v128_splat_f32(0.0f);
    v128_t one_v = v128_splat_f32(1.0f);
    v128_t wake_threshold_v = v128_splat_f32(WAKE_MOVEMENT_THRESHOLD);
    v128_t sleep_vel_sq_v = v128_splat_f32(SLEEP_VELOCITY_THRESHOLD * SLEEP_VELOCITY_THRESHOLD);
    v128_t sleep_ang_vel_v = v128_splat_f32(SLEEP_ANGULAR_VELOCITY_THRESHOLD);

    float* fdata = liveBodyFloatData.data();
    int* idata = liveBodyIntData.data();

    for (int i = 0; i < vectorizedCount; i += 4) {
        // Load data for 4 bodies
        v128_t type = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_TYPE)]);
        v128_t flags = wasm_v128_load(&idata[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)]);
        
        v128_t isFixed = wasm_i32x4_eq(type, wasm_i32x4_splat((int)ObjectType::FIXED_OBJECT));
        v128_t isDynamic = wasm_i32x4_eq(type, wasm_i32x4_splat((int)ObjectType::DYNAMIC_OBJECT));
        v128_t isSleeping = wasm_i32x4_ne(wasm_v128_and(flags, wasm_i32x4_splat(IS_SLEEPING)), wasm_i32x4_splat(0));
        
        v128_t skipMask = wasm_v128_or(isFixed, isSleeping);

        v128_t x = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)]);
        v128_t y = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)]);
        v128_t r = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)]);
        v128_t vx = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VX)]);
        v128_t vy = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_VY)]);
        v128_t rs = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_RS)]);
        v128_t damping_a = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ANGULAR_DAMPING)]);
        
        v128_t lastX = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_X)]);
        v128_t lastY = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_Y)]);
        v128_t lastR = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_LAST_R)]);
        
        v128_t accX = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_X)]);
        v128_t accY = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_Y)]);
        v128_t accR = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_ERR_ACC_R)]);
        v128_t sleepTimer = wasm_v128_load(&fdata[GET_BODY_FDATA_INDEX(i, BODY_FDATA_SLEEP_TIMER)]);

        // 1. Angular Damping (only dynamic)
        v128_t dampFactor = v128_sub_f32(one_v, v128_mul_f32(damping_a, dt_v));
        rs = v128_select(isDynamic, v128_mul_f32(rs, dampFactor), rs);

        // 2. Integrate
        v128_t nextX = v128_add_f32(x, v128_mul_f32(vx, dt_v));
        v128_t nextY = v128_add_f32(y, v128_mul_f32(vy, dt_v));
        v128_t nextR = v128_add_f32(r, v128_mul_f32(rs, dt_v));

        // 3. NaN check (simplified SIMD version: just check vx, vy, rs)
        v128_t finiteMask = wasm_v128_and(wasm_v128_and(wasm_f32x4_eq(vx, vx), wasm_f32x4_eq(vy, vy)), wasm_f32x4_eq(rs, rs));
        
        nextX = v128_select(finiteMask, nextX, lastX);
        nextY = v128_select(finiteMask, nextY, lastY);
        nextR = v128_select(finiteMask, nextR, lastR);
        vx = v128_select(finiteMask, vx, zero_v);
        vy = v128_select(finiteMask, vy, zero_v);
        rs = v128_select(finiteMask, rs, zero_v);

        // 4. Movement track
        v128_t dx = v128_sub_f32(nextX, lastX);
        v128_t dy = v128_sub_f32(nextY, lastY);
        v128_t dr = v128_sub_f32(nextR, lastR);
        
        accX = v128_add_f32(accX, dx);
        accY = v128_add_f32(accY, dy);
        accR = v128_add_f32(accR, dr);
        
        v128_t absAccX = wasm_f32x4_abs(accX);
        v128_t absAccY = wasm_f32x4_abs(accY);
        v128_t absAccR = wasm_f32x4_abs(accR);
        
        v128_t moved = wasm_v128_or(wasm_v128_or(wasm_f32x4_ne(dx, zero_v), wasm_f32x4_ne(dy, zero_v)), wasm_f32x4_ne(dr, zero_v));
        v128_t significantMove = wasm_v128_or(wasm_v128_or(v128_gt_f32(absAccX, wake_threshold_v), v128_gt_f32(absAccY, wake_threshold_v)), v128_gt_f32(absAccR, wake_threshold_v));
        
        v128_t velSq = v128_mag_sq_f32(vx, vy);
        v128_t aboveSleepVel = wasm_v128_or(v128_gt_f32(velSq, sleep_vel_sq_v), v128_gt_f32(wasm_f32x4_abs(rs), sleep_ang_vel_v));
        
        v128_t resetTimerMask = wasm_v128_and(wasm_v128_and(moved, significantMove), aboveSleepVel);
        
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
    for (int i = vectorizedCount; i < bodyCount; ++i) {
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
        
        if (!std::isfinite(nextX) || !std::isfinite(nextY) || !std::isfinite(nextR) || 
            !std::isfinite(vx) || !std::isfinite(vy) || !std::isfinite(rs)) {
            nextX = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_X)];
            nextY = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_Y)];
            nextR = fdata[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_LAST_R)];
            vx = 0; vy = 0; rs = 0;
        }
        
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

void World::_doBroadPhase() {
    bvh.detectCollisions();
}

void World::_doNarrowPhase(float dt) {
    collisionSolver.clear();

    // Sequential pass for broadphase flags (very fast)
    for (auto& pair : bvh.collisionPairs) {
        Fixture* f1 = static_cast<Fixture*>(pair.first);
        Fixture* f2 = static_cast<Fixture*>(pair.second);

        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f1->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_AABB_COLLISION;
        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_AABB_COLLISION;
        liveBodyIntData[GET_BODY_IDATA_INDEX(f1->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_AABB_COLLISION;
        liveBodyIntData[GET_BODY_IDATA_INDEX(f2->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_AABB_COLLISION;
    }

    // Sort collision pairs to enable SIMD batching (same f1, same shape for f2)
    std::sort(bvh.collisionPairs.begin(), bvh.collisionPairs.end(), [this](const auto& a, const auto& b) {
        Fixture* f1a = static_cast<Fixture*>(a.first);
        Fixture* f2a = static_cast<Fixture*>(a.second);
        Fixture* f1b = static_cast<Fixture*>(b.first);
        Fixture* f2b = static_cast<Fixture*>(b.second);

        if (f1a->worldIndex != f1b->worldIndex) return f1a->worldIndex < f1b->worldIndex;
        int shape2a = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2a->worldIndex, FIXTURE_IDATA_SHAPE)];
        int shape2b = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2b->worldIndex, FIXTURE_IDATA_SHAPE)];
        return shape2a < shape2b;
    });

#ifdef GEARBOX_MT
    int pairCount = bvh.collisionPairs.size();
    if (pairCount > 0) {
        // Narrow-Phase Solving in Parallel
        int numThreads = mtSolvers.size();
        int batchSize = (pairCount + numThreads - 1) / numThreads;

        for (int i = 0; i < numThreads; ++i) {
            int start = i * batchSize;
            int end = std::min(start + batchSize, pairCount);
            if (start >= end) continue;

            mtSolvers[i]->solver.clear();
            mtSolvers[i]->collisionPairs.clear();

            threadPool->enqueue([this, i, start, end, dt]() {
                auto& solver = mtSolvers[i]->solver;
                for (int j = start; j < end; ) {
                    auto& pair = bvh.collisionPairs[j];
                    Fixture* f1 = static_cast<Fixture*>(pair.first);
                    Fixture* f2 = static_cast<Fixture*>(pair.second);

                    const auto& d1 = f1->body->_disabledBodyIds;
                    if (!d1.empty() && std::find(d1.begin(), d1.end(), f2->body->id) != d1.end()) { j++; continue; }

                    int shape1 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f1->worldIndex, FIXTURE_IDATA_SHAPE)];
                    int shape2 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2->worldIndex, FIXTURE_IDATA_SHAPE)];

                    // SIMD 1-vs-4 run-length check
                    if (shape1 == (int)ObjectShape::CIRCLE && (j + 3 < end)) {
                        bool canSimd = true;
                        int indicesB[4];
                        indicesB[0] = f2->worldIndex;
                        for (int k = 1; k < 4; ++k) {
                            Fixture* nextF1 = static_cast<Fixture*>(bvh.collisionPairs[j + k].first);
                            Fixture* nextF2 = static_cast<Fixture*>(bvh.collisionPairs[j + k].second);
                            int nextShape2 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(nextF2->worldIndex, FIXTURE_IDATA_SHAPE)];
                            const auto& nextD1 = nextF1->body->_disabledBodyIds;
                            if (nextF1->worldIndex != f1->worldIndex || nextShape2 != shape2 || 
                                (!nextD1.empty() && std::find(nextD1.begin(), nextD1.end(), nextF2->body->id) != nextD1.end())) {
                                canSimd = false;
                                break;
                            }
                            indicesB[k] = nextF2->worldIndex;
                        }

                        if (canSimd) {
                            int prevCollisions = (int)solver.collisions.size();
                            int count = 0;
                            if (shape2 == (int)ObjectShape::CIRCLE) {
                                count = solver._solveCircleCircleSIMD(f1->worldIndex, indicesB, dt);
                            } else if (shape2 == (int)ObjectShape::POINT) {
                                count = solver._solveCirclePointSIMD(f1->worldIndex, indicesB, dt);
                            }

                            if (count > 0) {
                                for (int k = prevCollisions; k < (int)solver.collisions.size(); ++k) {
                                    auto& info = solver.collisions[k];
                                    mtSolvers[i]->collisionPairs.insert({fixturesList[info.indexA]->id, fixturesList[info.indexB]->id});
                                }
                            }
                            j += 4;
                            continue;
                        }
                    }

                    if (solver.solve(f1->worldIndex, f2->worldIndex, dt)) {
                        mtSolvers[i]->collisionPairs.insert({f1->id, f2->id});
                    }
                    j++;
                }
            });
        }
        threadPool->wait();

        // Merge results sequentially
        for (int i = 0; i < numThreads; ++i) {
            for (const auto& info : mtSolvers[i]->solver.collisions) {
                collisionSolver.collisions.push_back(info);
            }
            for (const auto& pair : mtSolvers[i]->collisionPairs) {
                currentPairs.insert(pair);

                // Update HAS_PHYSICAL_COLLISION flags
                Fixture* f1 = getFixture(pair.first);
                Fixture* f2 = getFixture(pair.second);
                if (f1 && f2) {
                    liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f1->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                    liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                    liveBodyIntData[GET_BODY_IDATA_INDEX(f1->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                    liveBodyIntData[GET_BODY_IDATA_INDEX(f2->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                }
            }
        }
    }
#else
    for (int j = 0; j < (int)bvh.collisionPairs.size(); ) {
        auto& pair = bvh.collisionPairs[j];
        Fixture* f1 = static_cast<Fixture*>(pair.first);
        Fixture* f2 = static_cast<Fixture*>(pair.second);

        const auto& d1 = f1->body->_disabledBodyIds;
        if (!d1.empty() && std::find(d1.begin(), d1.end(), f2->body->id) != d1.end()) { j++; continue; }

        int shape1 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f1->worldIndex, FIXTURE_IDATA_SHAPE)];
        int shape2 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2->worldIndex, FIXTURE_IDATA_SHAPE)];

        // SIMD 1-vs-4 run-length check
        if (shape1 == (int)ObjectShape::CIRCLE && (j + 3 < (int)bvh.collisionPairs.size())) {
            bool canSimd = true;
            int indicesB[4];
            indicesB[0] = f2->worldIndex;
            for (int k = 1; k < 4; ++k) {
                Fixture* nextF1 = static_cast<Fixture*>(bvh.collisionPairs[j + k].first);
                Fixture* nextF2 = static_cast<Fixture*>(bvh.collisionPairs[j + k].second);
                int nextShape2 = liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(nextF2->worldIndex, FIXTURE_IDATA_SHAPE)];
                const auto& nextD1 = nextF1->body->_disabledBodyIds;
                if (nextF1->worldIndex != f1->worldIndex || nextShape2 != shape2 || 
                    (!nextD1.empty() && std::find(nextD1.begin(), nextD1.end(), nextF2->body->id) != nextD1.end())) {
                    canSimd = false;
                    break;
                }
                indicesB[k] = nextF2->worldIndex;
            }

            if (canSimd) {
                int prevCollisions = (int)collisionSolver.collisions.size();
                int count = 0;
                if (shape2 == (int)ObjectShape::CIRCLE) {
                    count = collisionSolver._solveCircleCircleSIMD(f1->worldIndex, indicesB, dt);
                } else if (shape2 == (int)ObjectShape::POINT) {
                    count = collisionSolver._solveCirclePointSIMD(f1->worldIndex, indicesB, dt);
                }

                if (count > 0) {
                    for (int k = prevCollisions; k < (int)collisionSolver.collisions.size(); ++k) {
                        auto& info = collisionSolver.collisions[k];
                        currentPairs.insert({fixturesList[info.indexA]->id, fixturesList[info.indexB]->id});

                        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(info.indexA, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(info.indexB, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                        liveBodyIntData[GET_BODY_IDATA_INDEX(fixturesList[info.indexA]->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                        liveBodyIntData[GET_BODY_IDATA_INDEX(fixturesList[info.indexB]->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
                    }
                }
                j += 4;
                continue;
            }
        }

        if (collisionSolver.solve(f1->worldIndex, f2->worldIndex, dt)) {
            currentPairs.insert({f1->id, f2->id});

            liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f1->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
            liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(f2->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
            liveBodyIntData[GET_BODY_IDATA_INDEX(f1->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
            liveBodyIntData[GET_BODY_IDATA_INDEX(f2->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
        }
        j++;
    }
#endif
}

void World::_doContactManagement() {
    // Process all newly active pairs
    for (const auto& pair : currentPairs) {
        if (prevPairs.find(pair) == prevPairs.end()) {
            Fixture* fA = getFixture(pair.first);
            Fixture* fB = getFixture(pair.second);
            if (fA && fB) {
                Body* bA = fA->body;
                Body* bB = fB->body;

                std::pair<int, int> bodyPair = {bA->id, bB->id};
                if (bodyPair.first > bodyPair.second) std::swap(bodyPair.first, bodyPair.second);

                if (bodyContactCounts[bodyPair]++ == 0) { // first contact between these bodies
                    bA->addContact(bB);
                    bB->addContact(bA);
                }

                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_START, bA->id, bB->id, fA->id, fB->id, resolvedImpulses[pair]);
                }
            }
        }
    }
    // Process pairs that ended
    for (const auto& pair : prevPairs) {
        if (currentPairs.find(pair) == currentPairs.end()) {
            Fixture* fA = getFixture(pair.first);
            Fixture* fB = getFixture(pair.second);
            if (fA && fB) {
                Body* bA = fA->body;
                Body* bB = fB->body;
                if (bA->isSleeping && bB->isSleeping) {
                    currentPairs.insert(pair);
                    continue;
                }

                std::pair<int, int> bodyPair = {bA->id, bB->id};
                if (bodyPair.first > bodyPair.second) std::swap(bodyPair.first, bodyPair.second);

                if (--bodyContactCounts[bodyPair] == 0) {
                    bA->removeContact(bB);
                    bB->removeContact(bA);
                    bodyContactCounts.erase(bodyPair);
                    _maybePruneBodyContactCounts();
                }

                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_END, bA->id, bB->id, fA->id, fB->id, 0);
                }
            }
        }
    }
    prevPairs = currentPairs;
    // Only shrink maps occasionally to reduce overhead
    static int pruneCounter = 0;
    if (++pruneCounter % 600 == 0) {
        _clearContactTracking();
        _maybePrunePairs();
        _maybePruneBodyContactCounts();
    }
}

void World::_clearContactTracking() {
    if (currentPairs.empty() && prevPairs.empty() && resolvedImpulses.empty() && warmStartImpulses.empty() && bodyContactCounts.empty()) return;

    // Prune buckets if maps grow too large but are mostly empty
    // This addresses the "infinite bucket growth" performance issue
    auto shrinkMap = [](auto& m) {
        // If map is large and sparsely populated, shrink it
        if (m.bucket_count() > 1024 && m.size() * 4 < m.bucket_count()) {
            m = std::move(std::decay_t<decltype(m)>(m)); // Force rehash to smaller capacity
        }
        if (m.empty() && m.bucket_count() > 128) {
            m = std::move(std::decay_t<decltype(m)>()); // Force reallocate to default capacity
        }
    };

    shrinkMap(resolvedImpulses);
    shrinkMap(warmStartImpulses);
}

void World::_maybePruneBodyContactCounts() {
    if (bodyContactCounts.empty() && bodyContactCounts.bucket_count() > 1024) {
        bodyContactCounts = std::move(std::decay_t<decltype(bodyContactCounts)>());
    }
}

void World::_maybePrunePairs() {
    if (currentPairs.empty() && currentPairs.bucket_count() > 1024) {
        currentPairs = std::move(std::decay_t<decltype(currentPairs)>());
    }
    if (prevPairs.empty() && prevPairs.bucket_count() > 1024) {
        prevPairs = std::move(std::decay_t<decltype(prevPairs)>());
    }
}

void World::_buildAndProcessIslands(float dt, int substepIndex) {
    int bodyCount = bodiesList.size();
    std::vector<bool> visited(bodyCount, false);
    std::vector<Body*> stack;

    // Reset joint inIsland flags
    for (auto& pair : jointsMap) {
        pair.second->inIsland = false;
    }
    
    // Clear collision tracking flags that we'll use during DFS if needed
    // or just use the local visited vector.
    
    // 1. Generate all contact constraints first, so we can follow them in DFS
    contactConstraints.clear();
    for (auto& col : collisionSolver.collisions) {
        Fixture* fA = fixturesList[col.indexA];
        Fixture* fB = fixturesList[col.indexB];
        Body* bA = fA->body;
        Body* bB = fB->body;

        if (fA->isSensor() || fB->isSensor()) continue;
        if (bA->getInverseMass() + bB->getInverseMass() == 0) continue;

        ContactConstraint c;
        c.a = bA; c.b = bB;
        c.fA = fA; c.fB = fB;
        c.point = col.contactPoint;
        c.normal = col.normal;
        c.depth = col.penetrationDepth;
        
        float resA = fA->getRestitution();
        float resB = fB->getRestitution();
        c.restitution = std::max(resA, resB);
        
        float sFricA = fA->getStaticFriction();
        float sFricB = fB->getStaticFriction();
        c.staticFriction = std::sqrt(sFricA * sFricB);
        
        float kFricA = fA->getKineticFriction();
        float kFricB = fB->getKineticFriction();
        c.kineticFriction = std::sqrt(kFricA * kFricB);
        c.id = col.id;

        c.preSolve(dt, hasRestitution, hasPenetrationResolution, hasFriction);

        // Warm Starting
        std::pair<int, int> fPair = {fA->id, fB->id};
        if (fPair.first > fPair.second) std::swap(fPair.first, fPair.second);

        auto it = warmStartImpulses.find(fPair);
        if (it != warmStartImpulses.end()) {
            int bestMatchIdx = -1;
            for (int i = 0; i < it->second.count; ++i) {
                if (it->second.impulses[i].id.key == c.id.key) {
                    bestMatchIdx = i;
                    break;
                }
            }
            if (bestMatchIdx != -1) {
                c.normalImpulse = it->second.impulses[bestMatchIdx].normalImpulse;
                c.frictionImpulse = it->second.impulses[bestMatchIdx].frictionImpulse;
            }
        }
        contactConstraints.push_back(c);
    }
    
    // 2. Pre-solve all joints globally so they can modify body velocities for warm-starting
    for (auto& pair : jointsMap) {
        pair.second->preSolve(dt);
    }
    
    // Map bodies to their contact constraints for fast DFS
    std::vector<std::vector<ContactConstraint*>> bodyToContacts(bodyCount);
    for (auto& c : contactConstraints) {
        bodyToContacts[c.a->worldIndex].push_back(&c);
        bodyToContacts[c.b->worldIndex].push_back(&c);
    }
    
    // 2. DFS partitioning
    std::vector<Island> islands;
    
    // 2.1 Pre-initialize solver data for all bodies to avoid race conditions 
    // when multiple islands share a static body.
    for (int i = 0; i < bodyCount; ++i) {
        solverBodies[i] = bodiesList[i]->getSolverData();
        solverBodyActive[i] = 1; // Mark as initialized
    }

    for (int i = 0; i < bodyCount; ++i) {
        Body* seed = bodiesList[i];
        if (visited[i] || seed->type == ObjectType::FIXED_OBJECT || seed->isSleeping) continue;
        
        Island currentIsland;
        currentIsland.bodies.reserve(bodyCount / 4 + 1); // Heuristic
        currentIsland.contacts.reserve(contactConstraints.size() / 4 + 1);
        currentIsland.joints.reserve(jointsMap.size() / 4 + 1);
        
        stack.push_back(seed);
        visited[i] = true;
        
        while (!stack.empty()) {
            Body* b = stack.back();
            stack.pop_back();
            
            currentIsland.bodies.push_back(b);
            // Wake up body if it was sleeping (main thread safe)
            if (b->isSleeping) b->wakeUp();
            
            // Follow contacts
            for (ContactConstraint* c : bodyToContacts[b->worldIndex]) {
                // Add contact to island if not already added
                if (!c->inIsland) {
                    c->inIsland = true;
                    currentIsland.contacts.push_back(c);
                }
                
                Body* other = (c->a == b) ? c->b : c->a;
                if (other->type != ObjectType::FIXED_OBJECT && !visited[other->worldIndex]) {
                    visited[other->worldIndex] = true;
                    stack.push_back(other);
                }
            }
            
            // Follow joints
            for (Joint* j : b->joints) {
                if (!j->inIsland) {
                    j->inIsland = true;
                    currentIsland.joints.push_back(j);
                }
                
                Body* bodies[6];
                int count = 0;
                bodies[count++] = j->bodyA;
                bodies[count++] = j->bodyB;
                GearJoint* gear = dynamic_cast<GearJoint*>(j);
                if (gear) {
                    bodies[count++] = gear->joint1->bodyA;
                    bodies[count++] = gear->joint1->bodyB;
                    bodies[count++] = gear->joint2->bodyA;
                    bodies[count++] = gear->joint2->bodyB;
                }
                
                for (int k = 0; k < count; ++k) {
                    Body* other = bodies[k];
                    if (other->type != ObjectType::FIXED_OBJECT && !visited[other->worldIndex]) {
                        visited[other->worldIndex] = true;
                        stack.push_back(other);
                    }
                }
            }
        }
        
        if (!currentIsland.bodies.empty()) {
            islands.push_back(std::move(currentIsland));
        }
    }
    
    // 3. Process the islands
    if (!islands.empty()) {
        // --- Velocity Pass ---
        if (islands.size() == 1) {
            _solveIslandVelocity(islands[0], dt, substepIndex);
        } else {
#ifdef GEARBOX_MT
            for (auto& isl : islands) {
                threadPool->enqueue([this, &isl, dt, substepIndex]() {
                    this->_solveIslandVelocity(isl, dt, substepIndex);
                });
            }
            threadPool->wait();
#else
            for (auto& isl : islands) {
                _solveIslandVelocity(isl, dt, substepIndex);
            }
#endif
        }

        // --- Global Position Integration (SIMD) ---
        _doIntegratePositionsSIMD(dt);

        // --- Position Correction Pass ---
        if (islands.size() == 1) {
            _solveIslandPosition(islands[0], dt, substepIndex);
        } else {
#ifdef GEARBOX_MT
            for (auto& isl : islands) {
                threadPool->enqueue([this, &isl, dt, substepIndex]() {
                    this->_solveIslandPosition(isl, dt, substepIndex);
                });
            }
            threadPool->wait();
#else
            for (auto& isl : islands) {
                _solveIslandPosition(isl, dt, substepIndex);
            }
#endif
        }

        // 4. Main-thread processing for sleeping (thread-safety for BVH)
        if (substepIndex == velocitySubSteps - 1) {
            for (auto& isl : islands) {
                if (isl.canSleep) {
                    for (Body* b : isl.bodies) b->sleep();
                }
            }
        }
    }
    
    // Reset solverBodyActive for all bodies (safe now that parallel processing is done)
    std::fill(solverBodyActive.begin(), solverBodyActive.end(), 0);
    
    // 4. Update warm start storage on every substep
    warmStartImpulses.clear();
    if (substepIndex == velocitySubSteps - 1) {
        resolvedImpulses.clear();
    }
    
    for (auto& c : contactConstraints) {
        std::pair<int, int> pair = {c.fA->id, c.fB->id};
        if (pair.first > pair.second) std::swap(pair.first, pair.second);
        
        if (substepIndex == velocitySubSteps - 1) {
            resolvedImpulses[pair] += c.normalImpulse;
        }
        
        Body* bFirst = (c.fA->id < c.fB->id) ? c.a : c.b;
        float prFirst = bFirst->getRotation();
        float cosFirst = std::cos(-prFirst), sinFirst = std::sin(-prFirst);
        Vec2 rFirst_world = c.point - bFirst->getPosition();
        Vec2 localPointFirst(rFirst_world.x * cosFirst - rFirst_world.y * sinFirst, rFirst_world.x * sinFirst + rFirst_world.y * cosFirst);
        
        auto& data = warmStartImpulses[pair];
        if (data.count < 2) {
            data.impulses[data.count++] = {c.id, localPointFirst, c.normalImpulse, c.frictionImpulse};
        }
    }
    
    // 5. Re-synchronize AABBs after position correction
    if (positionIterations > 0) {
        for (auto* body : bodiesList) {
            if (body->isSleeping) continue;
            float pr = body->getRotation();
            float cosR = std::cos(pr);
            float sinR = std::sin(pr);
            for (auto* fixture : body->fixtures) {
                Aabb tightAabb = fixture->computeAabb(cosR, sinR, 1);
                if (!fixture->aabb.contains(tightAabb)) {
                    fixture->updateAabb(cosR, sinR, 0);
                    fixture->bvhNode = bvh.updateLeaf(fixture->bvhNode, fixture->aabb, fixture->getCollisionProperties());
                }
            }
        }
    }
}

void World::_solveIslandVelocity(Island& island, float dt, int substepIndex) {
    // 1. Sort constraints for deterministic solving
    std::sort(island.contacts.begin(), island.contacts.end(), [](ContactConstraint* a, ContactConstraint* b) {
        return a->id.key < b->id.key;
    });
    std::sort(island.joints.begin(), island.joints.end(), [](Joint* a, Joint* b) {
        return a->id < b->id;
    });

    // 2. Process the island
    // NOTE: Bodies were already woken up in _buildAndProcessIslands
    
    auto getSolverBody = [&](Body* b) -> SolverData& {
        return solverBodies[b->worldIndex];
    };
    
    // Prepare contacts
    for (ContactConstraint* c : island.contacts) {
        SolverData& sA = getSolverBody(c->a);
        SolverData& sB = getSolverBody(c->b);
        c->context.a = &sA;
        c->context.b = &sB;
        
        if (c->normalImpulse != 0 || c->frictionImpulse != 0) {
            Vec2 impulse = c->normal * c->normalImpulse + c->tangent * c->frictionImpulse;
            if (sA.im > 0) {
                sA.v.x -= impulse.x * sA.im;
                sA.v.y -= impulse.y * sA.im;
                sA.w -= c->rA.cross(impulse) * sA.iI;
            }
            if (sB.im > 0) {
                sB.v.x += impulse.x * sB.im;
                sB.v.y += impulse.y * sB.im;
                sB.w += c->rB.cross(impulse) * sB.iI;
            }
        }
    }
    
    // Prepare joints
    for (Joint* j : island.joints) {
        j->context.a = &getSolverBody(j->bodyA);
        j->context.b = &getSolverBody(j->bodyB);
        GearJoint* gear = dynamic_cast<GearJoint*>(j);
        if (gear) {
            gear->context.a = &getSolverBody(gear->joint1->bodyA);
            gear->context.b = &getSolverBody(gear->joint1->bodyB);
            gear->context.c = &getSolverBody(gear->joint2->bodyA);
            gear->context.d = &getSolverBody(gear->joint2->bodyB);
        }
    }
    
    // Velocity Iterations
    for (int iter = 0; iter < velocityIterations; ++iter) {
        for (ContactConstraint* c : island.contacts) c->solveFast();
        for (Joint* j : island.joints) j->solveFast();
    }
    
    // Sync velocities back
    for (Body* b : island.bodies) {
        if (b->type != ObjectType::FIXED_OBJECT) {
            b->setSolverData(solverBodies[b->worldIndex]);
        }
    }
}

void World::_solveIslandPosition(Island& island, float dt, int substepIndex) {
    // Position Iterations
    for (int p = 0; p < positionIterations; ++p) {
        for (ContactConstraint* c : island.contacts) c->solvePosition();
        for (Joint* j : island.joints) j->solvePosition();
    }

    // 3. Check if the island can go to sleep
    if (substepIndex == velocitySubSteps - 1) {
        bool canIslandSleep = true;
        for (Body* b : island.bodies) {
            if (b->getSleepTimer() < b->sleepTimeRequired) {
                canIslandSleep = false;
                break;
            }
        }
        
        if (canIslandSleep) {
            island.canSleep = true;
        }
    }
}


void World::clear() {
    jointsMap.clear();
    disabledPairs.clear();
    currentPairs.clear();
    prevPairs.clear();
    bodyContactCounts.clear();
    resolvedImpulses.clear();
    warmStartImpulses.clear();
    _idToBody.clear();
    _idToFixture.clear();
    bvh.clear();
    for (auto* fixture : fixturesList) delete fixture;
    fixturesList.clear();
    fixturesMap.clear();
    for (auto* body : bodiesList) delete body;
    bodiesList.clear();
    bodiesMap.clear();
    // Do NOT clear the SoA data vectors; their size should remain fixed at MAX_BODIES/MAX_FIXTURES
    std::fill(liveBodyFloatData.begin(), liveBodyFloatData.end(), 0.0f);
    std::fill(liveBodyIntData.begin(), liveBodyIntData.end(), 0);
    std::fill(liveFixtureFloatData.begin(), liveFixtureFloatData.end(), 0.0f);
    std::fill(liveFixtureIntData.begin(), liveFixtureIntData.end(), 0);
    eventData.clear();
    nextFixtureId = 1;
}

Body* World::getBody(int id) const { 
    if (id >= 0 && id < (int)_idToBody.size()) return _idToBody[id]; 
    return nullptr; 
}
Body* World::getBodyAtIndex(int index) const { return (index >= 0 && index < (int)bodiesList.size()) ? bodiesList[index] : nullptr; }
Fixture* World::getFixture(int id) const { 
    if (id >= 0 && id < (int)_idToFixture.size()) return _idToFixture[id]; 
    return nullptr; 
}
int World::getBodyCount() const { return bodiesList.size(); }
int World::getFixtureCount() const { return fixturesList.size(); }

int World::findFixtureIndex(int id) {
    Fixture* f = getFixture(id);
    return f ? f->worldIndex : -1;
}

void World::setTimeStep(float dt) {
    timeStep = dt;
    invTimeStep = (dt > 0.0f) ? 1.0f / dt : 0.0f;
    decayMap[99] = pow(1.0f - 0.99f, dt);
}

void World::setGravity(float x, float y) { gravity.x = x; gravity.y = y; }
void World::setHasPenetrationResolution(bool v) { hasPenetrationResolution = v; }
void World::setHasRestitution(bool v) { hasRestitution = v; }
void World::setHasFriction(bool v) { hasFriction = v; }

std::vector<int> World::queryBodiesAtPoint(float x, float y, uint32_t mask) {
    std::vector<int> hitIds;
    std::unordered_set<int> uniqueBodyIds;
    Aabb pointBox(Vec2(x - 0.001f, y - 0.001f), Vec2(x + 0.001f, y + 0.001f));
    std::vector<BvhNode*> candidates;
    bvh.query(pointBox, candidates);
    for (auto node : candidates) {
        Fixture* fixture = static_cast<Fixture*>(node->data);
        if (fixture->getCategoryBits() & mask) {
            if (fixture->testPoint(x, y)) {
                uniqueBodyIds.insert(fixture->body->id);
            }
        }
    }
    for (int id : uniqueBodyIds) hitIds.push_back(id);
    return hitIds;
}

std::vector<int> World::queryFixturesAtPoint(float x, float y, uint32_t mask) {
    std::vector<int> hitIds;
    Aabb pointBox(Vec2(x - 0.001f, y - 0.001f), Vec2(x + 0.001f, y + 0.001f));
    std::vector<BvhNode*> candidates;
    bvh.query(pointBox, candidates);
    for (auto node : candidates) {
        Fixture* fixture = static_cast<Fixture*>(node->data);
        if (fixture->getCategoryBits() & mask) {
            if (fixture->testPoint(x, y)) {
                hitIds.push_back(fixture->id);
            }
        }
    }
    return hitIds;
}

#ifdef __EMSCRIPTEN__
emscripten_val World::getLiveBodyFloatData() { return emscripten_val(emscripten::typed_memory_view(liveBodyFloatData.size(), liveBodyFloatData.data())); }
emscripten_val World::getLiveBodyIntData() { return emscripten_val(emscripten::typed_memory_view(liveBodyIntData.size(), liveBodyIntData.data())); }
emscripten_val World::getLiveFixtureFloatData() { return emscripten_val(emscripten::typed_memory_view(liveFixtureFloatData.size(), liveFixtureFloatData.data())); }
emscripten_val World::getLiveFixtureIntData() { return emscripten_val(emscripten::typed_memory_view(liveFixtureIntData.size(), liveFixtureIntData.data())); }
emscripten_val World::getEventData() { return emscripten_val(emscripten::typed_memory_view(eventData.size(), eventData.data())); }
#endif

int World::getEventCount() { return (int)eventData.size() / 6; }
void World::addEvent(int type, int bodyA, int bodyB, int fixtureA, int fixtureB, float impulse) {
#ifdef GEARBOX_MT
    std::lock_guard<std::mutex> lock(eventMutex);
#endif
    eventData.push_back((float)type);
    eventData.push_back((float)bodyA);
    eventData.push_back((float)bodyB);
    eventData.push_back((float)fixtureA);
    eventData.push_back((float)fixtureB);
    eventData.push_back(impulse);
}

int World::createHingeJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<HingeJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY));
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<DistanceJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length);
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<SpringJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length, frequencyHz, dampingRatio);
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createGearJoint(int id, int joint1Id, int joint2Id, float ratio) {
    auto it1 = jointsMap.find(joint1Id); auto it2 = jointsMap.find(joint2Id);
    if (it1 == jointsMap.end() || it2 == jointsMap.end()) return -1;
    HingeJoint* h1 = dynamic_cast<HingeJoint*>(it1->second.get());
    HingeJoint* h2 = dynamic_cast<HingeJoint*>(it2->second.get());
    if (!h1 || !h2) return -1;
    auto joint = std::make_unique<GearJoint>(id, h1, h2, ratio);
    
    auto addUnique = [](Body* b, Joint* j) {
        if (std::find(b->joints.begin(), b->joints.end(), j) == b->joints.end()) {
            b->joints.push_back(j);
        }
    };
    
    addUnique(h1->bodyA, joint.get());
    addUnique(h1->bodyB, joint.get());
    addUnique(h2->bodyA, joint.get());
    addUnique(h2->bodyB, joint.get());
    
    jointsMap[id] = std::move(joint);
    return id;
}

void World::removeJoint(int id) {
    std::vector<int> dependentJoints;
    for (auto& pair : jointsMap) {
        GearJoint* gj = dynamic_cast<GearJoint*>(pair.second.get());
        if (gj && (gj->joint1->id == id || gj->joint2->id == id)) dependentJoints.push_back(pair.first);
    }
    for (int djId : dependentJoints) removeJoint(djId);

    auto it = jointsMap.find(id);
    if (it != jointsMap.end()) {
        Joint* j = it->second.get();
        Body* bA = j->bodyA;
        Body* bB = j->bodyB;

        auto removeJointFromBody = [j](Body* b) {
            auto& v = b->joints;
            v.erase(std::remove(v.begin(), v.end(), j), v.end());
        };
        removeJointFromBody(bA);
        removeJointFromBody(bB);
        
        // Only enable collision if there are no more joints between these bodies
        bool jointsRemaining = false;
        for (Joint* other : bA->joints) {
            if (other->isConnectedTo(bB)) {
                jointsRemaining = true;
                break;
            }
        }
        if (!jointsRemaining) {
            bA->enableCollisionWith(bB->id);
            bB->enableCollisionWith(bA->id);
            disabledPairs.erase({bA->id, bB->id});
        }
        
        GearJoint* gear = dynamic_cast<GearJoint*>(j);
        if (gear) {
            removeJointFromBody(gear->joint1->bodyA);
            removeJointFromBody(gear->joint1->bodyB);
            removeJointFromBody(gear->joint2->bodyA);
            removeJointFromBody(gear->joint2->bodyB);
        }
        
        jointsMap.erase(id);
    }
}
Joint* World::getJoint(int id) { auto it = jointsMap.find(id); return it != jointsMap.end() ? it->second.get() : nullptr; }

void World::updateBodyId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = bodiesMap.find(oldId);
    if (it != bodiesMap.end()) {
        Body* b = it->second;
        bodiesMap.erase(it);
        if (oldId < (int)_idToBody.size()) _idToBody[oldId] = nullptr;
        b->id = newId;
        bodiesMap[newId] = b;
        if (newId >= (int)_idToBody.size()) _idToBody.resize(newId + 1, nullptr);
        _idToBody[newId] = b;
        tempBodyIdMap[oldId] = newId;
    }
}

void World::updateFixtureId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = fixturesMap.find(oldId);
    if (it != fixturesMap.end()) {
        Fixture* f = it->second;
        fixturesMap.erase(it);
        if (oldId < (int)_idToFixture.size()) _idToFixture[oldId] = nullptr;
        f->id = newId;
        fixturesMap[newId] = f;
        if (newId >= (int)_idToFixture.size()) _idToFixture.resize(newId + 1, nullptr);
        _idToFixture[newId] = f;
        tempFixtureIdMap[oldId] = newId;
    }
}

void World::updateJointId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = jointsMap.find(oldId);
    if (it != jointsMap.end()) {
        std::unique_ptr<Joint> j = std::move(it->second);
        jointsMap.erase(it);
        j->id = newId;
        jointsMap[newId] = std::move(j);
    }
}

void World::syncDefragmentedIds() {
    if (!tempBodyIdMap.empty()) {
        // Update disabledPairs
        if (!disabledPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(disabledPairs.size());
            for (const auto& pair : disabledPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempBodyIdMap.find(id1);
                if (it1 != tempBodyIdMap.end()) id1 = it1->second;
                auto it2 = tempBodyIdMap.find(id2);
                if (it2 != tempBodyIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            disabledPairs = std::move(nextSet);
        }

        // Rebuild per-body _disabledBodyIds from the new disabledPairs
        for (auto* body : bodiesList) {
            body->_disabledBodyIds.clear();
        }
        for (const auto& pair : disabledPairs) {
            Body* bA = getBody(pair.first);
            Body* bB = getBody(pair.second);
            if (bA && bB) {
                bA->disableCollisionWith(bB->id);
                bB->disableCollisionWith(bA->id);
            }
        }

        // Update bodyContactCounts
        if (!bodyContactCounts.empty()) {
            std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual> nextMap;
            nextMap.reserve(bodyContactCounts.size());
            for (const auto& entry : bodyContactCounts) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempBodyIdMap.find(id1);
                if (it1 != tempBodyIdMap.end()) id1 = it1->second;
                auto it2 = tempBodyIdMap.find(id2);
                if (it2 != tempBodyIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            bodyContactCounts = std::move(nextMap);
        }
    }

    if (!tempFixtureIdMap.empty()) {
        // Update currentPairs
        if (!currentPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(currentPairs.size());
            for (const auto& pair : currentPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            currentPairs = std::move(nextSet);
        }

        // Update prevPairs
        if (!prevPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(prevPairs.size());
            for (const auto& pair : prevPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            prevPairs = std::move(nextSet);
        }

        // Update resolvedImpulses
        if (!resolvedImpulses.empty()) {
            std::unordered_map<std::pair<int, int>, float, PairHash, PairEqual> nextMap;
            nextMap.reserve(resolvedImpulses.size());
            for (const auto& entry : resolvedImpulses) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            resolvedImpulses = std::move(nextMap);
        }

        // Update warmStartImpulses
        if (!warmStartImpulses.empty()) {
            std::unordered_map<std::pair<int, int>, WarmStartData, PairHash, PairEqual> nextMap;
            nextMap.reserve(warmStartImpulses.size());
            for (const auto& entry : warmStartImpulses) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            warmStartImpulses = std::move(nextMap);
        }
    }

    tempBodyIdMap.clear();
    tempFixtureIdMap.clear();
}

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
    // We track the velocity increment from external forces during integration and compute the true impact velocity.
    // This eliminates energy gain from gravity/forces being integrated before the solver.
    // Reference: studies/kinematic_restitution_balancing/KRB_Whitepaper.md (Section 2.1)
    float forceVn = (b->getForceVelocity() - a->getForceVelocity()).dot(normal);
    float relativeVn = vn - forceVn;

    float vBounce = -restitution * relativeVn;
    float expectedDisplacement = 0.0f;

    if (depth < 0.0f) {
        // Speculative contact: disable friction to prevent lateral "ghost" forces
        staticFriction = 0.0f;
        kineticFriction = 0.0f;
    }

    // Determine if we should apply restitution (bouncing)
    // For regular contacts: if closing velocity exceeds threshold.
    // For speculative: if velocity is high enough to penetrate this frame.
    bool shouldBounce = enableRestitution && (relativeVn < -RESTITUTION_THRESHOLD || (depth < 0.0f && relativeVn < depth / dt));

    if (shouldBounce) {
        // Component B: Kinematic Energy Balancing
        // We adjust the launch velocity to account for work done by external forces over the correction displacement.
        // Reference: studies/kinematic_restitution_balancing/KRB_Whitepaper.md (Section 2.2)
        
        if (depth > 0.0f) {
            // Refined prediction: Account for velocity-induced displacement before position correction.
            float depthAfterVelocity = std::max(0.0f, (depth - PENETRATION_SLOP) - vBounce * dt);
            
            // Account for the displacement cap in the position solver (MAX_POSITION_CORRECTION)
            int n = a->world.getPositionIterations();
            float cumulativeCorrectionFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)n);
            expectedDisplacement = std::min(depthAfterVelocity, MAX_POSITION_CORRECTION) * cumulativeCorrectionFactor;
        } else {
            // Speculative contacts have no expected displacement from the position solver yet.
            expectedDisplacement = 0.0f;
        }
        
        float accVn = forceVn / dt;
        float workTerm = 2.0f * accVn * expectedDisplacement;
        float vImpactSq = relativeVn * relativeVn;
        
        float vSurfSq = vImpactSq + workTerm;
        float vFinal = restitution * std::sqrt(std::max(0.0f, vSurfSq));

        if (depth < 0.0f) {
            // Speculative bias: ensure no penetration happens in the next step.
            // We want v_final . n >= max(vBounce_Corrected, gap / dt).
            bias = -std::max(vFinal, depth / dt);
        } else {
            bias = -vFinal;
        }
    } else {
        // No bounce logic, but we still need to handle speculative anti-tunneling
        if (depth < 0.0f) {
            // Ensure objects don't close the gap faster than gap / dt
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
        sA.v.x -= impulse.x * sA.im;
        sA.v.y -= impulse.y * sA.im;
        sA.w -= rA.cross(impulse) * sA.iI;
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
