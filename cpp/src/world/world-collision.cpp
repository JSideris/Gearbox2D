#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include <algorithm>

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
            mtSolvers[i]->solver.clear();
            mtSolvers[i]->collisionPairs.clear();

            int start = i * batchSize;
            int end = std::min(start + batchSize, pairCount);
            if (start >= end) continue;

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
