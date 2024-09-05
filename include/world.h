#ifndef WORLD_H
#define WORLD_H

#include <iostream>
#include <unordered_map>
#include <vector>
#include "debug.h"
#include "vec2.h"
#include "bvh.h"

#define LIVE_INT_EPO 4
#define LIVE_INT_ID 0
#define LIVE_INT_SHAPE 1
#define LIVE_INT_TYPE 2
#define LIVE_INT_HAS_AABB_COLLISION 3

#define LIVE_FLOAT_EPO 21
#define LIVE_FLOAT_X 0
#define LIVE_FLOAT_Y 1
#define LIVE_FLOAT_R 2
#define LIVE_FLOAT_VX 3
#define LIVE_FLOAT_VY 4
#define LIVE_FLOAT_RS 5
#define LIVE_FLOAT_M 6
#define LIVE_FLOAT_W 7
#define LIVE_FLOAT_RADIUS 7
#define LIVE_FLOAT_H 8
#define LIVE_FLOAT_FX 9
#define LIVE_FLOAT_FY 10
#define LIVE_FLOAT_IX 11
#define LIVE_FLOAT_IY 12
#define LIVE_FLOAT_AX1 13
#define LIVE_FLOAT_AY1 14
#define LIVE_FLOAT_AX2 15
#define LIVE_FLOAT_AY2 16
#define LIVE_FLOAT_NFX 17
#define LIVE_FLOAT_NFY 18
#define LIVE_FLOAT_NIX 19
#define LIVE_FLOAT_NIY 20

class PhysicalObject;  // Forward declaration of PhysicalObject

class World {
private:

    std::unordered_map<int, PhysicalObject*> objectsMap;  // Stores objects by their ID
    std::vector<PhysicalObject*> objectsList;             // List for efficient iteration
	Bvh bvh;
    // std::vector<int> ids;

	float timeStep = 1.0f / 60.0f;  // Default time step of 60 Hz

	Vec2 gravity = Vec2(0.0f, 0.0f);  // Default gravity vector

public:

	std::vector<float> liveFloatData;  // x1, y1, r1, xs1, ys1, rs1, mass, fx, fy, ix, iy  x2, ...
	std::vector<float> liveIntData;  // id, shape, type, hasaabbcollision

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

	void clear();

	void destroy();
};

#endif // WORLD_H