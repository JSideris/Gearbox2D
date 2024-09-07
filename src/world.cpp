
#include <iostream>
#include "world.h"
// #include "physical-object.h"
// #include "bvh.h"

using namespace std;

World::World():
    collisionSolver(liveIntData, liveFloatData){
    // TODO: if we add more than 10k items, there should be some kind of event to warn the client.
    // Currently, the engine crashes with that many items. But with optimizations it's possible to exceed that.
    setTimeStep(1.0f / 60.0f);
    int size = 10000;
    liveFloatData.reserve(size * FDATA_EPO);
    liveIntData.reserve(size * LIVE_INT_EPO);

    // collisionSolver = CollisionSolver(liveIntData, liveFloatData);
}

World::~World() {
    clear();
}

int World::makeObject(int id, emscripten_val options){
    auto object = new PhysicalObject(*this, id, options);

    object->worldIndex = objectsList.size();

    objectsMap[id] = object;
    objectsList.push_back(object);

    // object->bvhNode = bvh.insert(object->aabb, object);

    liveIntData.push_back(id);
    liveIntData.push_back((int)object->shape);
    liveIntData.push_back((int)object->type);
    liveIntData.push_back(0);

    // auto position = object->getPosition();
    // auto velocity = object->getVelocity();
    // auto rotation = object->getRotation();
    // auto rotationalSpeed = object->getRotationalSpeed();

    liveFloatData.push_back(options.hasOwnProperty("x") ? options["x"].as<float>() : 0.0f); // x
    liveFloatData.push_back(options.hasOwnProperty("y") ? options["y"].as<float>() : 0.0f); // y
    liveFloatData.push_back(options.hasOwnProperty("r") ? options["r"].as<float>() : 0.0f); // rotation
    liveFloatData.push_back(options.hasOwnProperty("vx") ? options["vx"].as<float>() : 0.0f); // vx
    liveFloatData.push_back(options.hasOwnProperty("vy") ? options["vy"].as<float>() : 0.0f); // vy
    liveFloatData.push_back(options.hasOwnProperty("rs") ? options["rs"].as<float>() : 0.0f); // rs
    liveFloatData.push_back(options.hasOwnProperty("mass") ? options["mass"].as<float>() : 0.0f); // mass
    liveFloatData.push_back(options.hasOwnProperty("gscale") ? options["gscale"].as<float>() : 1.0f);
    liveFloatData.push_back(options.hasOwnProperty("restitution") ? options["restitution"].as<float>() : 0.5f);
    liveFloatData.push_back(options.hasOwnProperty("sFriction") ? options["sFriction"].as<float>() : 0.3f);
    // liveFloatData.push_back(options.hasOwnProperty("dFriction") ? options["dFriction"].as<float>() : 0.2f);
    liveFloatData.push_back(options.hasOwnProperty("kFriction") ? options["kFriction"].as<float>() : 0.2f);
    liveFloatData.push_back(options.hasOwnProperty("linearDamping") ? options["linearDamping"].as<float>() : 0.05f);
    liveFloatData.push_back(options.hasOwnProperty("angularDamping") ? options["angularDamping"].as<float>() : 0.05f);
    liveFloatData.push_back(
        (
            options.hasOwnProperty("radius") ? options["radius"].as<float>() : (
                options.hasOwnProperty("width") ? options["width"].as<float>() : 0.0f)
        )
    ); // radius or width
    liveFloatData.push_back(options.hasOwnProperty("height") ? options["height"].as<float>() : 0.0f); // height

    liveFloatData.push_back(0.0f); // fx
    liveFloatData.push_back(0.0f); // fy
    liveFloatData.push_back(0.0f); // ix
    liveFloatData.push_back(0.0f); // iy

    liveFloatData.push_back(object->aabb.min.x); // x0
    liveFloatData.push_back(object->aabb.min.y); // y0
    liveFloatData.push_back(object->aabb.max.x); // x1
    liveFloatData.push_back(object->aabb.max.y); // y1
    
    liveFloatData.push_back(0.0f); // nfx
    liveFloatData.push_back(0.0f); // nfy
    liveFloatData.push_back(0.0f); // nix
    liveFloatData.push_back(0.0f); // niy

    object->recomputeAabb(true);

    auto * bvhNode = bvh.insert(object->aabb, object);
    object->bvhNode = bvhNode;

    return object->worldIndex;
}

int World::removeObject(int id) {

    // cout << "Removing object with id: " << id << endl;

    auto it = objectsMap.find(id);

    if (it != objectsMap.end()) {
        auto object = it->second;

        // Remove the object from the BVH
        // cout << "Remove from BVH???" << endl;
        if (object->bvhNode) {
            // cout << "Removing from BVH" << endl;
            // TODO: ensure that this frees up the memory used by the node.
            bvh.remove(object->bvhNode);
            object->bvhNode = nullptr;
        }

        // Get the index of the object to remove
        int index = object->worldIndex;

        // Clear the object's reference to the world
        // object->world = nullptr;
        // TODO: shouldn't I delete the object reference too?
        // This can be done by calling object->destroy(true);
        object->worldIndex = -1;

        // Remove the object from the list if it has a valid index
        if (index != -1 && index < objectsList.size()) {
            // Swap the object to be removed with the last object in the list
            iter_swap(objectsList.begin() + index, objectsList.end() - 1);

            for(int i = 0; i < LIVE_INT_EPO; i++){
                iter_swap(
                    liveIntData.begin() + index * LIVE_INT_EPO + i, 
                    liveIntData.begin() + (liveIntData.size() / LIVE_INT_EPO - 1) * LIVE_INT_EPO + i
                );
            }

            for(int i = 0; i < FDATA_EPO; i++){
                iter_swap(
                    liveFloatData.begin() + index * FDATA_EPO + i, 
                    liveFloatData.begin() + (liveFloatData.size() / FDATA_EPO - 1) * FDATA_EPO + i
                );
            }
            // Update the worldIndex of the swapped object
            objectsList[index]->worldIndex = index;

            // Remove the last element (which is the object we want to remove)
            objectsList.pop_back();
            // ids.pop_back();
            liveFloatData.resize(objectsList.size() * FDATA_EPO);
            liveIntData.resize(objectsList.size() * LIVE_INT_EPO);
        }

        // Remove the object from the map
        objectsMap.erase(it);

        delete object;

        return index;
    }
    else return -1;
}

PhysicalObject* World::getObject(int id) const {
    auto it = objectsMap.find(id);
    if (it != objectsMap.end()) {
        return it->second;
    }
    return nullptr;
}

PhysicalObject* World::getObjectAtIndex(int index) const {
    if (index >= 0 && index < objectsList.size()) {
        return objectsList[index];
    }
    return nullptr;
}

int World::findeIndexForObject(int id){
    auto it = objectsMap.find(id);
    if (it != objectsMap.end()) {
        return it->second->worldIndex;
    }
    return -1;

}

int World::getObjectCount() const {
    return objectsList.size();
}

void World::setGravity(float x, float y) {
    gravity.x = x;
    gravity.y = y;
}

// Expose the raw pointers


#ifdef EMSCRIPTEN
emscripten_val World::getLiveFloatData() {
    size_t size = max(static_cast<size_t>(4096u), liveFloatData.size() * 2);
    return emscripten_val(emscripten::typed_memory_view(size * sizeof(float), liveFloatData.data()));
}

emscripten_val World::getLiveIntData() {
    size_t size = max(static_cast<size_t>(4096u), liveIntData.size() * 2);
    return emscripten_val(emscripten::typed_memory_view(size * sizeof(int), liveIntData.data()));
}
#endif

void World::step() {
    _doKinematics();
    _doBroadPhase();
    _doNarrowPhase();
    _doResolution();
    // _doConstraints();
    // _doStabilization(); // Optional.
}

void World::_doKinematics(){
    // Update all objects in the world
    for (auto& object : objectsList) {
        liveIntData[object->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] = 0;
        float m = liveFloatData[object->worldIndex * FDATA_EPO + FDATA_M];

        // Apply gravity.
        liveFloatData[object->worldIndex * FDATA_EPO + FDATA_NFX] += gravity.x * m;
        liveFloatData[object->worldIndex * FDATA_EPO + FDATA_NFY] += gravity.y * m;
        
        // Physics step.
        bool moved = object->stepMovement(timeStep);

        // Recompute AABB and update BVH.
        if(moved){
            bool treeNeedsUpdate = object->recomputeAabb(false);

            if(treeNeedsUpdate){
                bvh.update(object->bvhNode, object->aabb);
            }
        }
    }
}

void World::_doBroadPhase(){
    bvh.traverseAndCheckCollisions();
    // [_this](void* obja, void* objb) {
    //     auto* obj1 = static_cast<PhysicalObject*>(obja);
    //     auto* obj2 = static_cast<PhysicalObject*>(objb);
    //     // For debugging.
    //     // cout << "Collision detected between object " << obj1->id
    //     //     << " and object " << obj2->id << endl;
    //     _this->liveIntData[obj1->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] = 1;
    //     _this->liveIntData[obj2->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] = 1;

    //     // collisionPairs.push_back({obj1, obj2});
    // });
}

void World::_doNarrowPhase(){
    collisionSolver.clear();
    
    for (auto& pair : bvh.collisionPairs) {
        PhysicalObject* obj1 = static_cast<PhysicalObject*>(pair.first);
        PhysicalObject* obj2 = static_cast<PhysicalObject*>(pair.second);
        

        // Perform narrow phase collision detection between obj1 and obj2
        auto colliding = collisionSolver.solve(obj1->worldIndex, obj2->worldIndex);

        liveIntData[obj1->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION | (colliding * HAS_PHYSICAL_COLLISION);
        liveIntData[obj2->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION | (colliding * HAS_PHYSICAL_COLLISION);
    }
}

void World::_doResolution(){
    
}

void World::setTimeStep(float dt) {
    timeStep = dt;
    decayMap[99] = pow(1.0f - 0.99f, dt); // E.g. 99% decay in 1 s, given the fixed time step dt.
    decayMap[90] = pow(1.0f - 0.90f, dt);
    decayMap[75] = pow(1.0f - 0.75f, dt);
    decayMap[50] = pow(1.0f - 0.50f, dt);
    decayMap[25] = pow(1.0f - 0.25f, dt);
    decayMap[10] = pow(1.0f - 0.10f, dt);
    decayMap[5] = pow(1.0f - 0.05f, dt);
    decayMap[2] = pow(1.0f - 0.02f, dt);
    decayMap[1] = pow(1.0f - 0.01f, dt);
}

// Remove all objects from the world and clean them up.
void World::clear() {
    bvh.clear();
    collisionSolver.clear();

    for (auto& object : objectsList) {
        delete object;
    }

    // Clear the lists

    objectsMap.clear();
    objectsList.clear();

    liveIntData.clear();
    liveFloatData.clear();

    // objectsList.resize(0);
    // liveIntData.resize(0);
    // liveFloatData.resize(0);
}

void World::destroy(){
    delete this;
}
