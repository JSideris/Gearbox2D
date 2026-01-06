#include "debug.h"
#include "collision-solver.h"
#include "world.h"
#include "physical-object.h"
#include "vec2.h"
#include "aabb.h"
#include "bvh.h"
#include "joint.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"

#ifdef __EMSCRIPTEN__

int main() {
    return 0;
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(general) {
    emscripten::register_vector<float>("vector<float>");
    emscripten::register_vector<int>("vector<int>");

    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);
}

EMSCRIPTEN_BINDINGS(world) {
    emscripten::class_<PhysicalObject>("PhysicalObject")
        .function("setCategoryBits", &PhysicalObject::setCategoryBits)
        .function("setMaskBits", &PhysicalObject::setMaskBits)
        .function("getCategoryBits", &PhysicalObject::getCategoryBits)
        .function("getMaskBits", &PhysicalObject::getMaskBits)
        .function("wakeUp", &PhysicalObject::wakeUp)
        .function("getX", &PhysicalObject::getX)
        .function("getY", &PhysicalObject::getY)
        .function("getRotation", &PhysicalObject::getRotation);

    emscripten::class_<Joint>("Joint")
        .function("getReactionForce", &Joint::getReactionForce)
        .function("getReactionTorque", &Joint::getReactionTorque);

    emscripten::class_<HingeJoint, emscripten::base<Joint>>("HingeJoint");
    emscripten::class_<DistanceJoint, emscripten::base<Joint>>("DistanceJoint");
    emscripten::class_<SpringJoint, emscripten::base<Joint>>("SpringJoint");
    emscripten::class_<GearJoint, emscripten::base<Joint>>("GearJoint");

    emscripten::class_<World>("World")
        .constructor<>()
        .function("findeIndexForObject", &World::findeIndexForObject)
        .function("getLiveFloatData", &World::getLiveFloatData, emscripten::allow_raw_pointers())
        .function("getLiveIntData", &World::getLiveIntData, emscripten::allow_raw_pointers())
        // .function("getIds", &World::getIds, emscripten::allow_raw_pointers())
        // .property("liveData", &World::liveData, emscripten::allow_raw_pointers())
        // .property("ids", &World::ids)

        .function("makeObject", &World::makeObject)
        .function("removeObject", &World::removeObject)
        .function("getObject", &World::getObject, emscripten::allow_raw_pointers())
        .function("getObjectAtIndex", &World::getObjectAtIndex, emscripten::allow_raw_pointers())
        .function("getObjectCount", &World::getObjectCount)
        .function("setTimeStep", &World::setTimeStep)
        .function("setGravity", &World::setGravity)
        .function("createHingeJoint", &World::createHingeJoint)
        .function("createDistanceJoint", &World::createDistanceJoint)
        .function("createSpringJoint", &World::createSpringJoint)
        .function("createGearJoint", &World::createGearJoint)
        .function("removeJoint", &World::removeJoint)
        .function("getJoint", &World::getJoint, emscripten::allow_raw_pointers())

        // .function("getLiveData", &World::getLiveData, emscripten::allow_raw_pointers())
        // .function("getIds", &World::getIds, emscripten::allow_raw_pointers())

        .function("step", &World::step)
        .function("clear", &World::clear)
        .function("destroy", &World::destroy)

        .function("setHasPenetrationResolution", &World::setHasPenetrationResolution)
        .function("setHasRestitution", &World::setHasRestitution)
        .function("setHasFriction", &World::setHasFriction);
}

#endif