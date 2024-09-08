#ifndef WORLD_H
#define WORLD_H

#include <iostream>
#include <unordered_map>
#include <vector>

// class CollisionSolver;
// class PhysicalObject;

#include "debug.h"
#include "vec2.h"
#include "bvh.h"
#include "collision-solver.h"
#include "physical-object.h"
#include "impulse-solver.h"
#include "constants.h"


class PhysicalObject;  // Forward declaration of PhysicalObject

class World {
private:

    std::unordered_map<int, PhysicalObject*> objectsMap;  // Stores objects by their ID
    std::vector<PhysicalObject*> objectsList;             // List for efficient iteration
	Bvh bvh;
    CollisionSolver collisionSolver;
    // std::vector<int> ids;

	float timeStep = 1.0f / 60.0f;  // Default time step of 60 Hz

	Vec2 gravity = Vec2(0.0f, 0.0f);  // Default gravity vector

public:

	std::vector<float> liveFloatData;  // x1, y1, r1, xs1, ys1, rs1, mass, fx, fy, ix, iy  x2, ...
	std::vector<int> liveIntData;  // id, shape, type, hasaabbcollision

    std::unordered_map<int, float> decayMap;  // Stores precomputed decay rates by decay percentage per second.

    // Default constructor
    World();

    // Destructor to clean up dynamic memory
    ~World();

    // Make a new object to the world (ownership transferred to World)
    // Returns the index of the new object
    int makeObject(int id, emscripten_val options);
    // void addObject(PhysicalObject* object);

    // Remove an object from the world by its ID
    int removeObject(int id);

    void setTimeStep(float dt);

    void setGravity(float x, float y);

    int findeIndexForObject(int id);
    // Access an object by its ID
    PhysicalObject* getObject(int id) const;

	PhysicalObject* getObjectAtIndex(int index) const;

    int getObjectCount() const;

#ifdef EMSCRIPTEN
	emscripten_val getLiveFloatData();
	emscripten_val getLiveIntData();
#endif

    // Step function to update all objects in the world
    void step();
    void _doKinematics();
    void _doBroadPhase();
    void _doNarrowPhase();
    void _doResolution();
    void __doPenetrationResolution(CollisionInfo collisionInfo);

	void clear();

	void destroy();
};

#endif // WORLD_H