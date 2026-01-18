#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "hinge-joint.h"
#include "gear-joint.h"

// Helper to create options
static emscripten_val createSimpleOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 0.5f;
    return options;
}

TEST(MemoryLifecycleTest, GearJointDanglingPointerOnHingeRemoval) {
    World world;
    emscripten_val options = createSimpleOptions(0, 0);
    
    // Setup a GearJoint
    world.makeBody(1, options); // Static base
    world.getBody(1)->setMass(0); // Make it static
    
    options.properties["x"] = 1.0f;
    world.makeBody(2, options);
    
    options.properties["x"] = -1.0f;
    world.makeBody(3, options);
    
    world.createHingeJoint(101, 1, 2, 1, 0, 0, 0);
    world.createHingeJoint(102, 1, 3, -1, 0, 0, 0);
    world.createGearJoint(200, 101, 102, 1.0f);
    
    // Now remove one of the hinges directly
    world.removeJoint(101);
    
    // Force some memory allocations to overwrite deleted joint1
    for (int i = 0; i < 1000; ++i) {
        std::vector<int> dummy(100, i);
    }

    // This should crash if we don't have protection
    world.step();
}

TEST(MemoryLifecycleTest, StaleContactStateAfterClear) {
    World world;
    emscripten_val options = createSimpleOptions(0, 0);
    
    // 1. Create two colliding bodies
    world.makeBody(1, options);
    options.properties["x"] = 0.1f;
    world.makeBody(2, options);
    
    world.step();
    
    // 2. Clear the world
    world.clear();
    
    // 3. Create two NEW bodies with same IDs but NOT colliding
    world.makeBody(1, createSimpleOptions(10, 10));
    world.makeBody(2, createSimpleOptions(20, 20));
    
    // We expect 0 events. If stale state exists, it might emit COLLISION_END
    EXPECT_EQ(world.getEventCount(), 0);
    
    world.step();
    
    // After step, it definitely should not have events from old simulation
    EXPECT_EQ(world.getEventCount(), 0);
}

TEST(MemoryLifecycleTest, IDReuseMemorySafety) {
    World world;
    
    for (int i = 0; i < 5; ++i) {
        world.makeBody(1, createSimpleOptions(0, 0));
        world.makeBody(2, createSimpleOptions(0.1f, 0));
        world.step();
        world.clear();
    }
    
    // If memory isn't cleared properly, this repeated cycle of creation/step/clear
    // with same IDs might eventually trigger out-of-bounds if maps grow or pointers persist.
    EXPECT_EQ(world.getBodyCount(), 0);
}
