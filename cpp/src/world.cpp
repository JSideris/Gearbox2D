#include <iostream>
#include <cstdlib>
#include <cmath>
#include "world.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <fstream>
#include <chrono>
#include <sstream>

BvhMetrics g_bvhMetrics;

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <stdio.h>
#endif

World::World():
    collisionSolver(liveIntData, liveFloatData){
    // TODO: if we add more than 10k items, there should be some kind of event to warn the client.
    // Currently, the engine crashes with that many items. But with optimizations it's possible to exceed that.
    setTimeStep(1.0f / 60.0f);
    int maxSize = 10000;
    liveFloatData.reserve(maxSize * FDATA_EPO);
    liveIntData.reserve(maxSize * LIVE_INT_EPO);
    contactConstraints.reserve(100);
    velocityIterations = 50;
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
    object->updateInverseInertia();

    objectsMap[id] = object;
    objectsList.push_back(object);

    object->recomputeAabb(1);

    CollisionProperties props;
    props.category = object->categoryBits;
    props.collidesWith = object->maskBits;
    props.isRigid = (object->type == ObjectType::RIGID_BODY);
    props.isSleeping = object->isSleeping;

    auto* bvhNode = bvh.insert(object->aabb, object, props);
    object->bvhNode = bvhNode;

    // cout << object->getRadius() << endl;

    return object->worldIndex;
}

int World::removeObject(int id) {

    // cout << "Removing object with id: " << id << endl;

    auto it = objectsMap.find(id);

    if (it != objectsMap.end()) {
        auto object = it->second;

        // Remove any joints associated with this object
        std::vector<int> jointsToRemove;
        for (auto& pair : jointsMap) {
            if (pair.second->isConnectedTo(object)) {
                jointsToRemove.push_back(pair.first);
            }
        }
        for (int jointId : jointsToRemove) {
            removeJoint(jointId);
        }

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

std::vector<int> World::queryPoint(float x, float y, uint32_t mask) {
    std::vector<int> hitIds;
    // Tiny AABB around the point
    Aabb pointBox(Vec2(x - 0.001f, y - 0.001f), Vec2(x + 0.001f, y + 0.001f));
    
    std::vector<BvhNode*> candidates;
    bvh.query(pointBox, candidates);

    for (auto node : candidates) {
        PhysicalObject* obj = static_cast<PhysicalObject*>(node->data);
        // Broad phase: Check collision mask
        if (obj->categoryBits & mask) {
            // Narrow phase: Precise shape check
            if (obj->testPoint(x, y)) {
                hitIds.push_back(obj->id);
            }
        }
    }
    return hitIds;
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

emscripten_val World::getEventData() {
    return emscripten_val(emscripten::typed_memory_view(eventData.size() * sizeof(float), eventData.data()));
}
#endif

int World::getEventCount() {
    return eventData.size() / 4;
}

void World::addEvent(int type, int idA, int idB, float impulse) {
    eventData.push_back((float)type);
    eventData.push_back((float)idA);
    eventData.push_back((float)idB);
    eventData.push_back(impulse);
}

void World::step() {
    // Snapshot current state for interpolation before processing the next step
    for (auto& object : objectsList) {
        int idx = object->worldIndex * FDATA_EPO;
        liveFloatData[idx + FDATA_PREV_X] = liveFloatData[idx + FDATA_X];
        liveFloatData[idx + FDATA_PREV_Y] = liveFloatData[idx + FDATA_Y];
        liveFloatData[idx + FDATA_PREV_R] = liveFloatData[idx + FDATA_R];
    }

    eventData.clear();
    static int frameCount = 0;
    _doKinematics();
    _doBroadPhase();
    _doNarrowPhase();
    
    // Joint pre-solving
    for (auto& pair : jointsMap) {
        pair.second->preSolve(timeStep);
    }
    
    _doResolution();

    // Contact management is done after resolution so that collision events 
    // can include the final resolved impulses.
    _doContactManagement();
}

// 1. Kinematics.
void World::_doKinematics(){
    // Update all objects in the world
    // TODO: would be cool to have a separate list for only awake objects.
    // TODO: obvious parallilization opportunity.
    for (auto& object : objectsList) {
        
        if(object->isSleeping){
            // Check if any external impulses or forces were applied via the live data buffer.
            int idx = object->worldIndex * FDATA_EPO;
            if (liveFloatData[idx + FDATA_NIX] != 0.0f || liveFloatData[idx + FDATA_NIY] != 0.0f || liveFloatData[idx + FDATA_NIA] != 0.0f ||
                liveFloatData[idx + FDATA_NFX] != 0.0f || liveFloatData[idx + FDATA_NFY] != 0.0f) {
                object->wakeUp();
            }
        }

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
    currentPairs.clear();
    
    for (auto& pair : bvh.collisionPairs) {
        PhysicalObject* obj1 = static_cast<PhysicalObject*>(pair.first);
        PhysicalObject* obj2 = static_cast<PhysicalObject*>(pair.second);
        

        // Perform narrow phase collision detection between obj1 and obj2
        auto colliding = collisionSolver.solve(obj1->worldIndex, obj2->worldIndex);

        liveIntData[obj1->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION 
            | (colliding * HAS_PHYSICAL_COLLISION);
        liveIntData[obj2->worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] |= HAS_AABB_COLLISION 
            | (colliding * HAS_PHYSICAL_COLLISION);

        if(colliding){
            // Add the pair to the current pairs for contact management
            currentPairs.insert({obj1->id, obj2->id});
        }
    }
}

void World::_doContactManagement(){
    // Find new contacts (in currentPairs but not in prevPairs)
    for (const auto& pair : currentPairs) {
        if (prevPairs.find(pair) == prevPairs.end()) {
            PhysicalObject* objA = getObject(pair.first);
            PhysicalObject* objB = getObject(pair.second);
            if (objA && objB) {
                objA->addContact(objB);
                objB->addContact(objA);

                if (objA->wantsEvents || objB->wantsEvents) {
                    float impulse = 0.0f;
                    auto it = resolvedImpulses.find(pair);
                    if (it != resolvedImpulses.end()) {
                        impulse = it->second;
                    }
                    addEvent((int)EventType::COLLISION_START, objA->id, objB->id, impulse);
                }
            }
        }
    }
    
    // Find removed contacts (in prevPairs but not in currentPairs)
    for (const auto& pair : prevPairs) {
        if (currentPairs.find(pair) == currentPairs.end()) {
            PhysicalObject* objA = getObject(pair.first);
            PhysicalObject* objB = getObject(pair.second);
            if (objA && objB) {
                // If both are sleeping, they might still be touching but the BVH optimization 
                // skipped them. We should keep the contact alive in our tracking so that 
                // when one wakes up, it can propagate the wake-up to its neighbor.
                if (objA->isSleeping && objB->isSleeping) {
                    currentPairs.insert(pair);
                    continue;
                }
                objA->removeContact(objB);
                objB->removeContact(objA);

                if (objA->wantsEvents || objB->wantsEvents) {
                    addEvent((int)EventType::COLLISION_END, objA->id, objB->id, 0.0f);
                }
            }
        }
    }
    
    // Update for next iteration
    prevPairs = currentPairs;
}

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
        
        // Solve joints interleaved with contacts
        for (auto& pair : jointsMap) {
            pair.second->solve();
        }
    }

    // Capture the final impulses for use in events
    resolvedImpulses.clear();
    for (auto& c : contactConstraints) {
        resolvedImpulses[{c.a->id, c.b->id}] = c.normalImpulse;
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
        tangent = Vec2(0.0f, 0.0f);
        tangentMass = 0.0f;
    } else {
        tangent = -tangentialComponent / tanMag;
        float rtA = rA.x * tangent.y - rA.y * tangent.x;
        float rtB = rB.x * tangent.y - rB.y * tangent.x;
        float kTangent = imA + imB + iIA * rtA * rtA + iIB * rtB * rtB;
        tangentMass = (kTangent > 0.00001f) ? 1.0f / kTangent : 0.0f;

        // Friction
        float sf = a->getStaticFriction() * b->getStaticFriction();
        float kf = a->getKineticFriction() * b->getKineticFriction();
        friction = (tanMag < 0.01f) ? sf : kf;
    }

    if (!enableFriction) friction = 0.0f;

    // Bias
    float e = 0.0f;
    if (enableRestitution) {
        e = std::max(a->getRestitution(), b->getRestitution());
        if (vn > -0.1f) e = 0.0f; // Increased threshold to settle faster
    }
    bias = e * vn;
    
    positionBias = 0.0f;
    if (enablePenetration && depth > 0.01f) {
        // High-quality stabilization: resolve penetration without introducing physical bounce
        positionBias = -0.2f / dt * (depth - 0.01f);
        
        // Cap the stabilization velocity to prevent "explosions"
        float maxStabilizationVelocity = 2.0f; // Limit to 2 units per second
        if (positionBias < -maxStabilizationVelocity) positionBias = -maxStabilizationVelocity;
    }
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
        // 1. Solve for real velocity (restitution)
        float vn = relVel.dot(normal);
        float dLambda = - (vn + bias) * normalMass;
        
        if (std::isfinite(dLambda)) {
            float old = normalImpulse;
            normalImpulse = std::max(old + dLambda, 0.0f);
            dLambda = normalImpulse - old;

            Vec2 impulse = normal * dLambda;
            if (imA > 0.0f) {
                a->setVelocity(a->getVelocity() - impulse * imA);
                float torqueA = -(rA.x * impulse.y - rA.y * impulse.x);
                a->setAngularVelocity(a->getAngularVelocity() + torqueA * iIA);
            }
            if (imB > 0.0f) {
                b->setVelocity(b->getVelocity() + impulse * imB);
                float torqueB = rB.x * impulse.y - rB.y * impulse.x;
                b->setAngularVelocity(b->getAngularVelocity() + torqueB * iIB);
            }
        }

        // 2. Solve for pseudo-velocity (position correction)
        if (positionBias < 0.0f) {
            Vec2 tangentialPseudoVelocityA(-rA.y * a->pseudoAngularVelocity, rA.x * a->pseudoAngularVelocity);
            Vec2 tangentialPseudoVelocityB(-rB.y * b->pseudoAngularVelocity, rB.x * b->pseudoAngularVelocity);
            Vec2 vpa = a->pseudoVelocity + tangentialPseudoVelocityA;
            Vec2 vpb = b->pseudoVelocity + tangentialPseudoVelocityB;
            float vnp = (vpb - vpa).dot(normal);
            
            float dLambdaP = -(vnp + positionBias) * normalMass;
            if (std::isfinite(dLambdaP)) {
                float oldP = positionImpulse;
                positionImpulse = std::max(oldP + dLambdaP, 0.0f);
                dLambdaP = positionImpulse - oldP;
                
                Vec2 impulseP = normal * dLambdaP;
                if (imA > 0.0f) {
                    a->pseudoVelocity = a->pseudoVelocity - impulseP * imA;
                    a->pseudoAngularVelocity += -(rA.x * impulseP.y - rA.y * impulseP.x) * iIA;
                }
                if (imB > 0.0f) {
                    b->pseudoVelocity = b->pseudoVelocity + impulseP * imB;
                    b->pseudoAngularVelocity += (rB.x * impulseP.y - rB.y * impulseP.x) * iIB;
                }
            }
        }
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
        
        if (std::isfinite(dLambda)) {
            float maxFriction = friction * normalImpulse;
            float old = frictionImpulse;
            frictionImpulse = std::max(-maxFriction, std::min(old + dLambda, maxFriction));
            float dLambdaFriction = frictionImpulse - old;
            
            Vec2 impulse = tangent * dLambdaFriction;
            if (imA > 0.0f) {
                a->setVelocity(a->getVelocity() - impulse * imA);
                float torqueA = -(rA.x * impulse.y - rA.y * impulse.x);
                a->setAngularVelocity(a->getAngularVelocity() + torqueA * iIA);
            }
            if (imB > 0.0f) {
                b->setVelocity(b->getVelocity() + impulse * imB);
                float torqueB = rB.x * impulse.y - rB.y * impulse.x;
                b->setAngularVelocity(b->getAngularVelocity() + torqueB * iIB);
            }
        }
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

int World::createHingeJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY) {
    auto itA = objectsMap.find(bodyAId);
    auto itB = objectsMap.find(bodyBId);
    
    if (itA == objectsMap.end() || itB == objectsMap.end()) {
        return -1;
    }
    
    jointsMap[id] = std::make_unique<HingeJoint>(
        id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY)
    );
    
    return id;
}

int World::createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length) {
    auto itA = objectsMap.find(bodyAId);
    auto itB = objectsMap.find(bodyBId);
    
    if (itA == objectsMap.end() || itB == objectsMap.end()) {
        return -1;
    }
    
    jointsMap[id] = std::make_unique<DistanceJoint>(
        id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length
    );
    
    return id;
}

int World::createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio) {
    auto itA = objectsMap.find(bodyAId);
    auto itB = objectsMap.find(bodyBId);
    
    if (itA == objectsMap.end() || itB == objectsMap.end()) {
        return -1;
    }
    
    jointsMap[id] = std::make_unique<SpringJoint>(
        id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length, frequencyHz, dampingRatio
    );
    
    return id;
}

int World::createGearJoint(int id, int joint1Id, int joint2Id, float ratio) {
    auto it1 = jointsMap.find(joint1Id);
    auto it2 = jointsMap.find(joint2Id);
    
    if (it1 == jointsMap.end() || it2 == jointsMap.end()) {
        return -1;
    }
    
    HingeJoint* h1 = dynamic_cast<HingeJoint*>(it1->second.get());
    HingeJoint* h2 = dynamic_cast<HingeJoint*>(it2->second.get());
    
    if (!h1 || !h2) {
        return -1;
    }
    
    jointsMap[id] = std::make_unique<GearJoint>(id, h1, h2, ratio);
    
    return id;
}

void World::removeJoint(int id) {
    jointsMap.erase(id);
}

Joint* World::getJoint(int id) {
    auto it = jointsMap.find(id);
    if (it != jointsMap.end()) {
        return it->second.get();
    }
    return nullptr;
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