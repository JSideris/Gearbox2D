// #include <iostream>

#include "debug.h"
#include "world.h"
#include "physical-object.h"
#include "vec2.h"
#include "aabb.h"
#include "bvh.h"


#ifdef __EMSCRIPTEN__

int main() {
    return 0;
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(general) {
    emscripten::register_vector<float>("vector<float>");
    emscripten::register_vector<int>("vector<int>");
}

EMSCRIPTEN_BINDINGS(vec2) {
    emscripten::class_<Vec2>("Vec2")
        .constructor<float, float>()
        .property("x", &Vec2::x)
        .property("y", &Vec2::y)
        .function("add", &Vec2::operator+)
        .function("subtract", &Vec2::operator-)
        .function("scale", &Vec2::operator*)
        .function("magnitude", &Vec2::magnitude)
        .function("normalize", &Vec2::normalize);
}

// EMSCRIPTEN_BINDINGS(physical_object) {

//     emscripten::enum_<ObjectShape>("ObjectShape")
//         .value("POINT", ObjectShape::POINT)
//         .value("CIRCLE", ObjectShape::CIRCLE)
//         .value("AABB", ObjectShape::AABB)
//         .value("BOX", ObjectShape::BOX)
//         .value("ELLIPSE", ObjectShape::ELLIPSE)
//         .value("CAPSULE", ObjectShape::CAPSULE)
//         .value("POLYGON", ObjectShape::POLYGON);

//     emscripten::enum_<ObjectType>("ObjectType")
//         .value("RIGID_BODY", ObjectType::RIGID_BODY)
//         .value("SENSOR", ObjectType::SENSOR)
//         .value("FIXED_OBJECT", ObjectType::FIXED_OBJECT);

//     // emscripten::class_<PhysicalObject>("PhysicalObject")
//         // .constructor<int, emscripten_val>();

//         // .property("x", &PhysicalObject::x)
//         // .property("y", &PhysicalObject::y)
//         // .property("x0", &PhysicalObject::x0)
//         // .property("x1", &PhysicalObject::x1)
//         // .property("y0", &PhysicalObject::y0)
//         // .property("y1", &PhysicalObject::y1)
//         // .property("r", &PhysicalObject::r)
//         // .property("vx", &PhysicalObject::vx)
//         // .property("vy", &PhysicalObject::vy)
//         // .property("rs", &PhysicalObject::rs)
//         // .property("fx", &PhysicalObject::fx)
//         // .property("fy", &PhysicalObject::fy)
//         // .property("ix", &PhysicalObject::ix)
//         // .property("iy", &PhysicalObject::iy)

//         // .function("destroy", &PhysicalObject::destroy)

//         // .function("getId", &PhysicalObject::getId)
//         // .function("getPosition", &PhysicalObject::getPosition)
//         // .function("getX", &PhysicalObject::getX)
//         // .function("getY", &PhysicalObject::getY)
//         // .function("getRotation", &PhysicalObject::getRotation)
//         // .function("getType", &PhysicalObject::getType)
//         // .function("getShape", &PhysicalObject::getShape)
//         // .function("getVelocity", &PhysicalObject::getVelocity)
//         // .function("getRotationalSpeed", &PhysicalObject::getRotationalSpeed)
//         // .function("getDamping", &PhysicalObject::getDamping)
//         // .function("getRotationalDamping", &PhysicalObject::getRotationalDamping)
//         // .function("getRadius", &PhysicalObject::getRadius)
//         // .function("getWidth", &PhysicalObject::getWidth)
//         // .function("getHeight", &PhysicalObject::getHeight)

//         // .function("setPosition", &PhysicalObject::setPosition)
//         // .function("setRotation", &PhysicalObject::setRotation)
//         // .function("setType", &PhysicalObject::setType)
//         // .function("setVelocity", &PhysicalObject::setVelocity)
//         // .function("setRotationalSpeed", &PhysicalObject::setRotationalSpeed)
//         // .function("setDamping", &PhysicalObject::setDamping)
//         // .function("setRotationalDamping", &PhysicalObject::setRotationalDamping)
//         // .function("setMass", &PhysicalObject::setMass)

//         // .function("applyForce", &PhysicalObject::applyForce)
//         // .function("applyImpulse", &PhysicalObject::applyImpulse);

// }

EMSCRIPTEN_BINDINGS(world) {
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

        // .function("getLiveData", &World::getLiveData, emscripten::allow_raw_pointers())
        // .function("getIds", &World::getIds, emscripten::allow_raw_pointers())

        .function("step", &World::step)
        .function("clear", &World::clear)
        .function("destroy", &World::destroy);
}

#endif