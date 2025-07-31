#include <iostream>
#include <cstdlib>
#include <cmath>
#include "world.h"
#include "constants.h"
#include <algorithm>

using namespace std;

World::World():
    collisionSolver(liveIntData, liveFloatData){
    // TODO: if we add more than 10k items, there should be some kind of event to warn the client.
    // Currently, the engine crashes with that many items. But with optimizations it's possible to exceed that.
    setTimeStep(1.0f / 60.0f);
    int maxSize = 10000;
    liveFloatData.reserve(maxSize * FDATA_EPO);
    liveIntData.reserve(maxSize * LIVE_INT_EPO);
    contactConstraints.reserve(100);
    velocityIterations = 8;
}

World::~World() {
    clear();
}

int World::makeObject(int id, emscripten_val options){
    int currentSize = objectsList.size();
    // liveFloatData.resize((currentSize + 1) * FDATA_EPO);
    // liveIntData.resize((currentSize + 1) * LIVE_INT_EPO);

    auto object = new PhysicalObject(*this, id, options);

    object->worldIndex = currentSize;

    objectsMap[id] = object;
    objectsList.push_back(object);

    object->recomputeAabb(1);

    auto* bvhNode = bvh.insert(object->aabb, object);
    object->bvhNode = bvhNode;

    // cout << object->getRadius() << endl;

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

            // Remove the corresponding data from arrays
            for(int i = 0; i < LIVE_INT_EPO; i++){
                liveIntData.pop_back();
            }
            for(int i = 0; i < FDATA_EPO; i++){
                liveFloatData.pop_back();
            }
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
    size_t size = 10000*FDATA_EPO;
    return emscripten_val(emscripten::typed_memory_view(size * sizeof(float), liveFloatData.data()));
}

emscripten_val World::getLiveIntData() {
    size_t size = 10000*LIVE_INT_EPO;
    return emscripten_val(emscripten::typed_memory_view(size * sizeof(int), liveIntData.data()));
}
#endif

void World::step() {
    static int frameCount = 0;
    _doKinematics();
    _doBroadPhase();
    _doNarrowPhase();
    _doResolution();
    // _doConstraints(); // Coming soon.
    // _doStabilization(); // Optional.
}

// 1. Kinematics.
void World::_doKinematics(){
    // Update all objects in the world
    // TODO: would be cool to have a separate list for only awake objects.
    // TODO: obvious parallilization opportunity.
    for (auto& object : objectsList) {
        
        if(object->isSleeping){
            continue;
        }
        
        liveIntData[object->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] = 0;

        float m = liveFloatData[object->worldIndex * FDATA_EPO + FDATA_M];

        // Apply gravity.
        liveFloatData[object->worldIndex * FDATA_EPO + FDATA_NFX] += gravity.x * m;
        liveFloatData[object->worldIndex * FDATA_EPO + FDATA_NFY] += gravity.y * m;
        
        // Physics step.
        bool moved = object->stepMovement(timeStep);

        // Recompute AABB and update BVH.
        if(moved){
            bool treeNeedsUpdate = object->recomputeAabb(0);

            if(treeNeedsUpdate){
                bvh.updateLeaf(object->bvhNode, object->aabb);
            }
        }
    }
}

// 2. Broad phase collision detection.
void World::_doBroadPhase(){
    bvh.detectCollisions();
}

// 3. Narrow phase collision detection.
void World::_doNarrowPhase(){
    collisionSolver.clear();
    // currentPairs.clear();
    
    for (auto& pair : bvh.collisionPairs) {
        PhysicalObject* obj1 = static_cast<PhysicalObject*>(pair.first);
        PhysicalObject* obj2 = static_cast<PhysicalObject*>(pair.second);
        

        // Perform narrow phase collision detection between obj1 and obj2
        auto colliding = collisionSolver.solve(obj1->worldIndex, obj2->worldIndex);

        liveIntData[obj1->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION 
            | (colliding * HAS_PHYSICAL_COLLISION);
        liveIntData[obj2->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION 
            | (colliding * HAS_PHYSICAL_COLLISION);

        // if(colliding){
        //     // Add the pair to the current pairs for contact management
        //     currentPairs.insert({obj1->worldIndex, obj2->worldIndex});
        // }
    }
}

void World::_doContactManagement(){

    // TODO: implement contact management.
    // std::unordered_set<std::pair<int, int>, PairHash, PairEqual> confirmedContacts;
    // for (const auto& pair : currentPairs) {
    //     confirmedContacts.insert(pair);
    // }
    
    // Find missing pairs
    // for (const auto& pair : prev_pairs) {
    //     if (confirmedContacts.find(pair) == confirmedContacts.end()) {
    //         raiseEvent(pair);
    //     }
    // }
    
    // Update for next iteration
    // prev_pairs = std::move(confirmedContacts);

        // if(colliding){
        //     obj1->addContact(obj2);
        //     obj2->addContact(obj1);
        // }
}

// 4. Collision resolution.
void World::_doResolution(){
    contactConstraints.clear();
    for (auto& collisionInfo : collisionSolver.collisions) {
        PhysicalObject* objA = objectsList[collisionInfo.indexA];
        PhysicalObject* objB = objectsList[collisionInfo.indexB];
        float totalInverseMass = objA->getInverseMass() + objB->getInverseMass();
        if (totalInverseMass == 0.0f) {
            continue;
        }
        ContactConstraint c;
        c.a = objA;
        c.b = objB;
        c.point = collisionInfo.contactPoint;
        c.normal = collisionInfo.normal;
        c.depth = collisionInfo.penetrationDepth;
        c.preSolve(timeStep, hasRestitution, hasPenetrationResolution, hasFriction);
        contactConstraints.push_back(c);
    }
    bool enableNormal = hasRestitution || hasPenetrationResolution;
    for (int iter = 0; iter < velocityIterations; ++iter) {
        for (auto& c : contactConstraints) {
            c.solve(enableNormal, hasFriction);
        }
    }
}

void ContactConstraint::preSolve(float dt, bool enableRestitution, bool enablePenetration, bool enableFriction) {
    rA = point - a->getPosition();
    rB = point - b->getPosition();

    float imA = a->getInverseMass();
    float imB = b->getInverseMass();
    float iIA = a->getInverseInertia();
    float iIB = b->getInverseInertia();

    float rnA = rA.x * normal.y - rA.y * normal.x;
    float rnB = rB.x * normal.y - rB.y * normal.x;
    float kNormal = imA + imB + iIA * rnA * rnA + iIB * rnB * rnB;
    normalMass = (kNormal > 0.00001f) ? 1.0f / kNormal : 0.0f;

    // Initial rel vel
    Vec2 tangentialVelocityA(-rA.y * a->getAngularVelocity(), rA.x * a->getAngularVelocity());
    Vec2 tangentialVelocityB(-rB.y * b->getAngularVelocity(), rB.x * b->getAngularVelocity());
    Vec2 va = a->getVelocity() + tangentialVelocityA;
    Vec2 vb = b->getVelocity() + tangentialVelocityB;
    Vec2 relVel = vb - va;
    float vn = relVel.dot(normal);

    // Tangent
    Vec2 tangentialComponent = relVel - normal * vn;
    float tanMag = tangentialComponent.magnitude();
    if (tanMag < 0.0001f) {
        friction = 0.0f;
        return;
    }
    tangent = -tangentialComponent / tanMag;

    float rtA = rA.x * tangent.y - rA.y * tangent.x;
    float rtB = rB.x * tangent.y - rB.y * tangent.x;
    float kTangent = imA + imB + iIA * rtA * rtA + iIB * rtB * rtB;
    tangentMass = (kTangent > 0.00001f) ? 1.0f / kTangent : 0.0f;

    // Friction
    float sf = std::min(a->getStaticFriction(), b->getStaticFriction());
    float kf = std::min(a->getKineticFriction(), b->getKineticFriction());
    friction = (tanMag < 0.01f) ? sf : kf;
    if (!enableFriction) friction = 0.0f;

    // Bias
    float e = 0.0f;
    if (enableRestitution) {
        e = std::max(a->getRestitution(), b->getRestitution());
        if (vn > -0.2f) e = 0.0f;
    }
    float restitutionBias = e * vn;
    float positionBias = 0.0f;
    if (enablePenetration && depth > 0.001f) {
        positionBias = -0.2f / dt * (depth - 0.001f);
    }
    bias = std::min(restitutionBias, positionBias);
}

void ContactConstraint::solve(bool enableNormal, bool enableFriction) {
    if (!enableNormal && !enableFriction) return;

    float imA = a->getInverseMass();
    float imB = b->getInverseMass();
    float iIA = a->getInverseInertia();
    float iIB = b->getInverseInertia();

    // Compute current rel vel
    Vec2 tangentialVelocityA(-rA.y * a->getAngularVelocity(), rA.x * a->getAngularVelocity());
    Vec2 tangentialVelocityB(-rB.y * b->getAngularVelocity(), rB.x * b->getAngularVelocity());
    Vec2 va = a->getVelocity() + tangentialVelocityA;
    Vec2 vb = b->getVelocity() + tangentialVelocityB;
    Vec2 relVel = vb - va;

    if (enableNormal) {
        float vn = relVel.dot(normal);
        float dLambda = - (vn + bias) * normalMass;
        float old = normalImpulse;
        normalImpulse = std::max(old + dLambda, 0.0f);
        dLambda = normalImpulse - old;
        Vec2 impulse = normal * dLambda;
        a->setVelocity(a->getVelocity() - impulse * imA);
        b->setVelocity(b->getVelocity() + impulse * imB);
        float torqueA = -(rA.x * impulse.y - rA.y * impulse.x);
        float torqueB = rB.x * impulse.y - rB.y * impulse.x;
        a->setAngularVelocity(a->getAngularVelocity() + torqueA * iIA);
        b->setAngularVelocity(b->getAngularVelocity() + torqueB * iIB);
    }

    if (enableFriction && friction > 0.0f) {
        // Recompute relVel
        tangentialVelocityA = Vec2(-rA.y * a->getAngularVelocity(), rA.x * a->getAngularVelocity());
        tangentialVelocityB = Vec2(-rB.y * b->getAngularVelocity(), rB.x * b->getAngularVelocity());
        va = a->getVelocity() + tangentialVelocityA;
        vb = b->getVelocity() + tangentialVelocityB;
        relVel = vb - va;
        float vt = relVel.dot(tangent);
        float dLambda = - vt * tangentMass;
        float maxFriction = friction * normalImpulse;
        float old = frictionImpulse;
        frictionImpulse = std::max(-maxFriction, std::min(old + dLambda, maxFriction));
        dLambda = frictionImpulse - old;
        Vec2 impulse = tangent * dLambda;
        a->setVelocity(a->getVelocity() - impulse * imA);
        b->setVelocity(b->getVelocity() + impulse * imB);
        float torqueA = -(rA.x * impulse.y - rA.y * impulse.x);
        float torqueB = rB.x * impulse.y - rB.y * impulse.x;
        a->setAngularVelocity(a->getAngularVelocity() + torqueA * iIA);
        b->setAngularVelocity(b->getAngularVelocity() + torqueB * iIB);
    }
}

// 5. Constraints.
void World::_doConstraints(){}


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
// This could be more efficient by just clearing the vector.
// The downside is added complexity and potential for bugs.
// Removing the nodes 1 by 1 from the BVH is tried and tested already.
void World::clear() {
    collisionSolver.clear();

    while (!objectsList.empty()) {
        removeObject(objectsList[0]->id);
    }

    // Clear the lists

    // These should already be cleared by the removeObject function.
    // But we should add some logging in case something goes wrong.
    if(objectsList.size() != 0){
        cout << "World::clear() - objectsList not cleared!" << endl;
    }
    if(objectsMap.size() != 0){
        cout << "World::clear() - objectsMap not cleared!" << endl;
    }

    // Delete all the object data.
    liveIntData.clear();
    liveFloatData.clear();
}

void World::destroy(){
    delete this;
}


void World::setHasPenetrationResolution(bool value){ hasPenetrationResolution = value; }
void World::setHasRestitution(bool value){ hasRestitution = value; }
void World::setHasFriction(bool value){ hasFriction = value; }