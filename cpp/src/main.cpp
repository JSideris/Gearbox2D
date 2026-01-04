#include "debug.h"
#include "collision-solver.h"
#include "world.h"
#include "physical-object.h"
#include "vec2.h"
#include "aabb.h"
#include "bvh.h"

#ifdef __EMSCRIPTEN__

EM_JS(void, network_log, (const char* hypothesisId, const char* location, const char* message, const char* dataJson), {
    fetch('http://127.0.0.1:7243/ingest/85da54db-cf92-43ad-83ed-b8a8ad84d3c4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: 'debug-session',
            hypothesisId: UTF8ToString(hypothesisId),
            location: UTF8ToString(location),
            message: UTF8ToString(message),
            data: dataJson ? JSON.parse(UTF8ToString(dataJson)) : {},
            timestamp: Date.now()
        })
    }).catch(() => {});
});

int main() {
    return 0;
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(general) {
    emscripten::register_vector<float>("vector<float>");
    emscripten::register_vector<int>("vector<int>");
}

EMSCRIPTEN_BINDINGS(world) {
    emscripten::class_<PhysicalObject>("PhysicalObject")
        .function("setCategoryBits", &PhysicalObject::setCategoryBits)
        .function("setMaskBits", &PhysicalObject::setMaskBits)
        .function("getCategoryBits", &PhysicalObject::getCategoryBits)
        .function("getMaskBits", &PhysicalObject::getMaskBits);

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
        .function("destroy", &World::destroy)

        .function("setHasPenetrationResolution", &World::setHasPenetrationResolution)
        .function("setHasRestitution", &World::setHasRestitution)
        .function("setHasFriction", &World::setHasFriction);
}

#endif