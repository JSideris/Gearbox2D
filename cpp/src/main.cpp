#include "debug.h"
#include "collision-solver.h"
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "vec2.h"
#include "aabb.h"
#include "bvh.h"
#include "joint.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>

int main() {
    return 0;
}

EMSCRIPTEN_BINDINGS(general) {
    emscripten::register_vector<float>("vector<float>");
    emscripten::register_vector<int>("vector<int>");
    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);
}

EMSCRIPTEN_BINDINGS(world) {
    emscripten::class_<Body>("Body")
        .function("sleep", &Body::sleep)
        .function("wakeUp", &Body::wakeUp)
        .function("forceWakeUp", &Body::forceWakeUp)
        .property("canSleep", &Body::canSleep)
        .property("sleepTimeRequired", &Body::sleepTimeRequired)
        .function("getX", &Body::getX)
        .function("getY", &Body::getY)
        .function("getRotation", &Body::getRotation)
        .function("recomputeMassProperties", &Body::recomputeMassProperties);

    emscripten::class_<Fixture>("Fixture")
        .function("setCategoryBits", &Fixture::setCategoryBits)
        .function("setMaskBits", &Fixture::setMaskBits)
        .function("setDensity", &Fixture::setDensity)
        .function("getCategoryBits", &Fixture::getCategoryBits)
        .function("getMaskBits", &Fixture::getMaskBits)
        .function("getDensity", &Fixture::getDensity)
        .function("testPoint", &Fixture::testPoint);

    emscripten::class_<Joint>("Joint")
        .function("getReactionForce", &Joint::getReactionForce)
        .function("getReactionTorque", &Joint::getReactionTorque)
        .function("setLength", &Joint::setLength)
        .function("getLength", &Joint::getLength)
        .function("setFrequencyHz", &Joint::setFrequencyHz)
        .function("getFrequencyHz", &Joint::getFrequencyHz)
        .function("setDampingRatio", &Joint::setDampingRatio)
        .function("getDampingRatio", &Joint::getDampingRatio)
        .function("setRatio", &Joint::setRatio)
        .function("getRatio", &Joint::getRatio)
        .function("setLocalAnchorA", &Joint::setLocalAnchorA)
        .function("getLocalAnchorA", &Joint::getLocalAnchorA)
        .function("setLocalAnchorB", &Joint::setLocalAnchorB)
        .function("getLocalAnchorB", &Joint::getLocalAnchorB);

    emscripten::class_<HingeJoint, emscripten::base<Joint>>("HingeJoint");
    emscripten::class_<DistanceJoint, emscripten::base<Joint>>("DistanceJoint");
    emscripten::class_<SpringJoint, emscripten::base<Joint>>("SpringJoint");
    emscripten::class_<GearJoint, emscripten::base<Joint>>("GearJoint");

    emscripten::class_<World>("World")
        .constructor<>()
        .function("getLiveBodyFloatData", &World::getLiveBodyFloatData)
        .function("getLiveBodyIntData", &World::getLiveBodyIntData)
        .function("getLiveFixtureFloatData", &World::getLiveFixtureFloatData)
        .function("getLiveFixtureIntData", &World::getLiveFixtureIntData)
        .function("getEventData", &World::getEventData)
        .function("getEventCount", &World::getEventCount)
        .function("createBody", &World::createBody)
        .function("createFixture", &World::createFixture)
        .function("removeObject", &World::removeObject)
        .function("getBody", &World::getBody, emscripten::allow_raw_pointers())
        .function("getFixture", &World::getFixture, emscripten::allow_raw_pointers())
        .function("getBodyCount", &World::getBodyCount)
        .function("getFixtureCount", &World::getFixtureCount)
        .function("findFixtureIndex", &World::findFixtureIndex)
        .function("setTimeStep", &World::setTimeStep)
        .function("setGravity", &World::setGravity)
        .function("createHingeJoint", &World::createHingeJoint)
        .function("createDistanceJoint", &World::createDistanceJoint)
        .function("createSpringJoint", &World::createSpringJoint)
        .function("createGearJoint", &World::createGearJoint)
        .function("removeJoint", &World::removeJoint)
        .function("getJoint", &World::getJoint, emscripten::allow_raw_pointers())
        .function("updateBodyId", &World::updateBodyId)
        .function("updateFixtureId", &World::updateFixtureId)
        .function("updateJointId", &World::updateJointId)
        .function("syncDefragmentedIds", &World::syncDefragmentedIds)
        .function("step", &World::step)
        .function("queryBodiesAtPoint", &World::queryBodiesAtPoint)
        .function("queryFixturesAtPoint", &World::queryFixturesAtPoint)
        .function("clear", &World::clear)
        .function("setHasPenetrationResolution", &World::setHasPenetrationResolution)
        .function("setHasRestitution", &World::setHasRestitution)
        .function("setHasFriction", &World::setHasFriction)
        .function("setSpeculativeMargin", &World::setSpeculativeMargin)
        .function("getSpeculativeMargin", &World::getSpeculativeMargin);
}
#endif
