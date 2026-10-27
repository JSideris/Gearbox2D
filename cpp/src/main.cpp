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
        .function("recomputeMassProperties", &Body::recomputeInverseInertia);

    emscripten::class_<Fixture>("Fixture")
        .function("setCategoryBits", &Fixture::setCategoryBits)
        .function("setMaskBits", &Fixture::setMaskBits)
        .function("setDensity", &Fixture::setDensity)
        .function("getCategoryBits", &Fixture::getCategoryBits)
        .function("getMaskBits", &Fixture::getMaskBits)
        .function("getDensity", &Fixture::getDensity)
        .function("setSensor", &Fixture::setSensor)
        .function("setSensorContacts", &Fixture::setSensorContacts)
        .function("getSensorContacts", &Fixture::getSensorContacts)
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
        .function("queryAABB", &World::queryAABB)
        .function("queryRadius", &World::queryRadius)
        .function("raycast", &World::raycast)
        .function("queryRadiusBatch", &World::queryRadiusBatch)
        .function("reserveQueryBatch", &World::reserveQueryBatch)
        .function("getQueryHeader", &World::getQueryHeader)
        .function("getQueryHitsView", &World::getQueryHitsView)
        .function("getRayHitsView", &World::getRayHitsView)
        .function("getBatchOffsetsView", &World::getBatchOffsetsView)
        .function("getBatchInputView", &World::getBatchInputView)
        .function("getBatchExcludeView", &World::getBatchExcludeView)
        .function("navCreate", &World::navCreate)
        .function("navDestroy", &World::navDestroy)
        .function("navHasGrid", &World::navHasGrid)
        .function("navCols", &World::navCols)
        .function("navRows", &World::navRows)
        .function("navAddBox", &World::navAddBox)
        .function("navAddDisc", &World::navAddDisc)
        .function("navCommitBase", &World::navCommitBase)
        .function("navTrack", &World::navTrack)
        .function("navSetDynamic", &World::navSetDynamic)
        .function("navPushDynamic", &World::navPushDynamic)
        .function("navPopDynamic", &World::navPopDynamic)
        .function("navDynamicLayers", &World::navDynamicLayers)
        .function("navBuildHierarchy", &World::navBuildHierarchy)
        .function("navSync", &World::navSync)
        .function("navReserve", &World::navReserve)
        .function("findPaths", &World::findPaths)
        .function("navFindPath", &World::navFindPath)
        .function("navCancel", &World::navCancel)
        .function("navClearRequests", &World::navClearRequests)
        .function("navGetHeader", &World::navGetHeader)
        .function("navGetRequestView", &World::navGetRequestView)
        .function("navGetDiscView", &World::navGetDiscView)
        .function("navGetOutView", &World::navGetOutView)
        .function("navGetBaseView", &World::navGetBaseView)
        .function("navGetBlockedView", &World::navGetBlockedView)
        .function("navGetDynamicView", &World::navGetDynamicView)
        .function("clear", &World::clear)
        .function("setHasPenetrationResolution", &World::setHasPenetrationResolution)
        .function("setHasRestitution", &World::setHasRestitution)
        .function("setHasFriction", &World::setHasFriction)
        .function("setHasKrb", &World::setHasKrb)
        .function("setSpeculativeMargin", &World::setSpeculativeMargin)
        .function("getSpeculativeMargin", &World::getSpeculativeMargin);
}
#endif
