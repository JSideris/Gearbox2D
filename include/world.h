#pragma once

#include <unordered_map>
#include <vector>
#include "vec2.h"
#include "bvh.h"

class PhysicalObject;  // Forward declaration of PhysicalObject

class World {
private:

    std::unordered_map<int, PhysicalObject*> objectsMap;  // Stores objects by their ID
    std::vector<PhysicalObject*> objectsList;             // List for efficient iteration
	Bvh tree;
	std::vector<float> liveData;  // x1, y1, r1, xs1, ys1, rs1, x2, y2, r2, xs2, ys2, rs2, ...
    std::vector<int> ids;

	float timeStep = 1.0f / 60.0f;  // Default time step of 60 Hz

	Vec2 gravity = Vec2(0.0f, 0.0f);  // Default gravity vector

public:

    std::unordered_map<int, float> decayMap;  // Stores precomputed decay rates by decay percentage per second.

    // Default constructor
    World();

    // Destructor to clean up dynamic memory
    ~World();

    // Add a new object to the world (ownership transferred to World)
    void addObject(PhysicalObject* object);

    // Remove an object from the world by its ID
    void removeObject(int id);

    void setTimeStep(float dt);

    void setGravity(float x, float y);

    // Access an object by its ID
    PhysicalObject* getObject(int id) const;

	PhysicalObject* getObjectAtIndex(int index) const;

    int getObjectCount() const;

	emscripten::val getIds();
	emscripten::val getLiveData();

    // Step function to update all objects in the world
    void step();

	void clear();

	void destroy();
};
