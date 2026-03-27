#include "world.h"
#include "body.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>

int World::createHingeJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<HingeJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY));
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createDistanceJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<DistanceJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length);
    distanceJoints.push_back(joint.get());
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createSpringJoint(int id, int bodyAId, int bodyBId, float anchorAX, float anchorAY, float anchorBX, float anchorBY, float length, float frequencyHz, float dampingRatio) {
    auto itA = bodiesMap.find(bodyAId); auto itB = bodiesMap.find(bodyBId);
    if (itA == bodiesMap.end() || itB == bodiesMap.end()) return -1;
    disabledPairs.insert({bodyAId, bodyBId});
    itA->second->disableCollisionWith(bodyBId);
    itB->second->disableCollisionWith(bodyAId);
    auto joint = std::make_unique<SpringJoint>(id, itA->second, itB->second, Vec2(anchorAX, anchorAY), Vec2(anchorBX, anchorBY), length, frequencyHz, dampingRatio);
    springJoints.push_back(joint.get());
    itA->second->joints.push_back(joint.get());
    itB->second->joints.push_back(joint.get());
    jointsMap[id] = std::move(joint);
    return id;
}

int World::createGearJoint(int id, int joint1Id, int joint2Id, float ratio) {
    auto it1 = jointsMap.find(joint1Id); auto it2 = jointsMap.find(joint2Id);
    if (it1 == jointsMap.end() || it2 == jointsMap.end()) return -1;
    HingeJoint* h1 = dynamic_cast<HingeJoint*>(it1->second.get());
    HingeJoint* h2 = dynamic_cast<HingeJoint*>(it2->second.get());
    if (!h1 || !h2) return -1;
    auto joint = std::make_unique<GearJoint>(id, h1, h2, ratio);
    
    auto addUnique = [](Body* b, Joint* j) {
        if (std::find(b->joints.begin(), b->joints.end(), j) == b->joints.end()) {
            b->joints.push_back(j);
        }
    };
    
    addUnique(h1->bodyA, joint.get());
    addUnique(h1->bodyB, joint.get());
    addUnique(h2->bodyA, joint.get());
    addUnique(h2->bodyB, joint.get());
    
    jointsMap[id] = std::move(joint);
    return id;
}

void World::removeJoint(int id) {
    std::vector<int> dependentJoints;
    for (auto& pair : jointsMap) {
        GearJoint* gj = dynamic_cast<GearJoint*>(pair.second.get());
        if (gj && (gj->joint1->id == id || gj->joint2->id == id)) dependentJoints.push_back(pair.first);
    }
    for (int djId : dependentJoints) removeJoint(djId);

    auto it = jointsMap.find(id);
    if (it != jointsMap.end()) {
        Joint* j = it->second.get();
        Body* bA = j->bodyA;
        Body* bB = j->bodyB;

        auto removeJointFromBody = [j](Body* b) {
            auto& v = b->joints;
            v.erase(std::remove(v.begin(), v.end(), j), v.end());
        };
        removeJointFromBody(bA);
        removeJointFromBody(bB);

        if (DistanceJoint* dj = dynamic_cast<DistanceJoint*>(j)) {
            distanceJoints.erase(std::remove(distanceJoints.begin(), distanceJoints.end(), dj), distanceJoints.end());
        } else if (SpringJoint* sj = dynamic_cast<SpringJoint*>(j)) {
            springJoints.erase(std::remove(springJoints.begin(), springJoints.end(), sj), springJoints.end());
        }
        
        // Only enable collision if there are no more joints between these bodies
        bool jointsRemaining = false;
        for (Joint* other : bA->joints) {
            if (other->isConnectedTo(bB)) {
                jointsRemaining = true;
                break;
            }
        }
        if (!jointsRemaining) {
            bA->enableCollisionWith(bB->id);
            bB->enableCollisionWith(bA->id);
            disabledPairs.erase({bA->id, bB->id});
        }
        
        GearJoint* gear = dynamic_cast<GearJoint*>(j);
        if (gear) {
            removeJointFromBody(gear->joint1->bodyA);
            removeJointFromBody(gear->joint1->bodyB);
            removeJointFromBody(gear->joint2->bodyA);
            removeJointFromBody(gear->joint2->bodyB);
        }
        
        jointsMap.erase(id);
    }
}

Joint* World::getJoint(int id) { auto it = jointsMap.find(id); return it != jointsMap.end() ? it->second.get() : nullptr; }
