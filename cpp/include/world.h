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

class Body;
class Fixture;
class Joint;

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
    ContactID id;
    bool inIsland;
    
    Vec2 localAnchorA, localAnchorB, localNormalA;

    void preSolve(float dt, bool enableRestitution, bool enablePenetration, bool enableFriction);
    void solve(bool enableNormal, bool enableFriction);
    void solvePosition();

    ContactConstraint() : normalImpulse(0.0f), frictionImpulse(0.0f), staticFriction(0.0f), kineticFriction(0.0f), inIsland(false) {}

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

struct Island {
    std::vector<Body*> bodies;
    std::vector<ContactConstraint*> contacts;
    std::vector<Joint*> joints;
    bool canSleep;

    Island() : canSleep(false) {}

    void clear() {
        bodies.clear();
        contacts.clear();
        joints.clear();
        canSleep = false;
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
    CollisionSolver collisionSolver;

    float timeStep = 1.0f / 60.0f;
    Vec2 gravity = Vec2(0.0f, 0.0f);

    bool hasPenetrationResolution = true;
    bool hasRestitution = true;
    bool hasFriction = true;
    std::vector<ContactConstraint> contactConstraints;
    std::vector<float> eventData;
#ifdef GEARBOX_MT
    std::mutex eventMutex;
#endif
    int velocityIterations = 50;
    int positionIterations = 3;
    int velocitySubSteps = 1;
    float speculativeMargin = 0.01f; // Default speculative margin
    int nextFixtureId = 1;

#ifdef GEARBOX_MT
    std::unique_ptr<ThreadPool> threadPool;
    std::vector<std::unique_ptr<ThreadLocalSolver>> mtSolvers;
#endif

    std::vector<SolverData> solverBodies;
    std::vector<uint8_t> solverBodyActive;
private:

    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> currentPairs;
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> prevPairs;
    std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual> bodyContactCounts;
    std::unordered_map<std::pair<int, int>, float, PairHash, PairEqual> resolvedImpulses;
    std::unordered_map<std::pair<int, int>, WarmStartData, PairHash, PairEqual> warmStartImpulses;
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> disabledPairs;

    std::unordered_map<int, int> tempBodyIdMap;
    std::unordered_map<int, int> tempFixtureIdMap;

    void _clearContactTracking();
    void _maybePruneBodyContactCounts();
    void _maybePrunePairs();

    void _buildAndProcessIslands(float dt, int substepIndex);
    void _solveIslandVelocity(Island& island, float dt, int substepIndex);
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
    void setGravity(float x, float y);
    Vec2 getGravity() const { return gravity; }

    std::vector<int> queryBodiesAtPoint(float x, float y, uint32_t mask = 0xFFFFFFFF);
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
#endif
    int getEventCount();
    void addEvent(int type, int bodyA, int bodyB, int fixtureA, int fixtureB, float impulse);

    void step();
    void _doIntegrateVelocities();
    void _doIntegrateVelocitiesSubStep(float dt);
    void _doBroadPhase();
    void _doIntegrateVelocitiesSIMD(float dt);
    void _doIntegratePositionsSIMD(float dt);
    void _doNarrowPhase(float dt);
    void _doContactManagement();
    void _doResolution(float dt, int substepIndex);
    void clear();
};

#endif
