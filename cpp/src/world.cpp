#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>

BvhMetrics g_bvhMetrics;

World::World() : collisionSolver(*this) {
    timeStep = 1.0f / 60.0f;
    invTimeStep = 60.0f;
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
    // Clear collision flags on all bodies and fixtures
    for (int i = 0; i < bodiesList.size(); ++i) {
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
    for (int i = 0; i < fixturesList.size(); ++i) {
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
        // Clear AT THE BEGINNING of the step, so that the FIRST substep 
    // uses warm starts from the LAST substep of the previous frame.
    // WAIT! If we clear it at the beginning of the step, the first substep gets NOTHING!
    // We should NOT clear it at the beginning of the step! We should clear it at the start of _doResolution?
    // No, _doResolution CLEARS it AFTER the solver loop to populate it with the NEW impulses!
    // So it should never be cleared at the beginning of `step()`, except when the world is reset or a body is removed.
    // REMOVED: warmStartImpulses.clear(); 
    // Note: Warm starting the full impulse from the previous frame in each substep
    // can inject too much energy. If we take 4 substeps, we probably want to apply 1/4 of the warm start impulse?
    // Actually, usually you apply the *full* warm start impulse on the *first* substep, or you carry over the impulse
    // from the same substep index in the previous frame. 
    // Wait! Since `warmStartImpulses` is populated in `_doResolution` and NOT cleared until the next call to `_doResolution`,
    // it IS being carried from the previous frame's last substep, and then cleared and populated for the NEXT substep!
    // So substep 1 gets warm start from previous frame's substep N. Substep 2 gets from substep 1. This is perfect!
    
    // Apply position integration per substep as well
    for (int i = 0; i < velocitySubSteps; ++i) {
        _doIntegrateVelocitiesSubStep(subStepDt);
        _doBroadPhase();
        _doNarrowPhase();
        
        for (auto& pair : jointsMap) {
            if (pair.second->bodyA->isSleeping && pair.second->bodyB->isSleeping) continue;
            pair.second->preSolve(subStepDt);
        }
        _doResolution(subStepDt);
        _doIntegratePositionsSubStep(subStepDt);
        
        // --- Position Solver Loop ---
        for (int p = 0; p < positionIterations; ++p) {
            for (auto& c : contactConstraints) {
                c.solvePosition();
            }
            // If joints also had solvePosition, they'd go here.
        }
        
        // Re-synchronize AABBs after position correction
        if (positionIterations > 0) {
            for (auto* body : bodiesList) {
                if (body->isSleeping) continue;
                float pr = body->getRotation();
                float cosR = cos(pr);
                float sinR = sin(pr);
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
        if (body->isSleeping) {
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
        body->applyForce(gravity.x * m * gScale, gravity.y * m * gScale);
        body->integrateVelocities(dt);
    }
}

void World::_doIntegratePositionsSubStep(float dt) {
    for (auto* body : bodiesList) {
        if (body->isSleeping) continue;

        bool moved = body->integratePositions(dt);

        if (moved) {
            float pr = body->getRotation();
            float cosR = cos(pr);
            float sinR = sin(pr);
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
    currentPairs.clear();
    for (auto& pair : bvh.collisionPairs) {
        Fixture* f1 = static_cast<Fixture*>(pair.first);
        Fixture* f2 = static_cast<Fixture*>(pair.second);
        
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
                if (awake->type != ObjectType::FIXED_OBJECT) {
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
    // Pairwise contact persistence / Persistent Manifold

    // Process all newly active pairs
    for (const auto& pair : currentPairs) {
        if (prevPairs.find(pair) == prevPairs.end()) {
            Fixture* fA = getFixture(pair.first);
            Fixture* fB = getFixture(pair.second);
            if (fA && fB) {
                Body* bA = fA->body;
                Body* bB = fB->body;

                // Ensure unique ordering for body pair (unordered pair hashing).
                std::pair<int, int> bodyPair = {bA->id, bB->id};
                if (bodyPair.first > bodyPair.second) std::swap(bodyPair.first, bodyPair.second);

                // Reference Counting for multi-fixture body pairs
                if (bodyContactCounts[bodyPair]++ == 0) { // first contact between these bodies
                    bA->addContact(bB);
                    bB->addContact(bA);
                }

                // Collision Event Dispatch / Contact Listener pattern
                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_START, bA->id, bB->id, fA->id, fB->id, resolvedImpulses[pair]);
                }
            }
        }
    }
    // Process all pairs that were present last frame but not in currentPairs (i.e., ended this frame)
    for (const auto& pair : prevPairs) {
        if (currentPairs.find(pair) == currentPairs.end()) {
            Fixture* fA = getFixture(pair.first);
            Fixture* fB = getFixture(pair.second);
            if (fA && fB) {
                Body* bA = fA->body;
                Body* bB = fB->body;
                // Sleep islands: sleeping pairs are skipped from exit events and contact removal
                if (bA->isSleeping && bB->isSleeping) {
                    currentPairs.insert(pair);
                    continue;
                }

                std::pair<int, int> bodyPair = {bA->id, bB->id};
                if (bodyPair.first > bodyPair.second) std::swap(bodyPair.first, bodyPair.second);

                // Reference Counting for removing body contacts when last fixture is gone
                if (--bodyContactCounts[bodyPair] == 0) {
                    bA->removeContact(bB);
                    bB->removeContact(bA);
                }

                // Collision Event Dispatch on contact end
                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_END, bA->id, bB->id, fA->id, fB->id, 0);
                }
            }
        }
    }
    // Swap pairs for next frame (contact state swapping / flip-flop pattern)
    prevPairs = currentPairs;
}

void World::_doResolution(float dt) {
    contactConstraints.clear();
    for (auto& col : collisionSolver.collisions) {
        // Col indices are fixture indices. We need to look up body from fixture.
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
        
        // Combine friction and restitution
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
#if 1
        std::pair<int, int> fPair = {fA->id, fB->id};
        if (fPair.first > fPair.second) std::swap(fPair.first, fPair.second);

        auto it = warmStartImpulses.find(fPair);
        if (it != warmStartImpulses.end()) {
            int bestMatchIdx = -1;
            for (size_t i = 0; i < it->second.size(); ++i) {
                if (it->second[i].id.key == c.id.key) {
                    bestMatchIdx = i;
                    break;
                }
            }
            if (bestMatchIdx != -1) {
                // When substepping, warm start impulse needs to be scaled by the timestep fraction
                // Since warmStartImpulses from the *previous frame* (accumulated over the full dt) is applied at each substep, 
                // it needs to be scaled by (1.0f / velocitySubSteps).
                // Wait, actually, if the warm start impulse is carried over from the PREVIOUS frame's final step, 
                // it represents an impulse applied over the SUBSTEP dt, because we overwrite it in every substep.
                // So the warm start impulse stored is ALREADY scaled to the substep dt!
                c.normalImpulse = it->second[bestMatchIdx].normalImpulse * 0.50f;
                // Just use scaled down normal impulse
                c.frictionImpulse = it->second[bestMatchIdx].frictionImpulse * 0.50f;
                
                // Keep the impulse so it can be used in subsequent substeps of the same frame!
                // Wait! If we keep it, we use the SAME warm start impulse on EVERY substep?
                // Yes, because at the end of the substep we overwrite warmStartImpulses with the NEW impulses.
                // Ah! We OVERWRITE it in `_doResolution` after the solver loop! 
                // So Substep 2 uses the warm start impulses generated by Substep 1. 
                // So we SHOULD NOT erase it during the loop if there are multiple contacts matching the same feature ID, 
                // but erasing it is safer to prevent double-applying within the same substep.
                // Actually if a feature ID is shared, maybe erasing it makes the other one miss out? 
                // Let's NOT erase it, but let's just make sure feature IDs are unique per contact in a pair.
                // Wait, if we DO NOT erase it, we might double apply the same impulse if the same feature ID appears twice (e.g. bug in contact generation).
                // Let's just apply it.
                c.normalImpulse = it->second[bestMatchIdx].normalImpulse * 1.0f;
                // Just use full normal impulse
                c.frictionImpulse = it->second[bestMatchIdx].frictionImpulse * 1.0f;
                
                it->second.erase(it->second.begin() + bestMatchIdx);
            }
        }
#endif
        // ---------------------

        contactConstraints.push_back(c);
    }

    for (int iter = 0; iter < velocityIterations; ++iter) {
        for (auto& c : contactConstraints) c.solve(hasRestitution || hasPenetrationResolution, hasFriction);
        for (auto& pair : jointsMap) {
            if (pair.second->bodyA->isSleeping && pair.second->bodyB->isSleeping) continue;
            pair.second->solve();
        }
    }

    resolvedImpulses.clear();
    // It's probably safer to just accumulate or overwrite.
    for (auto& c : contactConstraints) {
        std::pair<int, int> pair = {c.fA->id, c.fB->id};
        if (pair.first > pair.second) std::swap(pair.first, pair.second);
        resolvedImpulses[pair] += c.normalImpulse;
        
        Body* bFirst = (c.fA->id < c.fB->id) ? c.a : c.b;
        float prFirst = bFirst->getRotation();
        float cosFirst = cos(-prFirst), sinFirst = sin(-prFirst);
        Vec2 rFirst_world = c.point - bFirst->getPosition();
        Vec2 localPointFirst(rFirst_world.x * cosFirst - rFirst_world.y * sinFirst, rFirst_world.x * sinFirst + rFirst_world.y * cosFirst);
        
        warmStartImpulses[pair].push_back({c.id, localPointFirst, c.normalImpulse, c.frictionImpulse});
    }
}

void World::clear() {
    // 1. Clear joints first (they depend on bodies)
    jointsMap.clear();

    // 2. Clear all tracking maps to prevent stale collision state
    currentPairs.clear();
    prevPairs.clear();
    bodyContactCounts.clear();
    resolvedImpulses.clear();
    warmStartImpulses.clear();

    // 3. Clear BVH and fixtures
    bvh.clear();
    for (auto* fixture : fixturesList) {
        delete fixture;
    }
    fixturesList.clear();
    fixturesMap.clear();

    // 4. Clear bodies
    for (auto* body : bodiesList) {
        delete body;
    }
    bodiesList.clear();
    bodiesMap.clear();

    // 5. Clear live data vectors and events
    liveBodyFloatData.clear();
    liveBodyIntData.clear();
    liveFixtureFloatData.clear();
    liveFixtureIntData.clear();
    eventData.clear();

    // 6. Reset ID counters
    nextFixtureId = 1;
}

Body* World::getBody(int id) const { auto it = bodiesMap.find(id); return it != bodiesMap.end() ? it->second : nullptr; }
Body* World::getBodyAtIndex(int index) const { return (index >= 0 && index < bodiesList.size()) ? bodiesList[index] : nullptr; }
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

int World::getEventCount() { return eventData.size() / 6; }
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
    jointsMap[id] = std::make_unique<HingeJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY));
    return id;
}

int World::createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    jointsMap[id] = std::make_unique<DistanceJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length);
    return id;
}

int World::createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
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
    // 1. Find and remove any joints that depend on this joint (e.g. GearJoints)
    // We use a separate list to avoid iterator invalidation during recursion
    std::vector<int> dependentJoints;
    for (auto& pair : jointsMap) {
        GearJoint* gj = dynamic_cast<GearJoint*>(pair.second.get());
        if (gj && (gj->joint1->id == id || gj->joint2->id == id)) {
            dependentJoints.push_back(pair.first);
        }
    }
    for (int djId : dependentJoints) {
        removeJoint(djId);
    }

    // 2. Remove the joint itself
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

    // Restitution compensation for external forces (gravity, etc.)
    float forceVn = (b->forceVelocity - a->forceVelocity).dot(normal);
    float relativeVn = vn - forceVn;

    // --- High-Fidelity Kinematic Energy Compensation ---
    // Correct for "free" potential energy gained by the solver teleporting objects out of overlaps.
    Vec2 grav = a->world.getGravity();
    float gMag = grav.magnitude();
    
    if (enableRestitution && relativeVn < -0.1f) {
        float targetBounceSpeed = restitution * (-relativeVn);
        
        if (gMag > 0.0001f && enablePenetration && depth > 0.004f) {
            Vec2 gDir = grav / gMag;
            float imA = a->getInverseMass();
            float imB = b->getInverseMass();
            
            // Calculate how much the position correction (Baumgarte) will lift the objects against gravity
            // We use 0.2f because that's the factor used in positionBias calculation
            float lift = (imA - imB) * normal.dot(gDir) * (depth - 0.004f) * 0.2f / (imA + imB);
            
            // v_launch^2 = (e * v_impact)^2 - 2gh. Tax the speed to pay for the free height.
            float speedSq = targetBounceSpeed * targetBounceSpeed;
            float compensatedSpeedSq = speedSq - 2.0f * gMag * lift;
            targetBounceSpeed = std::sqrt(std::max(0.0f, compensatedSpeedSq));
        }
        bias = -targetBounceSpeed;
    } else {
        bias = 0.0f;
    }
    // -------------------------------------------------------

#if 0
    Vec2 tangentialComponent = relVel - normal * vn;
    float tanMag = tangentialComponent.magnitude();
    if (tanMag > 0.0001f) {
        tangent = -tangentialComponent / tanMag;
    } else {
        // Fallback to a vector perpendicular to the normal
        tangent = Vec2(-normal.y, normal.x);
    }
#else
    // Use a strictly normal-based tangent for consistent friction direction
    tangent = Vec2(-normal.y, normal.x);
#endif

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

    float thetaB = b->getRotation();
    float cB = std::cos(-thetaB), sB = std::sin(-thetaB);
    localAnchorB = Vec2(rB.x * cB - rB.y * sB, rB.x * sB + rB.y * cB);
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
        // Recalculate relative velocity after normal impulse
        Vec2 vA_new = a->getVelocity(), vB_new = b->getVelocity();
        float wA_new = a->getAngularVelocity(), wB_new = b->getAngularVelocity();
        Vec2 vrA_new(-wA_new * rA.y, wA_new * rA.x), vrB_new(-wB_new * rB.y, wB_new * rB.x);
        Vec2 relVel_new = (vB_new + vrB_new) - (vA_new + vrA_new);

        float vt = relVel_new.dot(tangent);
        float dLambdaT = -vt * tangentMass;

        if (std::isfinite(dLambdaT)) {
            // Coulomb's Law transition: 
            // 1. Calculate the impulse required for zero relative velocity (static).
            // 2. If it exceeds the static limit, clamp it to the kinetic limit.
            // Using maxStaticFriction relative to normalImpulse.
            float maxStaticFriction = staticFriction * normalImpulse;
            float maxKineticFriction = kineticFriction * normalImpulse;
            
            float oldImpulseT = frictionImpulse;
            float newImpulseT = oldImpulseT + dLambdaT;
            
            if (std::abs(newImpulseT) > maxStaticFriction) {
                // We've broken static friction, use kinetic limit.
                frictionImpulse = std::max(-maxKineticFriction, std::min(maxKineticFriction, newImpulseT));
                
                // IMPORTANT: When breaking static friction, we often drop the kinetic impulse heavily.
                // In some engines, they just do: frictionImpulse = Math.sign(newImpulseT) * maxKineticFriction;
                // Wait, std::max(-M, std::min(M, X)) does exactly this clamping. But wait, if newImpulseT was huge, 
                // we set it to maxKineticFriction.
                // Is this right? Yes, that's standard.
            } else {
                // Still within static threshold.
                frictionImpulse = newImpulseT;
            }
            dLambdaT = frictionImpulse - oldImpulseT;

            Vec2 fImpulse = tangent * dLambdaT;
            if (imA > 0) {
                a->setVelocityInternal(a->getVelocity() - fImpulse * imA);
                a->setAngularVelocityInternal(a->getAngularVelocity() - rA.cross(fImpulse) * iIA);
            }
            if (imB > 0) {
                b->setVelocityInternal(b->getVelocity() + fImpulse * imB);
                b->setAngularVelocityInternal(b->getAngularVelocity() + rB.cross(fImpulse) * iIB);
            }
        }

    }
}

void ContactConstraint::solvePosition() {
    float imA = a->getInverseMass(), imB = b->getInverseMass();
    float iIA = a->getInverseInertia(), iIB = b->getInverseInertia();
    
    // Total mass should be greater than 0
    if (imA == 0.0f && imB == 0.0f) return;

    // Current transformations
    Vec2 pA = a->getPosition();
    float thetaA = a->getRotation();
    Vec2 pB = b->getPosition();
    float thetaB = b->getRotation();

    // Recompute local to world
    float cA = std::cos(thetaA), sA = std::sin(thetaA);
    Vec2 rA_curr(localAnchorA.x * cA - localAnchorA.y * sA, localAnchorA.x * sA + localAnchorA.y * cA);

    float cB = std::cos(thetaB), sB = std::sin(thetaB);
    Vec2 rB_curr(localAnchorB.x * cB - localAnchorB.y * sB, localAnchorB.x * sB + localAnchorB.y * cB);

    // Current separation
    Vec2 separation_vec = (pB + rB_curr) - (pA + rA_curr);
    float current_depth = depth - separation_vec.dot(normal);

    float slop = 0.004f;
    if (current_depth <= slop) {
        return; // Nothing to correct
    }

    // Baumgarte position correction
    float baumgarte = 0.2f;
    float maxCorrection = 0.2f; // Box2D limits position correction to 0.2 units per step
    float correction = std::min(current_depth - slop, maxCorrection) * baumgarte;

    float rnA = rA_curr.x * normal.y - rA_curr.y * normal.x;
    float rnB = rB_curr.x * normal.y - rB_curr.y * normal.x;
    float kNormal = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    
    if (kNormal < 0.00001f) return;

    float impulse = correction / kNormal;
    Vec2 P = normal * impulse;

    if (imA > 0) {
        a->world.liveBodyFloatData[a->worldIndex * BODY_FDATA_EPO + BODY_FDATA_X] = pA.x - P.x * imA;
        a->world.liveBodyFloatData[a->worldIndex * BODY_FDATA_EPO + BODY_FDATA_Y] = pA.y - P.y * imA;
        a->world.liveBodyFloatData[a->worldIndex * BODY_FDATA_EPO + BODY_FDATA_R] = thetaA - rA_curr.cross(P) * iIA;
    }
    if (imB > 0) {
        b->world.liveBodyFloatData[b->worldIndex * BODY_FDATA_EPO + BODY_FDATA_X] = pB.x + P.x * imB;
        b->world.liveBodyFloatData[b->worldIndex * BODY_FDATA_EPO + BODY_FDATA_Y] = pB.y + P.y * imB;
        b->world.liveBodyFloatData[b->worldIndex * BODY_FDATA_EPO + BODY_FDATA_R] = thetaB + rB_curr.cross(P) * iIB;
    }
}
