#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include <algorithm>
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

void World::clear() {
    jointsMap.clear();
    distanceJoints.clear();
    springJoints.clear();
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

#ifdef __EMSCRIPTEN__
emscripten_val World::getLiveBodyFloatData() { return emscripten_val(emscripten::typed_memory_view(liveBodyFloatData.size(), liveBodyFloatData.data())); }
emscripten_val World::getLiveBodyIntData() { return emscripten_val(emscripten::typed_memory_view(liveBodyIntData.size(), liveBodyIntData.data())); }
emscripten_val World::getLiveFixtureFloatData() { return emscripten_val(emscripten::typed_memory_view(liveFixtureFloatData.size(), liveFixtureFloatData.data())); }
emscripten_val World::getLiveFixtureIntData() { return emscripten_val(emscripten::typed_memory_view(liveFixtureIntData.size(), liveFixtureIntData.data())); }
emscripten_val World::getEventData() { return emscripten_val(emscripten::typed_memory_view(eventData.size(), eventData.data())); }
#endif
