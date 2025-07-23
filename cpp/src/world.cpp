
#include <iostream>
#include <cstdlib>
#include <cmath>
#include "world.h"
#include "constants.h"

using namespace std;

World::World():
    collisionSolver(liveIntData, liveFloatData){
    // TODO: if we add more than 10k items, there should be some kind of event to warn the client.
    // Currently, the engine crashes with that many items. But with optimizations it's possible to exceed that.
    setTimeStep(1.0f / 60.0f);
    int maxSize = 10000;
    liveFloatData.reserve(maxSize * FDATA_EPO);
    liveIntData.reserve(maxSize * LIVE_INT_EPO);
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

    // if (++frameCount % 60 == 0) { 
    //     std::cout << "Frame " << frameCount 
    //               << " Objects: " << objectsList.size()
    //               << " CollisionPairs capacity: " << bvh.collisionPairs.capacity()
    //               << " Solver collisions: " << collisionSolver.collisions.size()
    //               << " capacity: " << collisionSolver.collisions.capacity()
    //               << std::endl;
    // }
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
    // TODO: this could also be parallelized.
    for (auto& collisionInfo : collisionSolver.collisions) {
        PhysicalObject* objA = objectsList[collisionInfo.indexA];
        PhysicalObject* objB = objectsList[collisionInfo.indexB];

        if(hasPenetrationResolution) __doPenetrationResolution(collisionInfo, objA, objB);
        if(hasRestitution) __doRestitution(collisionInfo, objA, objB);
        if(hasFriction) __doCollisionFriction(collisionInfo, objA, objB);
    }
}

// 4.a. Penetration resolution.
void World::__doPenetrationResolution(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject* objB) {
    // Calculate inverse masses
    float imA = objA->getInverseMass();
    float imB = objB->getInverseMass();
    float totalInverseMass = imA + imB;

    // Skip if both objects have infinite mass
    if(totalInverseMass == 0.0f) {
        return;
    }
    
    // Get current velocities
    Vec2 vA = objA->getVelocity();
    Vec2 vB = objB->getVelocity();
    
    // Calculate relative velocity along normal
    float relVelAlongNormal = (vB - vA).dot(collisionInfo.normal);
    
    // Scale the correction by penetration depth
    // TODO: compute slop based on scale.
    float slop = 0.001f;      // Small penetration allowed
    float percent = 0.2f;     // Reduced Baumgarte factor for stacking
    
    // Only correct if penetration is significant
    float correction = 0.0f;
    if (collisionInfo.penetrationDepth > slop) {
        correction = (collisionInfo.penetrationDepth - slop) * percent / totalInverseMass;
    }
    
    Vec2 correctionVector = collisionInfo.normal * correction;
    
    // Apply positional correction
    Vec2 pA = objA->getPosition();
    Vec2 pB = objB->getPosition();
    objA->setPosition(pA - correctionVector * imA);
    objB->setPosition(pB + correctionVector * imB);
    
    // Apply velocity correction for resting contacts
    // This prevents objects from vibrating when at rest
    float restingThreshold = 0.01f;
    if (std::abs(relVelAlongNormal) < restingThreshold) {
        // Calculate how much velocity would be needed to correct the penetration
        float velCorrection = correction / (timeStep * totalInverseMass);
        
        // Apply a small damping effect to reduce energy in the system
        float damping = 0.2f;
        
        if (relVelAlongNormal < 0) {
            Vec2 dampingImpulse = collisionInfo.normal * (-(1.0f + damping) * relVelAlongNormal);
            objA->setVelocity(vA + dampingImpulse * imA);
            objB->setVelocity(vB - dampingImpulse * imB);
        }
    }
}

// 4.b. Collision impulse.
void World::__doRestitution(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject* objB){
    float imA = objA->getInverseMass();
    float imB = objB->getInverseMass();
    float totalInverseMass = imA + imB;
    
    // Skip if both objects have infinite mass
    if (totalInverseMass == 0.0f) {
        return;
    }
    
    // Get the radius vectors (from center of mass to contact point)
    Vec2 rA = collisionInfo.contactPoint - objA->getPosition();
    Vec2 rB = collisionInfo.contactPoint - objB->getPosition();
    
    // Calculate inverse inertia on-the-fly based on shape and mass
    float iaInv = objA->getInverseInertia();
    float ibInv = objB->getInverseInertia();
    
    // CRITICAL - Calculate the correct relative velocity at the contact point
    // This MUST include both linear and angular components to avoid erratic behavior
    
    // Calculate the tangential velocities due to rotation at the contact point
    // Cross product: r × ω = (-r.y * ω, r.x * ω) for 2D
    Vec2 tangentialVelocityA(
        -rA.y * objA->getAngularVelocity(),
        rA.x * objA->getAngularVelocity()
    );
    
    Vec2 tangentialVelocityB(
        -rB.y * objB->getAngularVelocity(),
        rB.x * objB->getAngularVelocity()
    );
    
    // Calculate the total velocity at the contact point (linear + rotational)
    Vec2 contactVelocityA = objA->getVelocity() + tangentialVelocityA;
    Vec2 contactVelocityB = objB->getVelocity() + tangentialVelocityB;
    
    // Calculate the relative velocity at the contact point
    Vec2 rv = contactVelocityB - contactVelocityA;
    
    // Relative velocity along the normal
    float velAlongNormal = rv.dot(collisionInfo.normal);
    
    // Apply a small threshold for numerical stability
    float velocitySeparationThreshold = 0.0001f;
    if (velAlongNormal > velocitySeparationThreshold) {
        // Objects are separating, no impulse needed
        return;
    }
    
    // Calculate restitution coefficient
    float restitutionThreshold = -0.2f;
    float e;
    
    // old:
    if (velAlongNormal > restitutionThreshold) {
        // Objects are moving slowly relative to each other, reduce restitution
        e = 0.0f;
    } else {
        // Normal restitution for faster collisions
        e = max(objA->getRestitution(), objB->getRestitution());
        
        // Allow full 1.0 restitution with tiny cap for extreme numerical stability
        e = min(0.9999f, e);
    }
    
    // Calculate the impulse scalar
    // For 2D: j = -(1 + e) * velAlongNormal / (totalInverseMass + (rA × n)² * iaInv + (rB × n)² * ibInv)
    
    // Calculate cross products: r × normal
    float rACrossN = rA.x * collisionInfo.normal.y - rA.y * collisionInfo.normal.x;
    float rBCrossN = rB.x * collisionInfo.normal.y - rB.y * collisionInfo.normal.x;
    
    // Calculate the angular contribution to the impulse denominator
    float angularFactor = (rACrossN * rACrossN * iaInv) + (rBCrossN * rBCrossN * ibInv);
    
    // Total denominator for impulse calculation
    float j_denom = totalInverseMass + angularFactor;
    
    // Prevent division by zero
    if (j_denom < 0.00001f) {
        j_denom = 0.00001f;
    }
    
    // Calculate the impulse magnitude
    float j = -(1.0f + e) * velAlongNormal / j_denom;
    
    // Apply impulse along the normal direction
    Vec2 impulse = collisionInfo.normal * j;
    
    // Apply the impulse to linear velocity
    objA->setVelocity(objA->getVelocity() - impulse * imA);
    objB->setVelocity(objB->getVelocity() + impulse * imB);
    
    // Apply the impulse to angular velocity (torque = r × F)
    // For 2D: torque = r.x * F.y - r.y * F.x
    
    // Old calculation (wrong)
    // float torqueA = -rA.x * impulse.y - rA.y * impulse.x;
    // float torqueB = (rB.x * impulse.y - rB.y * impulse.x);
    // Also wrong:
    // float torqueA = rA.x * impulse.y - rA.y * impulse.x;
    // float torqueB = rB.x * impulse.y - rB.y * impulse.x;
    // Correct?
    float torqueA = -(rA.x * impulse.y - rA.y * impulse.x);
    float torqueB = rB.x * impulse.y - rB.y * impulse.x;
    
    // Set new angular velocities
    objA->setAngularVelocity(objA->getAngularVelocity() + torqueA * iaInv);
    objB->setAngularVelocity(objB->getAngularVelocity() + torqueB * ibInv);
    
    // Store impulse magnitude for friction calculations
    collisionInfo.normalImpulseMagnitude = impulse.magnitude();
}

// 4.c. Collision friction.
void World::__doCollisionFriction(CollisionInfo& collisionInfo, PhysicalObject* objA, PhysicalObject* objB){
    // Skip friction if no normal impulse was applied
    if (collisionInfo.normalImpulseMagnitude < 0.001f) {
        return;
    }
    
    // Get the radius vectors (from center of mass to contact point)
    Vec2 rA = collisionInfo.contactPoint - objA->getPosition();
    Vec2 rB = collisionInfo.contactPoint - objB->getPosition();
    
    // Calculate inverse mass and inertia
    float imA = objA->getInverseMass();
    float imB = objB->getInverseMass();
    
    // Calculate inverse inertia on-the-fly based on shape and mass
    float iaInv = objA->getInverseInertia();
    float ibInv = objB->getInverseInertia();
    
    // Total inverse mass (skip if both objects have infinite mass)
    float totalInverseMass = imA + imB;
    if (totalInverseMass <= 0.00001f) {
        return;
    }
    
    // Calculate the tangential velocities due to rotation at the contact point
    Vec2 tangentialVelocityA(
        -rA.y * objA->getAngularVelocity(),
        rA.x * objA->getAngularVelocity()
    );
    
    Vec2 tangentialVelocityB(
        -rB.y * objB->getAngularVelocity(),
        rB.x * objB->getAngularVelocity()
    );
    
    // Calculate the total velocity at the contact point (linear + rotational)
    Vec2 contactVelocityA = objA->getVelocity() + tangentialVelocityA;
    Vec2 contactVelocityB = objB->getVelocity() + tangentialVelocityB;
    
    // Calculate the relative velocity at the contact point
    Vec2 relativeVelocity = contactVelocityB - contactVelocityA;
    
    // Calculate the tangential component (relative velocity projected onto tangent plane)
    float normalComponent = relativeVelocity.dot(collisionInfo.normal);
    Vec2 tangentialComponent = relativeVelocity - (collisionInfo.normal * normalComponent);

    // Get the magnitude of the tangential velocity
    float tangentialMagnitude = tangentialComponent.magnitude();

    // Skip if tangential velocity is negligible
    if (tangentialMagnitude < 0.0001f) {
        return;
    }

    // Calculate the tangent direction - pointing OPPOSITE to the sliding direction
    Vec2 tangent = -tangentialComponent / tangentialMagnitude;
    
    // Calculate friction coefficients
    float staticFriction = min(objA->getStaticFriction(), objB->getStaticFriction());
    float kineticFriction = min(objA->getKineticFriction(), objB->getKineticFriction());
    
    // Calculate impulse in the tangent direction
    // For 2D: jt = -(relativeVelocity · tangent) / (totalInverseMass + (rA × tangent)² * iaInv + (rB × tangent)² * ibInv)
    
    // Cross products: r × tangent
    float rACrossT = rA.x * tangent.y - rA.y * tangent.x;
    float rBCrossT = rB.x * tangent.y - rB.y * tangent.x;
    
    // Calculate the denominator for the tangential impulse
    float jt_denom = totalInverseMass + (rACrossT * rACrossT * iaInv) + (rBCrossT * rBCrossT * ibInv);
    
    // Prevent division by zero
    if (jt_denom < 0.00001f) {
        jt_denom = 0.00001f;
    }
    
    // Calculate the raw tangential impulse magnitude
    float jt = -relativeVelocity.dot(tangent) / jt_denom;
    
    // Maximum friction force (Coulomb model: |Ft| ≤ μ|Fn|)
    float maxFriction = collisionInfo.normalImpulseMagnitude * 
                        (tangentialMagnitude < 0.01f ? staticFriction : kineticFriction);
    
    // Clamp the tangential impulse to not exceed the maximum friction force
    if (abs(jt) > maxFriction) {
        jt = jt > 0 ? maxFriction : -maxFriction;
    }
    
    // Apply impulse in the tangent direction
    Vec2 frictionImpulse = tangent * jt;

    // Apply the impulse to linear velocity
    objA->setVelocity(objA->getVelocity() - frictionImpulse * imA);
    objB->setVelocity(objB->getVelocity() + frictionImpulse * imB);

    // Apply the impulse to angular velocity (torque = r × F)
    // Old:
    // float torqueA = -rA.cross(frictionImpulse); // Using your cross product method
    // float torqueB = rB.cross(frictionImpulse); // Opposite reaction
    float torqueA = rA.cross(frictionImpulse);
    float torqueB = rB.cross(frictionImpulse);
    
    objA->setAngularVelocity(objA->getAngularVelocity() + torqueA * iaInv);
    objB->setAngularVelocity(objB->getAngularVelocity() + torqueB * ibInv);
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