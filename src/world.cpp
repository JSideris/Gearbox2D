
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

// 1. Kinematics.
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

// 2. Broad phase collision detection.
void World::_doBroadPhase(){
    bvh.traverseAndCheckCollisions();
}

// 3. Narrow phase collision detection.
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

// 4. Collision resolution.
void World::_doResolution(){
    for (auto& collisionInfo : collisionSolver.collisions) {
        PhysicalObject* objA = objectsList[collisionInfo.indexA];
        PhysicalObject* objB = objectsList[collisionInfo.indexB];

        // SEPARATION STEP
        __doPenetrationResolution(collisionInfo, objA, objB);
        __doCollisionImpulse(collisionInfo, objA, objB);
        __doCollisionFriction(collisionInfo, objA, objB);
    }
}

// 4.a. Penetration resolution.
void World::__doPenetrationResolution(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject*  objB){
        
    float totalInverseMass = objA->getInverseMass() + objB->getInverseMass();

    if(totalInverseMass == 0.0f){
        return;
    }
    // else if(mA == 0.0f){

    // }
    // else if(mB == 0.0f){

    // }
    else{
        // TODO: potential to cache to remove a division. 
        Vec2 correction = collisionInfo.normal * (collisionInfo.penetrationDepth / totalInverseMass);
        
        Vec2 pA = objA->getPosition();
        Vec2 pB = objB->getPosition();

        Vec2 cpA = pA - correction * objA->getMass();
        Vec2 cpB = pB + correction * objB->getMass();

        objA->setPosition(cpA);
        objB->setPosition(cpB);
    }
}

// 4.b. Collision impulse.
void World::__doCollisionImpulse(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject* objB){
    float totalInverseMass = objA->getInverseMass() + objB->getInverseMass();
    
    // Relative velocity.
    Vec2 rv = objB->getVelocity() - objA->getVelocity();

    // Relative velocity along the normal.
    float velAlongNormal = rv.dot(collisionInfo.normal);

    // Do not resolve if velocities are separating.
    if (velAlongNormal > 0) {
        return;
    }

    // Calculate restitution.
    float e = max(objA->getRestitution(), objB->getRestitution());
    float j = -(1 + e) * velAlongNormal / totalInverseMass;

    // Apply impulse.
    auto impulse = collisionInfo.normal * j;

    objA->applyImpulse(impulse * -1.0f, collisionInfo.contactPoint - objA->getPosition());
    objB->applyImpulse(impulse, collisionInfo.contactPoint - objB->getPosition());

    collisionInfo.normalImpulseMagnitude = impulse.magnitude();
}

// 4.c. Collision friction.
void World::__doCollisionFriction(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject* objB){
    // Compute the lever arms (from center of mass to contact point)
    Vec2 rA = collisionInfo.contactPoint - objA->getPosition();
    Vec2 rB = collisionInfo.contactPoint - objB->getPosition();

    // Compute the tangential velocities due to rotation
    Vec2 tangentialVelocityA = Vec2(-rA.y * objA->getAngularVelocity(), rA.x * objA->getAngularVelocity()); // Cross product in 2D
    Vec2 tangentialVelocityB = Vec2(-rB.y * objB->getAngularVelocity(), rB.x * objB->getAngularVelocity());

    // Compute the total velocity at the point of contact (linear + tangential)
    Vec2 contactVelocityA = objA->getVelocity() + tangentialVelocityA;
    Vec2 contactVelocityB = objB->getVelocity() + tangentialVelocityB;

    // Compute the relative velocity at the point of contact
    Vec2 relativeVelocity = contactVelocityB - contactVelocityA;

    // Remove the normal component of the relative velocity to get the tangential component
    Vec2 relativeNormalComponent = collisionInfo.normal * (relativeVelocity.dot(collisionInfo.normal));
    Vec2 tangentialVelocity = relativeVelocity - relativeNormalComponent;

    // If the object is nearly stationary in the tangential direction, apply static friction
    if (tangentialVelocity.magnitude() < 0.001f) {
        // Static friction case: cancel out the tangential velocity
        float maxStaticFriction = min(objA->getStaticFriction(), objB->getStaticFriction());
        Vec2 staticFrictionImpulse = tangentialVelocity * -maxStaticFriction;

        // Apply static friction (impulse)
        objA->applyImpulse(staticFrictionImpulse, collisionInfo.contactPoint - objA->getPosition());
        objB->applyImpulse(staticFrictionImpulse * -1.0f, collisionInfo.contactPoint - objB->getPosition());
    } else {
        // Dynamic friction case: reduce sliding velocity
        float frictionCoefficient = min(objA->getKineticFriction(), objB->getKineticFriction());
        Vec2 dynamicFrictionImpulse = tangentialVelocity.normalize() * -frictionCoefficient * collisionInfo.normalImpulseMagnitude;

        // Apply dynamic friction (impulse)
        objA->applyImpulse(dynamicFrictionImpulse * -1.0f, collisionInfo.contactPoint - objA->getPosition());
        objB->applyImpulse(dynamicFrictionImpulse, collisionInfo.contactPoint - objB->getPosition());
    }
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
