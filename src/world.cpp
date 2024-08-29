#include "world.h"
#include "physical-object.h"
// #include "bvh.h"

World::World() {
    setTimeStep(1.0f / 60.0f);
    liveData.reserve(4096);
}

World::~World() {
    for (auto& object : objectsList) {
        delete object;  // Manually delete the objects to avoid memory leaks
    }
}

void World::addObject(PhysicalObject* object) {
    auto it = objectsMap.find(object->getId());

    // Make sure the id doesn't exist in this world already.
    if (it == objectsMap.end()) {

        if (object->world != nullptr) {
            object->world->removeObject(object->getId());
        }

        object->world = this;
        object->worldIndex = objectsList.size();

        int id = object->getId();

        objectsMap[id] = object;
        objectsList.push_back(object);

        object->bvhNode = tree.insert(object->aabb, object);

        ids.push_back(id);

        auto position = object->getPosition();
        auto velocity = object->getVelocity();
        auto rotation = object->getRotation();
        auto rotationalSpeed = object->getRotationalSpeed();

        liveData.push_back(position.x);
        liveData.push_back(position.y);
        liveData.push_back(rotation);
        liveData.push_back(velocity.x);
        liveData.push_back(velocity.y);
        liveData.push_back(rotationalSpeed);

        // TODO: also push aabb data.
    }
}

void World::removeObject(int id) {
    auto it = objectsMap.find(id);

    if (it != objectsMap.end()) {
        auto object = it->second;

        // Remove the object from the BVH tree
        if (object->bvhNode) {
            tree.remove(object->bvhNode);
            object->bvhNode = nullptr;
        }

        // Get the index of the object to remove
        int index = object->worldIndex;

        // Clear the object's reference to the world
        object->world = nullptr;
        object->worldIndex = -1;

        int liveDataPerObject = 6;

        // Remove the object from the list if it has a valid index
        if (index != -1 && index < objectsList.size()) {
            // Swap the object to be removed with the last object in the list
            std::iter_swap(objectsList.begin() + index, objectsList.end() - 1);
            std::iter_swap(ids.begin() + index, ids.end() - 1);
            // std::iter_swap(liveData.begin() + index, liveData.end() - 1);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 0, liveData.end() - 6);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 1, liveData.end() - 5);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 2, liveData.end() - 4);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 3, liveData.end() - 3);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 4, liveData.end() - 2);
            std::iter_swap(liveData.begin() + index * liveDataPerObject + 5, liveData.end() - 1);

            // Update the worldIndex of the swapped object
            objectsList[index]->worldIndex = index;

            // Remove the last element (which is the object we want to remove)
            objectsList.pop_back();
            ids.pop_back();
            liveData.resize(objectsList.size() * liveDataPerObject);
        }

        // Remove the object from the map
        objectsMap.erase(it);
    }
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

int World::getObjectCount() const {
    return objectsList.size();
}

void World::setGravity(float x, float y) {
    gravity.x = x;
    gravity.y = y;
}

// Expose the raw pointers


emscripten::val World::getLiveData() {
    size_t size = std::max(static_cast<size_t>(4096u), liveData.size() * 2);
    return emscripten::val(emscripten::typed_memory_view(size * sizeof(float), liveData.data()));
}

emscripten::val World::getIds() {
    size_t size = std::max(static_cast<size_t>(4096u), ids.size() * 2);
    return emscripten::val(emscripten::typed_memory_view(size * sizeof(int), ids.data()));
}

void World::step() {

    for (auto& object : objectsList) {
        float m = object->mass;
        object->applyForce(gravity.x * m, gravity.y * m);
        bool moved = object->stepMovement(timeStep);
        if(moved){
            // TODO: only recompute if the object is actually outside of the AABB.
            // Because we also need to update the BVH tree which is expensive.
            bool treeNeedsUpdate = object->recomputeAabb();

            if(treeNeedsUpdate){
                // tree.update(object->bvhNode, object->aabb);
            }
        }
    }

    // Update live data.
    for (auto& object : objectsList) {

        auto position = object->getPosition();
        auto velocity = object->getVelocity();
        auto rotation = object->getRotation();
        auto rotationalSpeed = object->getRotationalSpeed();

        object->x = position.x;
        object->y = position.y;
        object->r = rotation;
        object->vx = velocity.x;
        object->vy = velocity.y;
        object->rs = rotationalSpeed;
        object->x0 = object->aabb.min.x;
        object->y0 = object->aabb.min.y;
        object->x1 = object->aabb.max.x;
        object->y1 = object->aabb.max.y;

        // The following would be ideal instead.

        liveData[object->worldIndex + 0] = (position.x);
        liveData[object->worldIndex + 1] = (position.y);
        liveData[object->worldIndex + 2] = (rotation);
        liveData[object->worldIndex + 3] = (velocity.x);
        liveData[object->worldIndex + 4] = (velocity.y);
        liveData[object->worldIndex + 5] = (rotationalSpeed);
        // liveData[object->worldIndex + 6] = (object->aabb.min.x);
        // liveData[object->worldIndex + 7] = (object->aabb.min.y);
        // liveData[object->worldIndex + 8] = (object->aabb.max.x);
        // liveData[object->worldIndex + 9] = (object->aabb.max.y);
    }
}

void World::setTimeStep(float dt) {
    timeStep = dt;
    decayMap[99] = std::pow(1.0f - 0.99f, dt); // E.g. 99% decay in 1 s, given the fixed time step dt.
    decayMap[90] = std::pow(1.0f - 0.90f, dt);
    decayMap[75] = std::pow(1.0f - 0.75f, dt);
    decayMap[50] = std::pow(1.0f - 0.50f, dt);
    decayMap[25] = std::pow(1.0f - 0.25f, dt);
    decayMap[10] = std::pow(1.0f - 0.10f, dt);
    decayMap[5] = std::pow(1.0f - 0.05f, dt);
    decayMap[2] = std::pow(1.0f - 0.02f, dt);
    decayMap[1] = std::pow(1.0f - 0.01f, dt);
}

// Remove all objects from the world and clean them up.
void World::clear() {
    for (auto& object : objectsList) {
        object->world = nullptr; // Optimization: avoid calling removeObject since we're nuking the lists too.
        object->destroy();
    }

    // Clear the lists

    objectsMap.clear();
    objectsList.clear();
    // ids.clear();
    // liveData.clear();

    // TODO: empty the quad tree when we develop that.
}

// Note that objects can be removed from the world and moved into other worlds.
// But if the world is destroyed, all objects in it are also destroyed.
// We don't assume that the user has other references to the objects.
void World::destroy(){
    clear();
    delete this;
}

