#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <type_traits>

World::World() : collisionSolver(*this) {
    timeStep = 1.0f / 60.0f;
    invTimeStep = 60.0f;
    velocityIterations = 50;
    positionIterations = 10;
    velocitySubSteps = 1;
    int maxSize = 10000;
    liveBodyFloatData.reserve(maxSize * BODY_FDATA_EPO);
    liveBodyIntData.reserve(maxSize * BODY_IDATA_EPO);
    liveFixtureFloatData.reserve(maxSize * FIXTURE_FDATA_EPO);
    liveFixtureIntData.reserve(maxSize * FIXTURE_IDATA_EPO);
    contactConstraints.reserve(1000);
    nextFixtureId = 1;
}

World::~World() {
    clear();
}

int World::makeBody(int id, emscripten_val options) {
    auto* body = new Body(*this, id, options);
    body->worldIndex = bodiesList.size();
    bodiesMap[id] = body;
    bodiesList.push_back(body);

    // Support atomic creation of multiple fixtures
    if (!options["fixtures"].isUndefined()) {
        emscripten_val fixtures = options["fixtures"];
        int length = fixtures["length"].as<int>();
        for (int i = 0; i < length; ++i) {
            addFixture(id, 0, fixtures[i]);
        }
    }

    // Only create an initial fixture if shape is specified (legacy/single fixture support)
    if (!options["shape"].isUndefined()) {
        int fId = (!options["fixtureId"].isUndefined()) ? options["fixtureId"].as<int>() : nextFixtureId++;
        addFixture(id, fId, options);
    }

    return body->worldIndex;
}

int World::addFixture(int bodyId, int fixtureId, emscripten_val options) {
    auto it = bodiesMap.find(bodyId);
    if (it == bodiesMap.end()) return -1;
    Body* body = it->second;

    int fId = (fixtureId > 0) ? fixtureId : nextFixtureId++;
    auto* fixture = new Fixture(*this, fId, body, options);
    fixture->worldIndex = fixturesList.size();
    fixturesMap[fId] = fixture;
    fixturesList.push_back(fixture);
    
    body->addFixture(fixture);
    fixture->updateAabb(1);

    CollisionProperties props;
    props.userCategory = fixture->getCategoryBits();
    props.userMask = fixture->getMaskBits();
    props.systemCategory = fixture->getSystemCategory();
    props.isRigid = !fixture->isSensor();
    props.isSleeping = body->isSleeping;
    props.bodyId = body->id;
    props.velocity = body->getVelocity();

    fixture->bvhNode = bvh.insert(fixture->aabb, fixture, props);

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
        if (fIdx != -1 && fIdx < fixturesList.size()) {
            // Swap this fixture with the last one in the list
            std::iter_swap(fixturesList.begin() + fIdx, fixturesList.end() - 1);
            
            for (int i = 0; i < FIXTURE_IDATA_EPO; ++i) {
                std::iter_swap(liveFixtureIntData.begin() + fIdx * FIXTURE_IDATA_EPO + i,
                               liveFixtureIntData.begin() + (fixturesList.size() - 1) * FIXTURE_IDATA_EPO + i);
            }
            for (int i = 0; i < FIXTURE_FDATA_EPO; ++i) {
                std::iter_swap(liveFixtureFloatData.begin() + fIdx * FIXTURE_FDATA_EPO + i,
                               liveFixtureFloatData.begin() + (fixturesList.size() - 1) * FIXTURE_FDATA_EPO + i);
            }
            
            // Update the index of the fixture that was moved from the end to fIdx
            fixturesList[fIdx]->worldIndex = fIdx;
            
            // Remove the last element (which is the fixture we want to delete)
            fixturesList.pop_back();
            for (int i = 0; i < FIXTURE_IDATA_EPO; ++i) liveFixtureIntData.pop_back();
            for (int i = 0; i < FIXTURE_FDATA_EPO; ++i) liveFixtureFloatData.pop_back();
        }
        fixturesMap.erase(fixture->id);
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
    if (bIdx != -1 && bIdx < bodiesList.size()) {
        bool isLast = (bIdx == bodiesList.size() - 1);
        
        if (!isLast) {
            // Swap this body with the last one in the list
            std::iter_swap(bodiesList.begin() + bIdx, bodiesList.end() - 1);
            for (int i = 0; i < BODY_IDATA_EPO; ++i) {
                std::iter_swap(liveBodyIntData.begin() + bIdx * BODY_IDATA_EPO + i,
                               liveBodyIntData.begin() + (bodiesList.size() - 1) * BODY_IDATA_EPO + i);
            }
            for (int i = 0; i < BODY_FDATA_EPO; ++i) {
                std::iter_swap(liveBodyFloatData.begin() + bIdx * BODY_FDATA_EPO + i,
                               liveBodyFloatData.begin() + (bodiesList.size() - 1) * BODY_FDATA_EPO + i);
            }
            
            // Update the index of the body that was moved from the end to bIdx
            bodiesList[bIdx]->worldIndex = bIdx;
            
            // Update all fixtures of the moved body to point to the new body index
            for (auto* f : bodiesList[bIdx]->fixtures) {
                liveFixtureIntData[f->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX] = bIdx;
            }
        }

        // Remove the last element (which is the body we want to delete)
        bodiesList.pop_back();
        for (int i = 0; i < BODY_IDATA_EPO; ++i) liveBodyIntData.pop_back();
        for (int i = 0; i < BODY_FDATA_EPO; ++i) liveBodyFloatData.pop_back();
    }
    
    bodiesMap.erase(itBody);
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
        liveBodyIntData[i * BODY_IDATA_EPO + BODY_IDATA_FLAGS] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
        
        // Reset forces and accumulated impulses from the previous frame
        // This ensures they are available for the debug renderer between steps
        int fIdx = i * BODY_FDATA_EPO;
        liveBodyFloatData[fIdx + BODY_FDATA_FX] = 0;
        liveBodyFloatData[fIdx + BODY_FDATA_FY] = 0;
        liveBodyFloatData[fIdx + BODY_FDATA_IX] = 0;
        liveBodyFloatData[fIdx + BODY_FDATA_IY] = 0;
        liveBodyFloatData[fIdx + BODY_FDATA_IA] = 0;
    }
    for (int i = 0; i < (int)fixturesList.size(); ++i) {
        liveFixtureIntData[i * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
    }

    for (auto* body : bodiesList) {
        int idx = body->worldIndex * BODY_FDATA_EPO;
        liveBodyFloatData[idx + BODY_FDATA_PREV_X] = liveBodyFloatData[idx + BODY_FDATA_X];
        liveBodyFloatData[idx + BODY_FDATA_PREV_Y] = liveBodyFloatData[idx + BODY_FDATA_Y];
        liveBodyFloatData[idx + BODY_FDATA_PREV_R] = liveBodyFloatData[idx + BODY_FDATA_R];
    }

    eventData.clear();

    float subStepDt = timeStep / velocitySubSteps;
    
    // Apply position integration per substep as well
    for (int i = 0; i < velocitySubSteps; ++i) {
        _doIntegrateVelocitiesSubStep(subStepDt);
        _doBroadPhase();
        _doNarrowPhase();
        
        std::vector<Joint*> sortedJoints;
        sortedJoints.reserve(jointsMap.size());
        for (auto& pair : jointsMap) sortedJoints.push_back(pair.second.get());
        std::sort(sortedJoints.begin(), sortedJoints.end(), [](Joint* a, Joint* b) { return a->id < b->id; });

        for (auto* joint : sortedJoints) {
            if (joint->bodyA->isSleeping && joint->bodyB->isSleeping) continue;
            joint->preSolve(subStepDt);
        }

        _doResolution(subStepDt, i);
        _doIntegratePositionsSubStep(subStepDt);
        
        // --- Position Solver Loop ---
        for (int p = 0; p < positionIterations; ++p) {
            for (auto& c : contactConstraints) {
                c.solvePosition();
            }
            for (auto* joint : sortedJoints) {
                if (joint->bodyA->isSleeping && joint->bodyB->isSleeping) continue;
                joint->solvePosition();
            }
        }
        
        // Re-synchronize AABBs after position correction
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
                        fixture->bvhNode = bvh.updateLeaf(fixture->bvhNode, fixture->aabb);
                    }
                }
            }
        }
    }
    _doContactManagement();
}

void World::_doIntegrateVelocitiesSubStep(float dt) {
    for (auto* body : bodiesList) {
        if (body->isSleeping && body->type != ObjectType::FIXED_OBJECT) {
            int idx = body->worldIndex * BODY_FDATA_EPO;
            if (liveBodyFloatData[idx + BODY_FDATA_NIX] != 0 || liveBodyFloatData[idx + BODY_FDATA_NIY] != 0 || 
                liveBodyFloatData[idx + BODY_FDATA_NIA] != 0 || liveBodyFloatData[idx + BODY_FDATA_NFX] != 0 || 
                liveBodyFloatData[idx + BODY_FDATA_NFY] != 0) {
                body->wakeUp();
            }
        }
        if (body->isSleeping) continue;

        float m = body->getMass();
        float gScale = body->getGravityScale();
        int idx = body->worldIndex * BODY_FDATA_EPO;
        
        // Temporarily add gravity for this substep integration
        float originalFX = liveBodyFloatData[idx + BODY_FDATA_FX];
        float originalFY = liveBodyFloatData[idx + BODY_FDATA_FY];
        liveBodyFloatData[idx + BODY_FDATA_FX] += gravity.x * m * gScale;
        liveBodyFloatData[idx + BODY_FDATA_FY] += gravity.y * m * gScale;
        
        body->integrateVelocities(dt);
        
        // Restore original forces for subsequent substeps or debug rendering
        liveBodyFloatData[idx + BODY_FDATA_FX] = originalFX;
        liveBodyFloatData[idx + BODY_FDATA_FY] = originalFY;
    }
}

void World::_doIntegratePositionsSubStep(float dt) {
    for (auto* body : bodiesList) {
        if (body->isSleeping) continue;

        bool moved = body->integratePositions(dt);

        if (moved) {
            float pr = body->getRotation();
            float cosR = std::cos(pr);
            float sinR = std::sin(pr);
            for (auto* fixture : body->fixtures) {
                // Check if tight AABB (mode 1) is still within current fat AABB
                Aabb tightAabb = fixture->computeAabb(cosR, sinR, 1);
                if (!fixture->aabb.contains(tightAabb)) {
                    // Out of bounds, update to new fat AABB and broadphase
                    fixture->updateAabb(cosR, sinR, 0);
                    fixture->bvhNode = bvh.updateLeaf(fixture->bvhNode, fixture->aabb);
                }
            }
        }
    }
}

void World::_doBroadPhase() {
    bvh.detectCollisions();
}

void World::_doNarrowPhase() {
    collisionSolver.clear();
    for (auto& pair : bvh.collisionPairs) {
        Fixture* f1 = static_cast<Fixture*>(pair.first);
        Fixture* f2 = static_cast<Fixture*>(pair.second);
        
        if (disabledPairs.count({f1->body->id, f2->body->id})) continue;

        bool colliding = collisionSolver.solve(f1->worldIndex, f2->worldIndex);
        
        // Mark as AABB collision (broadphase overlap)
        liveFixtureIntData[f1->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] |= HAS_AABB_COLLISION;
        liveFixtureIntData[f2->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] |= HAS_AABB_COLLISION;
        
        // Also mark bodies for backward compatibility
        liveBodyIntData[f1->body->worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= HAS_AABB_COLLISION;
        liveBodyIntData[f2->body->worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= HAS_AABB_COLLISION;

        if (colliding) {
            currentPairs.insert({f1->id, f2->id});

            // If one body is awake and dynamic/kinematic, and the other is sleeping, wake up the sleeping one
            if (f1->body->isSleeping != f2->body->isSleeping) {
                Body* awake = f1->body->isSleeping ? f2->body : f1->body;
                Body* sleeping = f1->body->isSleeping ? f1->body : f2->body;
                if (awake->type != ObjectType::FIXED_OBJECT && sleeping->type != ObjectType::FIXED_OBJECT) {
                    sleeping->wakeUp();
                }
            }

            // Mark fixtures as colliding for debug graphics
            liveFixtureIntData[f1->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] |= HAS_PHYSICAL_COLLISION;
            liveFixtureIntData[f2->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] |= HAS_PHYSICAL_COLLISION;

            // Also mark bodies for backward compatibility
            liveBodyIntData[f1->body->worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= HAS_PHYSICAL_COLLISION;
            liveBodyIntData[f2->body->worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= HAS_PHYSICAL_COLLISION;
        }
    }
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

void World::_doResolution(float dt, int substepIndex) {
    contactConstraints.clear();
    
    // Collect all bodies involved in collisions to cache their solver data
    std::vector<Body::SolverData> solverBodies(bodiesList.size());
    std::vector<bool> solverBodyActive(bodiesList.size(), false);
    auto getSolverBody = [&](Body* b) -> Body::SolverData& {
        int idx = b->worldIndex;
        if (!solverBodyActive[idx]) {
            solverBodies[idx] = b->getSolverData();
            solverBodyActive[idx] = true;
        }
        return solverBodies[idx];
    };

    // Constraint generation
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
                c.normalImpulse = it->second.impulses[bestMatchIdx].normalImpulse * 1.0f;
                c.frictionImpulse = it->second.impulses[bestMatchIdx].frictionImpulse * 1.0f;
            }
        }

        // Apply initial warm-start impulses to Cached Solver Data
        Body::SolverData& sA = getSolverBody(bA);
        Body::SolverData& sB = getSolverBody(bB);
        c.context.a = &sA;
        c.context.b = &sB;

        if (c.normalImpulse != 0 || c.frictionImpulse != 0) {
            Vec2 impulse = c.normal * c.normalImpulse + c.tangent * c.frictionImpulse;
            if (sA.im > 0) {
                sA.v.x -= impulse.x * sA.im;
                sA.v.y -= impulse.y * sA.im;
                sA.w -= c.rA.cross(impulse) * sA.iI;
            }
            if (sB.im > 0) {
                sB.v.x += impulse.x * sB.im;
                sB.v.y += impulse.y * sB.im;
                sB.w += c.rB.cross(impulse) * sB.iI;
            }
        }

        contactConstraints.push_back(c);
    }

    // Fast Iterative Solver
    // Link joints to solver data before iterations
    std::vector<Joint*> sortedJoints;
    sortedJoints.reserve(jointsMap.size());
    for (auto& pair : jointsMap) {
        sortedJoints.push_back(pair.second.get());
    }
    std::sort(sortedJoints.begin(), sortedJoints.end(), [](Joint* a, Joint* b) {
        return a->id < b->id;
    });

    for (auto* joint : sortedJoints) {
        if (joint->bodyA->isSleeping && joint->bodyB->isSleeping) continue;

        joint->context.a = &getSolverBody(joint->bodyA);
        joint->context.b = &getSolverBody(joint->bodyB);

        // Special handling for GearJoint which needs 4 bodies
        GearJoint* gear = dynamic_cast<GearJoint*>(joint);
        if (gear) {
            gear->context.a = &getSolverBody(gear->joint1->bodyA);
            gear->context.b = &getSolverBody(gear->joint1->bodyB);
            gear->context.c = &getSolverBody(gear->joint2->bodyA);
            gear->context.d = &getSolverBody(gear->joint2->bodyB);
        }
    }

    for (int iter = 0; iter < velocityIterations; ++iter) {
        for (auto& c : contactConstraints) {
            c.solveFast();
        }
        for (auto* joint : sortedJoints) {
            if (joint->bodyA->isSleeping && joint->bodyB->isSleeping) continue;
            joint->solveFast();
        }
    }

    // Sync cached data back to bodies
    for (int i = 0; i < (int)bodiesList.size(); ++i) {
        if (solverBodyActive[i]) {
            bodiesList[i]->setSolverData(solverBodies[i]);
        }
    }

    // Update warm start storage only on LAST substep
    if (substepIndex == velocitySubSteps - 1) {
        resolvedImpulses.clear();
        warmStartImpulses.clear();
        
        for (auto& c : contactConstraints) {
            std::pair<int, int> pair = {c.fA->id, c.fB->id};
            if (pair.first > pair.second) std::swap(pair.first, pair.second);
            resolvedImpulses[pair] += c.normalImpulse;
            
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
    bvh.clear();
    for (auto* fixture : fixturesList) delete fixture;
    fixturesList.clear();
    fixturesMap.clear();
    for (auto* body : bodiesList) delete body;
    bodiesList.clear();
    bodiesMap.clear();
    liveBodyFloatData.clear();
    liveBodyIntData.clear();
    liveFixtureFloatData.clear();
    liveFixtureIntData.clear();
    eventData.clear();
    nextFixtureId = 1;
}

Body* World::getBody(int id) const { auto it = bodiesMap.find(id); return it != bodiesMap.end() ? it->second : nullptr; }
Body* World::getBodyAtIndex(int index) const { return (index >= 0 && index < (int)bodiesList.size()) ? bodiesList[index] : nullptr; }
Fixture* World::getFixture(int id) const { auto it = fixturesMap.find(id); return it != fixturesMap.end() ? it->second : nullptr; }
int World::getBodyCount() const { return bodiesList.size(); }
int World::getFixtureCount() const { return fixturesList.size(); }

int World::findFixtureIndex(int id) {
    auto it = fixturesMap.find(id);
    return it != fixturesMap.end() ? it->second->worldIndex : -1;
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
    jointsMap[id] = std::make_unique<HingeJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY));
    return id;
}

int World::createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    jointsMap[id] = std::make_unique<DistanceJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length);
    return id;
}

int World::createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    jointsMap[id] = std::make_unique<SpringJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length, frequencyHz, dampingRatio);
    return id;
}

int World::createGearJoint(int id, int joint1Id, int joint2Id, float ratio) {
    auto it1 = jointsMap.find(joint1Id); auto it2 = jointsMap.find(joint2Id);
    if (it1 == jointsMap.end() || it2 == jointsMap.end()) return -1;
    HingeJoint* h1 = dynamic_cast<HingeJoint*>(it1->second.get());
    HingeJoint* h2 = dynamic_cast<HingeJoint*>(it2->second.get());
    if (!h1 || !h2) return -1;
    jointsMap[id] = std::make_unique<GearJoint>(id, h1, h2, ratio);
    return id;
}

void World::removeJoint(int id) {
    std::vector<int> dependentJoints;
    for (auto& pair : jointsMap) {
        GearJoint* gj = dynamic_cast<GearJoint*>(pair.second.get());
        if (gj && (gj->joint1->id == id || gj->joint2->id == id)) dependentJoints.push_back(pair.first);
    }
    for (int djId : dependentJoints) removeJoint(djId);
    jointsMap.erase(id);
}
Joint* World::getJoint(int id) { auto it = jointsMap.find(id); return it != jointsMap.end() ? it->second.get() : nullptr; }

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
    float forceVn = (b->forceVelocity - a->forceVelocity).dot(normal);
    float relativeVn = vn - forceVn;

    if (enableRestitution && relativeVn < -RESTITUTION_THRESHOLD) {
        // Component B: Kinematic Energy Balancing
        // We adjust the launch velocity to account for work done by external forces over the correction displacement (depth).
        // This eliminates energy gain from position correction (Baumgarte) by taxing/boosting launch speed.
        // Formula: v_final = sqrt(max(0, (e * v_impact)^2 + 2 * (a_ext . n) * total_displacement))
        // Reference: studies/kinematic_restitution_balancing/KRB_Whitepaper.md (Section 2.2)
        
        float accVn = forceVn / dt;
        float vBounce = -restitution * relativeVn;
        
        // Refined prediction: Account for velocity-induced displacement before position correction.
        // The objects will move apart by (vBounce * dt) during integration, so the position solver
        // only sees the remaining penetration.
        float depthAfterVelocity = std::max(0.0f, (depth - PENETRATION_SLOP) - vBounce * dt);
        
        // Account for the displacement cap in the position solver (MAX_POSITION_CORRECTION)
        // to avoid over-taxing kinetic energy when penetration is deep.
        int n = a->world.getPositionIterations();
        float cumulativeCorrectionFactor = 1.0f - std::pow(1.0f - BAUMGARTE_FACTOR, (float)n);
        float expectedDisplacement = std::min(depthAfterVelocity, MAX_POSITION_CORRECTION) * cumulativeCorrectionFactor;
        
        float workTerm = 2.0f * accVn * expectedDisplacement;
        
        float vImpactSq = relativeVn * relativeVn;
        float restitutionSq = restitution * restitution;
        
        float vFinalSq = (restitutionSq * vImpactSq) + workTerm;
        bias = -std::sqrt(std::max(0.0f, vFinalSq));
    } else {
        bias = 0.0f;
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
    Body::SolverData& sA = *static_cast<Body::SolverData*>(context.a);
    Body::SolverData& sB = *static_cast<Body::SolverData*>(context.b);

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
        int idx = a->worldIndex * BODY_FDATA_EPO;
        a->world.liveBodyFloatData[idx + BODY_FDATA_X] = pA.x - P.x * imA;
        a->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pA.y - P.y * imA;
        a->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaA - rA_curr.cross(P) * iIA;
    }
    if (imB > 0) {
        int idx = b->worldIndex * BODY_FDATA_EPO;
        b->world.liveBodyFloatData[idx + BODY_FDATA_X] = pB.x + P.x * imB;
        b->world.liveBodyFloatData[idx + BODY_FDATA_Y] = pB.y + P.y * imB;
        b->world.liveBodyFloatData[idx + BODY_FDATA_R] = thetaB + rB_curr.cross(P) * iIB;
    }
}
