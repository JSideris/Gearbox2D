#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "collision-solver.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "island-internal.h"

static float fixtureCircleRadius(Body* body) {
    if (!body) {
        return 0.0f;
    }
    for (Fixture* f : body->fixtures) {
        if (f && f->shape == ObjectShape::CIRCLE) {
            float r = f->getRadius();
            if (r > 0.0f) {
                return r;
            }
        }
    }
    return 0.0f;
}

static bool bodiesEqualInverseMass(Body* a, Body* b) {
    if (!a || !b) {
        return false;
    }
    float imA = a->getInverseMass();
    float imB = b->getInverseMass();
    if (imA <= 0.0f || imB <= 0.0f) {
        return false;
    }
    float ratio = imA / imB;
    return ratio >= 0.999999f && ratio <= 1.000001f;
}

static bool isPendulumSiblingSpacing(Body* ref, Body* cand, float walkStep, float maxGap, float maxDy) {
    if (!ref || !cand || cand == ref || cand->type == ObjectType::FIXED_OBJECT) {
        return false;
    }
    if (!bodyHasDistanceJoint(cand)) {
        return false;
    }
    if (!bodiesEqualInverseMass(ref, cand)) {
        return false;
    }
    if (std::abs(cand->getY() - ref->getY()) > maxDy) {
        return false;
    }
    float dx = std::abs(cand->getX() - ref->getX());
    return dx > kChainResidualEps && dx <= walkStep + maxGap;
}

static bool bodiesShareContactCount(
    Body* a,
    Body* b,
    const std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual>& bodyContactCounts) {
    if (!a || !b || a == b) {
        return false;
    }
    std::pair<int, int> key = {a->id, b->id};
    if (key.first > key.second) {
        std::swap(key.first, key.second);
    }
    auto it = bodyContactCounts.find(key);
    return it != bodyContactCounts.end() && it->second > 0;
}

static bool bodiesAreFloodNeighbors(
    Body* a,
    Body* b,
    float walkStep,
    float maxGap,
    float maxDy,
    const std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual>& bodyContactCounts) {
    if (!a || !b || a == b) {
        return false;
    }
    if (bodiesShareContactCount(a, b, bodyContactCounts)) {
        return true;
    }
    return isPendulumSiblingSpacing(a, b, walkStep, maxGap, maxDy);
}

static std::pair<int, int> fixturePairKey(int a, int b) {
    if (a > b) {
        std::swap(a, b);
    }
    return {a, b};
}

static bool fixturesCanCollide(const Fixture* fA, const Fixture* fB) {
    if (!fA || !fB || fA->body == fB->body) {
        return false;
    }
    if (fA->isSensor() || fB->isSensor()) {
        return false;
    }
    const uint32_t catA = fA->getCategoryBits();
    const uint32_t maskA = fA->getMaskBits();
    const uint32_t catB = fB->getCategoryBits();
    const uint32_t maskB = fB->getMaskBits();
    return (catA & maskB) != 0 && (catB & maskA) != 0;
}

static void markSynthesizedPhysicalCollision(Fixture* fA, Fixture* fB) {
	if (!fA || !fB) {
		return;
	}
	World& world = fA->world;
	world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(fA->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
	world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(fB->worldIndex, FIXTURE_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
	world.liveBodyIntData[GET_BODY_IDATA_INDEX(fA->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
	world.liveBodyIntData[GET_BODY_IDATA_INDEX(fB->body->worldIndex, BODY_IDATA_FLAGS)] |= HAS_PHYSICAL_COLLISION;
}

static void trySynthesizeFixturePair(
    CollisionSolver& collisionSolver,
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual>& existingPairs,
    Fixture* fA,
    Fixture* fB,
    float dt) {
    if (!fixturesCanCollide(fA, fB)) {
        return;
    }
    const int idxA = fA->worldIndex;
    const int idxB = fB->worldIndex;
    const auto key = fixturePairKey(idxA, idxB);
    if (existingPairs.count(key) != 0) {
        return;
    }
    if (collisionSolver.solve(idxA, idxB, dt)) {
        existingPairs.insert(key);
        markSynthesizedPhysicalCollision(fA, fB);
    }
}

static void expandSleepingImpactChain(
    CollisionSolver& collisionSolver,
    const std::vector<Fixture*>& fixturesList,
    const std::vector<Body*>& bodiesList,
    const std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual>& bodyContactCounts,
    float dt,
    std::unordered_set<Body*>& floodSet) {
    floodSet.clear();

    std::vector<Body*> bfsStack;
    for (const CollisionInfo& col : collisionSolver.collisions) {
        Fixture* fA = fixturesList[col.indexA];
        Fixture* fB = fixturesList[col.indexB];
        if (!fA || !fB) {
            continue;
        }
        if (fA->isSensor() || fB->isSensor()) {
            continue;
        }
        Body* bA = fA->body;
        Body* bB = fB->body;
        if (!bA || !bB) {
            continue;
        }
        if (bA->getInverseMass() + bB->getInverseMass() == 0) {
            continue;
        }

        bool aDynamic = bA->type != ObjectType::FIXED_OBJECT;
        bool bDynamic = bB->type != ObjectType::FIXED_OBJECT;
        bool aAwake = aDynamic && !bA->isSleeping;
        bool bAwake = bDynamic && !bB->isSleeping;
        bool aSleep = aDynamic && bA->isSleeping;
        bool bSleep = bDynamic && bB->isSleeping;
        if (!((aAwake && bSleep) || (bAwake && aSleep))) {
            continue;
        }

        for (Body* seed : {bA, bB}) {
            if (!seed || seed->type == ObjectType::FIXED_OBJECT) {
                continue;
            }
            if (floodSet.insert(seed).second) {
                bfsStack.push_back(seed);
            }
        }
    }

    if (floodSet.empty()) {
        return;
    }

    while (!bfsStack.empty()) {
        Body* b = bfsStack.back();
        bfsStack.pop_back();

        for (Body* contact : bodiesList) {
            if (!contact || contact == b || contact->type == ObjectType::FIXED_OBJECT) {
                continue;
            }
            if (!bodiesShareContactCount(b, contact, bodyContactCounts)) {
                continue;
            }
            if (floodSet.insert(contact).second) {
                bfsStack.push_back(contact);
            }
        }

        float refR = fixtureCircleRadius(b);
        if (refR <= 0.0f) {
            refR = 0.5f;
        }
        float spacing = refR * 2.0f;
        float walkStep = std::max(spacing, refR * 2.0f);
        float maxGap = walkStep * 0.5f;
        float maxDy = std::max(spacing, refR * 2.0f);

        for (Body* cand : bodiesList) {
            if (!cand || floodSet.count(cand) != 0) {
                continue;
            }
            if (!isPendulumSiblingSpacing(b, cand, walkStep, maxGap, maxDy)) {
                continue;
            }
            float r = fixtureCircleRadius(cand);
            if (r > 0.0f && refR > 0.0f) {
                float ratio = r / refR;
                if (ratio < 0.75f || ratio > 1.25f) {
                    continue;
                }
            }
            if (floodSet.insert(cand).second) {
                bfsStack.push_back(cand);
            }
        }
    }

    for (Body* b : floodSet) {
        if (b && b->isSleeping && b->type != ObjectType::FIXED_OBJECT) {
            b->wakeUp();
        }
    }

    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> existingPairs;
    for (const CollisionInfo& col : collisionSolver.collisions) {
        existingPairs.insert(fixturePairKey(col.indexA, col.indexB));
    }

    std::vector<Body*> flooded;
    flooded.reserve(floodSet.size());
    for (Body* b : floodSet) {
        flooded.push_back(b);
    }

    for (size_t i = 0; i < flooded.size(); ++i) {
        Body* ba = flooded[i];
        float refR = fixtureCircleRadius(ba);
        if (refR <= 0.0f) {
            refR = 0.5f;
        }
        float spacing = refR * 2.0f;
        float walkStep = std::max(spacing, refR * 2.0f);
        float maxGap = walkStep * 0.5f;
        float maxDy = std::max(spacing, refR * 2.0f);

        for (size_t j = i + 1; j < flooded.size(); ++j) {
            Body* bb = flooded[j];
            if (!bodiesAreFloodNeighbors(ba, bb, walkStep, maxGap, maxDy, bodyContactCounts)) {
                continue;
            }
            for (Fixture* fA : ba->fixtures) {
                if (!fA) {
                    continue;
                }
                for (Fixture* fB : bb->fixtures) {
                    if (!fB) {
                        continue;
                    }
                    trySynthesizeFixturePair(collisionSolver, existingPairs, fA, fB, dt);
                }
            }
        }
    }

    for (Body* dynamicBody : flooded) {
        if (!dynamicBody || dynamicBody->type == ObjectType::FIXED_OBJECT) {
            continue;
        }
        for (Body* fixedBody : bodiesList) {
            if (!fixedBody || fixedBody->type != ObjectType::FIXED_OBJECT) {
                continue;
            }
            if (dynamicBody->getInverseMass() + fixedBody->getInverseMass() == 0.0f) {
                continue;
            }
            for (Fixture* fDynamic : dynamicBody->fixtures) {
                if (!fDynamic) {
                    continue;
                }
                for (Fixture* fFixed : fixedBody->fixtures) {
                    if (!fFixed) {
                        continue;
                    }
                    trySynthesizeFixturePair(collisionSolver, existingPairs, fDynamic, fFixed, dt);
                }
            }
        }
    }
}

static bool bodyOnlyHasDistanceJointsToFixed(Body* body) {
    if (!body) {
        return false;
    }
    bool hasDistance = false;
    for (Joint* joint : body->joints) {
        if (joint->getType() != JointType::DISTANCE) {
            continue;
        }
        hasDistance = true;
        Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
        if (!other || other->type != ObjectType::FIXED_OBJECT) {
            return false;
        }
    }
    return hasDistance;
}

void World::_buildAndProcessIslands(float dt, int substepIndex) {
    int bodyCount = bodiesList.size();
    std::vector<bool> visited(bodyCount, false);
    std::vector<Body*> stack;

    // Reset joint inIsland flags
    for (auto& pair : jointsMap) {
        pair.second->inIsland = false;
    }
    
    // 1. Generate all contact constraints first, so we can follow them in DFS
    contactConstraints.clear();

    std::unordered_set<Body*> sleepingImpactFlood;
    expandSleepingImpactChain(collisionSolver, fixturesList, bodiesList, bodyContactCounts, dt, sleepingImpactFlood);

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
    
    // KRB split: contact/joint bias is computed here before island DFS.
    // Coupled contact+joint island PE tax is not applied (attempt-2 overlay removed).
    // 1.5 SIMD preSolve for contacts
    int contactCount = contactConstraints.size();
    int contactVectorizedCount = (contactCount / 4) * 4;
    for (int i = 0; i < contactVectorizedCount; i += 4) {
        ContactConstraint* batch[4] = {
            &contactConstraints[i],
            &contactConstraints[i+1],
            &contactConstraints[i+2],
            &contactConstraints[i+3]
        };
        ContactConstraint::preSolveSIMD(batch, dt, hasRestitution, hasPenetrationResolution, hasFriction);
    }
    for (int i = contactVectorizedCount; i < contactCount; ++i) {
        contactConstraints[i].preSolve(dt, hasRestitution, hasPenetrationResolution, hasFriction);
    }
    
    // 2. Pre-solve all joints globally so they can modify body velocities for warm-starting
    
    // 2.1 DistanceJoints
    int djCount = distanceJoints.size();
    for (int i = 0; i < djCount; ++i) {
        distanceJoints[i]->preSolve(dt);
    }

    // 2.2 Vectorized SpringJoints
    int sjCount = springJoints.size();
    int sjVectorizedCount = (sjCount / 4) * 4;
    for (int i = 0; i < sjVectorizedCount; i += 4) {
        SpringJoint::preSolveSIMD(&springJoints[i], dt);
    }
    for (int i = sjVectorizedCount; i < sjCount; ++i) {
        springJoints[i]->preSolve(dt);
    }

    // 2.3 Other joints (Hinge, Gear, etc.)
    for (auto& pair : jointsMap) {
        Joint* j = pair.second.get();
        // Skip if already processed
        if (dynamic_cast<DistanceJoint*>(j) || dynamic_cast<SpringJoint*>(j)) continue;
        j->preSolve(dt);
    }
    
    // Map bodies to their contact constraints for fast DFS
    std::vector<std::vector<ContactConstraint*>> bodyToContacts(bodyCount);
    for (auto& c : contactConstraints) {
        bodyToContacts[c.a->worldIndex].push_back(&c);
        bodyToContacts[c.b->worldIndex].push_back(&c);
    }
    
    // 2. DFS partitioning
    std::vector<Island> islands;
    lastChainResidual = ChainResidualStats();

    // 2.1 Pre-initialize solver data for all bodies to avoid race conditions
    // when multiple islands share a static body.
    for (int i = 0; i < bodyCount; ++i) {
        solverBodies[i] = bodiesList[i]->getSolverData();
        solverBodyActive[i] = 1; // Mark as initialized
    }
    if (pendulumPeakMechE.size() < solverBodies.size()) {
        pendulumPeakMechE.resize(solverBodies.size(), 0.0f);
    }
    for (int i = 0; i < bodyCount; ++i) {
        Body* b = bodiesList[i];
        if (!b || b->type == ObjectType::FIXED_OBJECT || !bodyHasDistanceJoint(b)) {
            continue;
        }
        SolverData& s = solverBodies[i];
        if (s.im <= 0.0f) {
            continue;
        }
        float m = 1.0f / s.im;
        float ke = 0.5f * m * (s.v.x * s.v.x + s.v.y * s.v.y);
        float pe = m * b->world.getGravity().magnitude() * pendulumHeightAboveRest(b);
        float e = ke + pe;
        int idx = b->worldIndex;
        if (idx >= 0 && static_cast<size_t>(idx) < pendulumPeakMechE.size() && e > pendulumPeakMechE[idx]) {
            pendulumPeakMechE[idx] = e;
        }
    }

    std::vector<Vec2> prePgsAll(solverBodies.size());
    for (int i = 0; i < bodyCount; ++i) {
        prePgsAll[i] = solverBodies[i].v;
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

            for (Body* nb : sleepingImpactFlood) {
                if (!nb || nb == b || nb->type == ObjectType::FIXED_OBJECT) {
                    continue;
                }
                if (!visited[nb->worldIndex]) {
                    visited[nb->worldIndex] = true;
                    stack.push_back(nb);
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
            _colorIsland(currentIsland);
            islands.push_back(std::move(currentIsland));
        }
    }
    
    // 3. Process the islands
    if (!islands.empty()) {
        // --- Velocity Pass ---
        if (islands.size() == 1) {
            _solveIslandVelocity(islands[0], dt, substepIndex, prePgsAll);
        } else {
#ifdef GEARBOX_MT
            for (auto& isl : islands) {
                threadPool->enqueue([this, &isl, dt, substepIndex, &prePgsAll]() {
                    this->_solveIslandVelocity(isl, dt, substepIndex, prePgsAll);
                });
            }
            threadPool->wait();
#else
            for (auto& isl : islands) {
                _solveIslandVelocity(isl, dt, substepIndex, prePgsAll);
            }
#endif
        }

        ChainResidualStats agg;
        for (const Island& isl : islands) {
            agg.pathCount += isl.chainPathCount;
            agg.eligibleContactCount += isl.chainEligibleContactCount;
            if (isl.chainMaxApproachingVn > agg.maxApproachingVn) {
                agg.maxApproachingVn = isl.chainMaxApproachingVn;
            }
            agg.visitedPathCount += isl.chainPassVisitedPathCount;
            agg.appliedPathCount += isl.chainPassAppliedPathCount;
            agg.reprojectedJointCount += isl.chainPassReprojectedJointCount;
        }
        lastChainResidual = agg;
        _applyWorldPendulumPackChainMap(prePgsAll);
        {
            std::unordered_set<Body*> contacted;
            for (ContactConstraint& c : contactConstraints) {
                if (!c.inIsland || c.depth < 0.0f) {
                    continue;
                }
                if (c.a) {
                    contacted.insert(c.a);
                }
                if (c.b) {
                    contacted.insert(c.b);
                }
            }
            int snapped = 0;
            for (Body* b : bodiesList) {
                if (!b || b->type == ObjectType::FIXED_OBJECT || contacted.count(b) != 0) {
                    continue;
                }
                if (b->worldIndex < 0 || static_cast<size_t>(b->worldIndex) >= solverBodies.size()) {
                    continue;
                }
                if (!bodyOnlyHasDistanceJointsToFixed(b)) {
                    continue;
                }
                snapPendulumVelocityToTangent(b, solverBodies[b->worldIndex]);
                snapped++;
            }
            lastChainResidual.reprojectedJointCount += snapped;
        }
        for (Body* b : bodiesList) {
            if (b && b->type != ObjectType::FIXED_OBJECT &&
                b->worldIndex >= 0 && static_cast<size_t>(b->worldIndex) < solverBodies.size()) {
                b->setSolverData(solverBodies[b->worldIndex]);
            }
        }

        for (Body* b : bodiesList) {
            if (!b || b->type == ObjectType::FIXED_OBJECT || !b->isSleeping) {
                continue;
            }
            float vx = b->getVelocityX();
            float vy = b->getVelocityY();
            float w = b->getAngularVelocity();
            if (std::abs(vx) > kChainResidualEps || std::abs(vy) > kChainResidualEps ||
                std::abs(w) > kChainResidualEps) {
                b->wakeUp();
            }
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
    
    // 5. Re-synchronize AABBs after position correction using SIMD
    if (positionIterations > 0) {
        _syncFixturesSIMD(dt);
    }
}
