#ifndef WORLD_H
#define WORLD_H

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <utility>
#include <algorithm>
#include <memory>
#ifdef GEARBOX_MT
#include <mutex>
#include <future>
#include "thread-pool.h"
#endif

#ifdef __EMSCRIPTEN__
#include <emscripten/val.h>
#endif

#include "debug.h"
#include "vec2.h"
#include "bvh.h"
#include "collision-solver.h"
#include "constants.h"
#include "joint.h"
#include "solver-data.h"
#include "simd-math.h"
#include "spatial-query.h"

class Body;
class Fixture;
class Joint;
class DistanceJoint;
class SpringJoint;

struct PairHash {
    size_t operator()(const std::pair<int, int>& p) const {
        int first = p.first;
        int second = p.second;
        if (first > second) std::swap(first, second);
        return std::hash<int>()(first) ^ (std::hash<int>()(second) << 1);
    }
};

struct PairEqual {
    bool operator()(const std::pair<int, int>& a, const std::pair<int, int>& b) const {
        int a1 = a.first, a2 = a.second;
        int b1 = b.first, b2 = b.second;
        if (a1 > a2) std::swap(a1, a2);
        if (b1 > b2) std::swap(b1, b2);
        return a1 == b1 && a2 == b2;
    }
};

struct ThreadLocalSolver {
    CollisionSolver solver;
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> collisionPairs;
    ThreadLocalSolver(World& world) : solver(world) {}
};

struct ContactConstraint {
    Body* a;
    Body* b;
    Fixture* fA;
    Fixture* fB;
    Vec2 point;
    Vec2 normal;
    float depth;
    Vec2 rA, rB;
    float normalMass, tangentMass;
    Vec2 tangent;
    float staticFriction, kineticFriction;
    float bias;
    float restitution;
    float normalImpulse, frictionImpulse;
    float frictionNormalBase;
    float krbPositionScale;
    ContactID id;
    bool inIsland;
    
    Vec2 localAnchorA, localAnchorB, localNormalA;

    void preSolve(float dt, bool enableRestitution, bool enablePenetration, bool enableFriction);
    static void preSolveSIMD(ContactConstraint** batch, float dt, bool enableRestitution, bool enablePenetration, bool enableFriction);
    static void solveFastSIMD(ContactConstraint** batch);
    void solve(bool enableNormal, bool enableFriction);
    void solvePosition();

    ContactConstraint() : normalImpulse(0.0f), frictionImpulse(0.0f), frictionNormalBase(0.0f), krbPositionScale(1.0f), staticFriction(0.0f), kineticFriction(0.0f), inIsland(false) {}

    // Temporary storage during iterations
    struct SolverContext {
        void* a; 
        void* b; 
    } context;

    void solveFast();
};

struct StoredImpulse {
    ContactID id;
    Vec2 localPointA;
    float normalImpulse;
    float frictionImpulse;
};

struct WarmStartData {
    StoredImpulse impulses[2];
    int count = 0;
};

struct ChainResidualStats {
    int pathCount = 0;
    int eligibleContactCount = 0;
    float maxApproachingVn = 0.0f;
    int visitedPathCount = 0;
    int appliedPathCount = 0;
    int reprojectedJointCount = 0;
};

struct Island {
    std::vector<Body*> bodies;
    std::vector<ContactConstraint*> contacts;
    std::vector<Joint*> joints;
    
    std::vector<std::vector<ContactConstraint*>> contactBatches;
    std::vector<std::vector<Joint*>> jointBatches;

    bool canSleep;
    int chainPathCount = 0;
    int chainEligibleContactCount = 0;
    float chainMaxApproachingVn = 0.0f;
    int chainPassVisitedPathCount = 0;
    int chainPassAppliedPathCount = 0;
    int chainPassReprojectedJointCount = 0;

    Island() : canSleep(false) {}

    void clear() {
        bodies.clear();
        contacts.clear();
        joints.clear();
        contactBatches.clear();
        jointBatches.clear();
        canSleep = false;
        chainPathCount = 0;
        chainEligibleContactCount = 0;
        chainMaxApproachingVn = 0.0f;
        chainPassVisitedPathCount = 0;
        chainPassAppliedPathCount = 0;
        chainPassReprojectedJointCount = 0;
    }
};

class World {
private:
    std::unordered_map<int, Body*> bodiesMap;
    std::vector<Body*> bodiesList;
    std::vector<Body*> _idToBody;
    std::unordered_map<int, Fixture*> fixturesMap;
    std::vector<Fixture*> fixturesList;
    std::vector<Fixture*> _idToFixture;
    
    std::unordered_map<int, std::unique_ptr<Joint>> jointsMap;
    std::vector<DistanceJoint*> distanceJoints;
    std::vector<SpringJoint*> springJoints;
    CollisionSolver collisionSolver;

    float timeStep = 1.0f / 60.0f;
    Vec2 gravity = Vec2(0.0f, 0.0f);

    bool hasPenetrationResolution = true;
    bool hasRestitution = true;
    bool hasFriction = true;
    bool hasKrb = true;
    std::vector<ContactConstraint> contactConstraints;
    std::vector<float> eventData;
#ifdef GEARBOX_MT
    std::mutex eventMutex;
#endif
    int velocityIterations = 8;
    int positionIterations = 3;
    int velocitySubSteps = 1;
    float speculativeMargin = 0.01f; // Default speculative margin
    ChainResidualStats lastChainResidual;
    int nextFixtureId = 1;

#ifdef GEARBOX_MT
    std::unique_ptr<ThreadPool> ownedThreadPool;
    ThreadPool* threadPool = nullptr;
    std::vector<std::unique_ptr<ThreadLocalSolver>> mtSolvers;
#endif

    std::vector<SolverData> solverBodies;
    std::vector<uint8_t> solverBodyActive;
    std::vector<float> pendulumPeakMechE;
private:

    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> currentPairs;
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> prevPairs;
    std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual> bodyContactCounts;
    std::unordered_map<std::pair<int, int>, float, PairHash, PairEqual> resolvedImpulses;
    std::unordered_map<std::pair<int, int>, WarmStartData, PairHash, PairEqual> warmStartImpulses;
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> disabledPairs;

    // Spatial query buffers (PER-856). Grown geometrically, never shrunk.
    std::vector<int32_t> queryHits;
    std::vector<float> rayHits;
    std::vector<int32_t> batchOffsets;
    std::vector<float> batchInput;
    std::vector<int32_t> batchExclude;
    std::vector<int32_t> queryHeader = std::vector<int32_t>(4, 0);
    std::vector<BvhNode*> queryCandidates;
    std::vector<BvhNode*> queryStack;
    std::vector<uint32_t> queryBodyStamp;
    uint32_t queryStampCounter = 0;
    std::vector<std::pair<RayHit, Fixture*>> rayScratch;
    std::vector<Fixture*> queryAccepted;
    const void* queryBufPtr[3] = {nullptr, nullptr, nullptr};
    size_t queryBufCap[3] = {0, 0, 0};

    void _queryBegin();
    int _queryEnd(int count);
    bool _queryAccepts(const Fixture* f, uint32_t mask, int flags, int excludeBodyId) const;
    void _queryNewStamp();
    void _emitAccepted(int flags);
    void _collectAabb(const Vec2& lo, const Vec2& hi, uint32_t mask, int flags);
    void _collectRadius(const Vec2& c, float radius, uint32_t mask, int flags, int excludeBodyId);

    std::unordered_map<int, int> tempBodyIdMap;
    std::unordered_map<int, int> tempFixtureIdMap;

    void _clearContactTracking();
    void _maybePruneBodyContactCounts();
    void _maybePrunePairs();

    void _buildAndProcessIslands(float dt, int substepIndex);
    void _colorIsland(Island& island);
    void _characterizeIslandChainResidual(Island& island);
    void _applyIslandChainRestitution(Island& island, const std::vector<Vec2>& prePgsV);
    void _applyWorldPendulumPackChainMap(const std::vector<Vec2>& prePgsV);
    void _reprojectIslandJointsAfterChainMap(Island& island);
    void _solveIslandVelocity(Island& island, float dt, int substepIndex, std::vector<Vec2>& prePgsAll);
    void _solveIslandPosition(Island& island, float dt, int substepIndex);

public:
    Bvh bvh;
    float invTimeStep;
    std::vector<float> liveBodyFloatData;
    std::vector<int> liveBodyIntData;
    std::vector<float> liveFixtureFloatData;
    std::vector<int> liveFixtureIntData;

    std::unordered_map<int, float> decayMap;

    World();
    ~World();

    void setVelocitySubSteps(int substeps) { velocitySubSteps = std::max(1, substeps); }
    int getVelocitySubSteps() const { return velocitySubSteps; }
    void setVelocityIterations(int iterations) { velocityIterations = std::max(1, iterations); }
    int getVelocityIterations() const { return velocityIterations; }
    void setPositionIterations(int iterations) { positionIterations = std::max(0, iterations); }
    int getPositionIterations() const { return positionIterations; }
    void setSpeculativeMargin(float margin) { speculativeMargin = std::max(0.0f, margin); }
    float getSpeculativeMargin() const { return speculativeMargin; }
    float getPendulumPeakMechE(int idx) const {
        if (idx < 0 || static_cast<size_t>(idx) >= pendulumPeakMechE.size()) {
            return 0.0f;
        }
        return pendulumPeakMechE[idx];
    }
    void setPendulumPeakMechE(int idx, float energy) {
        if (idx < 0 || static_cast<size_t>(idx) >= pendulumPeakMechE.size()) {
            return;
        }
        pendulumPeakMechE[idx] = energy;
    }

    int createBody(int id, emscripten_val options);
    int createFixture(int bodyId, int fixtureId, emscripten_val options, bool recomputeMass = true);
    int removeObject(int id);

    int createHingeJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY);
    int createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length);
    int createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio);
    int createGearJoint(int id, int joint1Id, int joint2Id, float ratio);
    void removeJoint(int id);
    Joint* getJoint(int id);

    void updateBodyId(int oldId, int newId);
    void updateFixtureId(int oldId, int newId);
    void updateJointId(int oldId, int newId);
    void syncDefragmentedIds();

    void setTimeStep(float dt);
    float getTimeStep() const { return timeStep; }
    void setHasPenetrationResolution(bool value);
    void setHasRestitution(bool value);
    void setHasFriction(bool value);
    void setHasKrb(bool value);
    bool getHasKrb() const { return hasKrb; }
    void setGravity(float x, float y);
    Vec2 getGravity() const { return gravity; }
    ChainResidualStats getLastChainResidual() const { return lastChainResidual; }

    std::vector<int> queryBodiesAtPoint(float x, float y, uint32_t mask = 0xFFFFFFFF);

    // --- Spatial queries (PER-856) ---------------------------------------
    // All walk the BVH broadphase, then run an exact shape test on its candidates.
    // A fixture matches when (categoryBits & mask) != 0; see QUERY_FLAG_* for flags.
    // Hits land in reused buffers: queryHits holds [fixtureId, bodyId] pairs (internal ids),
    // rayHits holds [t, px, py, nx, ny] per hit. Each call returns its hit count.
    int queryAABB(float minX, float minY, float maxX, float maxY, uint32_t mask = 0xFFFFFFFF, int flags = 0);
    int queryRadius(float x, float y, float radius, uint32_t mask = 0xFFFFFFFF, int flags = 0);
    // Ray p1->p2. Default: closest hit only; QUERY_FLAG_RAY_ALL returns every hit sorted by t.
    // excludeBodyId (internal id, -1 = none) skips one body, e.g. the shooter.
    int raycast(float x1, float y1, float x2, float y2, uint32_t mask = 0xFFFFFFFF, int flags = 0, int excludeBodyId = -1);
    // Batched radius query: centres from batchInput ([x, y, radius] per query) and
    // batchExclude (internal body id to skip per query, -1 = none). Hits for query i are
    // queryHits pairs [batchOffsets[i], batchOffsets[i+1]). Returns the total hit count.
    int queryRadiusBatch(int count, uint32_t mask = 0xFFFFFFFF, int flags = 0);
    // Grows the batch input buffers to hold `count` queries.
    void reserveQueryBatch(int count);

    const std::vector<int32_t>& getQueryHits() const { return queryHits; }
    const std::vector<float>& getRayHits() const { return rayHits; }
    const std::vector<int32_t>& getBatchOffsets() const { return batchOffsets; }
    std::vector<float>& getBatchInputBuffer() { return batchInput; }
    std::vector<int32_t>& getBatchExcludeBuffer() { return batchExclude; }
    // [0] = generation, bumped whenever a query buffer moves or grows. Allocated once; never moves.
    int getQueryBufferGeneration() const { return queryHeader[0]; }
    Fixture* getFixtureAtIndex(int index) const;
    std::vector<int> queryFixturesAtPoint(float x, float y, uint32_t mask = 0xFFFFFFFF);
    Body* getBody(int id) const;
    Body* getBodyAtIndex(int index) const;
    Fixture* getFixture(int id) const;
    int getBodyCount() const;
    int getFixtureCount() const;
    int findFixtureIndex(int id);

#ifdef __EMSCRIPTEN__
    emscripten_val getLiveBodyFloatData();
    emscripten_val getLiveBodyIntData();
    emscripten_val getLiveFixtureFloatData();
    emscripten_val getLiveFixtureIntData();
    emscripten_val getEventData();
    // Views over the full capacity of the query buffers; re-fetch when the generation changes.
    emscripten_val getQueryHeader();
    emscripten_val getQueryHitsView();
    emscripten_val getRayHitsView();
    emscripten_val getBatchOffsetsView();
    emscripten_val getBatchInputView();
    emscripten_val getBatchExcludeView();
#endif
    int getEventCount();
    const std::vector<float>& getEventBuffer() const { return eventData; }
    void addEvent(int type, int bodyA, int bodyB, int fixtureA, int fixtureB, float impulse);

    void step();
    void _doIntegrateVelocities();
    void _doIntegrateVelocitiesSubStep(float dt);
    void _doBroadPhase();
    void _doIntegrateVelocitiesSIMD(float dt);
    void _doIntegratePositionsSIMD(float dt);
    void _syncFixturesSIMD(float dt);
    void _doNarrowPhase(float dt);
    void _doContactManagement();
    void _doResolution(float dt, int substepIndex);
    void clear();
};

#endif
