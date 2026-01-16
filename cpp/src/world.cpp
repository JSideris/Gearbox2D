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
    setTimeStep(1.0f / 60.0f);
    int maxSize = 10000;
    liveBodyFloatData.reserve(maxSize * BODY_FDATA_EPO);
    liveBodyIntData.reserve(maxSize * BODY_IDATA_EPO);
    liveFixtureFloatData.reserve(maxSize * FIXTURE_FDATA_EPO);
    liveFixtureIntData.reserve(maxSize * FIXTURE_IDATA_EPO);
    contactConstraints.reserve(100);
    velocityIterations = 50;
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
    
    // Remove joints
    std::vector<int> jointsToRemove;
    for (auto& pair : jointsMap) {
        if (pair.second->isConnectedTo(body)) jointsToRemove.push_back(pair.first);
    }
    for (int jId : jointsToRemove) removeJoint(jId);

    // Remove fixtures
    for (auto* fixture : body->fixtures) {
        if (fixture->bvhNode) {
            bvh.remove(fixture->bvhNode);
            fixture->bvhNode = nullptr;
        }
        
        int fIdx = fixture->worldIndex;
        if (fIdx != -1 && fIdx < fixturesList.size()) {
            std::iter_swap(fixturesList.begin() + fIdx, fixturesList.end() - 1);
            
            for (int i = 0; i < FIXTURE_IDATA_EPO; ++i) {
                std::iter_swap(liveFixtureIntData.begin() + fIdx * FIXTURE_IDATA_EPO + i,
                               liveFixtureIntData.begin() + (fixturesList.size() - 1) * FIXTURE_IDATA_EPO + i);
            }
            for (int i = 0; i < FIXTURE_FDATA_EPO; ++i) {
                std::iter_swap(liveFixtureFloatData.begin() + fIdx * FIXTURE_FDATA_EPO + i,
                               liveFixtureFloatData.begin() + (fixturesList.size() - 1) * FIXTURE_FDATA_EPO + i);
            }
            
            fixturesList[fIdx]->worldIndex = fIdx;
            fixturesList.pop_back();
            for (int i = 0; i < FIXTURE_IDATA_EPO; ++i) liveFixtureIntData.pop_back();
            for (int i = 0; i < FIXTURE_FDATA_EPO; ++i) liveFixtureFloatData.pop_back();
        }
        fixturesMap.erase(fixture->id);
        delete fixture;
    }

    int bIdx = body->worldIndex;
    if (bIdx != -1 && bIdx < bodiesList.size()) {
        std::iter_swap(bodiesList.begin() + bIdx, bodiesList.end() - 1);
        for (int i = 0; i < BODY_IDATA_EPO; ++i) {
            std::iter_swap(liveBodyIntData.begin() + bIdx * BODY_IDATA_EPO + i,
                           liveBodyIntData.begin() + (bodiesList.size() - 1) * BODY_IDATA_EPO + i);
        }
        for (int i = 0; i < BODY_FDATA_EPO; ++i) {
            std::iter_swap(liveBodyFloatData.begin() + bIdx * BODY_FDATA_EPO + i,
                           liveBodyFloatData.begin() + (bodiesList.size() - 1) * BODY_FDATA_EPO + i);
        }
        bodiesList[bIdx]->worldIndex = bIdx;
        
        // Update all fixtures of the moved body to point to the new body index
        for (auto* f : bodiesList[bIdx]->fixtures) {
            liveFixtureIntData[f->worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX] = bIdx;
        }

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
    _doIntegrateVelocities();
    _doBroadPhase();
    _doNarrowPhase();
    
    for (auto& pair : jointsMap) {
        if (pair.second->bodyA->isSleeping && pair.second->bodyB->isSleeping) continue;
        pair.second->preSolve(timeStep);
    }
    _doResolution();
    _doIntegratePositions();
    _doContactManagement();
}

void World::_doIntegrateVelocities() {
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
        body->integrateVelocities(timeStep);
    }
}

void World::_doIntegratePositions() {
    for (auto* body : bodiesList) {
        if (body->isSleeping) continue;

        bool moved = body->integratePositions(timeStep);

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
    for (const auto& pair : currentPairs) {
        if (prevPairs.find(pair) == prevPairs.end()) {
            Fixture* fA = getFixture(pair.first);
            Fixture* fB = getFixture(pair.second);
            if (fA && fB) {
                Body* bA = fA->body;
                Body* bB = fB->body;
                
                std::pair<int, int> bodyPair = {bA->id, bB->id};
                if (bodyPair.first > bodyPair.second) std::swap(bodyPair.first, bodyPair.second);
                
                if (bodyContactCounts[bodyPair]++ == 0) {
                    bA->addContact(bB);
                    bB->addContact(bA);
                }
                
                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_START, bA->id, bB->id, fA->id, fB->id, resolvedImpulses[pair]);
                }
            }
        }
    }
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
                }
                
                if (bA->wantsEvents() || bB->wantsEvents() || fA->wantsEvents() || fB->wantsEvents()) {
                    addEvent((int)EventType::COLLISION_END, bA->id, bB->id, fA->id, fB->id, 0);
                }
            }
        }
    }
    prevPairs = currentPairs;
}

void World::_doResolution() {
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

        c.preSolve(timeStep, hasRestitution, hasPenetrationResolution, hasFriction);
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
    for (auto& c : contactConstraints) {
        std::pair<int, int> pair = {c.fA->id, c.fB->id};
        if (pair.first > pair.second) std::swap(pair.first, pair.second);
        resolvedImpulses[pair] += c.normalImpulse;
    }
}

void World::clear() {
    while (!bodiesList.empty()) removeObject(bodiesList[0]->id);
    liveBodyFloatData.clear(); liveBodyIntData.clear();
    liveFixtureFloatData.clear(); liveFixtureIntData.clear();
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

void World::removeJoint(int id) { jointsMap.erase(id); }
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
        
        if (gMag > 0.0001f && enablePenetration && depth > 0.01f) {
            Vec2 gDir = grav / gMag;
            float imA = a->getInverseMass();
            float imB = b->getInverseMass();
            
            // Calculate how much the position correction (Baumgarte) will lift the objects against gravity
            // We use 0.2f because that's the factor used in positionBias calculation
            float lift = (imA - imB) * normal.dot(gDir) * (depth - 0.01f) * 0.2f / (imA + imB);
            
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

    Vec2 tangentialComponent = relVel - normal * vn;
    float tanMag = tangentialComponent.magnitude();
    if (tanMag > 0.0001f) {
        tangent = -tangentialComponent / tanMag;
    } else {
        // Fallback to a vector perpendicular to the normal
        tangent = Vec2(-normal.y, normal.x);
    }

    float rtA = rA.x * tangent.y - rA.y * tangent.x;
    float rtB = rB.x * tangent.y - rB.y * tangent.x;
    float kTangent = imA + imB + iIA * rtA * rtA + iIB * rtB * rtB;
    tangentMass = (kTangent > 0.00001f) ? 1.0f / kTangent : 0.0f;

    if (!enableFriction) {
        staticFriction = 0.0f;
        kineticFriction = 0.0f;
    }
    positionBias = (enablePenetration && depth > 0.01f) ? std::max(-2.0f, -0.2f / dt * (depth - 0.01f)) : 0.0f;
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
        if (positionBias < 0.0f) {
            Vec2 tangentialPseudoVelocityA(-rA.y * a->pseudoAngularVelocity, rA.x * a->pseudoAngularVelocity);
            Vec2 tangentialPseudoVelocityB(-rB.y * b->pseudoAngularVelocity, rB.x * b->pseudoAngularVelocity);
            float vnp = ((b->pseudoVelocity + tangentialPseudoVelocityB) - (a->pseudoVelocity + tangentialPseudoVelocityA)).dot(normal);
            float dLambdaP = -(vnp + positionBias) * normalMass;
            if (std::isfinite(dLambdaP)) {
                float oldP = positionImpulse; positionImpulse = std::max(oldP + dLambdaP, 0.0f); dLambdaP = positionImpulse - oldP;
                Vec2 impulseP = normal * dLambdaP;
                if (imA > 0) { a->pseudoVelocity = a->pseudoVelocity - impulseP * imA; a->pseudoAngularVelocity -= rA.cross(impulseP) * iIA; }
                if (imB > 0) { b->pseudoVelocity = b->pseudoVelocity + impulseP * imB; b->pseudoAngularVelocity += rB.cross(impulseP) * iIB; }
            }
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
            float maxStaticFriction = staticFriction * normalImpulse;
            float maxKineticFriction = kineticFriction * normalImpulse;
            
            float oldImpulseT = frictionImpulse;
            float newImpulseT = oldImpulseT + dLambdaT;
            
            if (std::abs(newImpulseT) > maxStaticFriction) {
                // We've broken static friction, use kinetic limit.
                frictionImpulse = std::max(-maxKineticFriction, std::min(maxKineticFriction, newImpulseT));
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
