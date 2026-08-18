#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "island/island-internal.h"

// World island façade (stable compile path).
// Domain package: cpp/src/world/island/ (not more world-* siblings).
// Nested .cpp files are separate TUs via Makefile glob; do not #include implementation files.
// Modules: chain-map (island/chain-map.cpp), solve, build (future); island-internal.h seam.

bool bodyHasDistanceJoint(Body* body) {
    for (Joint* joint : body->joints) {
        if (joint->getType() == JointType::DISTANCE) {
            return true;
        }
    }
    return false;
}

float pendulumHeightAboveRest(Body* body) {
    if (!body) {
        return 0.0f;
    }
    Vec2 g = body->world.getGravity();
    float gMag = g.magnitude();
    if (gMag <= kChainResidualEps) {
        return 0.0f;
    }
    Vec2 gHat = g / gMag;
    for (Joint* joint : body->joints) {
        if (joint->getType() != JointType::DISTANCE) {
            continue;
        }
        Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
        if (!other || other->type != ObjectType::FIXED_OBJECT) {
            continue;
        }
        DistanceJoint* distanceJoint = static_cast<DistanceJoint*>(joint);
        Vec2 rod = body->getPosition() - other->getPosition();
        float alongG = rod.dot(gHat);
        float h = distanceJoint->getLength() - alongG;
        if (h < 0.0f) {
            h = 0.0f;
        }
        return h;
    }
    return 0.0f;
}
bool applyDistanceJointCdotOnly(DistanceJoint* joint, std::vector<SolverData>& solverBodies) {
    Body* bodyA = joint->bodyA;
    Body* bodyB = joint->bodyB;
    SolverData& sA = solverBodies[bodyA->worldIndex];
    SolverData& sB = solverBodies[bodyB->worldIndex];
    if (sA.im <= 0.0f && sB.im <= 0.0f) {
        return false;
    }

    Vec2 rA = joint->getLocalAnchorA().rotate(bodyA->getRotation());
    Vec2 rB = joint->getLocalAnchorB().rotate(bodyB->getRotation());
    Vec2 pA = bodyA->getPosition();
    Vec2 pB = bodyB->getPosition();
    Vec2 d = (pB + rB) - (pA + rA);
    float dMag = d.magnitude();
    if (dMag <= kChainJointReprojectMinDist) {
        return false;
    }

    Vec2 n = d / dMag;
    float rnA = rA.cross(n);
    float rnB = rB.cross(n);
    float k = sA.im + sB.im + sA.iI * rnA * rnA + sB.iI * rnB * rnB;
    if (k <= 0.0f) {
        return false;
    }
    float mass = 1.0f / k;

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(n);
    if (!std::isfinite(Cdot)) {
        return false;
    }

    float lambda = -mass * Cdot;
    if (!std::isfinite(lambda)) {
        return false;
    }

    Vec2 p = n * lambda;
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
    return true;
}

bool islandHasOverlappingContact(const Island& island) {
    for (ContactConstraint* c : island.contacts) {
        if (c && c->depth >= 0.0f) {
            return true;
        }
    }
    return false;
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
    
    // 2.1 DistanceJoints: skip preSolve (Baumgarte warm-start) for isolated pendulums
    std::unordered_set<Body*> overlappingBodies;
    for (ContactConstraint& c : contactConstraints) {
        if (c.depth < 0.0f) {
            continue;
        }
        if (c.a) {
            overlappingBodies.insert(c.a);
        }
        if (c.b) {
            overlappingBodies.insert(c.b);
        }
    }
    int djCount = distanceJoints.size();
    for (int i = 0; i < djCount; ++i) {
        DistanceJoint* joint = distanceJoints[i];
        bool aHit = joint->bodyA && joint->bodyA->type != ObjectType::FIXED_OBJECT &&
            overlappingBodies.count(joint->bodyA) != 0;
        bool bHit = joint->bodyB && joint->bodyB->type != ObjectType::FIXED_OBJECT &&
            overlappingBodies.count(joint->bodyB) != 0;
        if (!aHit && !bHit) {
            continue;
        }
        joint->preSolve(dt);
    }

    // 2.2 Vectorized SpringJoints
    for (SpringJoint* sj : springJoints) {
        sj->setWeakenOnContactIsland(false);
    }
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
                if (!bodyHasDistanceJoint(b)) {
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
        _syncFixturesSIMD();
    }
}

void World::_colorIsland(Island& island) {
    island.contactBatches.clear();
    island.jointBatches.clear();

    if (island.contacts.empty() && island.joints.empty()) {
        return;
    }

    // 1. Color Contacts
    if (!island.contacts.empty()) {
        std::vector<uint64_t> bodyBatchMasks(bodiesList.size(), 0);
        for (ContactConstraint* c : island.contacts) {
            uint64_t mask = 0;
            if (c->a->type != ObjectType::FIXED_OBJECT) mask |= bodyBatchMasks[c->a->worldIndex];
            if (c->b->type != ObjectType::FIXED_OBJECT) mask |= bodyBatchMasks[c->b->worldIndex];

            int batchIdx = 0;
            while ((mask >> batchIdx) & 1) {
                batchIdx++;
                if (batchIdx >= 64) break;
            }
            if (batchIdx >= 64) batchIdx = 63;

            if (batchIdx >= (int)island.contactBatches.size()) {
                island.contactBatches.resize(batchIdx + 1);
            }
            island.contactBatches[batchIdx].push_back(c);

            if (c->a->type != ObjectType::FIXED_OBJECT) bodyBatchMasks[c->a->worldIndex] |= (1ULL << batchIdx);
            if (c->b->type != ObjectType::FIXED_OBJECT) bodyBatchMasks[c->b->worldIndex] |= (1ULL << batchIdx);
        }
    }

    // 2. Color Joints
    if (!island.joints.empty()) {
        std::vector<uint64_t> bodyBatchMasks(bodiesList.size(), 0);
        for (Joint* j : island.joints) {
            uint64_t mask = 0;
            
            Body* bodies[6];
            int bodyCount = 0;
            bodies[bodyCount++] = j->bodyA;
            bodies[bodyCount++] = j->bodyB;
            
            GearJoint* gear = dynamic_cast<GearJoint*>(j);
            if (gear) {
                bodies[bodyCount++] = gear->joint1->bodyA;
                bodies[bodyCount++] = gear->joint1->bodyB;
                bodies[bodyCount++] = gear->joint2->bodyA;
                bodies[bodyCount++] = gear->joint2->bodyB;
            }

            for (int i = 0; i < bodyCount; ++i) {
                if (bodies[i]->type != ObjectType::FIXED_OBJECT) {
                    mask |= bodyBatchMasks[bodies[i]->worldIndex];
                }
            }

            int batchIdx = 0;
            while ((mask >> batchIdx) & 1) {
                batchIdx++;
                if (batchIdx >= 64) break;
            }
            if (batchIdx >= 64) batchIdx = 63;

            if (batchIdx >= (int)island.jointBatches.size()) {
                island.jointBatches.resize(batchIdx + 1);
            }
            island.jointBatches[batchIdx].push_back(j);

            for (int i = 0; i < bodyCount; ++i) {
                if (bodies[i]->type != ObjectType::FIXED_OBJECT) {
                    bodyBatchMasks[bodies[i]->worldIndex] |= (1ULL << batchIdx);
                }
            }
        }
    }
}

void World::_solveIslandVelocity(Island& island, float dt, int substepIndex, std::vector<Vec2>& prePgsAll) {
    // 1. Sort constraints for deterministic solving
    std::sort(island.contacts.begin(), island.contacts.end(), [](ContactConstraint* a, ContactConstraint* b) {
        return a->id.key < b->id.key;
    });
    std::sort(island.joints.begin(), island.joints.end(), [](Joint* a, Joint* b) {
        return a->id < b->id;
    });

    auto getSolverBody = [&](Body* b) -> SolverData& {
        return solverBodies[b->worldIndex];
    };

    // 2. Process the island
    // NOTE: Bodies were already woken up in _buildAndProcessIslands
    
    // Set up context
    for (ContactConstraint* c : island.contacts) {
        c->context.a = &getSolverBody(c->a);
        c->context.b = &getSolverBody(c->b);
    }

    std::vector<Vec2> prePgsV(solverBodies.size());
    for (Body* b : island.bodies) {
        prePgsV[b->worldIndex] = solverBodies[b->worldIndex].v;
        if (b->worldIndex >= 0 && static_cast<size_t>(b->worldIndex) < prePgsAll.size()) {
            prePgsAll[b->worldIndex] = solverBodies[b->worldIndex].v;
        }
    }

    // Apply warm starting impulses
    for (ContactConstraint* c : island.contacts) {
        SolverData& sA = *static_cast<SolverData*>(c->context.a);
        SolverData& sB = *static_cast<SolverData*>(c->context.b);
        
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
    const bool overlapping = islandHasOverlappingContact(island);
    for (Joint* j : island.joints) {
        j->context.a = &getSolverBody(j->bodyA);
        j->context.b = &getSolverBody(j->bodyB);
        if (SpringJoint* spring = dynamic_cast<SpringJoint*>(j)) {
            spring->setWeakenOnContactIsland(overlapping);
        }
        GearJoint* gear = dynamic_cast<GearJoint*>(j);
        if (gear) {
            gear->context.a = &getSolverBody(gear->joint1->bodyA);
            gear->context.b = &getSolverBody(gear->joint1->bodyB);
            gear->context.c = &getSolverBody(gear->joint2->bodyA);
            gear->context.d = &getSolverBody(gear->joint2->bodyB);
        }
    }

    // Velocity Iterations
    auto solveIslandContacts = [&]() {
        for (const auto& batch : island.contactBatches) {
            size_t i = 0;
            for (; i + 3 < batch.size(); i += 4) {
                ContactConstraint* b[4] = {batch[i], batch[i + 1], batch[i + 2], batch[i + 3]};
                ContactConstraint::solveFastSIMD(b);
            }
            for (; i < batch.size(); ++i) {
                batch[i]->solveFast();
            }
        }
    };

    bool islandHasSpringJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::SPRING) {
            islandHasSpringJoint = true;
            break;
        }
    }

    bool islandHasHingeOrGear = false;
    for (Joint* j : island.joints) {
        if (j && (j->getType() == JointType::HINGE || j->getType() == JointType::GEAR)) {
            islandHasHingeOrGear = true;
            break;
        }
    }

    for (int iter = 0; iter < velocityIterations; ++iter) {
        const bool iterOverlapping = islandHasOverlappingContact(island);
        const bool skipDistanceSolveFast = !overlapping && !islandHasSpringJoint;
        const bool contactFreeMechanical =
            !overlapping && island.contacts.empty();
        const bool runHingeFast =
            islandHasHingeOrGear &&
            (iterOverlapping || contactFreeMechanical);
        const bool runGearFast =
            islandHasHingeOrGear &&
            (islandHasSpringJoint || contactFreeMechanical);
        const bool enterJointLoop =
            iterOverlapping || islandHasSpringJoint ||
            (islandHasHingeOrGear && !overlapping);
        if (enterJointLoop) {
        for (int springPass = 0; springPass < 2; ++springPass) {
        for (const auto& batch : island.jointBatches) {
            for (size_t i = 0; i < batch.size(); ) {
                if (i + 3 < batch.size()) {
                    Joint* j0 = batch[i];
                    Joint* j1 = batch[i+1];
                    Joint* j2 = batch[i+2];
                    Joint* j3 = batch[i+3];

                    if (springPass == 0 && j0->getType() == JointType::SPRING &&
                        j1->getType() == JointType::SPRING &&
                        j2->getType() == JointType::SPRING &&
                        j3->getType() == JointType::SPRING) {
                        i += 4;
                        continue;
                    }
                    if (springPass == 1 && (j0->getType() != JointType::SPRING ||
                        j1->getType() != JointType::SPRING ||
                        j2->getType() != JointType::SPRING ||
                        j3->getType() != JointType::SPRING)) {
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::DISTANCE &&
                        j1->getType() == JointType::DISTANCE &&
                        j2->getType() == JointType::DISTANCE &&
                        j3->getType() == JointType::DISTANCE) {
                        DistanceJoint* djs[4] = {
                            static_cast<DistanceJoint*>(j0),
                            static_cast<DistanceJoint*>(j1),
                            static_cast<DistanceJoint*>(j2),
                            static_cast<DistanceJoint*>(j3)
                        };
                        if (!skipDistanceSolveFast) {
                            DistanceJoint::solveFastSIMD(djs);
                        }
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::SPRING &&
                        j1->getType() == JointType::SPRING &&
                        j2->getType() == JointType::SPRING &&
                        j3->getType() == JointType::SPRING) {
                        SpringJoint* sjs[4] = {
                            static_cast<SpringJoint*>(j0),
                            static_cast<SpringJoint*>(j1),
                            static_cast<SpringJoint*>(j2),
                            static_cast<SpringJoint*>(j3)
                        };
                        SpringJoint::solveFastSIMD(sjs);
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::HINGE &&
                        j1->getType() == JointType::HINGE &&
                        j2->getType() == JointType::HINGE &&
                        j3->getType() == JointType::HINGE) {
                        if (runHingeFast) {
                            HingeJoint* hjs[4] = {
                                static_cast<HingeJoint*>(j0),
                                static_cast<HingeJoint*>(j1),
                                static_cast<HingeJoint*>(j2),
                                static_cast<HingeJoint*>(j3)
                            };
                            HingeJoint::solveFastSIMD(hjs);
                        }
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::GEAR &&
                        j1->getType() == JointType::GEAR &&
                        j2->getType() == JointType::GEAR &&
                        j3->getType() == JointType::GEAR) {
                        if (runGearFast) {
                            GearJoint* gjs[4] = {
                                static_cast<GearJoint*>(j0),
                                static_cast<GearJoint*>(j1),
                                static_cast<GearJoint*>(j2),
                                static_cast<GearJoint*>(j3)
                            };
                            GearJoint::solveFastSIMD(gjs);
                        }
                        i += 4;
                        continue;
                    }
                }
                Joint* joint = batch[i];
                if ((springPass == 0 && joint->getType() == JointType::SPRING) ||
                    (springPass == 1 && joint->getType() != JointType::SPRING)) {
                    i++;
                    continue;
                }
                if (skipDistanceSolveFast && joint->getType() == JointType::DISTANCE) {
                    i++;
                    continue;
                }
                if (!runHingeFast && joint->getType() == JointType::HINGE) {
                    i++;
                    continue;
                }
                if (!runGearFast && joint->getType() == JointType::GEAR) {
                    i++;
                    continue;
                }
                joint->solveFast();
                i++;
            }
        }
        }
        if (iterOverlapping || islandHasSpringJoint) {
            solveIslandContacts();
        }
        }
        if (!iterOverlapping) {
            solveIslandContacts();
            for (Joint* j : island.joints) {
                if (j && j->getType() == JointType::DISTANCE) {
                    applyDistanceJointCdotOnly(static_cast<DistanceJoint*>(j), solverBodies);
                }
            }
        }
    }

    _characterizeIslandChainResidual(island);
    _applyIslandChainRestitution(island, prePgsV);
    _reprojectIslandJointsAfterChainMap(island);

    // Sync velocities back
    for (Body* b : island.bodies) {
        if (b->type != ObjectType::FIXED_OBJECT) {
            b->setSolverData(solverBodies[b->worldIndex]);
        }
    }
}

void World::_solveIslandPosition(Island& island, float dt, int substepIndex) {
    const int jointPositionIters = islandHasOverlappingContact(island) ? positionIterations : 1;
    bool islandHasSpringJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::SPRING) {
            islandHasSpringJoint = true;
            break;
        }
    }
    for (int p = 0; p < positionIterations; ++p) {
        for (const auto& batch : island.contactBatches) {
            for (ContactConstraint* c : batch) c->solvePosition();
        }
        if (p >= jointPositionIters) {
            continue;
        }
        if (islandHasOverlappingContact(island) && islandHasSpringJoint) {
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (!j || j->getType() == JointType::SPRING) {
                        continue;
                    }
                    j->solvePosition();
                }
            }
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (j && j->getType() == JointType::SPRING) {
                        j->solvePosition();
                    }
                }
            }
            for (const auto& batch : island.contactBatches) {
                for (ContactConstraint* c : batch) {
                    c->solvePosition();
                }
            }
        } else {
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (!j) {
                        continue;
                    }
                    if (j->getType() == JointType::GEAR && !islandHasSpringJoint &&
                        islandHasOverlappingContact(island)) {
                        continue;
                    }
                    j->solvePosition();
                }
            }
        }
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
